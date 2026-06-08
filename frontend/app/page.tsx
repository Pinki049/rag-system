"use client";

import { useState, useEffect, useRef } from "react";
import { Chat, Message, Source } from "@/lib/types";
import {
  loadChats,
  saveChats,
  createChat,
  addMessage,
  updateLastMessage,
  deleteChat,
  generateId,
} from "@/lib/store";
import { streamAnswer, getSources, getDocuments } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MessageComponent from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import DocumentPanel from "@/components/DocumentPanel";
import { FileText } from "lucide-react";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    const stored = loadChats();
    if (stored.length > 0) {
      setChats(stored);
      setActiveChatId(stored[stored.length - 1].id);
    } else {
      handleNewChat();
    }
    fetchDocuments();
  }, []);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data.documents);
    } catch {
      setDocuments([]);
    }
  };

  const handleNewChat = () => {
    const newChat = createChat();
    setChats((prev) => {
      const updated = [...prev, newChat];
      saveChats(updated);
      return updated;
    });
    setActiveChatId(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => {
      const updated = deleteChat(prev, chatId);
      saveChats(updated);
      if (activeChatId === chatId) {
        if (updated.length > 0) {
          setActiveChatId(updated[updated.length - 1].id);
        } else {
          const newChat = createChat();
          saveChats([newChat]);
          setActiveChatId(newChat.id);
          return [newChat];
        }
      }
      return updated;
    });
  };

  const handleSend = async (question: string) => {
    if (!activeChatId || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: new Date(),
    };

    setChats((prev) => {
      let updated = addMessage(prev, activeChatId, userMessage);
      updated = addMessage(updated, activeChatId, assistantMessage);
      return updated;
    });

    setIsLoading(true);
    let fullAnswer = "";

    try {
      // Stream the answer
      await streamAnswer(
        question,
        (chunk) => {
          fullAnswer += chunk;
          setChats((prev) =>
            updateLastMessage(prev, activeChatId, fullAnswer, undefined, true)
          );
        },
        async () => {
          // When done streaming, fetch sources
          try {
            const sourcesData = await getSources(question);
            const sources: Source[] = sourcesData.sources;
            setChats((prev) =>
              updateLastMessage(prev, activeChatId, fullAnswer, sources, false)
            );
          } catch {
            setChats((prev) =>
              updateLastMessage(prev, activeChatId, fullAnswer, [], false)
            );
          }
          setIsLoading(false);
        }
      );
    } catch {
      setChats((prev) =>
        updateLastMessage(
          prev,
          activeChatId,
          "Sorry, something went wrong. Make sure the backend is running.",
          [],
          false
        )
      );
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      backgroundColor: "var(--background)",
      overflow: "hidden",
    }}>
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenDocuments={() => setShowDocuments(true)}
        documentCount={documents.length}
      />

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Top Bar */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--background)",
        }}>
          <h1 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "var(--text-secondary)",
          }}>
            {activeChat?.title || "New Chat"}
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setShowDocuments(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              <FileText size={14} />
              Manage Docs
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 10%",
        }}>
          {!activeChat || activeChat.messages.length === 0 ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "16px",
              color: "var(--text-muted)",
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
              }}>📄</div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}>
                  Ask My Doc
                </h2>
                <p style={{ fontSize: "14px", maxWidth: "400px", lineHeight: "1.6" }}>
                  Upload your documents and start asking questions.
                  Get accurate answers with citations from your sources.
                </p>
              </div>
              <button
                onClick={() => setShowDocuments(true)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginTop: "8px",
                }}
              >
                Upload Documents
              </button>
            </div>
          ) : (
            <>
              {activeChat.messages.map((message) => (
                <MessageComponent key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={documents.length === 0}
        />
      </div>

      {/* Document Panel */}
      {showDocuments && (
        <DocumentPanel
          onClose={() => setShowDocuments(false)}
          onDocumentsChange={fetchDocuments}
          documents={documents}
        />
      )}
    </div>
  );
}