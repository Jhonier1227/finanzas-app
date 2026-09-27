# Requerimientos — Finanzas App

> Versión 1.0 — 2026-09-25
> Convención: **RF** = Requerimiento Funcional, **RNF** = Requerimiento No Funcional.
> Prioridad: **A**lta (MVP obligatorio), **M**edia (v1.1), **B**aja (futuro).

---

## 1. Requerimientos Funcionales

### 1.1 Autenticación y usuarios

| ID | Descripción | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-01 | El sistema permite registrar un usuario con email y contraseña | A | Tras registrarse, el usuario puede iniciar sesión de inmediato; la contraseña se almacena con hash (nunca en texto plano) |
| RF-02 | El sistema permite iniciar y cerrar sesión | A | Sesión por cookie `httpOnly`; el cierre invalida la sesión en BD |
| RF-03 | El sistema protege las rutas de la app y la API | A | Sin sesión válida, `/` redirige a `/login` y `/api/*` responde 401 |
| RF-04 | El sistema aísla los datos por usuario | A | Ninguna consulta devuelve datos de otro usuario (todas filtran por `userId`) |

### 1.2 Sueldos (ingresos mensuales)

| ID | Descripción | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-05 | Registrar el sueldo de un mes/año específico | A | No puede existir duplicado para el mismo (usuario, año, mes); monto > 0 |
| RF-06 | Editar el sueldo de un mes ya registrado | A | El cambio se refleja inmediatamente en el dashboard de ese mes |
| RF-07 | Consultar el sueldo de cualquier mes del historial | A | Disponible vía API y al navegar meses con el selector |
| RF-08 | Sugerir como valor inicial el último sueldo registrado | M | Al registrar un mes nuevo, el campo se precarga con el sueldo más reciente |

### 1.3 Gestión de gastos

| ID | Descripción | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-09 | Registrar un gasto en el mes en curso u otro (según su fecha) | A | Campos: categoría, nombre, descripción (opcional), precio > 0, tipo, fecha; validación Zod cliente + servidor |
| RF-10 | Editar un gasto existente | A | El formulario se precarga con los valores actuales |
| RF-11 | Eliminar un gasto | A | Requiere confirmación previa (diálogo) — *ya existe* |
| RF-12 | Clasificar el gasto como `realizado` o `planificado` | A | Obligatorio; ambos tipos se muestran distinguidos en la lista — *ya existe* |
| RF-13 | Listar los gastos filtrados por mes/año | A | Ordenados por fecha descendente |
| RF-14 | Marcar un gasto planificado como realizado | M | Acción rápida desde la lista, sin abrir el formulario completo |

### 1.4 Navegación mensual

| ID | Descripción | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-15 | Selector de mes visible en todas las vistas principales | A | Botones ◀ ▶; el mes seleccionado filtra dashboard, lista y gráficos |
| RF-16 | El mes actual es la vista por defecto al entrar | A | Basado en la fecha del dispositivo |

### 1.5 Dashboard y reportes

| ID | Descripción | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-17 | Tarjetas resumen del mes: ingreso, total gastado, comprometido, saldo disponible | A | Fórmulas según §10 de PROYECTO.md — *ya existe* |
| RF-18 | Barra de progreso % del ingreso gastado con semáforo (verde/ámbar/rojo) | A | Umbrales: >80 ámbar, >100 rojo — *ya existe* |
| RF-19 | Gráfico de torta: distribución del gasto realizado por categoría | A | Solo gastos `realizado` del mes seleccionado — *ya existe* |
| RF-20 | Gráfico de barras: realizado vs planificado por categoría | A | Del mes seleccionado — *ya existe* |
| RF-21 | Gráfico comparativo del año: ingreso vs gastado por mes (barras/línea) | A | Los 12 meses del año seleccionado |
| RF-22 | Tabla resumen anual: por mes — sueldo, gastado, comprometido, ahorro | A | Ahorro = sueldo − gastado |
| RF-23 | Saldo disponible negativo se muestra en rojo con indicador | A | — *ya existe* |

### 1.6 Migración y portabilidad

| ID | Descripción | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-24 | Importación única de los datos del localStorage a la BD | A | Tras importar, los datos locales no se duplican si se repite la acción (o se advierte) |
| RF-25 | Export de respaldo (JSON) de todos los datos del usuario | B | Descarga desde la app |

