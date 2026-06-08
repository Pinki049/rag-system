"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ingestFile, ingestURL, getDocuments, deleteDocuments } from "@/lib/api";
import { X, Upload, Link, FileText, Globe, Trash2, Loader2 } from "lucide-react";

interface DocumentPanelProps {
  onClose: () => void;
  onDocumentsChange: () => void;
  documents: string[];
}

export default function DocumentPanel({ onClose, onDocumentsChange, documents }: DocumentPanelProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true);
    try {
      for (const file of acceptedFiles) {
        await ingestFile(file);
      }
      showMessage(`Successfully ingested ${acceptedFiles.length} file(s)!`, "success");
      onDocumentsChange();
    } catch {
      showMessage("Failed to ingest file. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [onDocumentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
    },
  });

  const handleURLIngest = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await ingestURL(url);
      showMessage("URL ingested successfully!", "success");
      setUrl("");
      onDocumentsChange();
    } catch {
      showMessage("Failed to ingest URL. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete all documents? This cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteDocuments();
      showMessage("All documents deleted!", "success");
      onDocumentsChange();
    } catch {
      showMessage("Failed to delete documents.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        width: "560px",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Document Library</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
              {documents.length} document(s) ingested
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: "4px",
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Dropzone */}
          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragActive ? "rgba(124,58,237,0.05)" : "transparent",
            transition: "all 0.2s",
          }}>
            <input {...getInputProps()} />
            <Upload size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
              {isDragActive ? "Drop files here!" : "Drag & drop files here"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Supports PDF, Markdown, TXT
            </p>
          </div>

          {/* URL Input */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Link size={15} style={{
                position: "absolute", left: "12px", top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)",
              }} />
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleURLIngest()}
                placeholder="Paste a URL to ingest..."
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
            <button
              onClick={handleURLIngest}
              disabled={loading || !url.trim()}
              style={{
                padding: "10px 16px",
                backgroundColor: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                opacity: loading || !url.trim() ? 0.5 : 1,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Add"}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: message.type === "success" ? "#22c55e" : "#ef4444",
              fontSize: "13px",
            }}>
              {message.text}
            </div>
          )}

          {/* Document List */}
          {documents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "4px",
              }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Ingested Documents
                </span>
                <button onClick={handleDeleteAll} style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#ef4444", fontSize: "12px",
                }}>
                  <Trash2 size={12} /> Delete All
                </button>
              </div>
              {documents.map((doc, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 12px", borderRadius: "8px",
                  backgroundColor: "var(--sidebar)", border: "1px solid var(--border)",
                }}>
                  {doc.startsWith("http") ? <Globe size={14} color="var(--accent)" /> : <FileText size={14} color="var(--accent)" />}
                  <span style={{
                    fontSize: "13px", color: "var(--text-secondary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {doc}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}