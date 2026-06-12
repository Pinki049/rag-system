from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from src.embeddings import get_collection

_reranker = None

def get_reranker():
    global _reranker
    if _reranker is None:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _reranker

def get_all_chunks():
    collection, _ = get_collection()
    results = collection.get(include=["documents", "metadatas"])
    chunks = []
    for i in range(len(results["documents"])):
        chunks.append({
            "content": results["documents"][i],
            "source": results["metadatas"][i]["source"],
            "type": results["metadatas"][i]["type"],
            "chunk_id": results["metadatas"][i]["chunk_id"]
        })
    return chunks

def bm25_search(query, chunks, k=10):
    tokenized_corpus = [c["content"].lower().split() for c in chunks]
    tokenized_query = query.lower().split()
    bm25 = BM25Okapi(tokenized_corpus)
    scores = bm25.get_scores(tokenized_query)
    top_k_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
    return [chunks[i] for i in top_k_indices]

def vector_search(query, k=10):
    from src.embeddings import get_collection
    collection, model = get_collection()
    query_embedding = model.encode([query]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=k)
    chunks = []
    for i in range(len(results["documents"][0])):
        chunks.append({
            "content": results["documents"][0][i],
            "source": results["metadatas"][0][i]["source"],
            "type": results["metadatas"][0][i]["type"],
            "chunk_id": results["metadatas"][0][i]["chunk_id"]
        })
    return chunks

def deduplicate(chunks):
    seen = set()
    unique = []
    for chunk in chunks:
        key = (chunk["source"], chunk["chunk_id"])
        if key not in seen:
            seen.add(key)
            unique.append(chunk)
    return unique

def rerank(query, chunks, top_n=5):
    pairs = [[query, chunk["content"]] for chunk in chunks]
    scores = get_reranker().predict(pairs)
    scored_chunks = list(zip(scores, chunks))
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [chunk for _, chunk in scored_chunks[:top_n]]
    return top_chunks

def hybrid_retrieve(query, k=5):
    all_chunks = get_all_chunks()
    bm25_results = bm25_search(query, all_chunks, k=10)
    vector_results = vector_search(query, k=10)
    combined = deduplicate(bm25_results + vector_results)
    final_chunks = rerank(query, combined, top_n=k)
    return final_chunks