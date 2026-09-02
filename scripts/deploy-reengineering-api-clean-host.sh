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
bash -s" <<'REMOTE'
set -euo pipefail

docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 \
  || { echo "error: docker network $NETWORK_NAME missing" >&2; exit 1; }

echo "==> Pulling image"
docker pull "$IMAGE_REF"

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
}

if docker service inspect "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "==> Updating existing service $SERVICE_NAME"
  # shellcheck disable=SC2046
  docker service update \
    --image "$IMAGE_REF" \
    $(apply_labels_update) \
    --update-order start-first \
    --rollback-order start-first \
    "$SERVICE_NAME"
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
  # shellcheck disable=SC2046
  docker service create \
    --name "$SERVICE_NAME" \
    --replicas 1 \
    --network "$NETWORK_NAME" \
    $(apply_labels_create) \
    "${ENV_ARGS[@]}" \
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
echo "Note: if reengineering-placeholder still owns ${TRAEFIK_HOST}, remove that Host from its Traefik labels before expecting Nest responses."
echo "Append evidence to docs/reengineering/04-migration/phase-2/clean-host/IMPLEMENTATION-LOG.md"
