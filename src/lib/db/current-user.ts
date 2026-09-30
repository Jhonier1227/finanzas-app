import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";

/** Devuelve el id del usuario autenticado o null si no hay sesión válida (RF-03). */
export async function getCurrentUserId(): Promise<string | null> {
  return getSessionUserId();
}

/**
 * Devuelve el usuario autenticado sin datos sensibles (RNF-05: jamás
 * exponer passwordHash) o null si no hay sesión.
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
} | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });
}
