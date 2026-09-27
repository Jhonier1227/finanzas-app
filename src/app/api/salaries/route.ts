import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { salarySchema, monthQuerySchema } from "@/lib/validations";
import { jsonError } from "@/lib/api";

const salarySelect = {
  id: true,
  year: true,
  month: true,
  amount: true,
} as const;

/**
 * GET /api/salaries            → todos los sueldos del usuario
 * GET /api/salaries?year=      → los del año
 * GET /api/salaries?year=&month= → el del mes (único o vacío)
 */
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const parsed = monthQuerySchema.safeParse({
    year: request.nextUrl.searchParams.get("year") ?? undefined,
    month: request.nextUrl.searchParams.get("month") ?? undefined,
  });
  if (!parsed.success) return jsonError("Parámetros year/month inválidos");

  const { year, month } = parsed.data;
  const salaries = await prisma.salary.findMany({
    where: {
      userId,
      ...(year ? { year } : {}),
      ...(month ? { month } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: salarySelect,
  });
  return NextResponse.json(salaries);
}

/**
 * POST /api/salaries  (RF-05/06: upsert por (usuario, año, mes);
 * si ya existe el sueldo de ese mes, se actualiza el monto)
 */
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = salarySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datos de sueldo inválidos"
    );
  }

  const { year, month, amount } = parsed.data;
  const salary = await prisma.salary.upsert({
    where: { userId_year_month: { userId, year, month } },
    create: { userId, year, month, amount },
    update: { amount },
    select: salarySelect,
  });
  return NextResponse.json(salary, { status: 201 });
}
