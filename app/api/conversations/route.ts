import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.conversation.count({ where: { userId: user.id } }),
  ]);

  return Response.json({ conversations, total, limit, offset });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.create({
    data: { userId: user.id },
  });

  return Response.json({ conversation });
}
