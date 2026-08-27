#!/bin/sh
set -eu

if [ "${CONFIRM_RESTORE:-}" != "restore-${POSTGRES_DB}" ]; then
  echo "Refusing restore. Set CONFIRM_RESTORE=restore-${POSTGRES_DB}." >&2
  exit 2
fi

case "${BACKUP_FILE:-}" in
  /backups/*.dump) ;;
  *) echo "BACKUP_FILE must name a .dump file under /backups." >&2; exit 2 ;;
esac

test -f "$BACKUP_FILE"
export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
pg_restore \
  --host="${POSTGRES_HOST:-postgres}" \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$BACKUP_FILE"

if [ "${RESTORE_UPLOADS:-false}" = "true" ]; then
  case "${UPLOAD_BACKUP_FILE:-}" in
    /backups/uploads-*.tar.gz) ;;
    *) echo "UPLOAD_BACKUP_FILE must name an uploads archive under /backups." >&2; exit 2 ;;
  esac
  test -f "$UPLOAD_BACKUP_FILE"
  find /uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
  tar -C /uploads -xzf "$UPLOAD_BACKUP_FILE"
fi

echo "Restore completed. Restart the core service and verify /ready before reopening traffic."
