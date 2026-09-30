import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { recoverSchema } from "@/lib/validations";
import { jsonError } from "@/lib/api";

/**
 * POST /api/auth/recover  (recuperación de contraseña, uso personal)
 * Body: { email, code, newPassword }.
 * - `code` debe coincidir con la variable de entorno RECOVERY_CODE
 *   (configurada en el .env del servidor, nunca va a git).
 * - Al cambiar la contraseña se revocan todas las sesiones del usuario.
 * Ruta pública a propósito (se usa sin sesión, cuando se olvidó la clave);
 * el proxy la permite por estar bajo /api/auth/*.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = recoverSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const expected = process.env.RECOVERY_CODE;
  if (!expected) {
    return jsonError(
      "Recuperación no configurada en el servidor (falta RECOVERY_CODE)",
      500
    );
  }

  const { email, code, newPassword } = parsed.data;
  if (code !== expected) {
    return jsonError("Código de verificación incorrecto", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return jsonError("No existe una cuenta con ese correo", 404);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10); // RNF-01
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  // Revocar todo: la clave anterior queda inservible en todos los dispositivos.
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true });
}
