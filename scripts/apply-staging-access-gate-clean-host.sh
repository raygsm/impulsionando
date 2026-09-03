#!/usr/bin/env bash
# Apply Traefik basic-auth access gate on clean-host staging.
# Default: tenant-web + placeholder (stg). API is NOT gated (Bearer JWT smokes
# need a free Authorization header). Optional INCLUDE_API=1 attaches API too.
#
# Target: root@2.25.123.224 only — refuses legacy VPS.
# Secrets: NEVER printed; NEVER written to git. Hash is generated on the host.
#
# One-time / rotate password:
#   STAGING_BASIC_AUTH_USER=ops \
#   STAGING_BASIC_AUTH_PASS='choose-a-long-secret' \
#   ./scripts/apply-staging-access-gate-clean-host.sh
#
# Optional:
#   INCLUDE_STG=0          — skip placeholder Host stg.impulsionando.com.br (default: 1)
#   INCLUDE_API=1          — also gate reengineering-api / api.stg (default: 0)
#   DISABLE=1              — remove middleware labels + delete host gate files
#   SSH_KEY / SSH_USER     — override defaults
#
# After apply, FE public checks need credentials, e.g.:
#   curl -fsS -u "$STAGING_BASIC_AUTH_USER:$STAGING_BASIC_AUTH_PASS" \
#     https://tenant.stg.impulsionando.com.br/health
#
# API stays ungated by default:
#   curl -fsS https://api.stg.impulsionando.com.br/health
#
# Grey-cloud DNS stays for Let’s Encrypt HTTP-01. This gate is Traefik auth, not CF proxy.

set -euo pipefail

CLEAN_HOST="2.25.123.224"
LEGACY_DENY="187.77.232.52"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519_impulsionando}"
SSH_USER="${SSH_USER:-root}"
INCLUDE_STG="${INCLUDE_STG:-1}"
INCLUDE_API="${INCLUDE_API:-0}"
DISABLE="${DISABLE:-0}"
GATE_DIR="/etc/dokploy/traefik/dynamic"
GATE_YML="${GATE_DIR}/staging-access-gate.yml"
GATE_HTPASSWD="${GATE_DIR}/staging-basic-auth.htpasswd"
MW_REF="staging-basic-auth@file"

die() { echo "error: $*" >&2; exit 1; }

case "${CLEAN_HOST}" in
  *"${LEGACY_DENY}"*) die "refuses legacy VPS ${LEGACY_DENY}" ;;
esac
[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY}"

if [[ "${DISABLE}" != "1" ]]; then
  [[ -n "${STAGING_BASIC_AUTH_USER:-}" ]] || die "STAGING_BASIC_AUTH_USER required (or set DISABLE=1)"
  [[ -n "${STAGING_BASIC_AUTH_PASS:-}" ]] || die "STAGING_BASIC_AUTH_PASS required (or set DISABLE=1)"
  [[ "${#STAGING_BASIC_AUTH_PASS}" -ge 12 ]] || die "STAGING_BASIC_AUTH_PASS must be at least 12 characters"
fi

SSH=(ssh -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new
  "${SSH_USER}@${CLEAN_HOST}")

echo "==> Target clean host ${CLEAN_HOST} (not ${LEGACY_DENY})"
if [[ "${DISABLE}" == "1" ]]; then
  echo "==> DISABLE=1 — removing staging access gate"
else
  echo "==> Applying staging basic-auth middleware (user set; password not printed)"
  echo "==> INCLUDE_STG=${INCLUDE_STG} INCLUDE_API=${INCLUDE_API} (API default off)"
fi

# Pass credentials only via remote env for the duration of the remote script.
# Values are not echoed; remote cleans sensitive vars after hash generation.
"${SSH[@]}" "DISABLE=$(printf %q "${DISABLE}") \
INCLUDE_STG=$(printf %q "${INCLUDE_STG}") \
INCLUDE_API=$(printf %q "${INCLUDE_API}") \
GATE_YML=$(printf %q "${GATE_YML}") \
GATE_HTPASSWD=$(printf %q "${GATE_HTPASSWD}") \
MW_REF=$(printf %q "${MW_REF}") \
STAGING_BASIC_AUTH_USER=$(printf %q "${STAGING_BASIC_AUTH_USER:-}") \
STAGING_BASIC_AUTH_PASS=$(printf %q "${STAGING_BASIC_AUTH_PASS:-}") \
bash -s" <<'REMOTE'
set -euo pipefail

