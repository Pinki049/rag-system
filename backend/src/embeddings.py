import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path="./chromadb_store")
collection = client.get_or_create_collection(name="rag_documents")

def get_existing_ids():
    existing = collection.get(include=[])
    return set(existing["ids"])

def store_chunks(chunks):
    existing_ids = get_existing_ids()
    new_chunks = []
    for c in chunks:
        chunk_id = f"{c['source']}_{c['chunk_id']}"
        if chunk_id not in existing_ids:
            new_chunks.append(c)
    if not new_chunks:
        print("No new chunks to store — already ingested!")
        return
    documents = [c["content"] for c in new_chunks]
    ids = [f"{c['source']}_{c['chunk_id']}" for c in new_chunks]
    metadatas = [{"source": c["source"], "type": c["type"], "chunk_id": c["chunk_id"]} for c in new_chunks]
    embeddings = model.encode(documents).tolist()
    collection.add(documents=documents, embeddings=embeddings, ids=ids, metadatas=metadatas)
    print(f"Stored {len(new_chunks)} new chunks in ChromaDB")

def get_collection():
    return collection, model