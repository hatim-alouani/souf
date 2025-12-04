import os
import logging
import shutil
import re
from typing import List, Dict, Tuple
from dataclasses import dataclass

import fitz  # PyMuPDF
import torch
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from sentence_transformers import CrossEncoder

from dynamic_splitter import DynamicTechnicalTextSplitter, ChemicalNormalizer

# -------------------------------
# Logging Configuration
# -------------------------------
if not os.path.exists('logs'):
    os.makedirs('logs')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/rag_agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------------------
# Paths
# -------------------------------
DATA_DIR = "data/raw"
DB_DIR = "vectorstore"

# -------------------------------
# Enhanced PDF Extraction with Metadata
# -------------------------------
def extract_text_from_pdf(pdf_path: str) -> List[Dict]:
    """
    Extraction améliorée avec préservation de structure et métadonnées riches.
    """
    doc_content = []
    normalizer = ChemicalNormalizer()
    
    try:
        doc = fitz.open(pdf_path)
        current_section = "Introduction"
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Extraire avec structure (blocks)
            blocks = page.get_text("dict")["blocks"]
            page_text_parts = []
            
            for block in blocks:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"].strip()
                            if text:
                                if normalizer.is_section_header(text):
                                    current_section = text
                                page_text_parts.append(text)
            
            full_text = " ".join(page_text_parts)
            full_text = normalizer.normalize_text(full_text)
            
            if full_text.strip():
                # Extraire les entités
                entities = normalizer.extract_entities(full_text)
                
                doc_content.append({
                    "page_content": full_text,
                    "metadata": {
                        "source": os.path.basename(pdf_path),
                        "page": page_num + 1,
                        "section": current_section,
                        "type_doc": "technique",
                        "chemical_formulas": ", ".join(entities["formulas"][:5]),
                        "has_concentrations": len(entities["concentrations"]) > 0,
                        "has_temperatures": len(entities["temperatures"]) > 0,
                        "equipment_mentioned": ", ".join(entities["equipment"][:3]),
                    }
                })
        
        doc.close()
        logger.info(f"✅ Extracted {len(doc_content)} pages from {os.path.basename(pdf_path)}")
        
    except Exception as e:
        logger.error(f"❌ Error reading PDF {pdf_path}: {e}")
    
    return doc_content

# -------------------------------
# E5 Embeddings with Prefix
# -------------------------------
class E5EmbeddingsWithPrefix(HuggingFaceEmbeddings):
    """Wrapper pour ajouter les préfixes requis par E5."""
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        prefixed_texts = [f"passage: {text}" for text in texts]
        return super().embed_documents(prefixed_texts)
    
    def embed_query(self, text: str) -> List[float]:
        prefixed_text = f"query: {text}"
        return super().embed_query(prefixed_text)

