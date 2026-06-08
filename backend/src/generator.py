import os
import yaml
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def load_prompt():
    with open("config/prompts.yaml", "r") as f:
        prompts = yaml.load(f, Loader=yaml.SafeLoader)
    return prompts["rag_prompt"]

def build_context(chunks):
    context = ""
    for i, chunk in enumerate(chunks):
        context += f"\n[{i+1}] Source: {chunk['source']}\n{chunk['content']}\n"
    return context

def generate_answer(query, chunks):
    prompt_template = load_prompt()
    context = build_context(chunks)
    prompt = prompt_template.replace("{context}", context).replace("{question}", query)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    answer = response.choices[0].message.content
    return {
        "answer": answer,
        "chunks": chunks,
        "sources": list(set([c["source"] for c in chunks]))
    }