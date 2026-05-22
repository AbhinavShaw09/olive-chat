import { prisma } from "@/lib/prisma";
import { validatePayload } from "./validator";
import { extractMetadata, type IncomingLog } from "./metadata-extractor";

export interface PipelineResult {
  ingested: number;
  skipped: number;
  errors: { field: string; message: string }[];
}

export async function runPipeline(body: unknown): Promise<PipelineResult> {
  const { logs, errors: validationErrors } = validatePayload(body);

  if (validationErrors.length > 0) {
    return { ingested: 0, skipped: 0, errors: validationErrors };
  }

  let ingested = 0;
  let skipped = 0;

  for (const log of logs) {
    const ok = await persistLog(log);
    if (ok) ingested++;
    else skipped++;
  }

  return { ingested, skipped, errors: [] };
}

async function persistLog(log: IncomingLog): Promise<boolean> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: log.conversationId },
    });
    if (!conversation) return false;

    let messageId = log.messageId;

    if (!messageId) {
      const msg = await prisma.message.create({
        data: {
          conversationId: log.conversationId,
          role: "assistant",
          content: log.completion.slice(0, 10000),
        },
      });
      messageId = msg.id;
    }

    const extracted = extractMetadata(log);

    await prisma.inferenceLog.create({
      data: {
        conversationId: log.conversationId,
        messageId,
        model: log.model,
        provider: log.provider ?? null,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        latencyMs: log.latencyMs,
        prompt: log.prompt.slice(0, 50000),
        completion: log.completion.slice(0, 50000),
        temperature: log.temperature ?? null,
        maxTokens: log.maxTokens ?? null,
        finishReason: log.finishReason ?? null,
        requestId: log.requestId ?? null,
        systemFingerprint: null,
        estimatedCostUsd: extracted.totalCostUsd ?? null,
        status: log.status,
        errorType: extracted.errorCategory,
        errorDetail: log.error ?? null,
        extractedMetadata: {
          create: {
            modelFamily: extracted.modelFamily,
            modelVersion: extracted.modelVersion,
            errorCategory: extracted.errorCategory,
            promptCostUsd: extracted.promptCostUsd,
            completionCostUsd: extracted.completionCostUsd,
            environment: extracted.environment,
            appVersion: extracted.appVersion,
            userAgent: extracted.userAgent,
          },
        },
      },
    });

    return true;
  } catch (err) {
    console.error("[IngestionPipeline] persist error:", err);
    return false;
  }
}
