"use client";

import { Message, Source } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { ExternalLink, FileText, Globe, Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageProps {
  message: Message;
}

export default function MessageComponent({ message }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      gap: "8px",
      marginBottom: "24px",
      maxWidth: "100%",
    }}>
      <div style={{
        fontSize: "12px",
        color: "var(--text-muted)",
        fontWeight: "600",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        paddingLeft: isUser ? "0" : "4px",
      }}>
        {isUser ? "You" : "Ask My Doc"}
      </div>

      <div style={{
        maxWidth: "85%",
        padding: "14px 40px 14px 18px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        backgroundColor: isUser ? "var(--user-bubble)" : "var(--assistant-bubble)",
        border: "1px solid var(--border)",
        fontSize: "15px",
        lineHeight: "1.7",
        color: "var(--text-primary)",
        position: "relative" as const,
      }}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className={message.isStreaming ? "streaming-cursor" : ""}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {!isUser && !message.isStreaming && message.content && (
          <button
            onClick={handleCopy}
            style={{
          position: "absolute" as const,
          top: "8px",
          right: "8px",
          background: "var(--card)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: "4px 6px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          zIndex: 10,
}}
          >
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
          </button>
        )}
      </div>

      {!isUser && message.sources && message.sources.length > 0 && !message.isStreaming && (
        <div style={{
          maxWidth: "85%",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: "100%",
        }}>
          <div style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            fontWeight: "600",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
            paddingLeft: "4px",
          }}>
            Sources
          </div>
          {message.sources.map((source, i) => (
            <SourceCard key={i} source={source} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isWeb = source.type === "webpage";

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        backgroundColor: "#161616",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "20px",
          height: "20px",
          borderRadius: "4px",
          backgroundColor: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "20px",
          fontSize: "10px",
          fontWeight: "700",
          color: "white",
        }}>
          {index + 1}
        </div>
        {isWeb
          ? <Globe size={13} color="var(--text-muted)" />
          : <FileText size={13} color="var(--text-muted)" />
        }
        <span style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {source.source.split(/[\\/]/).pop()}
        </span>
        <span style={{
          fontSize: "11px",
          color: "var(--accent)",
          fontWeight: "500",
          whiteSpace: "nowrap",
        }}>
          {expanded ? "Hide excerpt ↑" : "View excerpt ↓"}
        </span>
        {isWeb && (
          <a
            href={source.source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: "var(--text-muted)", display: "flex" }}
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
      {expanded && (
        <div style={{
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid var(--border)",
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: "1.6",
          backgroundColor: "rgba(124,58,237,0.05)",
          padding: "10px",
          borderRadius: "6px"
        
        }}>
          <div style={{
            fontSize: "11px",
            color: "var(--accent)",
            fontWeight: "600",
            marginBottom: "6px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
          }}>
            Relevant excerpt:
          </div>
          {source.content}
        </div>
      )}
    </div>
  );
}