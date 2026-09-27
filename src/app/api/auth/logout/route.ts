import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth/session";

/**
 * POST /api/auth/logout  (RF-02)
 * Invalida la sesión en BD (revocable, ver MODELO-DATOS.md §3.4) y
 * borra la cookie del cliente.
 */
export async function POST() {
  await destroyCurrentSession();
  return new NextResponse(null, { status: 204 });
}
