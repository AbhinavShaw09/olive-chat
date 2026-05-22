import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({ user });
}

export async function PATCH(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  const updated = await prisma.user.update({
    where: { id: currentUser.id },
    data: { name: name || null },
  });

  return Response.json({
    user: { id: updated.id, email: updated.email, name: updated.name },
  });
}
