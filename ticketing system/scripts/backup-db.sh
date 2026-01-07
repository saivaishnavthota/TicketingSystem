#!/bin/bash

# Database backup script for production

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/itsm_backup_$TIMESTAMP.sql"

echo "Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
docker exec itsm-postgres pg_dump -U ${DB_USER:-itsm_user} ${DB_NAME:-itsm_platform} > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "Backup completed: ${BACKUP_FILE}.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "itsm_backup_*.sql.gz" -mtime +7 -delete

echo "Old backups cleaned up (kept last 7 days)"
