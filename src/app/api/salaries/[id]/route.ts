import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/db/current-user";
import { salarySchema } from "@/lib/validations";
import { jsonError, notFound } from "@/lib/api";
import { Prisma } from "@prisma/client";

const salarySelect = {
  id: true,
  year: true,
  month: true,
  amount: true,
} as const;

/** PATCH /api/salaries/[id]  (solo si el sueldo pertenece al usuario) */
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

  const parsed = salarySchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Datos de sueldo inválidos"
    );
  }

  try {
    const salary = await prisma.salary.update({
      where: { id, userId },
      data: parsed.data,
      select: salarySelect,
    });
    return NextResponse.json(salary);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return notFound();
      if (e.code === "P2002")
        return jsonError("Ya existe un sueldo para ese mes", 409);
    }
    throw e;
  }
}

/** DELETE /api/salaries/[id]  (solo si el sueldo pertenece al usuario) */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return jsonError("No autorizado", 401);

  const { id } = await ctx.params;

  try {
    await prisma.salary.delete({ where: { id, userId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return notFound();
    throw e;
  }
}
