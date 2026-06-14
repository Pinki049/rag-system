from dotenv import load_dotenv
load_dotenv()

import os
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from groq import Groq

from src.ingestion import load_documents, chunk_documents, load_webpage
from src.embeddings import store_chunks, get_collection
from src.hybrid_retriever import hybrid_retrieve
from src.generator import build_context, load_prompt

app = FastAPI(title="Ask My Doc API", version="1.0.0")

class CORSMiddlewareCustom(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.add_middleware(CORSMiddlewareCustom)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

class QuestionRequest(BaseModel):
    question: str
    k: int = 5

class URLRequest(BaseModel):
    url: str

@app.get("/health")
def health():
    return {"status": "ok", "message": "Ask My Doc API is running"}

@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    allowed = [".pdf", ".md", ".txt"]
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {suffix} not supported. Use PDF, MD, or TXT.")
    save_path = Path("data") / file.filename
    os.makedirs("data", exist_ok=True)
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    documents = load_documents(data_folder="data")
    chunks = chunk_documents(documents)
    store_chunks(chunks)
    return {"message": f"Successfully ingested {file.filename}", "chunks_created": len(chunks)}

@app.post("/ingest/url")
async def ingest_url(request: URLRequest):
    try:
        documents = load_webpage(request.url)
        chunks = chunk_documents(documents)
        store_chunks(chunks)
        return {"message": f"Successfully ingested {request.url}", "chunks_created": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/documents")
def list_documents():
    from src.embeddings import list_sources
    sources = list_sources()
    return {"documents": sources, "total": len(sources)}

@app.delete("/documents")
def delete_all_documents():
    from src.embeddings import get_index
    index = get_index()
    index.delete(delete_all=True)
    return {"message": "All documents deleted successfully"}

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    chunks = hybrid_retrieve(request.question, k=request.k)
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant documents found")

    prompt_template = load_prompt()
    context = build_context(chunks)
    prompt = prompt_template.replace("{context}", context).replace("{question}", request.question)

    def stream_response():
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            stream=True,
        )
        for chunk in response:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(stream_response(), media_type="text/plain")

@app.get("/ask/sources")
async def get_sources(question: str, k: int = 5):
    chunks = hybrid_retrieve(question, k=k)
    seen_sources = set()
    sources = []
    for chunk in chunks:
        source_key = chunk["source"]
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append({
                "content": chunk["content"][:300] + "...",
                "source": chunk["source"],
                "type": chunk["type"]
            })
    return {"question": question, "sources": sources}

@app.get("/evaluate")
async def run_evaluation():
    from src.evaluator import run_evaluation
    try:
        run_evaluation()
        return {"message": "Evaluation complete — check evaluation_results.json"}
    except SystemExit:
        raise HTTPException(status_code=422, detail="Evaluation failed — quality below threshold")