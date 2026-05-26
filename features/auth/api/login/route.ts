import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email?.trim() || !password?.trim()) {
    return Response.json(
      { error: "Email and password required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });
  await setSessionCookie(token);

  return Response.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
