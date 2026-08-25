#!/usr/bin/env bash
# ── Convex snapshot backup (macOS / Linux) ────────────────────────────────
#
# Takes a full snapshot of the Convex deployment and verifies it.
# READ-ONLY: this script never deletes or modifies anything in the
# deployment. It only downloads.
#
#   ./scripts/backup.sh              # snapshot the configured deployment
#   ./scripts/backup.sh --prod       # snapshot the production deployment
#
set -euo pipefail

cd "$(dirname "$0")/.."

STAMP="$(date +%Y-%m-%d-%H%M%S)"
LABEL="${BACKUP_LABEL:-snapshot}"
OUT="backups/${STAMP}-${LABEL}.zip"
PROD_FLAG=""

if [[ "${1:-}" == "--prod" ]]; then
  PROD_FLAG="--prod"
  OUT="backups/${STAMP}-${LABEL}-PROD.zip"
fi

echo "── Convex snapshot backup ──────────────────────────────────────────"
echo "Target : ${PROD_FLAG:-configured deployment (see .env.local)}"
echo "Output : $OUT"
echo

# ── Which deployment are we actually talking to? ──────────────────────────
if [[ -f .env.local ]]; then
  echo "Deployment configured in .env.local:"
  grep -E '^CONVEX_DEPLOYMENT=' .env.local || echo "  (CONVEX_DEPLOYMENT not set)"
  echo
else
  echo "WARNING: no .env.local found — 'npx convex export' may prompt you"
  echo "         to pick a deployment. Make sure you pick the right one."
  echo
fi

mkdir -p backups

# ── Export ────────────────────────────────────────────────────────────────
echo "Exporting… (this can take a few minutes on a large deployment)"
npx convex export $PROD_FLAG --path "$OUT"

if [[ ! -f "$OUT" ]]; then
  echo "FAILED: no snapshot was written to $OUT" >&2
  exit 1
fi

SIZE=$(du -h "$OUT" | cut -f1)
echo
echo "Snapshot written: $OUT ($SIZE)"
echo

# ── Verify ────────────────────────────────────────────────────────────────
echo "── Verifying contents ──────────────────────────────────────────────"
if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip not found — skipping verification. Verify manually before"
  echo "relying on this backup."
  exit 0
fi

TABLES=$(unzip -Z1 "$OUT" | grep -c 'documents.jsonl$' || true)
echo "Tables in snapshot : $TABLES"

if unzip -Z1 "$OUT" | grep -q '^_storage/'; then
  echo "File storage       : present"
else
  echo "File storage       : NOT FOUND — check whether attachments are included"
fi

echo
echo "Row counts per table:"
TMP=$(mktemp -d)
unzip -q "$OUT" -d "$TMP"
find "$TMP" -name 'documents.jsonl' | sort | while read -r f; do
  table=$(basename "$(dirname "$f")")
  count=$(wc -l < "$f" | tr -d ' ')
  printf "  %-28s %s\n" "$table" "$count"
done
rm -rf "$TMP"

echo
echo "── Done ────────────────────────────────────────────────────────────"
echo "Next steps:"
echo "  1. Copy this file somewhere OFF the Convex account (a compromise of"
echo "     that account must not take the backup with it)."
echo "  2. Encrypt it at rest — it contains real patient data."
echo "  3. Record the row counts above; compare after any migration."
echo "  4. Do NOT commit it. backups/.gitignore already blocks this."