### 1.7 Presentación

| ID | Descripción | Prioridad | Criterio de aceptación |
|---|---|---|---|
| RF-26 | Instalable como PWA en el teléfono | A | Manifest + iconos; aparece en pantalla de inicio, abre sin barra del navegador |
| RF-27 | Interfaz usable en pantallas de móvil (registro de gastos cómodo one-hand) | A | Formularios y lista funcionales a 360px de ancho |
| RF-28 | Modo oscuro/claro persistente | A | — *ya existe* |
| RF-29 | Toda la UI en español y montos en COP (`es-CO`, sin decimales) | A | — *ya existe* |

---

## 2. Requerimientos No Funcionales

### 2.1 Seguridad

| ID | Descripción | Prioridad |
|---|---|---|
| RNF-01 | Contraseñas almacenadas con hash resistente (**bcryptjs** — JS puro, evita compilación nativa en el servidor de 1.5 GB RAM; costo ≥ 10) | A |
| RNF-02 | Sesiones en cookie `httpOnly`, `sameSite=lax`, con expiración y registro en BD | A |
| RNF-03 | Validación de toda entrada también en el servidor (Zod), nunca confiar en el cliente | A |
| RNF-04 | El servidor no se expone a Internet público; acceso solo vía red Tailscale o LAN | A |
| RNF-05 | La API responde solo con los campos necesarios (nunca hashes ni datos de otros usuarios) | A |

### 2.2 Datos y persistencia

| ID | Descripción | Prioridad |
|---|---|---|
| RNF-06 | Los datos sobreviven a cierres de navegador, borrado de caché y cambios de dispositivo (están en la BD del servidor) | A |
| RNF-07 | Respaldo de la BD simple: un archivo SQLite copiable | A |
| RNF-08 | Montos enteros en COP (sin decimales) en toda la cadena BD → API → UI | A |

### 2.3 Rendimiento

| ID | Descripción | Prioridad |
|---|---|---|
| RNF-09 | Respuesta de la API < 500 ms en LAN para operaciones CRUD normales | A |
| RNF-10 | El servidor es Debian 13 con **1.57 GiB RAM** (Celeron 847): app en modo standalone, sin GUI, `MemoryMax=700M`, impronta en reposo < 400 MB; **prohibido compilar en el servidor** (build se hace en el PC personal y se copia) | A |
| RNF-11 | Sin dependencias pesadas innecesarias; build standalone para despliegue | M |

### 2.4 Disponibilidad y operación

| ID | Descripción | Prioridad |
|---|---|---|
| RNF-12 | La app arranca automáticamente tras reinicio del PC viejo | A |
| RNF-13 | Accesible desde cualquier dispositivo con Tailscale, fuera de casa incluido | A |
| RNF-14 | Degradación elegante: si el servidor está caído, el cliente muestra error claro (no pantalla rota) | M |

### 2.5 Calidad y mantenibilidad

| ID | Descripción | Prioridad |
|---|---|---|
| RNF-15 | TypeScript estricto; `npm run lint` sin errores antes de entregar cada fase | A |
| RNF-16 | Documentación viva: PROYECTO.md, TAREAS.md y docs/ actualizados al cerrar cada fase | A |
| RNF-17 | Verificación de breaking changes de Next 16 en `node_modules/next/dist/docs/` antes de usar cualquier API de Next | A |
| RNF-18 | Sin texto en inglés en la UI; formato de fechas y moneda en `es-CO` | A |

### 2.6 Compatibilidad

| ID | Descripción | Prioridad |
|---|---|---|
| RNF-19 | Navegadores modernos (Chrome/Edge/Firefox/Safari últimas 2 versiones) | A |
| RNF-20 | PWA instalable en Android (Chrome) e iOS (Safari) | A |

---

## 3. Fuera de alcance (exclusiones explícitas)

- App móvil nativa (Play Store / App Store) — la PWA la cubre.
- Sincronización bancaria, importación de extractos, OCR de facturas.
- Multi-moneda, decimales, presupuestos compartidos entre varios usuarios.
- Notificaciones push y recordatorios (se evaluará en futuro).
