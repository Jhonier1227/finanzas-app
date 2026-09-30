#!/usr/bin/env bash
# Backup semanal de la base de datos (RNF-07).
# Instalación en el PC viejo:
#   chmod +x ~/finanzas-app/deploy/backup-db.sh
#   crontab -e  →  0 3 * * 0  /home/stiven/finanzas-app/deploy/backup-db.sh
# (domingo 3 AM; copias en ~/finanzas-backups/, conserva las últimas 8)
set -euo pipefail

DB_PATH="/home/stiven/finanzas-data/db.sqlite"
BACKUP_DIR="/home/stiven/finanzas-backups"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# .backup de sqlite3 hace una copia consistente aunque la app esté corriendo
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/db-$STAMP.sqlite'"
else
  cp "$DB_PATH" "$BACKUP_DIR/db-$STAMP.sqlite"
fi

# Conserva solo las últimas 8 copias
ls -t "$BACKUP_DIR"/db-*.sqlite | tail -n +9 | xargs -r rm

echo "Backup creado: $BACKUP_DIR/db-$STAMP.sqlite"
