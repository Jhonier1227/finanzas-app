import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getCurrentUser, getCurrentUserId } from "@/lib/db/current-user";
import { profileSchema } from "@/lib/validations";
import { jsonError } from "@/lib/api";

/** GET /api/auth/me — usuario actual (sin passwordHash, RNF-05). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("No autorizado", 401);
  return NextResponse.json(user);
}

/**
 * PATCH /api/auth/me — actualiza nombre y apellido del perfil (N6).
 * Los textos vacíos borran el dato (se guardan como null).
 */
export async function PATCH(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const data: { firstName?: string | null; lastName?: string | null } = {};
  if (parsed.data.firstName !== undefined) {
    data.firstName = parsed.data.firstName === "" ? null : parsed.data.firstName;
  }
  if (parsed.data.lastName !== undefined) {
    data.lastName = parsed.data.lastName === "" ? null : parsed.data.lastName;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  return NextResponse.json(user);
}

/**
 * DELETE /api/auth/me — elimina la cuenta y TODOS sus datos (N7).
 * Las sesiones, sueldos y gastos se borran en cascada (onDelete: Cascade)
 * y se limpia la cookie de sesión. Acción irreversible.
 */
export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  return NextResponse.json({ ok: true });
}
