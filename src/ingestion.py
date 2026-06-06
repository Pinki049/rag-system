import os
import requests
from pathlib import Path
from bs4 import BeautifulSoup
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def load_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return [{"content": text, "source": str(file_path), "type": "pdf"}]

def load_markdown(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    return [{"content": text, "source": str(file_path), "type": "markdown"}]

def load_webpage(url):
    response = requests.get(url, timeout=10)
    soup = BeautifulSoup(response.content, "html.parser")
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    return [{"content": text, "source": url, "type": "webpage"}]

def load_documents(data_folder="data", urls=[]):
    documents = []
    data_path = Path(data_folder)
    for file in data_path.iterdir():
        if file.suffix == ".pdf":
            documents.extend(load_pdf(file))
        elif file.suffix in [".md", ".txt"]:
            documents.extend(load_markdown(file))
    for url in urls:
        documents.extend(load_webpage(url))
    return documents

def chunk_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=100,
        length_function=len,
    )
    chunks = []
    for doc in documents:
        splits = splitter.split_text(doc["content"])
        for i, split in enumerate(splits):
            chunks.append({
                "content": split,
                "source": doc["source"],
                "type": doc["type"],
                "chunk_id": i
            })
    return chunks