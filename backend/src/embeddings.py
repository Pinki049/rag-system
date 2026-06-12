import chromadb
from sentence_transformers import SentenceTransformer

_model = None
_client = None
_collection = None

def get_collection():
    global _model, _client, _collection
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    if _client is None:
        _client = chromadb.PersistentClient(path="./chromadb_store")
        _collection = _client.get_or_create_collection(name="rag_documents")
    return _collection, _model

def store_chunks(chunks):
    collection, model = get_collection()
    existing = collection.get(include=[])
    existing_ids = set(existing["ids"])
    new_chunks = [c for c in chunks if f"{c['source']}_{c['chunk_id']}" not in existing_ids]
    if not new_chunks:
        print("No new chunks to store — already ingested!")
        return
    documents = [c["content"] for c in new_chunks]
    ids = [f"{c['source']}_{c['chunk_id']}" for c in new_chunks]
    metadatas = [{"source": c["source"], "type": c["type"], "chunk_id": c["chunk_id"]} for c in new_chunks]
    embeddings = model.encode(documents).tolist()
    collection.add(documents=documents, embeddings=embeddings, ids=ids, metadatas=metadatas)
    print(f"Stored {len(new_chunks)} new chunks in ChromaDB")