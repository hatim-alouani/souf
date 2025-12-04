import asyncio
import os
import json
import logging
from rag_engine_streaming import RAGEngine

# Set the necessary environment variable for the internal key
# IMPORTANT: This must match the value you set in your FastAPI's main.py and Node.js .env
os.environ["INTERNAL_API_KEY"] = "7c4e201b17d8481358d6010a3f6288b8e3a24b1d6836154b23d0c3d9178f99e3"
os.environ["OLLAMA_HOST_URL"] = "http://host.docker.internal:11434" # Or your actual Ollama host

# Suppress log messages for cleaner test output
logging.getLogger().setLevel(logging.WARNING)

async def test_fastapi_streaming_function():
    print("--- 🔬 Testing FastAPI RAG Engine Streaming ---")
    try:
        # Initialize the RAG engine (will load vectorstore and connect to Ollama)
        rag_engine = RAGEngine()
        
        if not rag_engine.is_ready:
            print("❌ RAG Engine is not ready. Check vectorstore and Ollama connection.")
            return

        test_question = "Quels sont les facteurs qui influencent l'efficacité de la séparation liquide-solide dans le procédé Prayon?"
        
        # Get the generator stream directly from the RAG engine function
        stream_generator = rag_engine.stream_query(test_question, top_k=6)
        
        # Iterate over the stream
        is_metadata_read = False
        full_answer = ""
        
        print(f"\n✅ Streaming Response for Question: {test_question}\n")

        for chunk in stream_generator:
            # Check for the metadata header
            if not is_metadata_read and chunk.startswith("METADATA_START:"):
                try:
                    metadata_str = chunk.split("METADATA_START:")[1].split(":METADATA_END")[0]
                    metadata = json.loads(metadata_str)
                    print("--- METADATA (Sources & Context) Found ---")
                    print(f"Sources: {metadata['sources']}")
                    print("-----------------------------------------")
                    # Print the remaining part of the chunk (which might contain the start of the answer)
                    llm_start_content = chunk.split(":METADATA_END")[1].lstrip()
                    if llm_start_content:
                        print(llm_start_content, end="", flush=True)
                        full_answer += llm_start_content
                    is_metadata_read = True
                except Exception as e:
                    print(f"❌ Failed to parse metadata: {e}. Chunk: {chunk}")
                    print(chunk, end="", flush=True)
                    full_answer += chunk
            else:
                print(chunk, end="", flush=True)
                full_answer += chunk
        
        if not full_answer.strip():
             print("\n\n❌ Stream was empty or contained only errors.")

        print("\n\n--- ✅ RAG Stream Test Complete ---")
        
    except Exception as e:
        print(f"\n\n--- ❌ Critical Python Test Failure: {e} ---")

if __name__ == "__main__":
    # Since the RAG engine uses synchronous LangChain calls, we can run this directly
    test_fastapi_streaming_function()