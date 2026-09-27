# Proyecto: Finanzas App

> Documento maestro del proyecto. Se actualiza a medida que avanza el desarrollo.
> Última actualización: 2026-09-25 (definición inicial de arquitectura completa).
>
> **Documentos del proyecto:**
> - [TAREAS.md](./TAREAS.md) — tablero de tareas por fase (el checklist vivo del desarrollo)
> - [docs/REQUERIMIENTOS.md](./docs/REQUERIMIENTOS.md) — RF/RNF con criterios de aceptación
> - [docs/MODELO-DATOS.md](./docs/MODELO-DATOS.md) — diagrama ER y decisiones de modelado
> - [docs/ENTORNOS.md](./docs/ENTORNOS.md) — qué va en cada equipo (PC personal / PC viejo / teléfono)
> - [AGENTS.md](./AGENTS.md) — reglas operativas para sesiones de IA

---

## 1. ¿Qué es?

**Finanzas App** es una aplicación web personal de gestión financiera mensual.
Permite registrar el sueldo de cada mes, planificar los gastos antes de ejecutarlos,
registrar los gastos reales a medida que ocurren, y analizar visualmente en qué se
está yendo el dinero.

Nació como una prueba de un modelo de IA y evolucionó a una herramienta de uso
cotidiano real.

## 2. ¿Para quién es?

- **Uso personal y privado** (un solo propietario, posiblemente autenticación de uso individual).
- Contexto: Colombia — todos los montos se manejan en **COP** (formato `es-CO`, sin decimales).
- Idioma de la interfaz: **español**.

## 3. Problema que resuelve

El sueldo "no rinde" y no hay claridad de en qué se gasta. La app permite:

1. **Registrar el sueldo** al finalizar cada mes, acumulando historial del año.
2. **Planificar gastos** (compromisos futuros) al inicio del mes.
3. **Registrar gastos realizados** durante el mes, sobre todo desde el teléfono.
4. **Calcular y visualizar**: cuánto se ha gastado, cuánto está comprometido,
   cuánto queda disponible, y comparativas entre meses.

## 4. Concepto funcional: el ciclo mensual

```
┌──────────────────────────────────────────────────────┐
│                     CADA MES                          │
│                                                       │
│  1. Registrar sueldo del mes (fin de mes / inicio)    │
│  2. Planificar gastos (arriendo, servicios, deudas)   │
│  3. Ir registrando gastos reales día a día            │
│  4. Revisar dashboard: disponible, % gastado          │
│  5. Comparar con meses anteriores                     │
└──────────────────────────────────────────────────────┘
```

Tipos de gasto:
- **`realizado`**: dinero que ya salió.
- **`planificado`**: dinero comprometido pero aún no gastado (presupuesto).

Categorías de gasto (10): Alimentación, Transporte, Vivienda/Arriendo,
Servicios públicos, Entretenimiento, Salud, Educación, Ropa/Personal,
Ahorro/Inversión, Otros.

## 5. Arquitectura

### 5.1 Vista general

```
┌────────────────┐     ┌────────────────┐
│  Teléfono      │     │  PC principal  │
│  (PWA)         │     │  (navegador)   │
└───────┬────────┘     └───────┬────────┘
        │                      │
        │   Red privada cifrada Tailscale
        │   (http://100.76.131.36:3000)
        │                      │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │     PC VIEJO          │
        │  (servidor siempre    │
        │   encendido)          │
        │                       │
        │  Next.js 16           │
        │  ├── Frontend (React) │
        │  ├── API (Route       │
        │  │   Handlers)        │
        │  └── SQLite (Prisma)  │
        └──────────────────────┘
```

### 5.2 Decisiones arquitectónicas (y por qué)

| Decisión | Justificación |
|---|---|
| **Todo en el PC viejo** (app + BD) | Teléfono y PC son solo clientes iguales; funciona con el PC principal apagado; consultas BD-API son locales (sin latencia de red) |
| **Tailscale como red de acceso** | Túnel privado cifrado, sin exponer puertos a Internet público, funciona fuera de casa (IP fija `100.76.131.36`) |
| **SQLite + Prisma** | Tráfico mínimo (uso personal), backup = copiar un archivo, casi cero recursos para el PC viejo, sin servicio de BD aparte |
| **Next.js como full-stack** | Ya es el framework del proyecto; los Route Handlers sirven como API REST sin proyecto backend separado |
| **PWA en lugar de app nativa** | Mismo código, instalable en el teléfono (icono + pantalla completa), sin tiendas de apps |
| **Autenticación por sesión (cookie httpOnly)** | Estándar, segura, sin librerías pesadas; contraseñas con hash |

