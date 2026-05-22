import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  InferenceSDK,
  buildLogPayload,
  type SDKMessage,
} from "@/lib/inference-sdk";
import { InferenceIngester } from "@/lib/inference-ingester";
import { requireUser } from "@/lib/auth";

const sdk = new InferenceSDK();
const ingester = new InferenceIngester({
  endpoint: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/ingest`,
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, message } = await req.json();

  if (!message?.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  let conversation = conversationId
    ? await prisma.conversation.findUnique({ where: { id: conversationId } })
    : null;

  if (conversation && conversation.userId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId: user.id },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: message,
    },
  });

  const recentMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const sdkMessages: SDKMessage[] = recentMessages.map((m) => ({
    role: m.role as SDKMessage["role"],
    content: m.content,
  }));

  try {
    const { data, metadata } = await sdk.chat(sdkMessages, {
      conversationId: conversation.id,
    });

    const choice = data.choices[0];

    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: choice.message.content,
      },
    });

    ingester.send(buildLogPayload(metadata, assistantMsg.id));

    return Response.json({
      conversationId: conversation.id,
      message: {
        id: assistantMsg.id,
        role: "assistant",
        content: choice.message.content,
      },
      usage: {
        prompt_tokens: metadata.promptTokens,
        completion_tokens: metadata.completionTokens,
        total_tokens: metadata.totalTokens,
      },
      model: metadata.model,
      latencyMs: metadata.latencyMs,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "API call failed";
    return Response.json({ error: errorMessage }, { status: 502 });
  }
}
