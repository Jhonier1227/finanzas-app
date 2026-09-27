import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";

/**
 * POST /api/auth/login  (RF-02)
 * Verifica credenciales y crea sesión con cookie httpOnly.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  // Mensaje genérico a propósito: no revelar si el correo existe o no.
  const credencialesOk =
    user && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !credencialesOk) {
    return jsonError("Correo o contraseña incorrectos", 401);
  }

  await createSession(user.id);
  return NextResponse.json({ id: user.id, email: user.email });
}
