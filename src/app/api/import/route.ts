import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { expenseSchema } from "@/lib/validations";
import { jsonError } from "@/lib/api";

/**
 * POST /api/import  (RF-24, T3.5)
 * Importación única de datos guardados en localStorage:
 * - `income` > 0 → sueldo del mes en curso (upsert, no duplica).
 * - `expenses[]` → se crean vinculados al usuario (respetan su fecha original,
 *   así quedan en el mes correcto del historial).
 */
const importSchema = z.object({
  income: z.coerce.number().int().min(0).optional(),
  expenses: z.array(expenseSchema).max(5000).optional(),
});

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datos de importación inválidos"
    );
  }

  const { income, expenses } = parsed.data;

  let salaryRegistered = false;
  if (income && income > 0) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    await prisma.salary.upsert({
      where: { userId_year_month: { userId, year, month } },
      create: { userId, year, month, amount: income },
      update: { amount: income },
    });
    salaryRegistered = true;
  }

  let expensesImported = 0;
  if (expenses && expenses.length > 0) {
    const result = await prisma.expense.createMany({
      data: expenses.map((e) => ({ ...e, userId })),
    });
    expensesImported = result.count;
  }

  return NextResponse.json(
    { expensesImported, salaryRegistered },
    { status: 201 }
  );
}