# -------------------------------
# Technical Text Splitter (Enhanced)
# -------------------------------
class TechnicalTextSplitter(RecursiveCharacterTextSplitter):
    """Splitter adapté aux documents techniques chimiques."""
    
    def __init__(self, chunk_size=800, chunk_overlap=150):
        separators = [
            "\n\n\n",
            "\n\n",
            "\n",
            ". ",
            ".",
            ";",
            ",",
        ]
        
        super().__init__(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators,
            length_function=len,
            is_separator_regex=False
        )
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split avec enrichissement métadata."""
        chunks = super().split_documents(documents)
        
        normalizer = ChemicalNormalizer()
        for i, chunk in enumerate(chunks):
            # Ajouter un ID unique
            chunk.metadata["chunk_id"] = f"{chunk.metadata.get('source', 'unknown')}_{i}"
            
            # Extraire les entités du chunk
            entities = normalizer.extract_entities(chunk.page_content)
            chunk.metadata.update({
                "has_chemical_formula": len(entities["formulas"]) > 0,
                "has_percentage": "%" in chunk.page_content,
                "has_temperature": len(entities["temperatures"]) > 0,
                "has_equation": "→" in chunk.page_content or "=" in chunk.page_content,
                "word_count": len(chunk.page_content.split()),
                "char_count": len(chunk.page_content)
            })
        
        return chunks

# -------------------------------
# RRF (Reciprocal Rank Fusion)
# -------------------------------
@dataclass
class RRFResult:
    """Résultat RRF avec score et document."""
    document: Document
    rrf_score: float
    original_ranks: Dict[str, int]

def reciprocal_rank_fusion(
    search_results_list: List[List[Document]],
    k: int = 60
) -> List[RRFResult]:
    """
    Implémente RRF pour fusionner les résultats de plusieurs recherches.
    
    Args:
        search_results_list: Liste de listes de documents (une par méthode de recherche)
        k: Constante RRF (typiquement 60)
    
    Returns:
        Liste de RRFResult triée par score décroissant
    """
    # Dictionnaire: chunk_id -> (Document, {method: rank})
    doc_scores = {}
    
    for method_idx, results in enumerate(search_results_list):
        for rank, doc in enumerate(results, start=1):
            chunk_id = doc.metadata.get("chunk_id", f"doc_{id(doc)}")
            
            if chunk_id not in doc_scores:
                doc_scores[chunk_id] = {
                    "document": doc,
                    "ranks": {},
                    "rrf_score": 0.0
                }
            
            # RRF formula: 1 / (k + rank)
            doc_scores[chunk_id]["ranks"][f"method_{method_idx}"] = rank
            doc_scores[chunk_id]["rrf_score"] += 1.0 / (k + rank)
    
    # Convertir en RRFResult et trier
    rrf_results = [
        RRFResult(
            document=data["document"],
            rrf_score=data["rrf_score"],
            original_ranks=data["ranks"]
        )
        for data in doc_scores.values()
    ]
    
    rrf_results.sort(key=lambda x: x.rrf_score, reverse=True)
    
    return rrf_results

# -------------------------------
# Cross-Encoder Re-ranking
# -------------------------------
class CrossEncoderReranker:
    """
    Re-ranking avec Cross-Encoder pour améliorer la pertinence.
    """
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initialise le cross-encoder.
        
        Modèles recommandés:
        - cross-encoder/ms-marco-MiniLM-L-6-v2 (rapide, bon équilibre)
        - cross-encoder/ms-marco-MiniLM-L-12-v2 (plus précis)
        - amberoad/bert-multilingual-passage-reranking-msmarco (multilingue)
        """
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"🔄 Loading Cross-Encoder: {model_name} (device: {device})")
        
        self.model = CrossEncoder(model_name, device=device)
        self.model_name = model_name
    
    def rerank(
        self,
        query: str,
        documents: List[Document],
        top_k: int = 10
    ) -> List[Tuple[Document, float]]:
        """
        Re-rank les documents avec le cross-encoder.
        
        Args:
            query: Question de l'utilisateur
            documents: Documents à re-ranker
            top_k: Nombre de documents à retourner
        
        Returns:
            Liste de (Document, score) triée par score décroissant
        """
        if not documents:
            return []
        
        # Préparer les paires (query, document)
        pairs = [[query, doc.page_content] for doc in documents]
        
        # Calculer les scores
        scores = self.model.predict(pairs, show_progress_bar=False)
        
        # Combiner documents et scores
        doc_scores = list(zip(documents, scores))
        
        # Trier par score décroissant
        doc_scores.sort(key=lambda x: x[1], reverse=True)
        
        return doc_scores[:top_k]

# -------------------------------
# Hybrid Retriever with RRF and Re-ranking
# -------------------------------
class HybridRetrieverWithReranking:
    """
    Récupérateur hybride combinant:
    1. Recherche sémantique (embeddings)
    2. Recherche par similarité avec différents paramètres
    3. RRF pour fusion
    4. Cross-encoder pour re-ranking final
    """
    
    def __init__(
        self,
        vectorstore: Chroma,
        reranker: CrossEncoderReranker,
        k_semantic: int = 20,
        k_mmr: int = 20,
        k_final: int = 5
    ):
        self.vectorstore = vectorstore
        self.reranker = reranker
        self.k_semantic = k_semantic
        self.k_mmr = k_mmr
        self.k_final = k_final
    
    def retrieve(self, query: str) -> List[Tuple[Document, float]]:
        """
        Récupère les documents les plus pertinents.
        
        Pipeline:
        1. Recherche sémantique (similarity)
        2. Recherche MMR (Maximum Marginal Relevance)
        3. RRF pour fusionner
        4. Cross-encoder re-ranking
        """
        logger.info(f"🔍 Hybrid retrieval for: '{query}'")
        
        # 1. Recherche sémantique classique
        semantic_results = self.vectorstore.similarity_search(
            query,
            k=self.k_semantic
        )
        logger.info(f"  📊 Semantic search: {len(semantic_results)} results")
        
        # 2. Recherche MMR (diversité)
        mmr_results = self.vectorstore.max_marginal_relevance_search(
            query,
            k=self.k_mmr,
            fetch_k=self.k_mmr * 2
        )
        logger.info(f"  📊 MMR search: {len(mmr_results)} results")
        
        # 3. RRF Fusion
        rrf_results = reciprocal_rank_fusion(
            [semantic_results, mmr_results],
            k=60
        )
        logger.info(f"  🔗 RRF fusion: {len(rrf_results)} unique documents")
        
        # Prendre les top documents après RRF
        top_rrf_docs = [r.document for r in rrf_results[:self.k_semantic]]
        
        # 4. Cross-Encoder Re-ranking
        reranked_results = self.reranker.rerank(
            query,
            top_rrf_docs,
            top_k=self.k_final
        )
        logger.info(f"  ⭐ Re-ranked: {len(reranked_results)} final results")
        
        return reranked_results

