#!/bin/sh
set -eu

umask 077
mkdir -p /backups

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
database_tmp="/backups/database-${stamp}.dump.tmp"
database_file="/backups/database-${stamp}.dump"
uploads_tmp="/backups/uploads-${stamp}.tar.gz.tmp"
uploads_file="/backups/uploads-${stamp}.tar.gz"

export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
pg_dump \
  --host="${POSTGRES_HOST:-postgres}" \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$database_tmp"
mv "$database_tmp" "$database_file"

tar -C /uploads -czf "$uploads_tmp" .
mv "$uploads_tmp" "$uploads_file"

sha256sum "$database_file" "$uploads_file" > "/backups/checksums-${stamp}.sha256"
find /backups -type f -mtime "+${BACKUP_RETENTION_DAYS:-14}" -delete

echo "Backup completed: $database_file and $uploads_file"
