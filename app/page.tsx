"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Send,
  Bot,
  User,
  LogOut,
  Plus,
  MessageSquare,
  Trash2,
  BarChart3,
  Settings,
} from "lucide-react";

type AuthMode = "login" | "signup";

interface UserData {
  id: number;
  email: string;
  name: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: { content: string; role: string; createdAt: string }[];
}

interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  latencyMs: number;
}

function AuthScreen({
  onAuth,
}: {
  onAuth: (user: UserData) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { email, name: name || email.split("@")[0], password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      onAuth(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Olive Chat</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to your account" : "Create an account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          />
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="underline hover:text-foreground"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="underline hover:text-foreground"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onLogout,
  userName,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  userName: string;
}) {
  return (
      <div className="w-64 border-r flex flex-col shrink-0 bg-muted/20">
        <div className="flex items-center justify-between px-3 py-3 border-b">
          <span className="text-sm font-semibold tracking-tight">Olive Chat</span>
          <Button size="icon-xs" variant="ghost" onClick={onNew} title="New conversation">
            <Plus className="size-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No conversations yet
            </p>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {conversations.map((conv) => {
                const lastMsg = conv.messages[0];
                const preview = lastMsg
                  ? lastMsg.content.slice(0, 60)
                  : "Empty conversation";
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={`w-full text-left flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                      activeId === conv.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <MessageSquare className="size-3 mt-0.5 shrink-0" />
                    <span className="truncate flex-1">{preview}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="opacity-0 hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <a href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="size-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium truncate">{userName}</span>
            </a>
            <div className="flex gap-1 shrink-0">
              <Button size="icon-xs" variant="ghost" onClick={onLogout} title="Sign out">
                <LogOut className="size-3.5" />
              </Button>
              <a href="/profile">
                <Button size="icon-xs" variant="ghost" title="Settings">
                  <Settings className="size-3.5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
  );
}

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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    // Optimistic delete
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

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h1 className="text-sm font-medium">
            {conversationId ? "Chat" : "New conversation"}
          </h1>
          {conversationId && (
            <a
              href={`/logs?conversationId=${conversationId}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <BarChart3 className="size-3" />
              Logs
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Send a message to start chatting
            </div>
          )}
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {lastUsage && (
          <div className="px-4 py-1.5 text-xs text-muted-foreground border-t shrink-0 flex gap-4">
            <span>Tokens: {lastUsage.total_tokens}</span>
            <span>
              &uarr;{lastUsage.prompt_tokens} &darr;{lastUsage.completion_tokens}
            </span>
          </div>
        )}

        <div className="border-t p-4 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !input.trim()}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
