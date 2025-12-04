import logging
import time
from typing import List, Dict, Any
import os
import torch

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document

# Logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Vectorstore path
DB_DIR = "vectorstore"


class RAGEngine:
    def __init__(self):
        self.db_dir = DB_DIR

        # Detect GPU
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"💻 Using device for embeddings: {device}")

        # Embeddings
        logger.info("🔧 Initialisation des embeddings...")
        self.embedding_function = HuggingFaceEmbeddings(
            model_name="intfloat/multilingual-e5-large",
            model_kwargs={'device': device},
            encode_kwargs={'normalize_embeddings': True}
        )

        # Load vectorstore
        logger.info("📚 Chargement du vectorstore...")
        self.vectorstore = Chroma(
            persist_directory=self.db_dir,
            embedding_function=self.embedding_function
        )

        # --- Hybrid Search (BM25 + MMR Vector) ---
        logger.info("🔄 Initialisation de la recherche hybride...")
        try:
            # FIX: Access the underlying collection to get the total count
            collection = self.vectorstore._collection
            count = collection.count()

            if count > 0:
                logger.info(f"Loaded {count} documents for indexing (BM25)")
                
                # Fetch ALL documents explicitly using the total count as the limit
                # This ensures the BM25 index contains all available data
                results = collection.get(
                    limit=count,
                    include=["documents", "metadatas"]
                )

                documents = [
                    Document(page_content=content, metadata=meta)
                    for content, meta in zip(results["documents"], results["metadatas"])
                ]

                # 1. Initialize BM25 with the full corpus
                self.bm25_retriever = BM25Retriever.from_documents(documents)
                self.bm25_retriever.k = 8

                # 2. Initialize Chroma MMR retriever
                self.chroma_retriever = self.vectorstore.as_retriever(
                    search_type="mmr",
                    search_kwargs={"k": 8, "fetch_k": 24}
                )

                logger.info(f"✅ Hybrid retrieval opérationnel ({count} documents)")
            else:
                logger.warning("⚠️ Aucun document trouvé dans le vectorstore.")
                self.bm25_retriever = None
                self.chroma_retriever = None

        except Exception as e:
            logger.error(f"Erreur init BM25: {e}")
            self.bm25_retriever = None
            self.chroma_retriever = None

        # LLM with Qwen 14B
        logger.info("🤖 Configuration du LLM Qwen 2.5 14B...")
        self.llm = ChatOllama(
            model="qwen2.5:14b-instruct-q4_K_M",
            base_url="http://host.docker.internal:11434",
            temperature=0.1,
            num_ctx=4096,
            top_p=0.9,
            repeat_penalty=1.3,
            timeout=120,
            # Removed num_predict=600 to use the LLM's default maximum generation capacity
            # You can set this to a higher value (e.g., 4096) if you need very long answers
        )
        logger.info("✅ RAG Engine prêt !")

    def query(self, question: str, top_k: int = 6) -> Dict[str, Any]:
        logger.info(f"Question reçue: {question}")

        # Retrieval
        try:
            logger.info("🔎 Recherche hybride...")
            start_time = time.time()

            # BM25 + Chroma combination manually
            bm25_docs = self.bm25_retriever.get_relevant_documents(question) if self.bm25_retriever else []
            chroma_docs = self.chroma_retriever.get_relevant_documents(question) if self.chroma_retriever else []

            # Simple weighting (BM25 0.4, Chroma 0.6)
            docs = bm25_docs[:top_k] + chroma_docs[:top_k]
            docs = list({doc.page_content: doc for doc in docs}.values())  # remove duplicates

            if not docs:
                docs = self.vectorstore.max_marginal_relevance_search(
                    question, k=top_k, fetch_k=top_k * 3
                )

            docs_with_scores = [(doc, 0.0) for doc in docs]

            logger.info(f"✅ Retrieval en {time.time() - start_time:.2f}s – {len(docs)} docs trouvés")

        except Exception as e:
            logger.error(f"Erreur retrieval: {e}")
            return {
                "answer": "Erreur lors de la recherche.",
                "sources": [],
                "context": "",
                "confidence": 0.0
            }

        # Build context
        relevant_docs, context_parts, sources = [], [], []
        for doc, score in docs_with_scores:
            # logger.info(f"Doc trouvé: {doc.metadata.get('source')} – Score: {score}") # Removed score display since it's hardcoded to 0.0
            relevant_docs.append(doc)
            context_parts.append(
                f"Source: {doc.metadata.get('source')}, Page: {doc.metadata.get('page')}\n"
                f"Contenu:\n{doc.page_content}"
            )
            sources.append(f"{doc.metadata.get('source')} (p.{doc.metadata.get('page')})")

        if not relevant_docs:
            return {
                "answer": "Aucune information pertinente trouvée.",
                "sources": [],
                "context": "",
                "confidence": 0.0
            }

        context_str = "\n\n---\n\n".join(context_parts)

        SYSTEM_PROMPT = """
Tu es un assistant technique expert des procédés Prayon.

⚠️ RÈGLES STRICTES:
1. Réponds UNIQUEMENT selon le CONTEXTE ci-dessous.
2. Ne devine rien : pas d’invention.
3. Réponds techniquement, précisément et en français.
4. Cite les sources (document + page).

CONTEXTE DOCUMENTAIRE:
{context}
"""

        messages = [
            SystemMessage(content=SYSTEM_PROMPT.format(context=context_str)),
            HumanMessage(content=f"QUESTION: {question}\n\nRéponse technique :")
        ]

        # LLM Query
        try:
            logger.info("🤖 Envoi au LLM Qwen 14B...")
            start_llm = time.time()
            response = self.llm.invoke(messages)
            logger.info(f"✅ Réponse LLM en {time.time() - start_llm:.2f}s")
            answer = response.content
        except Exception as e:
            logger.error(f"Erreur génération LLM: {e}")
            return {
                "answer": "Erreur lors de la génération de la réponse. Vérifiez Ollama.",
                "sources": sources,
                "context": context_str,
                "confidence": 0.0
            }

        return {
            "answer": answer,
            "sources": list(set(sources)),
            "context": context_str,
            "confidence": 1.0
        }


if __name__ == "__main__":
    rag = RAGEngine()
    print("✅ RAG Engine Initialized with Qwen 2.5 14B")