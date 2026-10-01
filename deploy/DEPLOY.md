# Despliegue al PC viejo (servidor-jm) — paso a paso

> Servidor objetivo: **Debian 13, Celeron 847, 1.57 GiB RAM**, LAN `192.168.1.42`, Tailscale `100.76.131.36`, usuario `stiven`.
> Regla de oro: **nunca compilar en el servidor** (RNF-10). El build se hace en el PC personal.

Leyenda: 💻 = se ejecuta en tu PC personal (Windows) · 🖥️ = en el PC viejo (Debian)

---

## A. Preparación única del servidor 🖥️

```bash
# 1. Modo servidor sin interfaz gráfica (libera ~800 MB de RAM)
sudo systemctl set-default multi-user.target

# 2. zram (swap comprimido en RAM)
sudo apt update && sudo apt install -y zram-tools

# 3. Node.js 22 LTS (el de apt de Debian es viejo → NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # debe mostrar v22.x

# 4. Que no se suspenda al cerrar la tapa (¡es portátil!)
sudo sed -i 's/^#\?HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind

# 5. Tailscale: que la clave no expire (el servidor es permanente)
#    → https://console.tailscale.com → Machines → servidor-jm → "Disable key expiry"

sudo reboot   # entra en modo texto; todo lo demás se puede hacer por SSH
```

## B. Desplegar la app

### Desde el PC personal 💻

```powershell
npm run package:deploy    # build standalone + empaqueta deploy-dist/ (SIN .env: el script lo excluye a propósito)

# Enviar al servidor (primera vez o actualizaciones).
# OJO: nunca copiar un .env encima del servidor (el suyo, con la ruta de
# producción, se crea en §B y no se toca más):
scp -r deploy-dist/* stiven@192.168.1.42:~/finanzas-app/
```

> ⚠️ **Lecciones del despliegue real (2026-09-30):**
> 1. El `*` NO copia carpetas que empiezan por punto: `.next/` no viaja y sin
>    ella `node server.js` ni arranca. Enviarla explícita:
>    `scp -r deploy-dist/.next stiven@192.168.1.42:~/finanzas-app/`
> 2. `deploy/` (service, este archivo, backup) NO va dentro de `deploy-dist/`:
>    enviarla aparte la primera vez:
>    `scp -r deploy stiven@192.168.1.42:~/finanzas-app/`
> 3. En la primera subida, crear `mkdir -p ~/finanzas-app ~/finanzas-data`
>    en el servidor ANTES del primer `scp` (si no, falla "No such file").
> 4. Se puede usar el alias SSH (`MiServidorGlobal:...`) en vez de la IP.

### En el servidor 🖥️

```bash
mkdir -p ~/finanzas-app ~/finanzas-data

# 1. Variables de entorno (crear UNA vez; nunca va a git)
cat > ~/finanzas-app/.env << 'EOF'
DATABASE_URL="file:/home/stiven/finanzas-data/db.sqlite"
RECOVERY_CODE="1105389927"
EOF

# 2. Aplicar migraciones a la BD (primera vez y cada vez que cambie el schema)
cd ~/finanzas-app
chmod +x ~/finanzas-app/node_modules/@prisma/engines/schema-engine-*   # el scp no conserva el permiso de ejecución
node node_modules/prisma/build/index.js migrate deploy

# 3. Servicio systemd
sudo cp ~/finanzas-app/deploy/finanzas.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now finanzas
journalctl -u finanzas -f   # ver logs (Ctrl+C para salir)

# 4. Cortafuegos: puerto 3000 solo desde LAN y Tailscale (RNF-04)
sudo apt install -y ufw
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw allow in on tailscale0 to any port 3000
sudo ufw enable
```

## C. Probar

| Desde | URL |
|---|---|
| PC personal (misma casa) | `http://192.168.1.42:3000` |
| Cualquier dispositivo con Tailscale | `http://100.76.131.36:3000` |

Luego: abrir en el teléfono → menú del navegador → **"Añadir a pantalla de inicio"** → la PWA queda instalada como app.

## D. Backups automáticos (RNF-07) 🖥️

```bash
chmod +x ~/finanzas-app/deploy/backup-db.sh
crontab -e
# pegar esta línea (domingo 3 AM, conserva las últimas 8 copias):
0 3 * * 0  /home/stiven/finanzas-app/deploy/backup-db.sh
```

## E. Ciclo de actualizaciones (cada nueva versión)

```powershell
# PC personal 💻
npm run lint; npm run package:deploy
scp -r deploy-dist/* stiven@192.168.1.42:~/finanzas-app/
```
```bash
# Servidor 🖥️
cd ~/finanzas-app
node node_modules/prisma/build/index.js migrate deploy   # solo si hubo migración nueva
sudo systemctl restart finanzas
```

## F. Diagnóstico rápido

```bash
systemctl status finanzas     # ¿está corriendo?
journalctl -u finanzas -n 100 # últimos logs
free -h                       # RAM (alerta si uso > 85% sostenido → T6.9: ampliar a 4-8 GB DDR3)
df -h /                       # disco
```
