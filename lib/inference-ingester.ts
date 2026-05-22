export interface InferenceLogPayload {
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
  status: "success" | "error";
  error?: string;
  timestamp: string;
  requestId?: string;
  finishReason?: string;
  systemFingerprint?: string;
  userAgent?: string;
  appVersion?: string;
  environment?: string;
}

export interface IngesterConfig {
  endpoint: string;
  batchSize?: number;
  flushIntervalMs?: number;
}

export class InferenceIngester {
  private endpoint: string;
  private queue: InferenceLogPayload[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly batchSize: number;

  constructor(config: IngesterConfig) {
    this.endpoint = config.endpoint;
    this.batchSize = config.batchSize ?? 1;

    if (config.flushIntervalMs && config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, config.flushIntervalMs);
    }
  }

  async send(log: InferenceLogPayload): Promise<void> {
    if (this.batchSize <= 1) {
      return this.sendImmediate(log);
    }
    this.queue.push(log);
    if (this.queue.length >= this.batchSize) {
      return this.flush();
    }
  }

  private async sendImmediate(log: InferenceLogPayload): Promise<void> {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
      if (!res.ok) {
        console.warn(
          `[InferenceIngester] ingest failed (${res.status}): ${await res.text()}`,
        );
      }
    } catch (err) {
      console.warn("[InferenceIngester] ingest error:", err);
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: batch }),
      });
      if (!res.ok) {
        console.warn(
          `[InferenceIngester] batch ingest failed (${res.status}): ${await res.text()}`,
        );
      }
    } catch (err) {
      console.warn("[InferenceIngester] batch ingest error:", err);
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
