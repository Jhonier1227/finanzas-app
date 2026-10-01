# Finanzas App — Control de gastos personales

Aplicación web personal de gestión financiera mensual, en español y en pesos
colombianos (COP). Permite registrar el sueldo de cada mes, planificar gastos,
llevar el registro de gastos reales, visualizar el avance con gráficos y
comparar meses, además de llevar el acumulado de pagos hacia la vivienda propia
(módulo Vivienda VIS). Instalable como PWA en el teléfono.

## Funcionalidades

- **Sueldos por mes**: un registro por mes con sugerencia del último valor.
- **Gastos realizado / planificado**: CRUD con 10 categorías, filtros, búsqueda
  y acción rápida planificado → realizado.
- **Dashboard**: ingreso, gastado, comprometido, saldo disponible, barra de
  progreso con semáforo y gráficos por categoría (torta + barras).
- **Historial anual**: comparativa ingreso vs gastado por mes y tabla resumen.
- **Vivienda VIS**: valor del inmueble editable + registro libre de pagos con
  total acumulado, saldo restante y % de avance.
- **Perfil y cuenta**: nombre/apellido, recuperación con código de
  verificación, eliminación de cuenta con doble confirmación.
- **PWA**: instalable en Android/iOS, optimizada para móvil.
- **Autenticación propia**: registro/login con sesiones en cookie `httpOnly`;
  cada usuario solo ve sus datos.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript · Tailwind CSS 4 + Radix UI ·
Zustand · React Hook Form + Zod · Recharts · SQLite vía Prisma 6 · bcryptjs.

## Desarrollo

```bash
npm install
npx prisma migrate dev      # crea/actualiza la BD local (dev.db)
npm run dev                 # http://localhost:3000
npm run lint                # verificación (ESLint 9)
npm run build               # build de producción
```

Variables de entorno (`.env`, nunca va a git):

```
DATABASE_URL="file:./dev.db"
RECOVERY_CODE="<código personal para recuperar la contraseña>"
```

## Despliegue (producción casera)

La app corre en un PC dedicado (Debian, SQLite local) y se accede por red
privada Tailscale. **El servidor nunca compila**: el build se genera aquí y se
copia.

```bash
npm run package:deploy      # genera deploy-dist/ (standalone, sin .env)
```

Guía paso a paso: [`deploy/DEPLOY.md`](./deploy/DEPLOY.md).

## Documentación del proyecto

- [`PROYECTO.md`](./PROYECTO.md) — visión, arquitectura, roadmap.
- [`TAREAS.md`](./TAREAS.md) — tablero de tareas por fase.
- [`docs/REQUERIMIENTOS.md`](./docs/REQUERIMIENTOS.md) — requerimientos funcionales y no funcionales.
- [`docs/MODELO-DATOS.md`](./docs/MODELO-DATOS.md) — modelo de datos.
- [`docs/ENTORNOS.md`](./docs/ENTORNOS.md) — entornos (desarrollo, servidor, teléfono).

## Estado

En producción de uso personal. Ver roadmap y pendientes en
[`PROYECTO.md`](./PROYECTO.md) y [`TAREAS.md`](./TAREAS.md).
