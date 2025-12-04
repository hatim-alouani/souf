import logging
import time
from typing import Generator
import os
import json
import torch
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_core.exceptions import OutputParserException

# Logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

DB_DIR = "vectorstore"
OLLAMA_HOST_URL = os.getenv("OLLAMA_HOST_URL", "http://host.docker.internal:11434")


class RAGEngine:
    def __init__(self):
        self.db_dir = DB_DIR
        self.is_ready = False

        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"💻 Using device for embeddings: {device}")

        logger.info("🔧 Initialisation des embeddings...")
        self.embedding_function = HuggingFaceEmbeddings(
            model_name="intfloat/multilingual-e5-large",
            model_kwargs={'device': device},
            encode_kwargs={'normalize_embeddings': True}
        )

        # Load vectorstore and setup retrievers
        try:
            logger.info("📚 Chargement du vectorstore...")
            self.vectorstore = Chroma(
                persist_directory=self.db_dir,
                embedding_function=self.embedding_function
            )
            collection = self.vectorstore._collection
            count = collection.count()

            if count > 0:
                results = collection.get(limit=count, include=["documents", "metadatas"])
                documents = [
                    Document(page_content=content, metadata=meta)
                    for content, meta in zip(results["documents"], results["metadatas"])
                ]

                self.bm25_retriever = BM25Retriever.from_documents(documents, k=8)
                self.chroma_retriever = self.vectorstore.as_retriever(
                    search_type="mmr",
                    search_kwargs={"k": 8, "fetch_k": 24}
                )
                logger.info(f"✅ Hybrid retrieval opérationnel ({count} documents)")
                self.is_ready = True
            else:
                logger.warning("⚠️ Aucun document trouvé dans le vectorstore.")
                self.bm25_retriever = None
                self.chroma_retriever = None

        except Exception as e:
            logger.error(f"Erreur init RAG components: {e}")
            self.is_ready = False
            self.bm25_retriever = None
            self.chroma_retriever = None
            self.vectorstore = None

        # LLM
        logger.info(f"🤖 Configuration du LLM Qwen 2.5 14B sur {OLLAMA_HOST_URL}...")
        self.llm = ChatOllama(
            model="qwen2.5:14b-instruct-q4_K_M",
            base_url=OLLAMA_HOST_URL,
            temperature=0.1,
            num_ctx=4096,
            timeout=120,
        )
        if self.is_ready:
            logger.info("✅ RAG Engine prêt !")

    def stream_query(self, question: str, top_k: int = 6) -> Generator[str, None, None]:
        """Performs RAG retrieval and streams LLM response."""
        if not self.is_ready:
            yield "SYSTEM_ERROR: RAG Engine not ready."
            return

        logger.info(f"Question reçue pour streaming: {question}")
        start_time = time.time()

        try:
            bm25_docs = self.bm25_retriever.invoke(question) if self.bm25_retriever else []
            chroma_docs = self.chroma_retriever.invoke(question) if self.chroma_retriever else []
            
            docs = bm25_docs[:top_k] + chroma_docs[:top_k]
            docs = list({doc.page_content: doc for doc in docs}.values())[:top_k]

            logger.info(f"✅ Retrieval en {time.time() - start_time:.2f}s – {len(docs)} docs trouvés")

        except Exception as e:
            logger.error(f"Erreur retrieval: {e}")
            yield "SYSTEM_ERROR: Erreur lors de la recherche de documents."
            return

        # Prepare metadata
        context_parts, sources = [], []
        for doc in docs:
            context_parts.append(
                f"Source: {doc.metadata.get('source')}, Page: {doc.metadata.get('page')}\n"
                f"Contenu:\n{doc.page_content}"
            )
            sources.append(f"{doc.metadata.get('source')} (p.{doc.metadata.get('page')})")

        context_str = "\n\n---\n\n".join(context_parts)
        sources_payload = {"sources": list(set(sources)), "context": context_str}

        # Send metadata first
        yield f"METADATA_START:{json.dumps(sources_payload)}:METADATA_END\n\n"

        SYSTEM_PROMPT = """Tu es un assistant technique expert des procédés Prayon.
⚠️ RÈGLES STRICTES:
1. Réponds UNIQUEMENT selon le CONTEXTE ci-dessous.
2. Ne devine rien : pas d'invention.
3. Réponds techniquement, précisément et en français.
4. Cite les sources (document + page) DANS la réponse.

CONTEXTE DOCUMENTAIRE:
{context}
"""
        messages = [
            SystemMessage(content=SYSTEM_PROMPT.format(context=context_str)),
            HumanMessage(content=f"QUESTION: {question}\n\nRéponse technique :")
        ]

        try:
            logger.info("🤖 Début du streaming LLM...")
            for chunk in self.llm.stream(messages):
                if chunk.content:
                    yield chunk.content
            logger.info("✅ Fin du streaming LLM.")

        except OutputParserException as e:
            logger.error(f"Erreur LLM output: {e}")
            yield "\n\nSYSTEM_ERROR: Le modèle a généré une réponse malformée."
        except Exception as e:
            logger.error(f"Erreur génération LLM: {e}")
            yield "\n\nSYSTEM_ERROR: Erreur lors de la génération de la réponse. Vérifiez Ollama."


if __name__ == "__main__":
    rag = RAGEngine()
    print("✅ RAG Engine Initialized") if rag.is_ready else print("❌ RAG Engine FAILED")
