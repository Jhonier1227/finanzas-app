# Procedimiento — Registro de avances

> Bitácora cronológica del desarrollo. Cada entrada tiene fecha, hora, fase y
> detalle de lo realizado. Se añaden entradas al final del documento.
> Referencias: tareas → TAREAS.md · requerimientos → docs/REQUERIMIENTOS.md

---

## 2026-09-25 — Fase 0: Documentación y diseño

| Hora | Actividad | Detalle |
|---|---|---|
| — | Cierre del análisis del repositorio | App Next.js 16 + React 19, 100% cliente, estado en localStorage via Zustand persist |
| — | Definición de arquitectura | Decisión acordada: servidor = PC viejo (Debian 13), acceso por Tailscale `100.76.131.36`, BD SQLite + Prisma, móvil vía PWA |
| — | `PROYECTO.md` creado | 13 secciones: visión, arquitectura, stack, estructura, módulos, modelo de datos, motores de cálculo, roadmap Fases 0–6 |
| — | `AGENTS.md` actualizado | Reglas operativas para sesiones de IA (advertencia Next 16, convenciones, advertencias de "trampas") |
| — | `docs/REQUERIMIENTOS.md` creado | RF-01..RF-29 funcionales, RNF-01..RNF-20 no funcionales, con criterios de aceptación y exclusiones |
| — | `docs/MODELO-DATOS.md` creado | Diagrama ER (Mermaid), restricciones/índices, 5 decisiones de modelado justificadas |
| — | `TAREAS.md` creado | Tablero vivo Fases 0–7, ~50 tareas trazables a RF/RNF |
| — | `docs/ENTORNOS.md` creado | Qué va en cada equipo: PC personal (dev), PC viejo (prod), teléfono (PWA) |

**Cierre de fase 0** ✅

## 2026-09-26 — Ajuste por hardware del servidor + inicio Fase 1

| Hora | Actividad | Detalle |
|---|---|---|
| — | Análisis de hardware del PC viejo (fastfetch provisto por el usuario) | Debian 13 (trixie), Celeron 847 2×1.10 GHz, **1.57 GiB RAM**, swap 1.71 GiB, disco 455 GB (1%), LAN `192.168.1.42` |
| — | Veredicto | El equipo SÍ sirve con condiciones: sin GUI (multi-user.target), nunca compilar en el servidor (build standalone desde PC personal), zram, systemd con `MemoryMax=700M`, bcryptjs puro |
| — | Docs actualizados | ENTORNOS.md reescrito para Debian/Linux (systemd, ufw, zram, tapa del portátil); TAREAS.md Fase 6 rehecha (T6.1–T6.10); RNF-01 (bcryptjs) y RNF-10 (restricción RAM/compilación); PROYECTO.md §5.3 flujo dev→prod corregido |
| 17:49 | `PROCEDIMIENTO.md` creado | Este archivo |

### Fase 1 — Base de datos y backend (completada)

| Hora | Actividad | Detalle |
|---|---|---|
| 17:50 | T1.1 Docs de Next 16 revisadas | Hallazgos clave: `cookies()`/`headers()`/`params`/`searchParams` son async; `middleware.ts` → `proxy.ts`; Route Handlers no se cachean por defecto; Turbopack por defecto. Registrado en AGENTS.md |
| 18:00 | T1.2 Instalación Prisma | ⚠️ npm resolvió versiones incompatibles (`prisma@8.0.0-rc.17` + `@prisma/client@7.10`); se fijaron ambas a **6.19.3 estable**. Schema creado en `prisma/schema.prisma` con `binaryTargets` para `debian-openssl-3.0.x` (servidor) |
| 18:05 | T1.3 Migración inicial | `20260926231221_init` aplicada (User, Session, Salary, Expense); `prisma/dev.db*` añadido a .gitignore |
| 18:08 | T1.4 Singleton Prisma | `src/lib/db/index.ts` (globalThis pattern) + `src/lib/db/current-user.ts` (lee cookie `finanzas_session`; fallback usuario demo hasta Fase 2) |
| 18:10 | Seed usuario demo | `prisma/seed.mjs` → `demo@finanzas.local` (sin contraseña válida; solo para desarrollo pre-auth) |
| 18:12 | T1.5 Motores de cálculo | `src/lib/calculations.ts` con 9 funciones puras; `dashboard.tsx` refactorizado para usarlas (misma UI, lógica centralizada) |
| 18:15 | T1.6 Validaciones | `salarySchema`, `monthQuerySchema`, `registerSchema`, `loginSchema`; fecha de gasto con regex `YYYY-MM-DD`; montos enteros |
| 18:20 | T1.7/T1.8/T1.9 API completa | `GET/POST /api/salaries` (upsert por usuario+año+mes), `PATCH/DELETE /api/salaries/[id]`, `GET/POST /api/expenses` (filtro ?year=&month=), `PATCH/DELETE /api/expenses/[id]`. Todas validan Zod en servidor, filtran por userId, errores uniformes `{error}` en español, 404 si no pertenece al usuario |
| 18:28 | Bug encontrado en pruebas | `partial()` de Zod heredaba el `.default("")` de `description` → un PATCH sin description la borraba. Solución: schemas separados `expenseSchema` (con default) / `expensePatchSchema` (sin defaults) — documentado en AGENTS.md |
| 18:29 | Limpieza de lint | Pre-existentes: `as any` de RHF+Zod 4 marcados con `eslint-disable` justificado (semántica intacta); imports no usados eliminados (expense-list, ui/input, ui/alert-dialog). **Restauración:** un comando PowerShell dañó temporalmente `dashboard.tsx` y `alert-dialog.tsx`; ambos restaurados con `git checkout` y rehechos correctamente |
| 18:31 | T1.10 Verificación | `tsc --noEmit` ✅ · `eslint` ✅ 0 errores 0 warnings · `next build` ✅ (rutas API dinámicas ƒ) |
| 18:33 | Pruebas funcionales sobre `next start` | POST gasto 201 ✅ · GET filtro mes ✅ · POST sueldo 201 ✅ · upsert sueldo mismo mes actualiza sin duplicar ✅ · PATCH conserva campos no enviados ✅ · 404 en id ajeno/inexistente ✅ · validación rechaza precio negativo y cuerpo vacío (mensajes en español) ✅ · DELETE 204 ×2 ✅ · datos de prueba eliminados |

