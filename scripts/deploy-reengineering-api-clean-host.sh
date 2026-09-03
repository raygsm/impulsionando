#!/usr/bin/env bash
# Deploy Nest Support API (Phase 3) to clean host Swarm — staging only.
#
# Target: root@2.25.123.224 (Dokploy / Traefik)
# Image:  ghcr.io/raygsm/impulsionando-api:<full-sha>
# Host:   api.stg.impulsionando.com.br → container port 3100
#
# Does NOT touch legacy VPS 187.77.232.52.
# Does NOT print secrets (env file contents, tokens, DB URIs).
#
# Usage:
#   IMAGE_TAG=<40-char-sha> ./scripts/deploy-reengineering-api-clean-host.sh
#   IMAGE_TAG=<sha> ENV_FILE=/path/to/api.env ./scripts/deploy-reengineering-api-clean-host.sh
#
# Optional ENV_FILE: local path (scp'd) or remote path for create --env-file.
# Env updates on an existing service: set vars via Dokploy UI / --env-add (not printed here).
#
# Staging access gate (Traefik basic auth): API stays UNGATED by default.
# Bearer JWT smokes need a free Authorization header; FE hosts are gated via
# apply-staging-access-gate-clean-host.sh (INCLUDE_API=0 default).
# Override: STAGING_ACCESS_GATE=0 (default, never) | 1 (force attach) | auto
#   (attach only if staging-access-gate.yml exists — avoid unless intentional).

set -euo pipefail

CLEAN_HOST="2.25.123.224"
LEGACY_DENY="187.77.232.52"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519_impulsionando}"
SSH_USER="${SSH_USER:-root}"
SERVICE_NAME="reengineering-api"
NETWORK_NAME="dokploy-network"
IMAGE_REPO="ghcr.io/raygsm/impulsionando-api"
TRAEFIK_HOST="api.stg.impulsionando.com.br"
CONTAINER_PORT="3100"
SKIP_PULL="${SKIP_PULL:-0}"
STAGING_ACCESS_GATE="${STAGING_ACCESS_GATE:-0}"
# Phase 6 Wave 2 — when 1, docker service update --env-add AI_CHAT_ENABLED=true (name only).
PHASE6_CHAT="${PHASE6_CHAT:-0}"

die() { echo "error: $*" >&2; exit 1; }

if [[ -z "${IMAGE_TAG:-}" ]]; then
  cat >&2 <<'EOF'
error: IMAGE_TAG is required (full git commit SHA).

  IMAGE_TAG=<full-sha> ./scripts/deploy-reengineering-api-clean-host.sh

Publish first via workflow_dispatch:
  .github/workflows/reengineering-ghcr-api.yml
  → ghcr.io/raygsm/impulsionando-api:<sha>

Or build locally from infra/compose/Dockerfile.api, tag with the full SHA,
push to GHCR — do not use `latest` as release authority.
EOF
  exit 1
fi

if [[ "${IMAGE_TAG}" == *"/"* ]]; then
  IMAGE_REF="${IMAGE_TAG}"
else
  IMAGE_REF="${IMAGE_REPO}:${IMAGE_TAG}"
fi

case "${IMAGE_REF}" in
  *"${LEGACY_DENY}"*) die "refuses any reference to legacy VPS ${LEGACY_DENY}" ;;
esac

[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY}"

SSH=(ssh -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new
  "${SSH_USER}@${CLEAN_HOST}")

echo "==> Target clean host ${CLEAN_HOST} (not ${LEGACY_DENY})"
echo "==> Image ${IMAGE_REF}"
echo "==> Service ${SERVICE_NAME} on ${NETWORK_NAME}"
echo "==> Traefik Host(\`${TRAEFIK_HOST}\`) → :${CONTAINER_PORT}"

REMOTE_ENV=""
CLEANUP_REMOTE_ENV=0
if [[ -n "${ENV_FILE:-}" ]]; then
  if [[ -f "${ENV_FILE}" ]]; then
    REMOTE_ENV="/tmp/reengineering-api.env.$$"
    echo "==> Copying env file to remote (contents not printed)"
    scp -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
      "${ENV_FILE}" "${SSH_USER}@${CLEAN_HOST}:${REMOTE_ENV}"
    "${SSH[@]}" "chmod 600 '${REMOTE_ENV}'"
    CLEANUP_REMOTE_ENV=1
  else
    REMOTE_ENV="${ENV_FILE}"
    echo "==> Using remote env path (contents not printed)"
  fi
