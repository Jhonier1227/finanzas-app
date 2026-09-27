# Tareas — Finanzas App

> Tablero maestro del desarrollo. Marcar `[x]` al completar cada tarea.
> Cada fase termina con `npm run lint` + `npm run build` limpios y documentación actualizada.
> Referencias: RF/RNF → docs/REQUERIMIENTOS.md · Modelo → docs/MODELO-DATOS.md

**Leyenda:** `[ ]` pendiente · `[~]` en progreso · `[x]` hecha · bloqueada ⇒ depende de otra tarea

---

## Fase 0 — Documentación y diseño ✅ (2026-09-25)

- [x] T0.1 Crear PROYECTO.md (visión, arquitectura, estructura, módulos, motores de cálculo)
- [x] T0.2 Actualizar AGENTS.md (reglas operativas para agentes)
- [x] T0.3 Redactar requerimientos funcionales y no funcionales → docs/REQUERIMIENTOS.md
- [x] T0.4 Diagramar el modelo de datos → docs/MODELO-DATOS.md
- [x] T0.5 Definir entornos (PC personal vs PC viejo) → docs/ENTORNOS.md
- [x] T0.6 Crear este archivo de tareas

## Fase 1 — Base de datos y backend ✅ (2026-09-26)

> Objetivo: API REST funcional con datos reales en SQLite.

- [x] T1.1 Revisar docs de Next 16 en `node_modules/next/dist/docs/` (Route Handlers, breaking changes) — *RNF-17*
- [x] T1.2 Instalar Prisma + SQLite; crear `prisma/schema.prisma` (User, Session, Salary, Expense) — *modelo §1*
- [x] T1.3 Generar migración inicial y cliente (`prisma migrate dev --name init`)
- [x] T1.4 Crear singleton del cliente Prisma en `src/lib/db/` — *evita múltiples conexiones en dev con hot-reload*
- [x] T1.5 Mover cálculos de `dashboard.tsx` a `src/lib/calculations.ts` (funciones puras, reutilizables por API y UI) — *motores §10*
- [x] T1.6 Ampliar `src/lib/validations.ts`: schemas `salarySchema`, `registerSchema`, `loginSchema` — *RNF-03*
- [x] T1.7 API `GET/POST /api/salaries?year=&month=` + `PATCH/DELETE /api/salaries/[id]` — *RF-05..07*
- [x] T1.8 API `GET/POST /api/expenses?year=&month=` + `PATCH/DELETE /api/expenses/[id]` — *RF-09..13*
- [x] T1.9 Todas las respuestas validadas con Zod en servidor y filtradas por `userId` — *RF-04, RNF-03/05/08*
- [x] T1.10 Verificación de fase: probar endpoints con curl/HTTPie; `lint` + `build` limpios

## Fase 2 — Autenticación ✅ (2026-09-26)

> Objetivo: solo el usuario autenticado toca sus datos.

- [x] T2.1 `POST /api/auth/register` — hash de contraseña (**bcryptjs**, JS puro — evita node-gyp en el servidor), costo 10+ — *RF-01, RNF-01*
- [x] T2.2 `POST /api/auth/login` — crea `Session` + cookie `httpOnly; sameSite=lax; maxAge 30d` — *RF-02, RNF-02*
- [x] T2.3 `POST /api/auth/logout` — borra la sesión en BD y la cookie — *RF-02*
- [x] T2.4 `GET /api/auth/me` — devuelve usuario actual (sin hash) — *RNF-05*
- [x] T2.5 `middleware.ts`: proteger rutas de app (redirect a `/login`) y `/api/*` (401) — **implementado como `src/proxy.ts` (nueva convención Next 16)**
- [x] T2.6 Helper servidor: `getCurrentUser()` para Route Handlers
- [x] T2.7 Página `/login` (formulario + registro), estilo coherente con la app — *RF-29*
- [x] T2.8 Limpieza de sesiones expiradas (lazy: al validar sesión, borrar las vencidas)
- [x] T2.9 Verificación de fase: flujo completo registro→login→logout→login; respaldo a RNF-01..05

## Fase 3 — Frontend conectado a la API + migración de datos ✅ (2026-09-26)

> Objetivo: la app deja de depender de localStorage (sin perder los datos existentes).

- [x] T3.1 Capa de cliente API en `src/lib/api/` (fetch tipado, manejo de 401 → redirect login) — *RNF-14*
- [x] T3.2 Refactor `finance-store`: Zustand como caché de UI; cada mutación llama a la API primero
- [x] T3.3 Cargar datos del mes seleccionado al montar/cambiar de mes
- [x] T3.4 Estados de carga y error visibles (skeletons / mensajes) — *RNF-14*
- [x] T3.5 `POST /api/import` + botón "Importar datos guardados en este dispositivo" (lee localStorage → API, una vez) — *RF-24*
- [x] T3.6 Eliminar persistencia en localStorage del store financiero (dejar solo la del tema)
- [x] T3.7 Verificación de fase: importar datos reales, verificar totales contra la versión anterior

