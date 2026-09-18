#!/bin/bash
set -e
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/svg_electric_backup_$TIMESTAMP.sql"

echo "Backing up database to $BACKUP_FILE..."
if [ -n "$DOCKER_CONTAINER" ]; then
    docker exec -t svg_electric_postgres pg_dump -U postgres svg_electric_db > "$BACKUP_FILE"
else
    pg_dump -U postgres -h localhost -p 5432 svg_electric_db > "$BACKUP_FILE"
fi
echo "Backup successful: $BACKUP_FILE"