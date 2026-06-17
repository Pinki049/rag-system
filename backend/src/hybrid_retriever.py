from rank_bm25 import BM25Okapi
from src.embeddings import get_index, get_all_chunks_from_index

def bm25_search(query, chunks, k=10):
    if not chunks:
        return []
    tokenized_corpus = [c["content"].lower().split() for c in chunks]
    tokenized_query = query.lower().split()
    bm25 = BM25Okapi(tokenized_corpus)
    scores = bm25.get_scores(tokenized_query)
    top_k_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
    return [chunks[i] for i in top_k_indices]

def vector_search(query, k=10):
    from src.embeddings import get_embedding, get_index
    index = get_index()
    query_embedding = get_embedding(query)
    results = index.query(
        vector=query_embedding,
        top_k=k,
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

def deduplicate(chunks):
    seen = set()
    unique = []
    for chunk in chunks:
        key = (chunk["source"], chunk["chunk_id"])
        if key not in seen:
            seen.add(key)
            unique.append(chunk)
    return unique

def hybrid_retrieve(query, k=5):
    all_chunks = get_all_chunks_from_index()
    bm25_results = bm25_search(query, all_chunks, k=10)
    vector_results = vector_search(query, k=10)
    combined = deduplicate(bm25_results + vector_results)
    return combined[:k]