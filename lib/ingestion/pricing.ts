/// Model pricing per 1K tokens (USD)
/// Sources: OpenRouter, Anthropic, OpenAI published pricing (as of mid 2026)
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  // OpenAI
  "openai/gpt-4o": { prompt: 0.005, completion: 0.015 },
  "openai/gpt-4o-2024-08-06": { prompt: 0.005, completion: 0.015 },
  "openai/gpt-4o-mini": { prompt: 0.00015, completion: 0.0006 },
  "openai/gpt-4o-mini-2024-07-18": { prompt: 0.00015, completion: 0.0006 },
  "openai/gpt-4-turbo": { prompt: 0.01, completion: 0.03 },
  "openai/gpt-3.5-turbo": { prompt: 0.0005, completion: 0.0015 },

  // Anthropic
  "anthropic/claude-3.5-sonnet": { prompt: 0.003, completion: 0.015 },
  "anthropic/claude-3-opus": { prompt: 0.015, completion: 0.075 },
  "anthropic/claude-3-haiku": { prompt: 0.00025, completion: 0.00125 },
  "anthropic/claude-3-sonnet": { prompt: 0.003, completion: 0.015 },

  // Google
  "google/gemini-1.5-pro": { prompt: 0.00125, completion: 0.005 },
  "google/gemini-1.5-flash": { prompt: 0.000075, completion: 0.0003 },
  "google/gemini-2.0-flash": { prompt: 0.0001, completion: 0.0004 },
  "google/gemini-2.0-flash-lite": { prompt: 0.000075, completion: 0.0003 },

  // Meta
  "meta-llama/llama-3.3-70b-instruct": { prompt: 0.00059, completion: 0.00079 },
  "meta-llama/llama-3.2-3b-instruct": { prompt: 0.00006, completion: 0.00006 },
  "meta-llama/llama-3.2-1b-instruct": { prompt: 0.00004, completion: 0.00004 },

  // Mistral
  "mistral/mistral-large": { prompt: 0.002, completion: 0.006 },
  "mistral/mistral-small": { prompt: 0.0005, completion: 0.0015 },
  "mistral/codestral": { prompt: 0.001, completion: 0.003 },

  // DeepSeek
  "deepseek/deepseek-chat": { prompt: 0.00014, completion: 0.00028 },
  "deepseek/deepseek-r1": { prompt: 0.00055, completion: 0.00219 },

  // xAI
  "x-ai/grok-2": { prompt: 0.002, completion: 0.01 },
  "x-ai/grok-2-mini": { prompt: 0.0001, completion: 0.0003 },
};

function matchModel(model: string): { prompt: number; completion: number } | null {
  const exact = MODEL_PRICING[model];
  if (exact) return exact;

  for (const [key, price] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return price;
    if (model.includes(key)) return price;
  }

  return null;
}

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): { promptCostUsd: number; completionCostUsd: number; totalCostUsd: number } | null {
  const pricing = matchModel(model);
  if (!pricing) return null;

  const promptCostUsd = (promptTokens / 1000) * pricing.prompt;
  const completionCostUsd = (completionTokens / 1000) * pricing.completion;

  return {
    promptCostUsd: round(promptCostUsd),
    completionCostUsd: round(completionCostUsd),
    totalCostUsd: round(promptCostUsd + completionCostUsd),
  };
}

function round(n: number): number {
  return Math.round(n * 1000000) / 1000000;
}
