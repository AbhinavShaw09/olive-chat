const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: OpenRouterMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterStreamChunk {
  id: string;
  model: string;
  choices: {
    delta: { content?: string; role?: string };
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatCompletion(
  messages: OpenRouterMessage[],
  model = "openai/gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 1024,
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  return (await res.json()) as OpenRouterResponse;
}

export async function chatCompletionStream(
  messages: OpenRouterMessage[],
  model = "openai/gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 1024,
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  return res.body?.getReader();
}
