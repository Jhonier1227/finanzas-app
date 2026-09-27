import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "finanzas_session";
const SESSION_TTL_DAYS = 30;

/**
 * Crea una sesión en BD y la fija como cookie httpOnly en la respuesta.
 * Solo se puede llamar desde un Route Handler.
 *
 * Nota: NO se usa el flag `secure` porque el acceso es por HTTP sobre la red
 * privada (LAN/Tailscale); el cifrado del transporte lo aporta el túnel
 * Tailscale, no TLS (RNF-04).
 */
export async function createSession(userId: string): Promise<void> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );
  await prisma.session.create({ data: { id, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Destruye la sesión actual (fila en BD + cookie). */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) {
    await prisma.session.deleteMany({ where: { id } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Devuelve el userId de la sesión actual o null.
 * Incluye limpieza perezosa (T2.8): al encontrar una sesión expirada,
 * borra de una vez todas las vencidas.
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    select: { userId: true, expiresAt: true },
  });
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return null;
  }

  return session.userId;
}
