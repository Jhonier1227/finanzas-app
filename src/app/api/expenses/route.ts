import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { expenseSchema, monthQuerySchema } from "@/lib/validations";
import { jsonError } from "@/lib/api";

const expenseSelect = {
  id: true,
  category: true,
  productName: true,
  description: true,
  price: true,
  type: true,
  date: true,
} as const;

/** GET /api/expenses?year=&month=  (sin parámetros: todos los del usuario) */
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const parsed = monthQuerySchema.safeParse({
    year: request.nextUrl.searchParams.get("year") ?? undefined,
    month: request.nextUrl.searchParams.get("month") ?? undefined,
  });
  if (!parsed.success) return jsonError("Parámetros year/month inválidos");

  const { year, month } = parsed.data;
  let dateFilter = {};
  if (year && month) {
    dateFilter = {
      date: { startsWith: `${year}-${String(month).padStart(2, "0")}` },
    };
  } else if (year) {
    dateFilter = { date: { startsWith: `${year}-` } };
  }

  const expenses = await prisma.expense.findMany({
    where: { userId, ...dateFilter },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: expenseSelect,
  });
  return NextResponse.json(expenses);
}

/** POST /api/expenses  (crea un gasto del usuario actual) */
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datos de gasto inválidos"
    );
  }

  const expense = await prisma.expense.create({
    data: { ...parsed.data, userId },
    select: expenseSelect,
  });
  return NextResponse.json(expense, { status: 201 });
}
