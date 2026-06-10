"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Loader2, Plus, Link, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { ingestFile, ingestURL } from "@/lib/api";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  onDocumentsChange: () => void;
}

export default function ChatInput({ onSend, isLoading, disabled, onDocumentsChange }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showURLInput, setShowURLInput] = useState(false);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (files) => {
      setUploading(true);
      setShowMenu(false);
      try {
        for (const file of files) {
          await ingestFile(file);
        }
        showMsg(`✓ ${files.length} file(s) ingested!`, "success");
        onDocumentsChange();
      } catch {
        showMsg("Failed to ingest file.", "error");
      } finally {
        setUploading(false);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
    },
    noClick: true,
  });

  const handleURLSubmit = async () => {
    if (!url.trim()) return;
    setUploading(true);
    try {
      await ingestURL(url);
      showMsg("✓ URL ingested!", "success");
      setUrl("");
      setShowURLInput(false);
      onDocumentsChange();
    } catch {
      showMsg("Failed to ingest URL.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading || disabled) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  return (
    <div style={{ padding: "12px 24px 24px", backgroundColor: "var(--background)" }}>

      {/* Status message */}
      {message && (
        <div style={{
          marginBottom: "8px",
          padding: "8px 14px",
          borderRadius: "8px",
          backgroundColor: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: message.type === "success" ? "#22c55e" : "#ef4444",
          fontSize: "13px",
        }}>
          {message.text}
        </div>
      )}

      {/* URL input bar */}
      {showURLInput && (
        <div style={{
          marginBottom: "8px",
          display: "flex",
          gap: "8px",
          padding: "10px 14px",
          backgroundColor: "var(--card)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
        }}>
          <Link size={15} color="var(--text-muted)" style={{ marginTop: "2px" }} />
          <input
            autoFocus
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleURLSubmit()}
            placeholder="Paste URL and press Enter..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "14px",
            }}
          />
          <button onClick={() => setShowURLInput(false)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", display: "flex",
          }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main input */}
      <div {...getRootProps()} style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        backgroundColor: "var(--input-bg)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "10px 12px",
        position: "relative",
      }}>
        <input {...getInputProps()} />

        {/* Plus button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: showMenu ? "var(--accent)" : "var(--card)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: showMenu ? "white" : "var(--text-muted)",
              transition: "all 0.2s",
              minWidth: "32px",
            }}
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          </button>

          {/* Popup menu */}
          {showMenu && (
            <div style={{
              position: "absolute",
              bottom: "42px",
              left: "0",
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
              minWidth: "180px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              zIndex: 100,
            }}>
              {/* Upload file option */}
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "14px",
                transition: "background-color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sidebar)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <FileText size={15} color="var(--accent)" />
                Upload File
                <input
                  type="file"
                  accept=".pdf,.md,.txt"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setShowMenu(false);
                    setUploading(true);
                    try {
                      await ingestFile(file);
                      showMsg(`✓ ${file.name} ingested!`, "success");
                      onDocumentsChange();
                    } catch {
                      showMsg("Failed to ingest file.", "error");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>

              {/* Paste URL option */}
              <button
                onClick={() => { setShowMenu(false); setShowURLInput(true); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  borderTop: "1px solid var(--border)",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sidebar)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Link size={15} color="var(--accent)" />
                Paste URL
              </button>
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask anything about your documents..."
          disabled={isLoading}
          rows={1}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: "15px",
            lineHeight: "1.6",
            resize: "none",
            fontFamily: "inherit",
            maxHeight: "200px",
            overflowY: "auto",
            paddingTop: "2px",
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: input.trim() && !isLoading ? "var(--accent)" : "var(--border)",
            border: "none",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
            minWidth: "32px",
          }}
        >
          {isLoading
            ? <Loader2 size={15} color="white" />
            : <Send size={15} color="white" />
          }
        </button>
      </div>

      <p style={{
        textAlign: "center",
        fontSize: "12px",
        color: "var(--text-muted)",
        marginTop: "8px",
      }}>
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}