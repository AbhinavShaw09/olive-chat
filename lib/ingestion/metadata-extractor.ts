import { estimateCost } from "./pricing";

export interface IncomingLog {
  conversationId: string;
  messageId?: string;
  model: string;
  provider?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  prompt: string;
  completion: string;
  temperature?: number | null;
  maxTokens?: number | null;
  status: string;
  error?: string;
  timestamp: string;
  requestId?: string;
  finishReason?: string;
  systemFingerprint?: string;
  userAgent?: string;
  appVersion?: string;
  environment?: string;
}

export interface ExtractedMetadata {
  modelFamily: string | null;
  modelVersion: string | null;
  errorCategory: string | null;
  promptCostUsd: number | null;
  completionCostUsd: number | null;
  totalCostUsd: number | null;
  environment: string | null;
  appVersion: string | null;
  userAgent: string | null;
}

function classifyError(status: string, error?: string): string | null {
  if (status === "success") return null;

  const err = (error ?? "").toLowerCase();

  if (err.includes("rate limit") || err.includes("429")) return "rate_limit";
  if (err.includes("401") || err.includes("unauthorized") || err.includes("auth"))
    return "auth";
  if (err.includes("402") || err.includes("insufficient") || err.includes("quota"))
    return "quota";
  if (err.includes("timeout") || err.includes("timed out") || err.includes("504"))
    return "timeout";
  if (err.includes("content_filter") || err.includes("content filter"))
    return "content_filter";
  if (err.includes("500") || err.includes("502") || err.includes("503"))
    return "server_error";
  if (err.includes("context_length") || err.includes("max context"))
    return "context_length";

  return "other";
}

function extractModelFamily(model: string): string | null {
  if (!model) return null;
  const parts = model.split("/");

  if (parts.length >= 2) {
    return parts[0];
  }

  if (model.startsWith("gpt-")) return "openai";
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-")) return "google";
  if (model.startsWith("llama-") || model.startsWith("meta-llama/"))
    return "meta";
  if (model.startsWith("mistral") || model.startsWith("codestral"))
    return "mistral";
  if (model.startsWith("deepseek")) return "deepseek";
  if (model.startsWith("grok")) return "xai";

  return null;
}

function extractModelVersion(model: string): string | null {
  if (!model) return null;

  const parts = model.split("/");
  if (parts.length >= 2) {
    return parts.slice(1).join("/");
  }

  return model;
}

export function extractMetadata(log: IncomingLog): ExtractedMetadata {
  const cost = estimateCost(log.model, log.promptTokens, log.completionTokens);

  return {
    modelFamily: extractModelFamily(log.model),
    modelVersion: extractModelVersion(log.model),
    errorCategory: classifyError(log.status, log.error),
    promptCostUsd: cost?.promptCostUsd ?? null,
    completionCostUsd: cost?.completionCostUsd ?? null,
    totalCostUsd: cost?.totalCostUsd ?? null,
    environment: log.environment ?? null,
    appVersion: log.appVersion ?? null,
    userAgent: log.userAgent ?? null,
  };
}
