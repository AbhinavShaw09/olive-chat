import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatCompletion, type OpenRouterMessage } from "@/lib/openrouter";
import { logInference } from "@/lib/inference-logger";
import { requireUser } from "@/lib/auth";

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

  const userMsg = await prisma.message.create({
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

  const openrouterMessages: OpenRouterMessage[] = recentMessages.map((m) => ({
    role: m.role as OpenRouterMessage["role"],
    content: m.content,
  }));

  const start = Date.now();

  let data;
  try {
    data = await chatCompletion(openrouterMessages);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "API call failed" },
      { status: 502 },
    );
  }

  const latencyMs = Date.now() - start;
  const choice = data.choices[0];

  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: choice.message.content,
    },
  });

  await logInference({
    conversationId: conversation.id,
    messageId: assistantMsg.id,
    model: data.model,
    provider: null,
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
    totalTokens: data.usage.total_tokens,
    latencyMs,
    prompt: openrouterMessages.map((m) => `${m.role}: ${m.content}`).join("\n"),
    completion: choice.message.content,
    temperature: null,
    maxTokens: null,
  });

  return Response.json({
    conversationId: conversation.id,
    message: {
      id: assistantMsg.id,
      role: "assistant",
      content: choice.message.content,
    },
    usage: data.usage,
    model: data.model,
    latencyMs,
  });
}
