import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, name, password } = await req.json();

  if (!email?.trim() || !password?.trim()) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name: name || null, password: hashed },
  });

  const token = await createToken({ id: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);

  return Response.json({ user: { id: user.id, email: user.email, name: user.name } });
}
