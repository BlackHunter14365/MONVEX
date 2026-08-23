#!/bin/bash
# ==============================================================================
# MONVEX Enterprise Automated Database Backup Script
# Performs compressed PostgreSQL backups with automatic 30-day retention rotation
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/monvex}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/monvex_db_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="${DB_CONTAINER:-monvex_postgres}"
DB_NAME="${DB_NAME:-monvex_db}"
DB_USER="${DB_USER:-postgres}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting MONVEX PostgreSQL database backup..."

# Execute pg_dump within docker container and compress
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Retention Policy: Delete backups older than 30 days
echo "[$(date)] Purging backups older than 30 days..."
find "${BACKUP_DIR}" -name "monvex_db_backup_*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup procedure finished cleanly."
