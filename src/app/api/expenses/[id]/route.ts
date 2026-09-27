import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { expensePatchSchema } from "@/lib/validations";
import { jsonError, notFound } from "@/lib/api";
import { Prisma } from "@prisma/client";

const expenseSelect = {
  id: true,
  category: true,
  productName: true,
  description: true,
  price: true,
  type: true,
  date: true,
} as const;

/** PATCH /api/expenses/[id]  (solo si el gasto pertenece al usuario) */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = expensePatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datos de gasto inválidos"
    );
  }

  try {
    const expense = await prisma.expense.update({
      where: { id, userId },
      data: parsed.data,
      select: expenseSelect,
    });
    return NextResponse.json(expense);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return notFound();
    throw e;
  }
}

/** DELETE /api/expenses/[id]  (solo si el gasto pertenece al usuario) */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const { id } = await ctx.params;

  try {
    await prisma.expense.delete({ where: { id, userId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return notFound();
    throw e;
  }
}
