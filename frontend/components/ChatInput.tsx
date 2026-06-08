"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div style={{
      padding: "16px 24px 24px",
      borderTop: "1px solid var(--border)",
      backgroundColor: "var(--background)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "12px",
        backgroundColor: "var(--input-bg)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "12px 16px",
        transition: "border-color 0.2s",
      }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask anything about your documents..."
          disabled={isLoading || disabled}
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
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || disabled}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            backgroundColor: input.trim() && !isLoading ? "var(--accent)" : "var(--border)",
            border: "none",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
            minWidth: "36px",
          }}
        >
          {isLoading
            ? <Loader2 size={16} color="white" className="animate-spin" />
            : <Send size={16} color="white" />
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