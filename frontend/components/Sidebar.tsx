"use client";

import { useState } from "react";
import { Chat } from "@/lib/types";
import { createChat, deleteChat } from "@/lib/store";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  FileText,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onOpenDocuments: () => void;
  documentCount: number;
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenDocuments,
  documentCount,
}: SidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  return (
    <div style={{
      width: "260px",
      minWidth: "260px",
      height: "100vh",
      backgroundColor: "var(--sidebar)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "12px",
      gap: "8px",
    }}>
      {/* Logo */}
      <div style={{
        padding: "12px 8px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "4px",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
        }}>📄</div>
        <span style={{
          fontWeight: "700",
          fontSize: "16px",
          color: "var(--text-primary)",
        }}>Ask My Doc</span>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          backgroundColor: "transparent",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "500",
          transition: "background-color 0.2s",
          width: "100%",
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--card)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <Plus size={16} />
        New Chat
      </button>

      {/* Chat History */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}>
        {chats.length === 0 ? (
          <div style={{
            padding: "20px 8px",
            color: "var(--text-muted)",
            fontSize: "13px",
            textAlign: "center",
          }}>
            No chats yet. Start a conversation!
          </div>
        ) : (
          chats.slice().reverse().map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              onMouseEnter={() => setHoveredChat(chat.id)}
              onMouseLeave={() => setHoveredChat(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: activeChatId === chat.id ? "var(--card)" : hoveredChat === chat.id ? "#1a1a1a" : "transparent",
                border: activeChatId === chat.id ? "1px solid var(--border)" : "1px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <MessageSquare size={14} style={{ color: "var(--text-muted)", minWidth: "14px" }} />
              <span style={{
                flex: 1,
                fontSize: "13px",
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {chat.title}
              </span>
              {hoveredChat === chat.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Documents Button */}
      <button
        onClick={onOpenDocuments}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          backgroundColor: "transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "13px",
          transition: "background-color 0.2s",
          width: "100%",
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--card)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <FileText size={15} />
        <span style={{ flex: 1, textAlign: "left" }}>Documents</span>
        <span style={{
          backgroundColor: "var(--accent)",
          color: "white",
          borderRadius: "10px",
          padding: "1px 7px",
          fontSize: "11px",
          fontWeight: "600",
        }}>{documentCount}</span>
        <ChevronRight size={13} />
      </button>
    </div>
  );
}