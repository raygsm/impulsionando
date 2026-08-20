#!/usr/bin/env bash
set -Eeuo pipefail

: "${SUPABASE_URL:?SUPABASE_URL required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY required}"

API="${SUPABASE_URL%/}/rest/v1/core_publish_requests"
PUBLISHER="/usr/local/lib/impulsionando/publisher/publish-core-now.sh"
SLEEP_SECONDS="${CORE_PUBLISH_POLL_SECONDS:-3}"

headers=(
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
  -H "Content-Type: application/json"
)

patch_request() {
  local id="$1" payload="$2"
  curl -fsS -X PATCH "${API}?id=eq.${id}" "${headers[@]}" -H 'Prefer: return=minimal' -d "$payload" >/dev/null
}

while true; do
  row="$(curl -fsS "${API}?status=eq.queued&target=eq.core&select=id&order=requested_at.asc&limit=1" "${headers[@]}" | jq -r '.[0].id // empty' || true)"
  if [ -z "$row" ]; then
    sleep "$SLEEP_SECONDS"
    continue
  fi

  claimed="$(curl -fsS -X PATCH "${API}?id=eq.${row}&status=eq.queued" "${headers[@]}" -H 'Prefer: return=representation' -d '{"status":"running","started_at":"now","message":"Preparando publicação segura."}' || true)"
  if [ "$(printf '%s' "$claimed" | jq 'length' 2>/dev/null || echo 0)" -eq 0 ]; then
    sleep 1
    continue
  fi

  set +e
  "$PUBLISHER"
  rc=$?
  set -e

  status_file="/var/lib/impulsionando-publisher/status.json"
  sha=""
  stage=""
  if [ -r "$status_file" ]; then
    sha="$(jq -r '.sha // empty' "$status_file" 2>/dev/null || true)"
    stage="$(jq -r '.stage // empty' "$status_file" 2>/dev/null || true)"
  fi
  safe_stage="$(printf '%s' "${stage:-Publicação concluída.}" | jq -Rs '.')"
  safe_sha="$(printf '%s' "$sha" | jq -Rs '.')"

  if [ "$rc" -eq 0 ]; then
    patch_request "$row" "{\"status\":\"success\",\"finished_at\":\"now\",\"commit_sha\":${safe_sha},\"message\":${safe_stage}}"
  else
    patch_request "$row" "{\"status\":\"failed\",\"finished_at\":\"now\",\"commit_sha\":${safe_sha},\"message\":${safe_stage},\"metadata\":{\"exit_code\":${rc}}}"
  fi

done
