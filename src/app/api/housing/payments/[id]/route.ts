import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { housingPaymentPatchSchema } from "@/lib/validations";
import { jsonError, notFound } from "@/lib/api";
import { Prisma } from "@prisma/client";

const paymentSelect = {
  id: true,
  date: true,
  amount: true,
  note: true,
} as const;

/** PATCH /api/housing/payments/[id]  (solo si el pago pertenece al usuario) */
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

  const parsed = housingPaymentPatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datos de pago inválidos"
    );
  }

  try {
    const payment = await prisma.housingPayment.update({
      where: { id, userId },
      data: parsed.data,
      select: paymentSelect,
    });
    return NextResponse.json(payment);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return notFound();
    throw e;
  }
}

/** DELETE /api/housing/payments/[id]  (solo si el pago pertenece al usuario) */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const { id } = await ctx.params;

  try {
    await prisma.housingPayment.delete({ where: { id, userId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return notFound();
    throw e;
  }
}
