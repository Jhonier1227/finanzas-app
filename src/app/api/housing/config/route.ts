import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { housingConfigSchema } from "@/lib/validations";
import { jsonError } from "@/lib/api";

/** GET /api/housing/config — valor del inmueble del usuario (o null si no se configuró). */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const config = await prisma.housingConfig.findUnique({
    where: { userId },
    select: { propertyValue: true, updatedAt: true },
  });
  return NextResponse.json(config);
}

/** PUT /api/housing/config — crea o actualiza el valor del inmueble (upsert). */
export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = housingConfigSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const config = await prisma.housingConfig.upsert({
    where: { userId },
    create: { userId, propertyValue: parsed.data.propertyValue },
    update: { propertyValue: parsed.data.propertyValue },
    select: { propertyValue: true, updatedAt: true },
  });
  return NextResponse.json(config);
}
