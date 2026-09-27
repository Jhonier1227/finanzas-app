import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";

/**
 * POST /api/auth/register  (RF-01)
 * Crea el usuario y abre sesión de inmediato (auto-login).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10); // RNF-01

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    await createSession(user.id);
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError("Ya existe una cuenta con ese correo", 409);
    }
    throw e;
  }
}
