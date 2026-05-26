"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Bot, User, BarChart3 } from "lucide-react";
import type { ChatMessage, ChatResponse } from "@/lib/chat";

export function ChatView({
  messages,
  sending,
  conversationId,
  lastUsage,
  input,
  onInputChange,
  onSend,
}: {
  messages: ChatMessage[];
  sending: boolean;
  conversationId: string | null;
  lastUsage: ChatResponse["usage"] | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
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
            onSend();
          }}
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
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
  );
}
