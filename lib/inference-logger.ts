import { prisma } from "@/lib/prisma";

export interface LogInput {
  conversationId: string;
  messageId: string;
  model: string;
  provider: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  prompt: string;
  completion: string;
  temperature: number | null;
  maxTokens: number | null;
}

export async function logInference(data: LogInput) {
  return prisma.inferenceLog.create({ data });
}

export async function getLogs(options: {
  limit?: number;
  offset?: number;
  conversationId?: string;
  model?: string;
  sortBy?: "createdAt" | "totalTokens" | "latencyMs" | "estimatedCostUsd";
  sortOrder?: "asc" | "desc";
}) {
  const {
    limit = 50,
    offset = 0,
    conversationId,
    model,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const where: Record<string, unknown> = {};
  if (conversationId) where.conversationId = conversationId;
  if (model) where.model = model;

  const [logs, total] = await Promise.all([
    prisma.inferenceLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
      include: {
        conversation: { select: { id: true } },
        extractedMetadata: true,
      },
    }),
    prisma.inferenceLog.count({ where }),
  ]);

  return { logs, total, limit, offset };
}

export async function getLogStats() {
  const [totalLogs, totalTokens, avgLatency, modelBreakdown, costAgg, errorBreakdown] =
    await Promise.all([
      prisma.inferenceLog.count(),
      prisma.inferenceLog.aggregate({
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      }),
      prisma.inferenceLog.aggregate({
        _avg: { latencyMs: true, totalTokens: true },
      }),
      prisma.inferenceLog.groupBy({
        by: ["model"],
        _count: { id: true },
        _sum: { totalTokens: true },
        _avg: { latencyMs: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.inferenceLog.aggregate({
        _sum: { estimatedCostUsd: true },
      }),
      prisma.inferenceLog.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

  return {
    totalLogs,
    totalTokens: totalTokens._sum.totalTokens ?? 0,
    totalPromptTokens: totalTokens._sum.promptTokens ?? 0,
    totalCompletionTokens: totalTokens._sum.completionTokens ?? 0,
    totalCostUsd: Math.round((costAgg._sum.estimatedCostUsd ?? 0) * 1000000) / 1000000,
    avgLatencyMs: Math.round(avgLatency._avg.latencyMs ?? 0),
    avgTokensPerCall: Math.round(avgLatency._avg.totalTokens ?? 0),
    successCount: errorBreakdown.find((e) => e.status === "success")?._count.id ?? 0,
    errorCount: errorBreakdown.find((e) => e.status === "error")?._count.id ?? 0,
    modelBreakdown: modelBreakdown.map((m) => ({
      model: m.model,
      calls: m._count.id,
      totalTokens: m._sum.totalTokens ?? 0,
      avgLatencyMs: Math.round(m._avg.latencyMs ?? 0),
    })),
  };
}
