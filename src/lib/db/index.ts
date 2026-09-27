import { PrismaClient } from "@prisma/client";

// Singleton: en desarrollo, el hot-reload de Next crearía una nueva conexión
// por recarga; guardamos la instancia en globalThis para reutilizarla.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
