#!/bin/bash

# Database restore script

set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "Restoring database from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# Decompress and restore
gunzip -c "$BACKUP_FILE" | docker exec -i itsm-postgres psql -U ${DB_USER:-itsm_user} ${DB_NAME:-itsm_platform}

echo "Database restored successfully!"
