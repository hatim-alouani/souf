import os
import logging
import shutil
from typing import List, Dict

import fitz  # PyMuPDF
import torch
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

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
# PDF Extraction
# -------------------------------
def extract_text_from_pdf(pdf_path: str) -> List[Dict]:
    doc_content = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            text = doc[page_num].get_text("text")
            if text.strip():
                doc_content.append({
                    "page_content": text,
                    "metadata": {
                        "source": os.path.basename(pdf_path),
                        "page": page_num + 1,
                        "type_doc": "technique"
                    }
                })
        doc.close()
        logger.info(f"✅ Extracted {len(doc_content)} pages from {os.path.basename(pdf_path)}")
    except Exception as e:
        logger.error(f"❌ Error reading PDF {pdf_path}: {e}")
    return doc_content

# -------------------------------
# Document Ingestion
# -------------------------------
def ingest_documents():
    logger.info("🚀 Starting ingestion...")

    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        logger.warning(f"{DATA_DIR} created. Please add your PDFs here.")
        return

    pdf_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith('.pdf')]
    if not pdf_files:
        logger.warning(f"No PDFs found in {DATA_DIR}")
        return

    # 1️⃣ Extract all PDFs
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

    logger.info(f"Extraction complete: {len(raw_documents)} pages extracted.")

    # 2️⃣ Chunking
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=300,
        separators=["\n\n", "\n", ". ", ".", " ", ""]
    )
    chunks = splitter.split_documents(raw_documents)
    logger.info(f"Chunking complete: {len(chunks)} chunks generated.")

    # 3️⃣ GPU detection
    device = 'cuda' if torch.cuda.is_available() and os.environ.get("USE_GPU", "1") == "1" else 'cpu'
    logger.info(f"Generating embeddings (Device: {device})...")

    embeddings = HuggingFaceEmbeddings(
        model_name="intfloat/multilingual-e5-large",
        model_kwargs={'device': device},
        encode_kwargs={'normalize_embeddings': True}
    )

    # 4️⃣ Handle vectorstore corruption
    if os.path.exists(DB_DIR):
        try:
            Chroma(persist_directory=DB_DIR)
        except Exception:
            logger.warning(f"❌ Existing vectorstore {DB_DIR} seems corrupted. Rebuilding...")
            shutil.rmtree(DB_DIR)

    # 5️⃣ Create or overwrite Chroma vectorstore
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=DB_DIR
    )

    logger.info(f"✅ Ingestion completed! {len(chunks)} chunks indexed in {DB_DIR}")

# -------------------------------
# Entry Point
# -------------------------------
if __name__ == "__main__":
    ingest_documents()
