"use client";

import { Button } from "@/components/ui/button";
import { Plus, User, LogOut, MessageSquare, Trash2, Settings } from "lucide-react";
import type { ConversationSummary } from "@/lib/chat";

export function Sidebar({
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
