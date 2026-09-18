#!/bin/bash
set -e
if [ -z "$1" ]; then
    echo "Usage: ./restore-db.sh path_to_backup_file.sql"
    exit 1
fi

echo "Restoring database from $1..."
if [ -n "$DOCKER_CONTAINER" ]; then
    docker exec -i svg_electric_postgres psql -U postgres -d svg_electric_db < "$1"
else
    psql -U postgres -h localhost -p 5432 -d svg_electric_db < "$1"
fi
echo "Restore complete!"