**Cierre de Fase 1** ✅ — lint y build limpios, endpoints verificados manualmente.

### Colaboración + Fase 2 — Autenticación (completada)

| Hora | Actividad | Detalle |
|---|---|---|
| 20:55 | `requeriment.txt` creado | Guía de instalación para colaboradores: Node 22 LTS, Git, `npm install`, `.env` con DATABASE_URL, migraciones+seed, comandos del día a día, reglas del proyecto (español/COP, Prisma fijado en 6.x, localStorage sagrado) |
| 20:58 | Docs oficiales de proxy verificadas | `proxy.md` en node_modules: archivo en `src/` (mismo nivel que `app/`), export `proxy`, runtime Node.js fijo, matcher igual que middleware. Defensa en 2 capas: proxy verifica presencia de cookie; Route Handlers validan sesión real en BD |
| 21:00 | Dependencia | `bcryptjs` instalado (JS puro, sin node-gyp — requisito del servidor Celeron) |
| 21:02 | T2.6 + T2.8 | `src/lib/auth/session.ts`: `createSession` (token hex 32B, TTL 30 días, cookie httpOnly+samesite=lax, **sin `secure`** porque el transporte va por túnel Tailscale HTTP), `destroyCurrentSession`, `getSessionUserId` con limpieza perezosa de expiradas. `current-user.ts` reescrito: sin fallback demo, `getCurrentUser()` sin exponer hash |
| 21:05 | T2.1/T2.2/T2.3/T2.4 | 4 rutas: `register` (hash costo 10 + auto-login + 409 si correo duplicado), `login` (mensaje genérico anti-enumeración, 401), `logout` (borra sesión en BD —revocable— y cookie, 204), `me` (sin passwordHash) |
| 21:07 | T2.5 | `src/proxy.ts` — build lo registra como "ƒ Proxy (Middleware)". Sin cookie: app → 307 a /login; API → 401 JSON. /login con cookie → 307 a / |
| 21:09 | T2.7 | Página `/login` (español, dark-mode, estilo coherente): formulario RHF+Zod con alternancia login/registro; botón de cerrar sesión añadido a la cabecera |
| 21:10 | T2.9 Verificación | `lint` ✅ · `tsc` (vía build) ✅ · `next build` ✅ · Pruebas en vivo: `/` sin sesión → 307 /login ✅ · API sin sesión → 401 ✅ · registro 201+auto-login ✅ · /me sin passwordHash ✅ · login clave mala → 401 ✅ · registro duplicado → 409 ✅ · /login con sesión → 307 / ✅ · login correcto 200 ✅ · logout 204 ✅ · **post-logout la misma sesión queda invalidada en BD** (401) ✅ |
| 21:12 | Limpieza | Usuario de prueba eliminado (cascada de sesiones verificada: 0 filas), archivos temporales borrados, servidor detenido |

**Cierre de Fase 2** ✅ — autenticación completa verificada de punta a punta.

### Fase 3 — Frontend conectado a la API + migración de datos (completada)

