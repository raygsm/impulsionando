#!/usr/bin/env bash
# Smoke test dos endpoints públicos RioMed (HMAC).
# Uso: IMPULSIONANDO_WEBHOOK_SECRET=xxx ./scripts/riomed-public-smoke.sh [base_url]
set -euo pipefail

BASE="${1:-https://impulsionando.lovable.app}"
SECRET="${IMPULSIONANDO_WEBHOOK_SECRET:?defina IMPULSIONANDO_WEBHOOK_SECRET}"

sign() { printf '%s' "$1" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}'; }

post() {
  local path="$1" body="$2"
  local sig; sig=$(sign "$body")
  echo "── POST $path"
  curl -sS -X POST "$BASE$path" \
    -H "content-type: application/json" \
    -H "x-impulsionando-signature: $sig" \
    --data "$body" | sed 's/^/   /'
  echo
}

get() {
  local path="$1"
  local sig; sig=$(sign "")
  echo "── GET  $path"
  curl -sS "$BASE$path" \
    -H "x-impulsionando-signature: $sig" | sed 's/^/   /'
  echo
}

echo "=== 1. events ==="
post /api/public/riomed/events \
  '{"event_code":"smoke.test","level":"info","message":"smoke test","payload":{"ts":"'$(date -Iseconds)'"}}'

echo "=== 2. fx upsert ==="
post /api/public/riomed/fx/upsert \
  '{"rate":6.96,"source":"smoke","metadata":{"src":"manual"}}'

echo "=== 3. fx current (GET) ==="
get /api/public/riomed/fx/upsert

echo "=== 4. broadcasts due (GET) ==="
get "/api/public/riomed/broadcasts/due?limit=5"

echo "✅ smoke completo"
