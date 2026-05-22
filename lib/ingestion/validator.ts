import type { IncomingLog } from "./metadata-extractor";

export interface ValidationError {
  field: string;
  message: string;
}

const REQUIRED_FIELDS = ["conversationId", "model", "prompt", "completion", "status"] as const;
const REQUIRED_NUMERIC = ["promptTokens", "completionTokens", "totalTokens", "latencyMs"] as const;
const VALID_STATUSES = ["success", "error"];

export function validatePayload(body: unknown): {
  logs: IncomingLog[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    return { logs: [], errors: [{ field: "body", message: "Expected an object" }] };
  }

  const rawLogs: unknown[] = Array.isArray((body as Record<string, unknown>).logs)
    ? (body as Record<string, unknown>).logs as unknown[]
    : [body];

  const logs: IncomingLog[] = [];

  for (let i = 0; i < rawLogs.length; i++) {
    const entry = rawLogs[i];
    const itemErrors = validateLogEntry(entry, i);

    if (itemErrors.length > 0) {
      errors.push(...itemErrors);
      continue;
    }

    logs.push(coerceLogEntry(entry as Record<string, unknown>));
  }

  return { logs, errors };
}

function validateLogEntry(entry: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!entry || typeof entry !== "object") {
    errors.push({ field: `[${index}]`, message: "Expected an object" });
    return errors;
  }

  const obj = entry as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    if (!obj[field] || (typeof obj[field] === "string" && (obj[field] as string).trim() === "")) {
      errors.push({ field: `[${index}].${field}`, message: "Required field missing or empty" });
    }
  }

  for (const field of REQUIRED_NUMERIC) {
    const val = obj[field];
    if (val === undefined || val === null || typeof val !== "number" || val < 0) {
      errors.push({ field: `[${index}].${field}`, message: "Required numeric field missing or invalid" });
    }
  }

  if (obj.status && !VALID_STATUSES.includes(obj.status as string)) {
    errors.push({ field: `[${index}].status`, message: `Must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  return errors;
}

function coerceLogEntry(obj: Record<string, unknown>): IncomingLog {
  return {
    conversationId: String(obj.conversationId ?? ""),
    messageId: obj.messageId ? String(obj.messageId) : undefined,
    model: String(obj.model ?? ""),
    provider: obj.provider ? String(obj.provider) : undefined,
    promptTokens: Number(obj.promptTokens) || 0,
    completionTokens: Number(obj.completionTokens) || 0,
    totalTokens: Number(obj.totalTokens) || 0,
    latencyMs: Number(obj.latencyMs) || 0,
    prompt: String(obj.prompt ?? ""),
    completion: String(obj.completion ?? ""),
    temperature: obj.temperature != null ? Number(obj.temperature) : null,
    maxTokens: obj.maxTokens != null ? Number(obj.maxTokens) : null,
    status: String(obj.status ?? "success"),
    error: obj.error ? String(obj.error) : undefined,
    timestamp: String(obj.timestamp ?? new Date().toISOString()),
    requestId: obj.requestId ? String(obj.requestId) : undefined,
    finishReason: obj.finishReason ? String(obj.finishReason) : undefined,
    systemFingerprint: obj.systemFingerprint ? String(obj.systemFingerprint) : undefined,
    userAgent: obj.userAgent ? String(obj.userAgent) : undefined,
    appVersion: obj.appVersion ? String(obj.appVersion) : undefined,
    environment: obj.environment ? String(obj.environment) : undefined,
  };
}