fi

# Remote body via SSH stdin; args after -- are $1…$6 on the remote bash.
"${SSH[@]}" "IMAGE_REF=$(printf %q "${IMAGE_REF}") \
SERVICE_NAME=$(printf %q "${SERVICE_NAME}") \
NETWORK_NAME=$(printf %q "${NETWORK_NAME}") \
TRAEFIK_HOST=$(printf %q "${TRAEFIK_HOST}") \
CONTAINER_PORT=$(printf %q "${CONTAINER_PORT}") \
REMOTE_ENV=$(printf %q "${REMOTE_ENV}") \
SKIP_PULL=$(printf %q "${SKIP_PULL}") \
STAGING_ACCESS_GATE=$(printf %q "${STAGING_ACCESS_GATE}") \
PHASE6_CHAT=$(printf %q "${PHASE6_CHAT}") \
bash -s" <<'REMOTE'
set -euo pipefail

docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 \
  || { echo "error: docker network $NETWORK_NAME missing" >&2; exit 1; }

GATE_YML="/etc/dokploy/traefik/dynamic/staging-access-gate.yml"
MW_REF="staging-basic-auth@file"
USE_GATE=0
case "${STAGING_ACCESS_GATE}" in
  1|true|yes) USE_GATE=1 ;;
  0|false|no) USE_GATE=0 ;;
  auto)
    if [[ -f "${GATE_YML}" ]]; then USE_GATE=1; else USE_GATE=0; fi
    ;;
  *) echo "error: STAGING_ACCESS_GATE must be auto|0|1" >&2; exit 1 ;;
esac
if [[ "${USE_GATE}" == "1" ]]; then
  echo "==> Staging access gate ON → middleware ${MW_REF}"
else
  echo "==> Staging access gate OFF (no middleware labels)"
fi

if [[ "${SKIP_PULL}" != "1" ]]; then
  echo "==> Pulling image"
  docker pull "$IMAGE_REF"
else
  echo "==> SKIP_PULL=1 — using local image"
  docker image inspect "$IMAGE_REF" >/dev/null
fi

apply_labels_create() {
  # Used only on service create
  echo \
    --label "traefik.enable=true" \
    --label "traefik.swarm.network=${NETWORK_NAME}" \
    --label "traefik.http.routers.reeng-api.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label "traefik.http.routers.reeng-api.entrypoints=web" \
    --label "traefik.http.routers.reeng-api.service=reeng-api" \
    --label "traefik.http.routers.reeng-api-secure.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label "traefik.http.routers.reeng-api-secure.entrypoints=websecure" \
    --label "traefik.http.routers.reeng-api-secure.tls=true" \
    --label "traefik.http.routers.reeng-api-secure.tls.certresolver=letsencrypt" \
    --label "traefik.http.routers.reeng-api-secure.service=reeng-api" \
    --label "traefik.http.services.reeng-api.loadbalancer.server.port=${CONTAINER_PORT}"
  if [[ "${USE_GATE}" == "1" ]]; then
    echo \
      --label "traefik.http.routers.reeng-api.middlewares=${MW_REF}" \
      --label "traefik.http.routers.reeng-api-secure.middlewares=${MW_REF}"
  fi
}

apply_labels_update() {
  echo \
    --label-add "traefik.enable=true" \
    --label-add "traefik.swarm.network=${NETWORK_NAME}" \
    --label-add "traefik.http.routers.reeng-api.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label-add "traefik.http.routers.reeng-api.entrypoints=web" \
    --label-add "traefik.http.routers.reeng-api.service=reeng-api" \
    --label-add "traefik.http.routers.reeng-api-secure.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label-add "traefik.http.routers.reeng-api-secure.entrypoints=websecure" \
    --label-add "traefik.http.routers.reeng-api-secure.tls=true" \
    --label-add "traefik.http.routers.reeng-api-secure.tls.certresolver=letsencrypt" \
    --label-add "traefik.http.routers.reeng-api-secure.service=reeng-api" \
    --label-add "traefik.http.services.reeng-api.loadbalancer.server.port=${CONTAINER_PORT}"
  if [[ "${USE_GATE}" == "1" ]]; then
    echo \
      --label-add "traefik.http.routers.reeng-api.middlewares=${MW_REF}" \
      --label-add "traefik.http.routers.reeng-api-secure.middlewares=${MW_REF}"
  fi
}

