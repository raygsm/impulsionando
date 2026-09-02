#!/usr/bin/env bash
# Deploy tenant-web (Phase 4B) to clean host Swarm — staging only.
# Usage: IMAGE_TAG=<full-sha> ./scripts/deploy-reengineering-tenant-web-clean-host.sh

set -euo pipefail

CLEAN_HOST="2.25.123.224"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519_impulsionando}"
SSH_USER="${SSH_USER:-root}"
SERVICE_NAME="reengineering-tenant-web"
NETWORK_NAME="dokploy-network"
IMAGE_REPO="ghcr.io/raygsm/impulsionando-tenant-web"
TRAEFIK_HOST="tenant.stg.impulsionando.com.br"
CONTAINER_PORT="3300"

die() { echo "error: $*" >&2; exit 1; }
[[ -n "${IMAGE_TAG:-}" ]] || die "IMAGE_TAG required (full git SHA)"
[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY}"

IMAGE_REF="${IMAGE_TAG#*/}"
[[ "${IMAGE_TAG}" == *"/"* ]] && IMAGE_REF="${IMAGE_TAG}" || IMAGE_REF="${IMAGE_REPO}:${IMAGE_TAG}"

SSH=(ssh -i "${SSH_KEY}" -o BatchMode=yes "${SSH_USER}@${CLEAN_HOST}")

echo "==> Deploy ${SERVICE_NAME} → ${TRAEFIK_HOST}:${CONTAINER_PORT}"

"${SSH[@]}" "IMAGE_REF='${IMAGE_REF}' SERVICE_NAME='${SERVICE_NAME}' NETWORK_NAME='${NETWORK_NAME}' TRAEFIK_HOST='${TRAEFIK_HOST}' CONTAINER_PORT='${CONTAINER_PORT}' bash -s" <<'REMOTE'
set -euo pipefail
docker pull "$IMAGE_REF"
if docker service inspect "$SERVICE_NAME" >/dev/null 2>&1; then
  docker service update --image "$IMAGE_REF" "$SERVICE_NAME"
else
  docker service create \
    --name "$SERVICE_NAME" \
    --replicas 1 \
    --network "$NETWORK_NAME" \
    --label "traefik.enable=true" \
    --label "traefik.http.routers.reeng-tenant-web.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label "traefik.http.routers.reeng-tenant-web.entrypoints=websecure" \
    --label "traefik.http.routers.reeng-tenant-web.tls=true" \
    --label "traefik.http.routers.reeng-tenant-web.tls.certresolver=letsencrypt" \
    --label "traefik.http.services.reeng-tenant-web.loadbalancer.server.port=${CONTAINER_PORT}" \
    "$IMAGE_REF"
fi
docker service ps "$SERVICE_NAME" --no-trunc | head -n 10
REMOTE

echo "==> Done. curl -fsS https://${TRAEFIK_HOST}/health"
