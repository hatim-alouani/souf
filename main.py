import logging
import os
import json
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import StreamingResponse
from rag_engine_streaming import RAGEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
OLLAMA_HOST = os.getenv("OLLAMA_HOST_URL", "http://host.docker.internal:11434")

app = FastAPI(
    title="AI Service (FastAPI RAG)",
    description="Orchestrates RAG logic and streams LLM responses.",
    version="0.1.0"
)

# Global RAG Engine
try:
    RAG_ENGINE = RAGEngine()
except Exception as e:
    logger.critical(f"Failed to initialize RAG_ENGINE: {e}")
    RAG_ENGINE = None

@app.get("/health")
def health_check():
    return {"status": "ok", "rag_engine_ready": RAG_ENGINE.is_ready if RAG_ENGINE else False}

@app.post("/api/stream_response")
async def stream_response_endpoint(request: Request):
    if request.headers.get("x-internal-secret") != INTERNAL_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized internal access")

    try:
        data = await request.json()
        question = data.get("question")
        if not question:
            raise HTTPException(status_code=400, detail="Question is required.")
    except Exception as e:
        logger.error(f"Failed to parse JSON body: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    try:
        generator = RAG_ENGINE.stream_query(question=question, top_k=6)
        return StreamingResponse(generator, media_type="text/plain")
    except Exception as e:
        logger.error(f"Critical error during RAG execution: {e}")
        async def error_stream():
            yield "SYSTEM_ERROR: Une erreur inattendue est survenue dans le service AI."
        return StreamingResponse(error_stream(), status_code=500, media_type="text/plain")
