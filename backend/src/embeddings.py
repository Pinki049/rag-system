import os
import hashlib
import json
from pinecone import Pinecone, ServerlessSpec

_index = None

def simple_embed(text):
    """Create a simple hash-based embedding - no ML needed"""
    import hashlib
    words = text.lower().split()[:100]
    vector = [0.0] * 384
    for i, word in enumerate(words):
        h = int(hashlib.md5(word.encode()).hexdigest(), 16)
        idx = h % 384
        vector[idx] += 1.0
    norm = sum(x**2 for x in vector) ** 0.5
    if norm > 0:
        vector = [x/norm for x in vector]
    return vector

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

def get_embedding(text):
    return simple_embed(text)

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

def get_all_chunks_from_index():
    try:
        index = get_index()
        results = index.query(
            vector=[0.1] * 384,
            top_k=1000,
            include_metadata=True
        )
        chunks = []
        for match in results.matches:
            chunks.append({
                "content": match.metadata.get("content", ""),
                "source": match.metadata.get("source", ""),
                "type": match.metadata.get("type", ""),
                "chunk_id": match.metadata.get("chunk_id", 0)
            })
        return chunks
    except:
        return []