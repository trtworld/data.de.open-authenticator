#!/bin/sh

# Otto-TP Entrypoint Script
# Sets up cron job for audit log cleanup and starts the application

echo "Starting Otto-TP..."

# Create cron job for audit log cleanup (runs daily at 3 AM)
CRON_SCHEDULE="0 3 * * *"
CLEANUP_SCRIPT="/app/.next/standalone/scripts/cleanup-audit-logs.sh"

# Install cron and sqlite3 if not present
apk add --no-cache dcron sqlite 2>/dev/null || true

# Create cron job
echo "${CRON_SCHEDULE} ${CLEANUP_SCRIPT}" > /tmp/crontab
crontab /tmp/crontab
rm /tmp/crontab

# Start cron daemon
crond -b -l 2

echo "Cron job scheduled: Audit log cleanup will run daily at 3 AM"
echo "Retention period: ${AUDIT_RETENTION_DAYS:-2} days"

# Run initial cleanup
echo "Running initial audit log cleanup..."
${CLEANUP_SCRIPT}

# Start the application
echo "Starting Next.js application..."
exec node server.js