attach_mw() {
  local service="$1" http_router="$2" secure_router="$3"
  docker service inspect "$service" >/dev/null 2>&1 || {
    echo "==> skip ${service} (not present)"
    return 0
  }
  echo "==> Attach ${MW_REF} → ${service} (${http_router}, ${secure_router})"
  docker service update \
    --label-add "traefik.http.routers.${http_router}.middlewares=${MW_REF}" \
    --label-add "traefik.http.routers.${secure_router}.middlewares=${MW_REF}" \
    "$service" >/dev/null
}

detach_mw() {
  local service="$1" http_router="$2" secure_router="$3"
  docker service inspect "$service" >/dev/null 2>&1 || return 0
  echo "==> Detach middleware labels → ${service}"
  docker service update \
    --label-rm "traefik.http.routers.${http_router}.middlewares" \
    --label-rm "traefik.http.routers.${secure_router}.middlewares" \
    "$service" >/dev/null || true
}

if [[ "${DISABLE}" == "1" ]]; then
  detach_mw reengineering-api reeng-api reeng-api-secure
  detach_mw reengineering-tenant-web reeng-tenant-web reeng-tenant-web-secure
  detach_mw reengineering-placeholder reeng-ph reeng-ph-secure
  rm -f "${GATE_YML}" "${GATE_HTPASSWD}"
  echo "==> Gate files removed (if present)"
  exit 0
fi

command -v openssl >/dev/null || { echo "error: openssl missing on host" >&2; exit 1; }

# APR1 htpasswd line on host — password never written to disk in plaintext.
HASH="$(printf '%s' "${STAGING_BASIC_AUTH_PASS}" | openssl passwd -apr1 -stdin)"
AUTH_USER="${STAGING_BASIC_AUTH_USER}"
unset STAGING_BASIC_AUTH_PASS STAGING_BASIC_AUTH_USER

umask 077
printf '%s:%s\n' "${AUTH_USER}" "${HASH}" > "${GATE_HTPASSWD}"
chmod 600 "${GATE_HTPASSWD}"
unset HASH AUTH_USER

# usersFile keeps the hash out of YAML; .htpasswd is not loaded as Traefik config
# (file provider only parses yml/yaml/toml). Path is inside the Traefik bind mount.
cat > "${GATE_YML}" <<'YAML'
# Staging access gate — managed by scripts/apply-staging-access-gate-clean-host.sh
# Do not commit host copies. No plaintext passwords.
http:
  middlewares:
    staging-basic-auth:
      basicAuth:
        realm: "Impulsionando staging"
        usersFile: /etc/dokploy/traefik/dynamic/staging-basic-auth.htpasswd
YAML
chmod 644 "${GATE_YML}"

echo "==> Wrote ${GATE_YML} + usersFile (hash only; not printed)"

# Brief wait so Traefik file provider picks up middleware before routers reference it.
sleep 2

# Default: leave API ungated so Bearer JWT Authorization headers work for smokes.
if [[ "${INCLUDE_API}" == "1" ]]; then
  attach_mw reengineering-api reeng-api reeng-api-secure
else
  detach_mw reengineering-api reeng-api reeng-api-secure
  echo "==> INCLUDE_API=0 — api.stg left ungated (Bearer JWT smokes)"
fi

attach_mw reengineering-tenant-web reeng-tenant-web reeng-tenant-web-secure
if [[ "${INCLUDE_STG}" == "1" ]]; then
  attach_mw reengineering-placeholder reeng-ph reeng-ph-secure
else
  echo "==> INCLUDE_STG=0 — leaving placeholder ungated"
fi

echo "==> Local probe (expect 401 without credentials on gated FE hosts)"
code_tenant="$(curl -sS -o /dev/null -w '%{http_code}' -H 'Host: tenant.stg.impulsionando.com.br' http://127.0.0.1/health || true)"
echo "    tenant.stg Host → HTTP ${code_tenant} (401 = gate active)"
code_api="$(curl -sS -o /dev/null -w '%{http_code}' -H 'Host: api.stg.impulsionando.com.br' http://127.0.0.1/health || true)"
if [[ "${INCLUDE_API}" == "1" ]]; then
  echo "    api.stg Host → HTTP ${code_api} (401 = gate active)"
else
  echo "    api.stg Host → HTTP ${code_api} (200 expected when ungated)"
fi
REMOTE

echo "==> Done. Operator: use curl -u USER:PASS for gated FE hosts (tenant.stg / stg)."
echo "    API remains ungated by default — do not put Basic on Authorization for api.stg smokes."
echo "    Docs: docs/reengineering/04-migration/phase-2/STAGING-ACCESS-GATE.md"
echo "    Append evidence to docs/reengineering/04-migration/phase-2/clean-host/IMPLEMENTATION-LOG.md"