## Fase 4 — Vistas por mes y comparativas

> Objetivo: historial mensual completo (la funcionalidad estrella).

- [ ] T4.1 Selector de mes global (`MonthSelector`: ◀ Octubre 2026 ▶) en la cabecera — *RF-15/16*
- [ ] T4.2 `income-form` → formulario de sueldo mensual (sugerir último registrado) — *RF-05..08*
- [ ] T4.3 Dashboard y lista filtrados por mes seleccionado — *RF-13, RF-17..20*
- [ ] T4.4 Vista "Historial": gráfico ingreso vs gastado por mes del año — *RF-21*
- [ ] T4.5 Vista "Historial": tabla anual (sueldo, gastado, comprometido, ahorro) — *RF-22*
- [ ] T4.6 Acción rápida: gasto planificado → realizado desde la lista — *RF-14*
- [ ] T4.7 Verificación de fase: datos de 3 meses distintos, comparativas correctas contra cálculo manual

## Fase 5 — PWA y pulido móvil

> Objetivo: instalar en el teléfono y registrar gastos cómodamente.

- [ ] T5.1 Revisar soporte PWA en Next 16 (`manifest.ts` de App Router vs archivo estático) — *RNF-17*
- [ ] T5.2 `manifest` + iconos (192/512, maskable) + metadatos de instalación — *RF-26, RNF-20*
- [ ] T5.3 Auditoría responsive a 360px: navbar, formularios, lista, gráficos (Recharts) — *RF-27*
- [ ] T5.4 Cola de botones grandes y táctiles para registro rápido de gasto en móvil
- [ ] T5.5 Verificación de fase: instalar en el teléfono desde Tailscale y probar flujo completo

## Fase 6 — Despliegue en el PC viejo (Debian 13, 1.5 GB RAM)

> Objetivo: producción casera, siempre disponible. **Restricción dura: NUNCA compilar en este equipo.**

- [ ] T6.1 Preparar el PC viejo según docs/ENTORNOS.md §3: modo texto (sin GUI), zram, Node.js 22 (NodeSource), Tailscale sin expiración de clave
- [ ] T6.2 `output: "standalone"` en next.config; build **en el PC personal** y copia por scp — *RNF-10/11*
- [ ] T6.3 `npx prisma migrate deploy` en el servidor (crea `db.sqlite`)
- [ ] T6.4 Servicio systemd `finanzas.service` (plantilla en ENTORNOS.md §5.1: `NODE_OPTIONS=--max-old-space-size=512`, `MemoryMax=700M`, `Restart=always`) — *RNF-12*
- [ ] T6.5 ufw: permitir 3000 solo desde LAN (`192.168.1.0/24`) y `tailscale0` — *RNF-04*
- [ ] T6.6 Energía portátil: `HandleLidSwitch=ignore` en logind.conf (cerrar tapa ≠ apagar servidor)
- [ ] T6.7 Pruebas: acceso desde PC principal (LAN), teléfono en casa (LAN) y fuera (Tailscale) — *RNF-13*
- [ ] T6.8 Script de backup semanal de `db.sqlite` (cron → copia al PC personal) — *RNF-07*
- [ ] T6.9 Monitoreo de RAM: `htop`/`journalctl` tras una semana; si el uso sostenido > 85%, considerar ampliar a 4-8 GB DDR3 (slot libre del Samsung 300E)
- [ ] T6.10 Verificación de fase: registrar gasto en la calle con datos móviles, verlo en el PC al llegar

## Fase 7 — Futuro (backlog, sin fecha)

- [ ] T7.1 Export/backup JSON desde la app — *RF-25*
- [ ] T7.2 Presupuestos por categoría con alertas de exceso
- [ ] T7.3 Gastos recurrentes (generar planificado el día 1 de cada mes)
- [ ] T7.4 Etiquetas/filtros de texto en la lista
- [ ] T7.5 Modo offline con sincronización (service worker avanzado)

---

## Regla de cierre de fase

1. `npm run lint` y `npm run build` (o `npx tsc --noEmit` si se tocaron tipos) → limpios.
2. Actualizar: este archivo (checks), roadmap de PROYECTO.md, y docs/ si hubo cambios estructurales.
3. Sincronizar al PC viejo (Fase 6 en adelante).