# -------------------------------
# Document Ingestion (Enhanced)
# -------------------------------
def ingest_documents():
    logger.info("🚀 Starting enhanced ingestion with RRF + Re-ranking support...")

    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        logger.warning(f"{DATA_DIR} created. Please add your PDFs here.")
        return

    pdf_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith('.pdf')]
    if not pdf_files:
        logger.warning(f"No PDFs found in {DATA_DIR}")
        return

    # 1️⃣ Extract with enhanced metadata
    raw_documents = []
    for pdf_file in pdf_files:
        pdf_path = os.path.join(DATA_DIR, pdf_file)
        logger.info(f"📄 Processing {pdf_file}...")
        extracted = extract_text_from_pdf(pdf_path)
        for data in extracted:
            raw_documents.append(Document(
                page_content=data["page_content"],
                metadata=data["metadata"]
            ))

    logger.info(f"✅ Extraction: {len(raw_documents)} pages")

    # 2️⃣ Enhanced Chunking
    splitter = DynamicTechnicalTextSplitter()
    chunks = splitter.split_documents(raw_documents)
    logger.info(f"Dynamic chunking produced {len(chunks)} chunks")
    
    if chunks:
        avg_size = sum(len(c.page_content) for c in chunks) / len(chunks)
        logger.info(f"   Average chunk: {avg_size:.0f} chars")

    # 3️⃣ Embeddings
    device = 'cuda' if torch.cuda.is_available() and os.environ.get("USE_GPU", "1") == "1" else 'cpu'
    logger.info(f"🧠 Generating embeddings (Device: {device})...")

    embeddings = E5EmbeddingsWithPrefix(
        model_name="intfloat/multilingual-e5-large",
        model_kwargs={'device': device},
        encode_kwargs={'normalize_embeddings': True}
    )

    # 4️⃣ Rebuild vectorstore
    if os.path.exists(DB_DIR):
        logger.info(f"⚠️  Rebuilding vectorstore...")
        shutil.rmtree(DB_DIR)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=DB_DIR
    )

    logger.info(f"✅ Ingestion completed! {len(chunks)} chunks indexed")
    
    # 5️⃣ Test Hybrid Retrieval with Re-ranking
    logger.info("\n🧪 Testing Hybrid Retrieval with Re-ranking...")
    
    reranker = CrossEncoderReranker()
    hybrid_retriever = HybridRetrieverWithReranking(
        vectorstore=vectorstore,
        reranker=reranker,
        k_semantic=20,
        k_mmr=20,
        k_final=5
    )
    
    test_queries = [
        "concentration P2O5 acide phosphorique après filtration",
        "température de cristallisation",
        "équipements de filtration utilisés"
    ]
    
    for query in test_queries:
        logger.info(f"\n📝 Query: '{query}'")
        results = hybrid_retriever.retrieve(query)
        
        for i, (doc, score) in enumerate(results, 1):
            logger.info(f"   {i}. Score: {score:.4f} | Source: {doc.metadata.get('source')} (p.{doc.metadata.get('page')})")
            logger.info(f"      Preview: {doc.page_content[:100]}...")

# -------------------------------
# Entry Point
# -------------------------------
if __name__ == "__main__":
    ingest_documents()
