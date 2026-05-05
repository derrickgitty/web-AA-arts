#!/usr/bin/env bash
# Tar the SQLite DB and uploaded artworks into a single dated archive.
# Usage:  ./scripts/backup.sh [output-dir]
# Default output dir: ./backups
set -euo pipefail

cd "$(dirname "$0")/.."

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$OUT_DIR/aa-arts-$STAMP.tar.gz"

# Force a checkpoint so the WAL is flushed into data.db before we copy it.
# Skip silently if sqlite3 isn't installed — the WAL files are tarred too as a fallback.
if command -v sqlite3 >/dev/null 2>&1 && [ -f data.db ]; then
  sqlite3 data.db "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null
fi

tar -czf "$ARCHIVE" \
  $( [ -f data.db ]     && echo data.db ) \
  $( [ -f data.db-wal ] && echo data.db-wal ) \
  $( [ -f data.db-shm ] && echo data.db-shm ) \
  $( [ -d public/uploads ] && echo public/uploads )

echo "Wrote $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
