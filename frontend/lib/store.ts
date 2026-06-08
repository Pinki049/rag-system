import { Chat, Message, Source } from "./types";

const STORAGE_KEY = "askmydoc_chats";

export const generateId = () => Math.random().toString(36).substring(2, 9);

// Load all chats from localStorage
export const loadChats = (): Chat[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const chats = JSON.parse(stored);
    return chats.map((chat: Chat) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
      messages: chat.messages.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch {
    return [];
  }
};

// Save all chats to localStorage
export const saveChats = (chats: Chat[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
};

// Create a new chat
export const createChat = (): Chat => ({
  id: generateId(),
  title: "New Chat",
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Add message to a chat
export const addMessage = (
  chats: Chat[],
  chatId: string,
  message: Message
): Chat[] => {
  return chats.map((chat) => {
    if (chat.id !== chatId) return chat;
    const updatedMessages = [...chat.messages, message];
    const title =
      chat.messages.length === 0 && message.role === "user"
        ? message.content.slice(0, 40) + "..."
        : chat.title;
    return {
      ...chat,
      title,
      messages: updatedMessages,
      updatedAt: new Date(),
    };
  });
};

// Update last assistant message (for streaming)
export const updateLastMessage = (
  chats: Chat[],
  chatId: string,
  content: string,
  sources?: Source[],
  isStreaming?: boolean
): Chat[] => {
  return chats.map((chat) => {
    if (chat.id !== chatId) return chat;
    const messages = [...chat.messages];
    const lastIndex = messages.length - 1;
    if (messages[lastIndex]?.role === "assistant") {
      messages[lastIndex] = {
        ...messages[lastIndex],
        content,
        sources,
        isStreaming,
      };
    }
    return { ...chat, messages, updatedAt: new Date() };
  });
};

// Delete a chat
export const deleteChat = (chats: Chat[], chatId: string): Chat[] => {
  return chats.filter((chat) => chat.id !== chatId);
}; 