| Hora | Actividad | Detalle |
|---|---|---|
| 21:20 | T3.1 Cliente API | `src/lib/api/client.ts`: fetch tipado (`expensesApi`, `salariesApi`, `importApi`), `ApiError` con mensaje del servidor, 401 → redirect a `/login` |
| 21:23 | T3.2/T3.3/T3.6 | `finance-store` reescrito: fuente de verdad = API; Zustand cachea el mes en contexto (`year`, `month`), `loadMonth` carga sueldo+gastos en paralelo, mutaciones llaman API primero (si falla, el estado no cambia). **`persist` eliminado** — localStorage ya solo guarda tema y datos legado para importar |
| 21:25 | T3.4 | Estados de carga ("Cargando tus datos...") y error (banner rojo con botón Reintentar) en `page.tsx` |
| 21:26 | T3.5 | `POST /api/import`: valida con Zod; sueldo → upsert del mes en curso; gastos → `createMany` respetando su `date` original (caen en su mes del historial). Componente `import-local-data.tsx`: banner azul que detecta la clave `finanzas-app-storage`, botón Importar/Ignorar, marca `finanzas-app-imported` |
| 21:28 | Componentes actualizados | `income-form` (guarda sueldo mensual vía API), `expense-form` (crear/editar async), `expense-list` (eliminar async), `page.tsx` (carga del mes al montar + banner importación) |
| 21:30 | Detalle de lint | La regla `react-hooks/set-state-in-effect` (NUEVA en react-hooks v6) prohibió `setState` sincrónico en effect → lectura de localStorage reescrita con `useSyncExternalStore` (patrón canónico React: SSR null, cliente lee localStorage, sin mismatch de hidratación) |
| 21:33 | T3.7 Verificación | `lint` ✅ 0 problemas · `next build` ✅ (`/api/import` dinámico registrado) · Prueba en vivo: registro → import (3 gastos + sueldo) → gasto de ago queda en ago, el de sept en sept, planificado de oct intacto ✅ · sueldo sept = 2.200.000 ✅ |
| 21:34 | Verificación extra | Borrado en cascada FK comprobado (eliminar usuario elimina sesiones y gastos) ✅; datos de prueba y temporales eliminados, BD limpia |
| 21:41 | **Bugfix post-cierre: loop infinito en `ImportLocalData`** | El usuario reportó "Maximum update depth exceeded" + "getSnapshot should be cached". Causa: `getClientSnapshot` devolvía un **objeto nuevo en cada llamada** → `useSyncExternalStore` detectaba cambio en cada render → ciclo de renders infinito (crash de la app). Solución: snapshot **memoizado** (se lee localStorage una sola vez y se cachea). Aclaración: el `GET /api/expenses → 401` del log era el comportamiento correcto (sin sesión, la API redirige al login). Verificado: `/` sin cookie → 307 a `/login` ✅ |

**Cierre de Fase 3** ✅ — la app ya persiste en la BD. **Siguiente paso del usuario: entrar a la app, registrarse y pulsar "Importar" para migrar sus datos reales.**

### Fase 4 — Vistas por mes y comparativas (completada)

> Pre-requisito confirmado: el usuario registró su cuenta real e importó sus datos (Fase 3 en producción local). La BD dev ya contiene datos reales del usuario — **los scripts de limpieza solo borran usuarios `@*.local` de prueba**.

| Hora | Actividad | Detalle |
|---|---|---|
| 22:10 | T4.1 | `month-selector.tsx`: ◀ Septiembre 2026 ▶ (Intl es-CO, mes capitalizado), botón "Hoy" aparece al navegar lejos del mes actual. Cambia `store.setMonth` → todo reacciona |
| 22:12 | Store extendido | `suggestedIncome` (último sueldo registrado, RF-08), `setMonth`, `markAsRealized` (RF-14). `loadMonth` ahora trae en paralelo: sueldo del mes + gastos del mes + todos los sueldos (para la sugerencia) |
| 22:15 | T4.2 | `income-form`: si el mes no tiene sueldo, precarga el último registrado como sugerencia |
| 22:16 | T4.3 | Dashboard y lista ya eran month-scoped por el store (Fase 3): ahora responden al MonthSelector. `expense-form`: fecha por defecto = hoy si es el mes actual, o día 1 del mes navegado (evita gastos invisibles) |
| 22:22 | T4.4 + T4.5 | Vista **Historial** nueva (tercera pestaña, icono History): selector de año, gráfico de barras Ingreso vs Gastado por mes (12 meses, recharts), tabla anual con Sueldo/Gastado/Comprometido/Ahorro por mes + fila Total; celdas vacías como "—", ahorro negativo en rojo |
| 22:25 | T4.6 | Botón ✔ en filas planificadas: un clic las marca como realizadas (PATCH parcial) |
| 22:30 | Verificación | `lint` ✅ · `build` ✅ (sin rutas nuevas de API — todo agrega en cliente sobre endpoints existentes) |
| 22:36 | T4.7 Prueba de datos | 3 meses sembrados por API (jul/ago/sep, sueldos 1.8M/2M/2.2M, gastos realizados y planificados) → totales por mes comparados contra cálculo manual: **coincidencia exacta** (ej. sep: gastado 600k, comprometido 400k, ahorro 1.6M). Datos de prueba eliminados; **datos reales del usuario intactos** (5 gastos, 2 sueldos) |

