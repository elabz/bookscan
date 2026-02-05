#!/usr/bin/env bash
set -euo pipefail

# Deploy frontend assets to Bunny.net CDN storage, purge cache, and clean up old files.
#
# Usage: scripts/cdn-deploy.sh <dist-assets-dir>
# Example: scripts/cdn-deploy.sh library-scanster/dist/assets
#
# Required env vars:
#   CDN_API_KEY           - Bunny.net storage zone API key
#   CDN_ACCOUNT_API_KEY   - Bunny.net account API key (for cache purge)
#   CDN_STORAGE_ZONE_NAME - Storage zone name (e.g., allmybooks)
#   CDN_REGION            - Storage region (e.g., ny, de, la, sg, syd)
#   CDN_URL               - CDN hostname (e.g., cdn.allmybooks.com)
#   CDN_ASSETS_PATH       - Subfolder for frontend assets (default: app)

ASSETS_DIR="${1:?Usage: cdn-deploy.sh <dist-assets-dir>}"

if [ ! -d "$ASSETS_DIR" ]; then
  echo "Error: directory $ASSETS_DIR does not exist"
  exit 1
fi

CDN_ASSETS_PATH="${CDN_ASSETS_PATH:-app}"

# Bunny.net storage API base URL varies by region
if [ "$CDN_REGION" = "de" ] || [ "$CDN_REGION" = "" ]; then
  STORAGE_HOST="storage.bunnycdn.com"
else
  STORAGE_HOST="${CDN_REGION}.storage.bunnycdn.com"
fi

STORAGE_BASE="https://${STORAGE_HOST}/${CDN_STORAGE_ZONE_NAME}/${CDN_ASSETS_PATH}/assets"

echo "==> Deploying assets from $ASSETS_DIR to CDN"
echo "    Storage: $STORAGE_BASE"
echo "    CDN URL: https://${CDN_URL}/${CDN_ASSETS_PATH}/assets/"

# --- Step 1: List current files on CDN storage ---
echo ""
echo "==> Listing current files on CDN..."
REMOTE_FILES=$(curl -s --fail \
  -H "AccessKey: ${CDN_API_KEY}" \
  "https://${STORAGE_HOST}/${CDN_STORAGE_ZONE_NAME}/${CDN_ASSETS_PATH}/assets/" \
  2>/dev/null || echo "[]")

REMOTE_NAMES=$(echo "$REMOTE_FILES" | python3 -c "
import json, sys
try:
    files = json.load(sys.stdin)
    for f in files:
        if 'ObjectName' in f:
            print(f['ObjectName'])
except:
    pass
" 2>/dev/null || true)

echo "    Found $(echo "$REMOTE_NAMES" | grep -c . || echo 0) existing files"

# --- Step 2: Upload all local files ---
echo ""
echo "==> Uploading new assets..."
LOCAL_FILES=()
UPLOAD_COUNT=0
for filepath in "$ASSETS_DIR"/*; do
  [ -f "$filepath" ] || continue
  filename=$(basename "$filepath")
  LOCAL_FILES+=("$filename")

  echo "    Uploading: $filename"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PUT \
    -H "AccessKey: ${CDN_API_KEY}" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@${filepath}" \
    "${STORAGE_BASE}/${filename}")

  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    UPLOAD_COUNT=$((UPLOAD_COUNT + 1))
  else
    echo "    WARNING: Upload failed for $filename (HTTP $HTTP_CODE)"
  fi
done
echo "    Uploaded $UPLOAD_COUNT files"

# --- Step 3: Purge CDN cache ---
echo ""
echo "==> Purging CDN cache..."
PURGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "AccessKey: ${CDN_ACCOUNT_API_KEY}" \
  -H "Content-Type: application/json" \
  "https://api.bunny.net/purge?url=https://${CDN_URL}/${CDN_ASSETS_PATH}/*")

if [ "$PURGE_CODE" -ge 200 ] && [ "$PURGE_CODE" -lt 300 ]; then
  echo "    Cache purged successfully"
else
  echo "    WARNING: Cache purge returned HTTP $PURGE_CODE"
fi

# --- Step 4: Clean up orphaned files ---
echo ""
echo "==> Cleaning up orphaned files..."
DELETE_COUNT=0
while IFS= read -r remote_name; do
  [ -z "$remote_name" ] && continue
  # Check if remote file exists in local build
  FOUND=false
  for local_name in "${LOCAL_FILES[@]}"; do
    if [ "$local_name" = "$remote_name" ]; then
      FOUND=true
      break
    fi
  done

  if [ "$FOUND" = false ]; then
    echo "    Deleting orphan: $remote_name"
    curl -s -o /dev/null \
      -X DELETE \
      -H "AccessKey: ${CDN_API_KEY}" \
      "${STORAGE_BASE}/${remote_name}"
    DELETE_COUNT=$((DELETE_COUNT + 1))
  fi
done <<< "$REMOTE_NAMES"
echo "    Deleted $DELETE_COUNT orphaned files"

echo ""
echo "==> CDN deploy complete"