### 5.3 Flujo de desarrollo y despliegue

```
PC personal (Windows, desarrollo):
  código → git push → build standalone (aquí se compila, nunca en el servidor)

PC viejo (Debian 13, servidor — 1.5 GB RAM, ver docs/ENTORNOS.md):
  recibe el build por scp → systemd corre "node server.js"
  (sin GUI, zram activo, SQLite como archivo en el repo local)
```

El repositorio vive en el PC personal; el PC viejo solo ejecuta. Detalle de
hardware, RAM y pasos de preparación: [docs/ENTORNOS.md](./docs/ENTORNOS.md).

## 6. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.12 |
| UI | React | 19.2 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS (vía PostCSS) | ^4 |
| Componentes base | Radix UI + CVA (estilo shadcn/ui) | — |
| Estado cliente | Zustand | ^5 |
| Formularios | React Hook Form + Zod | ^7 / ^4 |
| Gráficos | Recharts | ^3 |
| Base de datos | SQLite vía Prisma | (pendiente de instalar) |
| Iconos | lucide-react | — |
| Fechas | date-fns | — |
| Lint | ESLint 9 (flat config) | — |

## 7. Estructura de carpetas

### 7.1 Actual (frontend-only, estado local)

```
finanzas-app/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── layout.tsx          # Layout raíz: fuentes Geist + ThemeProvider
│   │   ├── page.tsx            # Página única: pestañas Dashboard / Gastos
│   │   └── globals.css         # Tailwind 4
│   ├── components/
│   │   ├── income-form.tsx     # Formulario de ingreso mensual
│   │   ├── expense-form.tsx    # Diálogo crear/editar gasto (RHF + Zod)
│   │   ├── expense-list.tsx    # Lista de gastos con edición/eliminación
│   │   ├── dashboard.tsx       # Tarjetas, barra de progreso, gráficos
│   │   ├── dark-mode-toggle.tsx
│   │   ├── theme-provider.tsx
│   │   └── ui/                 # Componentes base (button, input, dialog, ...)
│   ├── lib/
│   │   ├── utils.ts            # cn(), generateId(), formatCurrency(), formatDate()
│   │   └── validations.ts      # Schemas Zod (income, expense)
│   ├── store/
│   │   ├── finance-store.ts    # Zustand + persist → localStorage
│   │   └── theme-store.ts      # Zustand + persist (modo oscuro)
│   └── types/
│       └── index.ts            # Expense, ExpenseCategory, ExpenseType
├── PROYECTO.md                 # Este documento
├── TAREAS.md                   # Checklist vivo del desarrollo
├── AGENTS.md                   # Instrucciones para agentes de IA
├── docs/                       # Requerimientos, modelo de datos, entornos
└── package.json
```

