import { NextRequest } from "next/server";
import { getLogs } from "@/lib/inference-logger";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const logs = await getLogs({
    limit: Math.min(Number(searchParams.get("limit")) || 50, 200),
    offset: Number(searchParams.get("offset")) || 0,
    conversationId: searchParams.get("conversationId") || undefined,
    model: searchParams.get("model") || undefined,
    sortBy: (searchParams.get("sortBy") as "createdAt" | "totalTokens" | "latencyMs") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  });

  return Response.json(logs);
}
