import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db/current-user";
import { jsonError } from "@/lib/api";

/** GET /api/auth/me — usuario actual (sin passwordHash, RNF-05). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("No autorizado", 401);
  return NextResponse.json(user);
}
