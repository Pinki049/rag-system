import axios from "axios";

const API_URL = '/api/proxy';

export const api = axios.create({
  baseURL: API_URL,
});

// Health check
export const checkHealth = async () => {
  const res = await api.get("/health");
  return res.data;
};

// Ingest a URL
export const ingestURL = async (url: string) => {
  const res = await api.post("/ingest/url", { url });
  return res.data;
};

// Ingest a file
export const ingestFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/ingest/file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Get all documents
export const getDocuments = async () => {
  const res = await api.get("/documents");
  return res.data;
};

// Delete all documents
export const deleteDocuments = async () => {
  const res = await api.delete("/documents");
  return res.data;
};

// Get sources for a question
export const getSources = async (question: string, k: number = 5) => {
  const res = await api.get("/ask/sources", { params: { question, k } });
  return res.data;
};

// Stream answer from backend
export const streamAnswer = async (
  question: string,
  onChunk: (chunk: string) => void,
  onDone: () => void
) => {
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, k: 5 }),
  });

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      onDone();
      break;
    }
    const chunk = decoder.decode(value);
    onChunk(chunk);
  }
};

// Run evaluation
export const runEvaluation = async () => {
  const res = await api.get("/evaluate");
  return res.data;
};