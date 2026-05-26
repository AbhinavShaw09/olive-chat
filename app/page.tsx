"use client";

import {
  useState,
  useEffect, useCallback
} from "react";
import { Loader2 } from "lucide-react";
import { ChatMessage, ChatResponse ,ConversationSummary, UserData} from "@/lib/chat"
import { AuthScreen } from "@/features/auth/ui";
import { Sidebar, ChatView } from "@/features/chat/ui";

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<ChatResponse["usage"] | null>(
    null,
  );
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/conversations?limit=100");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
    }
  }, [user]);

  const fetchMessages = useCallback(async (convId: string) => {
    const res = await fetch(`/api/conversations/${convId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.conversation.messages);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: userText },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: userText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const data: ChatResponse = await res.json();

      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      setLastUsage(data.usage);
      setMessages((prev) => [...prev, data.message]);
      fetchConversations();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function selectConversation(id: string) {
    setConversationId(id);
    setMessages([]);
    setLastUsage(null);
    fetchMessages(id);
  }

  async function newConversation() {
    setConversationId(null);
    setMessages([]);
    setLastUsage(null);
  }

  async function deleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));

    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    } catch {
      fetchConversations();
    }

    if (conversationId === id) {
      newConversation();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setConversationId(null);
    setMessages([]);
    setConversations([]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={(u) => setUser(u)} />;
  }

  return (
    <div className="flex h-dvh">
      <Sidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
        onLogout={handleLogout}
        userName={user.name || user.email}
      />
      <ChatView
        messages={messages}
        sending={sending}
        conversationId={conversationId}
        lastUsage={lastUsage}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
      />
    </div>
  );
}
