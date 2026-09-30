import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "finanzas_session";

/**
 * Proxy (antes "middleware" en Next <16 — convención verificada en
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 *
 * Defensa en dos capas (RF-03):
 * - Aquí solo se verifica la PRESENCIA de la cookie (rápido, sin BD):
 *   páginas sin cookie → redirect a /login; API sin cookie → 401.
 * - La validez real de la sesión (BD, expiración) la verifica cada Route
 *   Handler vía getCurrentUserId() — el proxy no es la única barrera.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    // auth (login/registro) es pública; el resto de la API exige sesión
    if (pathname.startsWith("/api/auth/")) return NextResponse.next();
    if (!hasSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    // Ya autenticado → directo a la app
    if (hasSession) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo excepto assets internos/estáticos y los archivos PWA
  // (manifest + iconos deben servirse sin sesión para que el
  // teléfono pueda instalar la app); incluye /api/*
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)",
  ],
};
