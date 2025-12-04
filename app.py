import logging
import os
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import StreamingResponse
from rag_engine_streaming import RAGEngine  # Your existing RAGEngine class

# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Environment Variables
# -----------------------------
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
OLLAMA_HOST = os.getenv("OLLAMA_HOST_URL", "http://localhost:11434")  # Default if not set

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(
    title="AI Service (FastAPI RAG)",
    description="Orchestrates RAG logic and streams LLM responses for React frontend.",
    version="0.1.0"
)

# -----------------------------
# Global RAG Engine Instance
# -----------------------------
try:
    RAG_ENGINE = RAGEngine()
except Exception as e:
    logger.critical(f"Failed to initialize RAG_ENGINE: {e}")
    RAG_ENGINE = None  # Safe fallback

# -----------------------------
# Health Check Endpoint
# -----------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "rag_engine_ready": RAG_ENGINE is not None}

# -----------------------------
# Streaming AI Response Endpoint
# -----------------------------
@app.post("/api/stream_response")
async def stream_response_endpoint(request: Request):
    """
    Receives a user question, performs RAG, and streams the LLM response.
    Designed to be proxied by Node.js Fastify for React frontend.
    """
    # 1. Internal Security Check
    if request.headers.get("x-internal-secret") != INTERNAL_API_KEY:
        logger.warning("Unauthorized access attempt to /api/stream_response")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal access"
        )

    # 2. Parse Request JSON
    try:
        data = await request.json()
        user_id = data.get("user_id")
        question = data.get("question")
        conversation_id = data.get("conversation_id")

        if not question:
            raise HTTPException(status_code=400, detail="Question is required.")

    except Exception as e:
        logger.error(f"Failed to parse JSON body: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    # 3. Stream RAG response
    try:
        generator = RAG_ENGINE.stream_query(
            question=question,
            top_k=6  # Can be dynamic if needed
        )
        return StreamingResponse(generator, media_type="text/plain")

    except Exception as e:
        logger.error(f"Critical error during RAG execution: {e}")

        async def error_stream():
            yield "SYSTEM_ERROR: Une erreur inattendue est survenue dans le service AI."

        return StreamingResponse(
            error_stream(),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            media_type="text/plain"
        )
