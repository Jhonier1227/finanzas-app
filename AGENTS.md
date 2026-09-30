<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Finanzas App — reglas para agentes

**Lee `PROYECTO.md` primero**: contiene la arquitectura completa, modelo de datos, motores de cálculo y el roadmap por fases acordado con el usuario. No te desvíes de ese plan sin confirmación.

- Antes de codificar una fase: revisa `TAREAS.md` (checklist vivo — al terminar tareas, márcalas `[x]`) y los RF/RNF aplicables en `docs/REQUERIMIENTOS.md`.
- Al cerrar una fase: `npm run lint` + `npm run build` limpios, y actualizar TAREAS.md, roadmap de PROYECTO.md y docs/ si cambió algo estructural.

## Comandos

- `npm run dev` — desarrollo; `npm run build` — producción; `npm run lint` — única verificación configurada (ESLint 9 flat config). No hay tests ni CI.
- No existe script de typecheck; usa `npx tsc --noEmit` si cambias tipos.
- BD: `npx prisma migrate dev --name <nombre>` (migraciones), `npx prisma db seed` (siembra del usuario demo). En el servidor (sin CLI de npm): `node node_modules/prisma/build/index.js migrate deploy`.
- Empaquetar para producción: `npm run package:deploy` → `deploy-dist/` (standalone + static + public + prisma CLI). **El PC viejo nunca compila**.

## Contexto crítico del proyecto

- Idioma de la UI y moneda: **español, COP** (`formatCurrency` usa `es-CO`, 0 decimales). No introduzcas textos en inglés ni cambies el locale.
- **Prisma fijado en 6.x** (`prisma` y `@prisma/client` deben tener la MISMA versión). NO actualices a 7/8: v7 exige config file y driver adapters; v8 era RC. Si npm propone upgrade, ignóralo.
- Estado actual: la UI ya consume la API (Fase 3 hecha). Zustand (`finance-store`) es solo caché del mes en contexto — **sin `persist`**. localStorage solo guarda: el tema (`finance-app-theme`), los datos LEGADO para importar (`finanzas-app-storage` — nunca los borres; el banner de importación los usa una sola vez) y la marca `finanzas-app-imported`.
- La API exige autenticación: cookie `finanzas_session` validada contra la tabla `Session` vía `getCurrentUserId()` (src/lib/db/). El cliente API (`src/lib/api/client.ts`) redirige a `/login` ante cualquier 401.
- Los gastos pertenecen a un mes por su campo `date` ("YYYY-MM-DD"); no añadas campos de mes redundantes al tipo `Expense`. Filtrado por mes = `startsWith("YYYY-MM")`.
- `zodResolver` se usa con `as any` en los formularios (incompatibilidad de tipos conocida entre RHF y Zod 4) — no "corrijas" el cast; si lint lo marca, usa `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <razón>`.
- Schemas Zod compartidos cliente/servidor viven en `src/lib/validations.ts`. Hay separación **expenseSchema (default) vs expensePatchSchema (sin defaults)** — los defaults reescriben campos en PATCH, no los uses ahí.
- Respuestas de error de API: `{ error: string }` vía `jsonError()`/`notFound()` de `src/lib/api.ts`.

## Next.js 16 (verificado en node_modules/next/dist/docs)

- `cookies()`, `headers()`, `searchParams` y `params` son **async**: `await` siempre. En Route Handlers dinámicos: `ctx: { params: Promise<{ id: string }> }`.
- `proxy.ts` va en `src/` (mismo nivel que `app/`), export `proxy`, runtime nodejs fijo. El proxy solo verifica presencia de la cookie; la sesión real se valida contra BD en cada Route Handler. Su matcher excluye los assets PWA (`manifest.webmanifest`, `icons/`) — si añades archivos públicos necesarios sin sesión, añádelos al lookahead; si no, el teléfono no podrá instalar la app.
- Cookie de sesión: SIN flag `secure` (acceso HTTP sobre Tailscale/LAN; el túnel aporta el cifrado). No lo actives o el login no funcionará en `http://100.76.131.36`.
- Route Handlers no se cachean por defecto. Turbopack es el bundler de dev y build.

## Convenciones del código existente

- Componentes UI estilo shadcn/ui viven en `src/components/ui/` (Radix + CVA); reutilízalos antes de instalar librerías nuevas de UI.
- Estilos: solo clases Tailwind 4 (vía PostCSS, **no hay `tailwind.config`**); alternancia dark con clases `dark:` y `theme-store`.
- Alias de importación: `@/` → `src/`.
- Git: no hacer commits/push sin que el usuario lo pida explícitamente.
- react-hooks v6 (ESLint prohíbe `setState` en effects): para leer localStorage usa `useSyncExternalStore` con snapshot **memoizado** — devolver un objeto nuevo en cada llamada causa loop infinito (bug real ya corregido en `import-local-data.tsx`).
