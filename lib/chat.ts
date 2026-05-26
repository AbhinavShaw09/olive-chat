export type AuthMode = "login" | "signup";

export interface UserData {
  id: number;
  email: string;
  name: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    content: string;
    role: string;
    createdAt: string;
  }[];
}

export interface ChatResponse {
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