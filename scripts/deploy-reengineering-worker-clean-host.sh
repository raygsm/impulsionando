#!/usr/bin/env bash
# Deploy worker (Phase 5A/5B) to clean host Swarm — staging only, internal (no Traefik).
# Usage:
#   IMAGE_TAG=<full-sha> ./scripts/deploy-reengineering-worker-clean-host.sh
#   IMAGE_TAG=<sha> ENV_FILE=.env.staging SKIP_PULL=1 ./scripts/deploy-reengineering-worker-clean-host.sh
#
# Does not print env file contents.

set -euo pipefail

CLEAN_HOST="2.25.123.224"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519_impulsionando}"
SSH_USER="${SSH_USER:-root}"
SERVICE_NAME="reengineering-worker"
NETWORK_NAME="dokploy-network"
IMAGE_REPO="ghcr.io/raygsm/impulsionando-worker"
CONTAINER_PORT="3200"
SKIP_PULL="${SKIP_PULL:-0}"

die() { echo "error: $*" >&2; exit 1; }
[[ -n "${IMAGE_TAG:-}" ]] || die "IMAGE_TAG required (full git SHA)"
[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY}"

IMAGE_REF="${IMAGE_TAG}"
[[ "${IMAGE_TAG}" == *"/"* ]] || IMAGE_REF="${IMAGE_REPO}:${IMAGE_TAG}"

SSH=(ssh -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new
  "${SSH_USER}@${CLEAN_HOST}")

echo "==> Deploy ${SERVICE_NAME} internal :${CONTAINER_PORT} image ${IMAGE_REF}"

REMOTE_ENV=""
CLEANUP_REMOTE_ENV=0
if [[ -n "${ENV_FILE:-}" ]]; then
  if [[ -f "${ENV_FILE}" ]]; then
    REMOTE_ENV="/tmp/reengineering-worker.env.$$"
    echo "==> Copying env file to remote (contents not printed)"
    scp -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
      "${ENV_FILE}" "${SSH_USER}@${CLEAN_HOST}:${REMOTE_ENV}"
    "${SSH[@]}" "chmod 600 '${REMOTE_ENV}' && printf '\nWORKER_CONSUMER_ENABLED=true\nWORKER_PORT=${CONTAINER_PORT}\n' >> '${REMOTE_ENV}'"
    CLEANUP_REMOTE_ENV=1
  else
    die "ENV_FILE not found: ${ENV_FILE}"
  fi
fi

"${SSH[@]}" "IMAGE_REF=$(printf %q "${IMAGE_REF}") \
SERVICE_NAME=$(printf %q "${SERVICE_NAME}") \
NETWORK_NAME=$(printf %q "${NETWORK_NAME}") \
REMOTE_ENV=$(printf %q "${REMOTE_ENV}") \
SKIP_PULL=$(printf %q "${SKIP_PULL}") \
bash -s" <<'REMOTE'
set -euo pipefail

docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 \
  || { echo "error: docker network $NETWORK_NAME missing" >&2; exit 1; }

if [[ "${SKIP_PULL}" != "1" ]]; then
  echo "==> Pulling image"
  docker pull "$IMAGE_REF"
else
  echo "==> SKIP_PULL=1 — using local image"
  docker image inspect "$IMAGE_REF" >/dev/null
fi

if docker service inspect "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "==> Updating existing service $SERVICE_NAME"
  docker service update \
    --image "$IMAGE_REF" \
    --env-add WORKER_CONSUMER_ENABLED=true \
    --update-order start-first \
    --rollback-order start-first \
    "$SERVICE_NAME"
  if [[ -n "${REMOTE_ENV}" ]]; then
    echo "==> Note: existing service — ENV_FILE not re-applied automatically."
  fi
else
  echo "==> Creating service $SERVICE_NAME (no public hostname)"
  ENV_ARGS=()
  if [[ -n "${REMOTE_ENV}" ]]; then
    ENV_ARGS=(--env-file "${REMOTE_ENV}")
  fi
  docker service create \
    --name "$SERVICE_NAME" \
    --replicas 1 \
    --network "$NETWORK_NAME" \
    --env WORKER_CONSUMER_ENABLED=true \
    "${ENV_ARGS[@]}" \
    --update-order start-first \
    --rollback-order start-first \
    "$IMAGE_REF"
fi

echo "==> Service ps"
docker service ps "$SERVICE_NAME" --no-trunc | head -n 20
REMOTE

if [[ "${CLEANUP_REMOTE_ENV}" -eq 1 && -n "${REMOTE_ENV}" ]]; then
  "${SSH[@]}" "rm -f '${REMOTE_ENV}'" || true
fi

echo "==> Done. Internal smoke: docker run --rm --network dokploy-network curlimages/curl:8.5.0 -fsS http://${SERVICE_NAME}:3200/health"
