"use client";
import { UserButton } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { Chat, Message, Source } from "@/lib/types";
import { loadChats, saveChats, createChat, addMessage, updateLastMessage, deleteChat, generateId } from "@/lib/store";
import { streamAnswer, getSources, getDocuments } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MessageComponent from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import DocumentPanel from "@/components/DocumentPanel";
import { Menu, FileText } from "lucide-react";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    const stored = loadChats();
    //console.log("Loaded chats:", stored.length);
    if (stored.length > 0) {
      setChats(stored);
      //setActiveChatId(stored[stored.length - 1].id);
      const lastChatWithMessages = stored.slice().reverse().find(c => c.messages.length > 0);
      setActiveChatId(lastChatWithMessages ? lastChatWithMessages.id : stored[stored.length - 1].id);
    } else {
      const newChat = createChat();
      setChats([newChat]);
      setActiveChatId(newChat.id);
      saveChats([newChat]);
    }
    setMounted(true);
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (mounted && chats.length > 0) {
      saveChats(chats);
      //console.log("Saved chats:", chats.length);
    }
  }, [chats, mounted]);

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

  const handleSelectChat = (chatId: string) => setActiveChatId(chatId);

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
      await streamAnswer(
        question,
        (chunk) => {
          fullAnswer += chunk;
          setChats((prev) =>
            updateLastMessage(prev, activeChatId, fullAnswer, undefined, true)
          );
        },
        async () => {
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
        updateLastMessage(prev, activeChatId, "Sorry, something went wrong. Make sure the backend is running.", [], false)
      );
      setIsLoading(false);
    }
  };

  if (!mounted) return (
    <div style={{
      height: "100vh",
      backgroundColor: "var(--background)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-muted)",
      fontSize: "14px",
    }}>
      Loading...
    </div>
  );

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      backgroundColor: "var(--background)",
      overflow: "hidden",
    }}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenDocuments={() => setShowDocuments(true)}
        documentCount={documents.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--background)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setSidebarOpen(true)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", display: "flex", padding: "4px", borderRadius: "6px",
            }}>
              <Menu size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "7px",
                backgroundColor: "var(--accent)", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "14px",
              }}>📄</div>
              <span style={{ fontWeight: "700", fontSize: "15px" }}>Ask My Doc</span>
            </div>
          </div>
          <button
            onClick={() => setShowDocuments(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 12px", borderRadius: "8px",
              border: "1px solid var(--border)", backgroundColor: "transparent",
              color: "var(--text-secondary)", cursor: "pointer", fontSize: "13px",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--card)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <FileText size={14} />
            Docs ({documents.length})
          </button>
           <UserButton />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "32px 10%" }}>
          {!activeChat || activeChat.messages.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: "16px",
            }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "16px",
                backgroundColor: "var(--card)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
              }}>📄</div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
                  Ask My Doc
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "400px", lineHeight: "1.6" }}>
                  Upload your documents and start asking questions.
                </p>
              </div>
              <button
                onClick={() => setShowDocuments(true)}
                style={{
                  padding: "10px 20px", backgroundColor: "var(--accent)", color: "white",
                  border: "none", borderRadius: "10px", cursor: "pointer",
                  fontSize: "14px", fontWeight: "600",
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

        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={false}
          onDocumentsChange={fetchDocuments}
        />
      </div>

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