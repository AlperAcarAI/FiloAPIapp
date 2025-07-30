#!/bin/bash

# Fleet Management API Backup Script
# Runs daily to backup database and application files

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/fleetapp/backups"
APP_DIR="/home/fleetapp/fleet-management-system"
DB_NAME="fleetmanagement"
DB_USER="fleetadmin"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🗂️  Starting backup process at $(date)"

# Database backup
echo "📊 Backing up PostgreSQL database..."
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully"
    
    # Compress the SQL file
    gzip $BACKUP_DIR/db_backup_$DATE.sql
    echo "🗜️  Database backup compressed"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Application files backup (excluding node_modules and logs)
echo "📁 Backing up application files..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='uploads' \
    -C /home/fleetapp fleet-management-system

if [ $? -eq 0 ]; then
    echo "✅ Application backup completed successfully"
else
    echo "❌ Application backup failed!"
fi

# Upload directory backup (if exists)
if [ -d "/home/fleetapp/uploads" ]; then
    echo "📂 Backing up upload files..."
    tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /home/fleetapp uploads
    echo "✅ Uploads backup completed"
fi

# Clean old backups (keep only last 7 days)
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Calculate backup sizes
DB_SIZE=$(du -h $BACKUP_DIR/db_backup_$DATE.sql.gz 2>/dev/null | cut -f1)
APP_SIZE=$(du -h $BACKUP_DIR/app_backup_$DATE.tar.gz 2>/dev/null | cut -f1)
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

echo ""
echo "📋 Backup Summary:"
echo "   Database: $DB_SIZE"
echo "   Application: $APP_SIZE" 
echo "   Total backup dir: $TOTAL_SIZE"
echo "   Location: $BACKUP_DIR"
echo ""
echo "✅ Backup process completed at $(date)"

# Optional: Send notification (uncomment if you have mail configured)
# echo "Fleet Management API backup completed successfully on $(date)" | mail -s "Backup Report" admin@yourdomain.com