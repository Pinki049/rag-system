from dotenv import load_dotenv
load_dotenv()

from src.ingestion import load_documents, chunk_documents
from src.embeddings import store_chunks
from src.hybrid_retriever import hybrid_retrieve
from src.generator import generate_answer

def ingest(urls=[]):
    print("Loading documents...")
    documents = load_documents(data_folder="data", urls=urls)
    print(f"Loaded {len(documents)} documents")
    chunks = chunk_documents(documents)
    print(f"Created {len(chunks)} chunks")
    store_chunks(chunks)
    print("Ingestion complete!")

def ask(question):
    print(f"\nQuestion: {question}")
    chunks = hybrid_retrieve(question, k=5)
    result = generate_answer(question, chunks)
    print(f"\nAnswer:\n{result['answer']}")
    print(f"\nSources:")
    for source in result['sources']:
        print(f"  - {source}")
    return result

if __name__ == "__main__":
    ingest(urls=[
        "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
        "https://en.wikipedia.org/wiki/Vector_database",
        "https://en.wikipedia.org/wiki/Fine-tuning_(deep_learning)"
    ])
    ask("What is retrieval augmented generation?")