### 7.2 Propuesta (full-stack, tras migración)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Redirige según sesión
│   ├── login/
│   │   └── page.tsx            # NUEVO: formulario login/registro
│   ├── (app)/                  # NUEVO: grupo protegido por sesión
│   │   ├── dashboard/page.tsx
│   │   ├── gastos/page.tsx
│   │   └── historial/page.tsx  # Comparativas mensuales
│   └── api/                    # NUEVO: Route Handlers
│       ├── auth/               # login, registro, logout, sesión
│       ├── salaries/route.ts   # GET/POST sueldos (?year=&month=)
│       ├── expenses/route.ts   # GET/POST gastos (?year=&month=)
│       ├── expenses/[id]/route.ts  # PATCH/DELETE
│       └── import/route.ts     # Importación única desde localStorage
├── components/                 # Igual, más: month-selector, comparativa-mensual
├── lib/
│   ├── db/                     # NUEVO: cliente Prisma singleton
│   ├── auth/                   # NUEVO: sesiones, hash, middleware helpers
│   ├── calculations.ts         # NUEVO: motores de cálculo (ver §10)
│   ├── utils.ts
│   └── validations.ts          # + schemas de auth y salary
├── store/                      # Zustand queda como caché de cliente o se retira
└── types/
prisma/
└── schema.prisma               # NUEVO: modelo de datos
public/
├── manifest.webmanifest        # NUEVO: PWA
└── icons/                      # NUEVO: iconos PWA
middleware.ts                   # NUEVO: protección de rutas
```

## 8. Módulos

### 8.1 Autenticación
- Registro e inicio de sesión con email + contraseña (hash bcrypt/argon2).
- Sesión con cookie `httpOnly`; middleware protege rutas `(app)` y `/api/*`.
- Cada registro de la BD pertenece a un usuario.

### 8.2 Sueldos (Salaries)
- Un registro por mes/año y usuario: `{ amount, year, month }`.
- Formulario sugiere el valor del último sueldo registrado.
- Habilita historial mensual y comparativas.

### 8.3 Gastos (Expenses)
- CRUD completo (ya existe en UI).
- Siempre filtrados por mes/año en contexto + usuario autenticado.
- Campo `date` existente define el mes al que pertenece el gasto.

### 8.4 Dashboard y reportes
- Tarjetas de resumen (ingreso, gastado, comprometido, disponible) — existen.
- Gráficos por categoría (torta) y realizado vs planificado (barras) — existen.
- **Nuevo**: selector de mes (◀ mes ▶) que filtra toda la vista.
- **Nuevo**: gráfico comparativo ingreso vs gasto por mes (año).
- **Nuevo**: tabla resumen anual por mes.

### 8.5 PWA (móvil)
- `manifest.webmanifest` + iconos + metadatos de instalación.
- Optimización responsive de formularios y lista (uso principal del teléfono).
- Instalación desde el navegador del teléfono ("Añadir a pantalla de inicio"),
  con Tailscale instalado en el teléfono para alcanzar el servidor.

## 9. Modelo de datos (destino: Prisma/SQLite)

```
User
  id            String   (uuid)
  email         String   (único)
  passwordHash  String
  createdAt     DateTime

Salary          (sueldo registrado por mes)
  id            String   (uuid)
  userId        String   → User
  year          Int
  month         Int      (1-12)
  amount        Int      (COP, sin decimales)
  createdAt     DateTime
  @@unique([userId, year, month])

Expense
  id            String   (uuid)
  userId        String   → User
  category      String   (una de las 10 categorías)
  productName   String
  description   String   (puede ser "")
  price         Int      (COP)
  type          String   ("realizado" | "planificado")
  date          String   ("YYYY-MM-DD", define el mes del gasto)
  createdAt     DateTime
```

## 10. Motores de cálculo

Fórmulas exactas que implementa la app (hoy en `dashboard.tsx`, destino: `lib/calculations.ts`):

| Métrica | Fórmula |
|---|---|
| Total gastado | Σ precio de gastos `realizado` del mes |
| Comprometido | Σ precio de gastos `planificado` del mes |
| Saldo disponible | `sueldoDelMes − totalGastado − comprometido` |
| % de gasto | `totalGastado / sueldoDelMes × 100` (semáforo: >100 rojo, >80 ámbar, resto verde) |
| Distribución por categoría | Σ precio de `realizado` agrupado por categoría del mes |
| Realizado vs planificado | ambas sumas agrupadas por categoría del mes |
| Ahorro del mes | `sueldoDelMes − totalGastado` |
| Comparativa anual | por cada mes: sueldo, gastado, comprometido, ahorro |

Formato de moneda: `Intl.NumberFormat("es-CO", { currency: "COP", mínimo 0 decimales })`.

## 11. Migración de datos existentes

Los datos actuales viven en `localStorage` del navegador (clave
`finanzas-app-storage`), **no en el repositorio**. Se rescatarán con una función
única de **"Importar datos locales"** (Fase 3): la app lee el localStorage y
envía los gastos/ingreso a la API para guardarlos en la BD del usuario.

## 12. Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| 0 | PROYECTO.md + AGENTS.md + docs/ (requerimientos, modelo de datos, entornos) + TAREAS.md | ✅ Hecho (2026-09-25) |
| 1 | Prisma + SQLite + modelo de datos + API routes (gastos, sueldos) | ✅ Hecho (2026-09-26) |
| 2 | Autenticación (registro/login, sesiones, middleware) | ✅ Hecho (2026-09-26) — `middleware.ts` implementado como `src/proxy.ts` (Next 16) |
| 3 | Frontend conectado a la API + importación de localStorage | ✅ Hecho (2026-09-26) |
| 4 | Sueldos por mes, selector de mes, comparativas mensuales/anuales | ⬜ Pendiente |
| 5 | PWA (manifest, iconos, pulido responsive) | ⬜ Pendiente |
| 6 | Despliegue en PC viejo (arranque automático, acceso por Tailscale) | ⬜ Pendiente |

## 13. Notas operativas

- **Sin exposición a Internet**: el servidor solo escucha en la red Tailscale/LAN.
- **Backups**: copiar periódicamente el archivo SQLite del PC viejo.
- **El PC viejo debe permanecer encendido** para acceso desde el teléfono.
- Tailscale requerido en cada dispositivo cliente que acceda fuera de la red local.
