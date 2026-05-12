#!/bin/bash

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="asisgrab_backup_$TIMESTAMP.tar.gz"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo "Starting backup for AsisGrab Business..."

# Files to backup
# 1. SQLite Database
# 2. Backend Logs
# 3. Form Templates
# 4. Environment Files
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    backend/storage.db \
    backend/backend.log \
    form_template.xlsx \
    .env.local \
    backend/.env \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_DIR/$BACKUP_NAME"
    
    # Cleanup old backups (keep last 30 days)
    find $BACKUP_DIR -name "asisgrab_backup_*" -mtime +30 -delete
    echo "Old backups cleaned up."
else
    echo "Backup failed. Please check permissions."
fi
