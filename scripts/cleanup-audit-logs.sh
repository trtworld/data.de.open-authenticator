#!/bin/sh

# Audit logs cleanup script
# This script runs inside the Docker container to clean old audit logs

RETENTION_DAYS=${AUDIT_RETENTION_DAYS:-30}
DB_PATH="/app/data/app.db"
LOG_FILE="/app/data/audit-cleanup.log"

# Calculate cutoff timestamp (current time - retention days in seconds)
CUTOFF_TIMESTAMP=$(($(date +%s) - (RETENTION_DAYS * 86400)))

# Log start
echo "[$(date)] Starting audit log cleanup (retention: ${RETENTION_DAYS} days)" >> "$LOG_FILE"

# Delete old logs
DELETED=$(sqlite3 "$DB_PATH" "DELETE FROM audit_logs WHERE timestamp < ${CUTOFF_TIMESTAMP}; SELECT changes();")

# Log result
echo "[$(date)] Deleted ${DELETED} audit logs older than ${RETENTION_DAYS} days" >> "$LOG_FILE"

# Vacuum database to reclaim space (optional, once a week)
if [ "$(date +%u)" -eq 1 ]; then
    echo "[$(date)] Running VACUUM on database" >> "$LOG_FILE"
    sqlite3 "$DB_PATH" "VACUUM;"
    echo "[$(date)] VACUUM completed" >> "$LOG_FILE"
fi

# Keep only last 100 lines of log file
tail -n 100 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"

exit 0
