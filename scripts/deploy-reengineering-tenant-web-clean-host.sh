#!/usr/bin/env bash
# Deploy tenant-web (Phase 4B) to clean host Swarm — staging only.
# Usage:
#   IMAGE_TAG=<full-sha> ./scripts/deploy-reengineering-tenant-web-clean-host.sh
#   IMAGE_TAG=<sha> SKIP_PULL=1 ./scripts/deploy-reengineering-tenant-web-clean-host.sh
#
# Staging access gate: when staging-access-gate.yml exists on the host (or
# STAGING_ACCESS_GATE=1), attaches Traefik middleware staging-basic-auth@file.
# Apply/rotate: ./scripts/apply-staging-access-gate-clean-host.sh

set -euo pipefail

CLEAN_HOST="2.25.123.224"
LEGACY_DENY="187.77.232.52"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519_impulsionando}"
SSH_USER="${SSH_USER:-root}"
SERVICE_NAME="reengineering-tenant-web"
NETWORK_NAME="dokploy-network"
IMAGE_REPO="ghcr.io/raygsm/impulsionando-tenant-web"
TRAEFIK_HOST="tenant.stg.impulsionando.com.br"
CONTAINER_PORT="3300"
SKIP_PULL="${SKIP_PULL:-0}"
STAGING_ACCESS_GATE="${STAGING_ACCESS_GATE:-auto}"

die() { echo "error: $*" >&2; exit 1; }
[[ -n "${IMAGE_TAG:-}" ]] || die "IMAGE_TAG required (full git SHA)"
[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY}"

case "${IMAGE_TAG}" in
  *"${LEGACY_DENY}"*) die "refuses any reference to legacy VPS ${LEGACY_DENY}" ;;
esac

if [[ "${IMAGE_TAG}" == *"/"* ]]; then
  IMAGE_REF="${IMAGE_TAG}"
else
  IMAGE_REF="${IMAGE_REPO}:${IMAGE_TAG}"
fi

SSH=(ssh -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new
  "${SSH_USER}@${CLEAN_HOST}")

echo "==> Target clean host ${CLEAN_HOST} (not ${LEGACY_DENY})"
echo "==> Deploy ${SERVICE_NAME} → ${TRAEFIK_HOST}:${CONTAINER_PORT}"
echo "==> Image ${IMAGE_REF} SKIP_PULL=${SKIP_PULL} STAGING_ACCESS_GATE=${STAGING_ACCESS_GATE}"

"${SSH[@]}" "IMAGE_REF=$(printf %q "${IMAGE_REF}") \
SERVICE_NAME=$(printf %q "${SERVICE_NAME}") \
NETWORK_NAME=$(printf %q "${NETWORK_NAME}") \
TRAEFIK_HOST=$(printf %q "${TRAEFIK_HOST}") \
CONTAINER_PORT=$(printf %q "${CONTAINER_PORT}") \
SKIP_PULL=$(printf %q "${SKIP_PULL}") \
STAGING_ACCESS_GATE=$(printf %q "${STAGING_ACCESS_GATE}") \
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

label_args_create() {
  echo \
    --label "traefik.enable=true" \
    --label "traefik.swarm.network=${NETWORK_NAME}" \
    --label "traefik.http.routers.reeng-tenant-web.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label "traefik.http.routers.reeng-tenant-web.entrypoints=web" \
    --label "traefik.http.routers.reeng-tenant-web.service=reeng-tenant-web" \
    --label "traefik.http.routers.reeng-tenant-web-secure.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label "traefik.http.routers.reeng-tenant-web-secure.entrypoints=websecure" \
    --label "traefik.http.routers.reeng-tenant-web-secure.tls=true" \
    --label "traefik.http.routers.reeng-tenant-web-secure.tls.certresolver=letsencrypt" \
    --label "traefik.http.routers.reeng-tenant-web-secure.service=reeng-tenant-web" \
    --label "traefik.http.services.reeng-tenant-web.loadbalancer.server.port=${CONTAINER_PORT}"
  if [[ "${USE_GATE}" == "1" ]]; then
    echo \
      --label "traefik.http.routers.reeng-tenant-web.middlewares=${MW_REF}" \
      --label "traefik.http.routers.reeng-tenant-web-secure.middlewares=${MW_REF}"
  fi
}

label_args_update() {
  echo \
    --label-add "traefik.enable=true" \
    --label-add "traefik.swarm.network=${NETWORK_NAME}" \
    --label-add "traefik.http.routers.reeng-tenant-web.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label-add "traefik.http.routers.reeng-tenant-web.entrypoints=web" \
    --label-add "traefik.http.routers.reeng-tenant-web.service=reeng-tenant-web" \
    --label-add "traefik.http.routers.reeng-tenant-web-secure.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label-add "traefik.http.routers.reeng-tenant-web-secure.entrypoints=websecure" \
    --label-add "traefik.http.routers.reeng-tenant-web-secure.tls=true" \
    --label-add "traefik.http.routers.reeng-tenant-web-secure.tls.certresolver=letsencrypt" \
    --label-add "traefik.http.routers.reeng-tenant-web-secure.service=reeng-tenant-web" \
    --label-add "traefik.http.services.reeng-tenant-web.loadbalancer.server.port=${CONTAINER_PORT}"
  if [[ "${USE_GATE}" == "1" ]]; then
    echo \
      --label-add "traefik.http.routers.reeng-tenant-web.middlewares=${MW_REF}" \
      --label-add "traefik.http.routers.reeng-tenant-web-secure.middlewares=${MW_REF}"
  fi
}

if docker service inspect "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "==> Updating existing service $SERVICE_NAME"
  # shellcheck disable=SC2046
  UPDATE_EXTRA=()
  if [[ "${USE_GATE}" != "1" ]] && [[ "${STAGING_ACCESS_GATE}" == "0" || "${STAGING_ACCESS_GATE}" == "false" || "${STAGING_ACCESS_GATE}" == "no" ]]; then
    labels_json="$(docker service inspect "$SERVICE_NAME" --format '{{json .Spec.Labels}}')"
    if printf '%s' "$labels_json" | grep -q 'traefik.http.routers.reeng-tenant-web.middlewares'; then
      UPDATE_EXTRA+=(--label-rm "traefik.http.routers.reeng-tenant-web.middlewares")
    fi
    if printf '%s' "$labels_json" | grep -q 'traefik.http.routers.reeng-tenant-web-secure.middlewares'; then
      UPDATE_EXTRA+=(--label-rm "traefik.http.routers.reeng-tenant-web-secure.middlewares")
    fi
  fi
  docker service update \
    --image "$IMAGE_REF" \
    $(label_args_update) \
    "${UPDATE_EXTRA[@]}" \
    "$SERVICE_NAME"
else
  echo "==> Creating service $SERVICE_NAME"
  # shellcheck disable=SC2046
  docker service create \
    --name "$SERVICE_NAME" \
    --replicas 1 \
    --network "$NETWORK_NAME" \
    $(label_args_create) \
    "$IMAGE_REF"
fi
docker service ps "$SERVICE_NAME" --no-trunc | head -n 10
REMOTE

echo "==> Done. curl -fsS https://${TRAEFIK_HOST}/health"
echo "    If staging access gate is on: curl -fsS -u USER:PASS https://${TRAEFIK_HOST}/health"
