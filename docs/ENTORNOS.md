# Entornos — Finanzas App

> Versión 1.0 — 2026-09-25
> Responde: **qué necesito en cada equipo antes de empezar el desarrollo.**

## 1. Vista general

```
┌──────────────────────────────┐         ┌──────────────────────────────┐
│      PC PERSONAL              │  git    │      PC VIEJO (servidor)      │
│      DESARROLLO               │ ──────► │      PRODUCCIÓN               │
│                               │  push   │                               │
│  - Código fuente (repo)       │  pull   │  - Copia del repo (ejecuta)   │
│  - Node.js + npm              │         │  - Node.js (solo producción)  │
│  - Editor (VS Code)           │         │  - SQLite (archivo de datos)  │
│  - Navegador                  │         │  - Tailscale                  │
│  - Tailscale (para probar)    │         │  - Encendido 24/7             │
└──────────────────────────────┘         └──────────────────────────────┘
          ▲                                        ▲
          │  http://100.76.131.36:3000             │
          │                                        │
┌─────────┴───────────┐                            │
│   TELÉFONO          │                            │
│   - Tailscale app   │────────────────────────────┘
│   - Navegador / PWA │
└─────────────────────┘
```

## 2. PC personal (desarrollo) — ya lo tienes casi todo

| Herramienta | ¿Por qué? | ¿Ya está? |
|---|---|---|
| Node.js LTS (22.x recomendado) | Ejecutar `npm run dev`, builds | ✅ (el proyecto ya corre aquí) |
| npm (incluido con Node) | Dependencias | ✅ |
| Git | Versionado y sync con el servidor | ✅ (el repo ya es git) |
| VS Code | Desarrollo | Asumido ✅ |
| Tailscale (opcional aquí) | Probar la app del servidor desde el PC sin estar en LAN | ⬜ Instalar |

**Nada más.** El desarrollo sigue exactamente como hasta ahora.

## 3. PC viejo (servidor) — checklist de preparación

> **Hardware real verificado** (fastfetch): Debian 13 (trixie), Celeron 847 2×1.10 GHz,
> **1.57 GiB RAM**, swap 1.71 GiB, disco 455 GB (1% usado), LAN `192.168.1.42`.
> Es un portátil Samsung serie 300E usado en modo servidor.

### 3.1 Reglas duras por la RAM limitada

1. **Nunca compilar en el servidor** (`next build` requiere 1–4 GB de RAM).
   El build standalone se genera en el PC personal y se copia (scp/rsync).
2. **Servidor sin interfaz gráfica**: `sudo systemctl set-default multi-user.target`
   y reiniciar. El escritorio consume ~800 MB; sin él queda ~180 MB.
3. **Activar zram** (swap comprimido): `sudo apt install zram-tools` —
   absorbe picos sin tocar disco.
4. **`NODE_OPTIONS=--max-old-space-size=512`** en el servicio: Node nunca pide más de lo que hay.
5. Solo módulos nativos pre-compilados o JS puro: se usa **bcryptjs** (JS puro)
   en vez de bcrypt nativo, para evitar compilaciones node-gyp en el Celeron.

### 3.2 Checklist

| # | Paso | Detalle |
|---|---|---|
| 1 | Node.js LTS 22.x | vía NodeSource (`apt install nodejs` de Debian 13 trae versión vieja) |
| 2 | Git | Solo para `git pull` del repositorio |
| 3 | REPO en GitHub (privado) | Si aún no está: push desde el PC personal |
| 4 | Tailscale instalado | ✅ Ya configurado (`100.76.131.36`); activar "key expiry disabled" en console.tailscale.com |
| 5 | Modo texto (multi-user.target) + zram | Ver §3.1 |
| 6 | Clonar repo en `~/finanzas-app` | `git clone` |
| 7 | Copiar `.env` y el build standalone desde el PC personal | scp/rsync; el `.env` **nunca va a git** |
| 8 | `npx prisma migrate deploy` | Aplica el esquema a `db.sqlite` (archivo, sin servicio de BD) |
| 9 | Servicio systemd (no pm2 ni Task Scheduler — es Linux): `finanzas.service` con `Restart=always` | Sección 5.1 |
| 10 | Cortafuegos (ufw): permitir 3000 solo desde LAN y tailscale0 | `sudo ufw allow from 192.168.1.0/24 to any port 3000` + `sudo ufw allow in on tailscale0 to any port 3000` |
| 11 | Energía: nunca suspender al cerrar la tapa | `HandleLidSwitch=ignore` en `/etc/systemd/logind.conf` (¡es portátil!) |

## 4. Teléfono

| Herramienta | Detalle |
|---|---|
| Tailscale (Play Store / App Store, gratis) | Conecta el teléfono a tu red privada; requisito fuera de casa |
| Navegador (Chrome/Safari) | Abrir `http://100.76.131.36:3000` → "Añadir a pantalla de inicio" → PWA instalada (Fase 5) |

## 5. Flujo de trabajo a partir del desarrollo

```
PC PERSONAL (Windows):                   PC VIEJO (Debian):
1. Desarrollar + probar local
2. npm run lint → npm run build
   (output: "standalone")
3. git commit + push
4. Copiar build + migraciones:
   scp -r .next/standalone servidor-jm:~/finanzas-app/
   scp -r .next/static servidor-jm:~/finanzas-app/.next/
5. scp .env si cambió ───────────────►   6. git pull (código de referencia)
                                        7. npx prisma migrate deploy (si hubo migración)
                                        8. sudo systemctl restart finanzas
```

### 5.1 Servicio systemd (arranque automático en el servidor)

La unidad vive versionada en el repo: **`deploy/finanzas.service`**
(ExecStart = `node server.js` standalone, `NODE_OPTIONS=--max-old-space-size=512`,
`MemoryMax=700M`, `Restart=always`). El procedimiento completo paso a paso
está en **`deploy/DEPLOY.md`**. Logs: `journalctl -u finanzas -f`.

## 6. Datos: qué vive en dónde

| Dato | PC personal | PC viejo | Teléfono |
|---|---|---|---|
| Código fuente | ✅ (origen) | ✅ (copia pull) | — |
| Base de datos (gastos, sueldos, usuarios) | ⚠️ solo datos de prueba locales | ✅ **la única base real** | — |
| localStorage actual (datos de hoy) | ✅ → se importa a la BD en Fase 3 | — | — |
| `.env` con secretos | ✅ | ✅ (copiado a mano) | — |
| `node_modules/` | ✅ | ✅ (`npm install`) | — |
| Backups de la BD | ✅ (copias) | ✅ (archivo original) | — |

> **Regla de oro:** la BD real vive únicamente en el PC viejo. La BD del PC
> personal es desechable (se usa para desarrollar con datos de prueba).

## 7. Variables de entorno (a partir de Fase 1)

`.env.local` (PC personal, desarrollo) — valores de desarrollo.
`.env` (PC viejo, producción) — valores reales.

```
DATABASE_URL="file:./dev.db"       # SQLite; en producción apunta al archivo real
AUTH_SECRET="<cadena aleatoria>"   # firmar/verificar sesiones (openssl rand -base64 32)
```

Ambos archivos están en `.gitignore`; nunca se suben a git.