if docker service inspect "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "==> Updating existing service $SERVICE_NAME"
  # shellcheck disable=SC2046
  UPDATE_EXTRA=()
  if [[ "${USE_GATE}" != "1" ]] && [[ "${STAGING_ACCESS_GATE}" == "0" || "${STAGING_ACCESS_GATE}" == "false" || "${STAGING_ACCESS_GATE}" == "no" ]]; then
    labels_json="$(docker service inspect "$SERVICE_NAME" --format '{{json .Spec.Labels}}')"
    if printf '%s' "$labels_json" | grep -q 'traefik.http.routers.reeng-api.middlewares'; then
      UPDATE_EXTRA+=(--label-rm "traefik.http.routers.reeng-api.middlewares")
    fi
    if printf '%s' "$labels_json" | grep -q 'traefik.http.routers.reeng-api-secure.middlewares'; then
      UPDATE_EXTRA+=(--label-rm "traefik.http.routers.reeng-api-secure.middlewares")
    fi
  fi
  docker service update \
    --image "$IMAGE_REF" \
    $(apply_labels_update) \
    "${UPDATE_EXTRA[@]}" \
    --update-order start-first \
    --rollback-order start-first \
    "$SERVICE_NAME"
  if [[ "${PHASE6_CHAT}" == "1" ]]; then
    echo "==> PHASE6_CHAT=1 — env-add AI_CHAT_ENABLED=true (no secret values)"
    docker service update \
      --env-add AI_CHAT_ENABLED=true \
      --update-order start-first \
      "$SERVICE_NAME"
  fi
  if [[ -n "${REMOTE_ENV}" ]]; then
    echo "==> Note: existing service — ENV_FILE not re-applied automatically."
    echo "    Set/refresh secrets via Dokploy UI or docker service update --env-add (do not log values)."
  fi
else
  echo "==> Creating service $SERVICE_NAME"
  ENV_ARGS=()
  if [[ -n "${REMOTE_ENV}" ]]; then
    ENV_ARGS=(--env-file "${REMOTE_ENV}")
  fi
  CREATE_ENV_EXTRA=()
  if [[ "${PHASE6_CHAT}" == "1" ]]; then
    CREATE_ENV_EXTRA+=(--env AI_CHAT_ENABLED=true)
  fi
  # shellcheck disable=SC2046
  docker service create \
    --name "$SERVICE_NAME" \
    --replicas 1 \
    --network "$NETWORK_NAME" \
    $(apply_labels_create) \
    "${ENV_ARGS[@]}" \
    "${CREATE_ENV_EXTRA[@]}" \
    --update-order start-first \
    --rollback-order start-first \
    "$IMAGE_REF"
fi

echo "==> Service ps"
docker service ps "$SERVICE_NAME" --no-trunc | head -n 20

echo "==> Local smoke (Host header; may still be placeholder until labels exclusive)"
curl -fsS -H "Host: ${TRAEFIK_HOST}" "http://127.0.0.1/health" | head -c 400 || true
echo
REMOTE

if [[ "${CLEANUP_REMOTE_ENV}" -eq 1 && -n "${REMOTE_ENV}" ]]; then
  "${SSH[@]}" "rm -f '${REMOTE_ENV}'" || true
fi

echo "==> Done. External check (operator):"
echo "    curl -fsS https://${TRAEFIK_HOST}/health"
echo "    If staging access gate is on: curl -fsS -u USER:PASS https://${TRAEFIK_HOST}/health"
echo "Note: if reengineering-placeholder still owns ${TRAEFIK_HOST}, remove that Host from its Traefik labels before expecting Nest responses."
echo "Append evidence to docs/reengineering/04-migration/phase-2/clean-host/IMPLEMENTATION-LOG.md"
