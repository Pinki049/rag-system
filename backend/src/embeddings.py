import os
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

_model = None
_index = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def get_index():
    global _index
    if _index is None:
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        index_name = "askmydoc"
        if index_name not in pc.list_indexes().names():
            pc.create_index(
                name=index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        _index = pc.Index(index_name)
    return _index

def get_collection():
    return get_index(), get_model()

def store_chunks(chunks):
    index = get_index()
    model = get_model()
    existing = index.fetch(ids=[f"{c['source']}_{c['chunk_id']}" for c in chunks])
    existing_ids = set(existing.vectors.keys())
    new_chunks = [c for c in chunks if f"{c['source']}_{c['chunk_id']}" not in existing_ids]
    if not new_chunks:
        print("No new chunks to store — already ingested!")
        return
    vectors = []
    embeddings = model.encode([c["content"] for c in new_chunks]).tolist()
    for i, chunk in enumerate(new_chunks):
        vectors.append({
            "id": f"{chunk['source']}_{chunk['chunk_id']}",
            "values": embeddings[i],
            "metadata": {
                "content": chunk["content"],
                "source": chunk["source"],
                "type": chunk["type"],
                "chunk_id": chunk["chunk_id"]
            }
        })
    index.upsert(vectors=vectors)
    print(f"Stored {len(new_chunks)} new chunks in Pinecone")

def get_all_chunks_from_index():
    index = get_index()
    results = index.query(
        vector=[0.0] * 384,
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

def list_sources():
    index = get_index()
    results = index.query(
        vector=[0.0] * 384,
        top_k=1000,
        include_metadata=True
    )
    sources = list(set([m.metadata.get("source", "") for m in results.matches]))
    return sources