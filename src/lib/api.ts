import { NextResponse } from "next/server";

/** Respuesta de error uniforme de la API: { error } con el status dado. */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** 404 uniforme cuando un registro no existe o no pertenece al usuario. */
export function notFound() {
  return jsonError("No encontrado", 404);
}
