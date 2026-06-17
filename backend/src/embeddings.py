import os
import requests
from pinecone import Pinecone, ServerlessSpec

_index = None
HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"

def get_embedding(text):
    token = os.environ.get("HF_API_TOKEN")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        HF_API_URL,
        headers=headers,
        json={"inputs": text[:512], "options": {"wait_for_model": True}}
    )
    result = response.json()
    if isinstance(result, list):
        if isinstance(result[0], list):
            return result[0]
        return result
    return [0.0] * 384

def get_index():
    global _index
    if _index is None:
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        index_name = "askmydoc"
        existing = pc.list_indexes().names()
        if index_name not in existing:
            pc.create_index(
                name=index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        _index = pc.Index(index_name)
    return _index

def get_collection():
    return get_index(), None

def store_chunks(chunks):
    index = get_index()
    existing = index.fetch(ids=[f"{c['source']}_{c['chunk_id']}" for c in chunks])
    existing_ids = set(existing.vectors.keys())
    new_chunks = [c for c in chunks if f"{c['source']}_{c['chunk_id']}" not in existing_ids]
    if not new_chunks:
        print("No new chunks to store — already ingested!")
        return
    vectors = []
    for chunk in new_chunks:
        embedding = get_embedding(chunk["content"])
        vectors.append({
            "id": f"{chunk['source']}_{chunk['chunk_id']}",
            "values": embedding,
            "metadata": {
                "content": chunk["content"],
                "source": chunk["source"],
                "type": chunk["type"],
                "chunk_id": chunk["chunk_id"]
            }
        })
    index.upsert(vectors=vectors)
    print(f"Stored {len(new_chunks)} new chunks in Pinecone")

def list_sources():
    try:
        index = get_index()
        results = index.query(
            vector=[0.1] * 384,
            top_k=100,
            include_metadata=True
        )
        sources = list(set([m.metadata.get("source", "") for m in results.matches if m.metadata]))
        return sources
    except Exception as e:
        print(f"Error: {e}")
        return []