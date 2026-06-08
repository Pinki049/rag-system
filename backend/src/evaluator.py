from dotenv import load_dotenv
load_dotenv()

import os
import json
from groq import Groq
from src.hybrid_retriever import hybrid_retrieve
from src.generator import generate_answer

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

GOLDEN_DATASET = [
    {
        "question": "What is retrieval augmented generation?",
        "expected_answer": "RAG is a technique that combines retrieval of relevant documents with language model generation to produce grounded answers."
    },
    {
        "question": "What are the benefits of RAG over fine-tuning?",
        "expected_answer": "RAG allows models to access up-to-date information without retraining, is more cost-effective, and provides citations for transparency."
    },
    {
        "question": "How does vector search work in RAG?",
        "expected_answer": "Vector search converts text into embeddings and finds semantically similar chunks using distance metrics like cosine similarity."
    },
]

def check_faithfulness(answer, chunks):
    context = "\n".join([c["content"] for c in chunks])
    prompt = f"""You are an evaluation assistant. Given the context and an answer, determine if the answer is faithful to the context.
    
Context:
{context}

Answer:
{answer}

Is every claim in the answer supported by the context? Reply with JSON only:
{{"faithful": true or false, "score": 0.0 to 1.0, "reason": "brief explanation"}}"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    text = response.choices[0].message.content
    try:
        text = text.strip().replace("```json", "").replace("```", "")
        return json.loads(text)
    except:
        return {"faithful": False, "score": 0.0, "reason": "Could not parse response"}

def run_evaluation():
    print("Running evaluation...\n")
    results = []
    total_score = 0

    for item in GOLDEN_DATASET:
        question = item["question"]
        chunks = hybrid_retrieve(question, k=5)
        result = generate_answer(question, chunks)
        answer = result["answer"]
        faithfulness = check_faithfulness(answer, chunks)
        total_score += faithfulness["score"]
        results.append({
            "question": question,
            "answer": answer,
            "faithful": faithfulness["faithful"],
            "score": faithfulness["score"],
            "reason": faithfulness["reason"]
        })
        print(f"Q: {question}")
        print(f"Faithful: {faithfulness['faithful']} | Score: {faithfulness['score']}")
        print(f"Reason: {faithfulness['reason']}\n")

    avg_score = total_score / len(GOLDEN_DATASET)
    print(f"Average Faithfulness Score: {avg_score:.2f}")

    if avg_score < 0.7:
        print("EVALUATION FAILED — quality below threshold!")
        exit(1)
    else:
        print("EVALUATION PASSED ✅")

    with open("evaluation_results.json", "w") as f:
        json.dump({"average_score": avg_score, "results": results}, f, indent=2)

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    run_evaluation()