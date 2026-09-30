import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { housingPaymentSchema } from "@/lib/validations";
import { jsonError } from "@/lib/api";

const paymentSelect = {
  id: true,
  date: true,
  amount: true,
  note: true,
} as const;

/** GET /api/housing/payments — todos los pagos del usuario (más recientes primero). */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const payments = await prisma.housingPayment.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: paymentSelect,
  });
  return NextResponse.json(payments);
}

/** POST /api/housing/payments — registra un pago (admite fechas pasadas). */
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo JSON inválido");
  }

  const parsed = housingPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datos de pago inválidos"
    );
  }

  const payment = await prisma.housingPayment.create({
    data: { ...parsed.data, userId },
    select: paymentSelect,
  });
  return NextResponse.json(payment, { status: 201 });
}