**Cierre de Fase 4** ✅ — la app ya permite navegar el historial mensual y comparar el año completo.

### Fase 5 — PWA y pulido móvil (completada)

| Hora | Actividad | Detalle |
|---|---|---|
| 22:45 | T5.1 | Docs Next 16: `src/app/manifest.ts` es un Route Handler especial (`MetadataRoute.Manifest`, cacheado por defecto, genera `/manifest.webmanifest`) |
| 22:50 | T5.2 | Iconos generados con `scripts/generate-icons.mjs` (PNG puro con Node+zlib, sin dependencias — a propósito por el servidor limitado): `icon-192/512.png` (esquinas redondeadas) + `icon-maskable-512.png` (full-bleed, zona segura 80%). Verificados visualmente: 3 barras blancas ascendentes sobre esmeralda #10b981. Manifest + `viewport.themeColor` + `appleWebApp` en layout |
| 23:00 | **Bug evitado en verificación** | El matcher del proxy habría redirigido `/manifest.webmanifest` e `/icons/*` a `/login` sin sesión → instalación PWA rota. Matcher excluye ahora esos assets. Registrado en AGENTS.md |
| 23:02 | T5.3 | Auditoría 360px: cabecera ahora muestra solo iconos de pestañas en móvil (texto desde `sm`), título truncable, subtítulo de ingreso oculto en xs; paddings reducidos. Tablas ya tenían `overflow-x-auto` ✅ |
| 23:05 | T5.4 | Objetivos táctiles: "Nuevo Gasto" full-width ≥44px en móvil; botones de acción de fila (✔ editar eliminar) con hit-area 36px+ |
| 23:06 | T5.5 Verificación | `lint` + `build` ✅ (`/manifest.webmanifest` estático registrado) · manifest servido como `application/manifest+json` sin sesión ✅ · iconos 200 PNG ✅. Pendiente por naturaleza: instalación real en teléfono (requiere Fase 6 desplegada) |

**Cierre de Fase 5** ✅ — PWA lista para instalar. Resta Fase 6: despliegue en el PC viejo.

## 2026-09-27 — Fase 6: preparación del despliegue (artefactos hechos y verificados)

| Hora | Actividad | Detalle |
|---|---|---|
| 19:10 | T6.2 Config standalone | `output: "standalone"` en `next.config.ts` (verificado en docs Next 16: crea `.next/standalone` + `server.js` minimal; `public` y `.next/static` se copian aparte). **El standalone trazó ambos motores Prisma (windows + debian-openssl-3.0.x)** gracias a los `binaryTargets` del schema — funciona en el servidor sin recompilar |
| 19:15 | Script de empaquetado | `scripts/package-deploy.mjs` + `npm run package:deploy` → genera `deploy-dist/` (standalone + static + public + schema/migraciones + CLI de Prisma para migrar en el servidor). `deploy-dist/` añadida a .gitignore |
| 19:20 | Prueba en vivo del paquete | Desde `deploy-dist/`: `migrate deploy` crea BD nueva ✅, `node server.js` sirve `/login` 200 ✅, manifest 200 ✅, y `POST /api/auth/register` **201 escribiendo en la BD SQLite del paquete** ✅ |
| 19:25 | Artefactos de despliegue | `deploy/DEPLOY.md` (guía paso a paso 💻 PC personal / 🖥️ servidor: preparación Debian, scp, .env, migraciones, systemd, ufw, backups, ciclo de actualizaciones, diagnóstico) · `deploy/finanzas.service` (systemd: MemoryMax=700M, Restart=always) · `deploy/backup-db.sh` (cron semanal, conserva 8 copias) |
| 19:31 | Bug colateral encontrado | ESLint empezó a analizar `deploy-dist/` (7.469 "errores" del bundle minificado). Solución: `deploy-dist/**` añadido a `globalIgnores` de eslint.config |
| 19:32 | Estado de la fase | lint ✅ limpio · Todo lo preparable desde el PC personal: hecho y verificado. **Pendiente (T6.1, T6.3–T6.10): ejecutar EN el servidor** siguiendo deploy/DEPLOY.md. TAREAS.md lo refleja marcado como ◐ |

**Siguiente acción (usuario):** seguir `deploy/DEPLOY.md` en el PC viejo — preparación (§A), despliegue (§B), pruebas (§C), backups (§D).

---

## Plantilla para nuevas entradas

<!--
| HH:MM | Actividad | Detalle |
|---|---|---|
-->
