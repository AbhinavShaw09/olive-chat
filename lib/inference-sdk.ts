import type { InferenceLogPayload } from "./inference-ingester";

export interface SDKMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SDKResponse {
  id: string;
  model: string;
  choices: {
    message: SDKMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMResult {
  data: SDKResponse;
  metadata: InferenceMetadata;
}

export interface InferenceMetadata {
  model: string;
  provider: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptPreview: string;
  completionPreview: string;
  conversationId: string | null;
  temperature: number | null;
  maxTokens: number | null;
  status: "success" | "error";
  error: string | null;
  timestamp: string;
  requestId: string | null;
  finishReason: string | null;
}

export interface SDKConfig {
  model?: string;
  provider?: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export function buildLogPayload(
  metadata: InferenceMetadata,
  messageId?: string,
): InferenceLogPayload {
  return {
    conversationId: metadata.conversationId ?? "",
    messageId,
    model: metadata.model,
    provider: metadata.provider,
    promptTokens: metadata.promptTokens,
    completionTokens: metadata.completionTokens,
    totalTokens: metadata.totalTokens,
    latencyMs: metadata.latencyMs,
    prompt: metadata.promptPreview,
    completion: metadata.completionPreview,
    temperature: metadata.temperature,
    maxTokens: metadata.maxTokens,
    status: metadata.status,
    error: metadata.error ?? undefined,
    timestamp: metadata.timestamp,
    requestId: metadata.requestId ?? undefined,
    finishReason: metadata.finishReason ?? undefined,
  };
}

export class InferenceSDK {
  private model: string;
  private provider: string;
  private baseUrl: string;
  private apiKey: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor(config: SDKConfig = {}) {
    this.model = config.model ?? "openai/gpt-4o-mini";
    this.provider = config.provider ?? "openrouter";
    this.baseUrl =
      config.baseUrl ?? "https://openrouter.ai/api/v1/chat/completions";
    this.apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    this.defaultTemperature = config.temperature ?? 0.7;
    this.defaultMaxTokens = config.maxTokens ?? 1024;
  }

  async chat(
    messages: SDKMessage[],
    options: {
      conversationId?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): Promise<LLMResult> {
    const model = options.model ?? this.model;
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxTokens = options.maxTokens ?? this.defaultMaxTokens;
    const start = Date.now();
    const requestId = crypto.randomUUID?.() ?? `${Date.now()}`;

    const promptPreview = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    try {
      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errBody = await res.text();
        const metadata: InferenceMetadata = {
          model,
          provider: this.provider,
          latencyMs,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          promptPreview,
          completionPreview: "",
          conversationId: options.conversationId ?? null,
          temperature,
          maxTokens,
          status: "error",
          error: `API error ${res.status}: ${errBody}`,
          timestamp: new Date().toISOString(),
          requestId,
          finishReason: null,
        };

        throw new InferenceError(
          `API error ${res.status}: ${errBody}`,
          metadata,
        );
      }

      const data = (await res.json()) as SDKResponse;
      const completionPreview = data.choices[0]?.message?.content ?? "";

      const metadata: InferenceMetadata = {
        model: data.model,
        provider: this.provider,
        latencyMs,
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        promptPreview,
        completionPreview,
        conversationId: options.conversationId ?? null,
        temperature,
        maxTokens,
        status: "success",
        error: null,
        timestamp: new Date().toISOString(),
        requestId,
        finishReason: data.choices[0]?.finish_reason ?? null,
      };

      return { data, metadata };
    } catch (err) {
      const latencyMs = Date.now() - start;

      if (err instanceof InferenceError) throw err;

      const metadata: InferenceMetadata = {
        model,
        provider: this.provider,
        latencyMs,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        promptPreview,
        completionPreview: "",
        conversationId: options.conversationId ?? null,
        temperature,
        maxTokens,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
        requestId,
        finishReason: null,
      };

      throw new InferenceError(
        err instanceof Error ? err.message : "Unknown error",
        metadata,
      );
    }
  }
}

export class InferenceError extends Error {
  public metadata: InferenceMetadata;

  constructor(message: string, metadata: InferenceMetadata) {
    super(message);
    this.name = "InferenceError";
    this.metadata = metadata;
  }
}
