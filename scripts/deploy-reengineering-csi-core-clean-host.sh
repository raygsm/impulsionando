#!/usr/bin/env bash
# Deploy CSI-capable core SSR to clean host Swarm — staging Host only by default.
# Usage:
#   IMAGE_TAG=<full-sha>-csi7b ./scripts/deploy-reengineering-csi-core-clean-host.sh
#   IMAGE_TAG=<sha> SKIP_PULL=1 ./scripts/deploy-reengineering-csi-core-clean-host.sh
#
# Default Traefik Host: csi.stg.impulsionando.com.br (staging Supabase baked at image build).
# Refuse legacy VPS. Never print secrets.

set -euo pipefail

CLEAN_HOST="2.25.123.224"
LEGACY_DENY="187.77.232.52"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519_impulsionando}"
SSH_USER="${SSH_USER:-root}"
SERVICE_NAME="reengineering-csi-core"
NETWORK_NAME="dokploy-network"
IMAGE_REPO="ghcr.io/raygsm/impulsionando-csi-core"
TRAEFIK_HOST="${TRAEFIK_HOST:-csi.stg.impulsionando.com.br}"
CONTAINER_PORT="3000"
SKIP_PULL="${SKIP_PULL:-0}"
STAGING_ACCESS_GATE="${STAGING_ACCESS_GATE:-auto}"
PUBLISH_DEBUG_PORT="${PUBLISH_DEBUG_PORT:-0}"

die() { echo "error: $*" >&2; exit 1; }
[[ -n "${IMAGE_TAG:-}" ]] || die "IMAGE_TAG required (full git SHA or repo:tag)"
[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY}"

case "${IMAGE_TAG}${TRAEFIK_HOST}${CLEAN_HOST}" in
  *"${LEGACY_DENY}"*) die "refuses any reference to legacy VPS ${LEGACY_DENY}" ;;
esac

if [[ "${TRAEFIK_HOST}" == "csi.impulsionando.com.br" ]]; then
  die "refuses prod CSI hostname in this script — use a dedicated prod promote path with prod env"
fi

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
PUBLISH_DEBUG_PORT=$(printf %q "${PUBLISH_DEBUG_PORT}") \
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
    --label "traefik.http.routers.reeng-csi-core.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label "traefik.http.routers.reeng-csi-core.entrypoints=web" \
    --label "traefik.http.routers.reeng-csi-core.service=reeng-csi-core" \
    --label "traefik.http.routers.reeng-csi-core-secure.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label "traefik.http.routers.reeng-csi-core-secure.entrypoints=websecure" \
    --label "traefik.http.routers.reeng-csi-core-secure.tls=true" \
    --label "traefik.http.routers.reeng-csi-core-secure.tls.certresolver=letsencrypt" \
    --label "traefik.http.routers.reeng-csi-core-secure.service=reeng-csi-core" \
    --label "traefik.http.services.reeng-csi-core.loadbalancer.server.port=${CONTAINER_PORT}"
  if [[ "${USE_GATE}" == "1" ]]; then
    echo \
      --label "traefik.http.routers.reeng-csi-core.middlewares=${MW_REF}" \
      --label "traefik.http.routers.reeng-csi-core-secure.middlewares=${MW_REF}"
  fi
}

label_args_update() {
  echo \
    --label-add "traefik.enable=true" \
    --label-add "traefik.swarm.network=${NETWORK_NAME}" \
    --label-add "traefik.http.routers.reeng-csi-core.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label-add "traefik.http.routers.reeng-csi-core.entrypoints=web" \
    --label-add "traefik.http.routers.reeng-csi-core.service=reeng-csi-core" \
    --label-add "traefik.http.routers.reeng-csi-core-secure.rule=Host(\`${TRAEFIK_HOST}\`)" \
    --label-add "traefik.http.routers.reeng-csi-core-secure.entrypoints=websecure" \
    --label-add "traefik.http.routers.reeng-csi-core-secure.tls=true" \
    --label-add "traefik.http.routers.reeng-csi-core-secure.tls.certresolver=letsencrypt" \
    --label-add "traefik.http.routers.reeng-csi-core-secure.service=reeng-csi-core" \
    --label-add "traefik.http.services.reeng-csi-core.loadbalancer.server.port=${CONTAINER_PORT}"
  if [[ "${USE_GATE}" == "1" ]]; then
    echo \
      --label-add "traefik.http.routers.reeng-csi-core.middlewares=${MW_REF}" \
      --label-add "traefik.http.routers.reeng-csi-core-secure.middlewares=${MW_REF}"
  fi
}

PUBLISH_ARGS=()
if [[ "${PUBLISH_DEBUG_PORT}" == "1" ]]; then
  PUBLISH_ARGS+=(--publish-add published=3008,target=3000,protocol=tcp,mode=ingress)
fi

if docker service inspect "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "==> Updating existing service $SERVICE_NAME"
  UPDATE_EXTRA=()
  if [[ "${USE_GATE}" != "1" ]] && [[ "${STAGING_ACCESS_GATE}" == "0" || "${STAGING_ACCESS_GATE}" == "false" || "${STAGING_ACCESS_GATE}" == "no" ]]; then
    labels_json="$(docker service inspect "$SERVICE_NAME" --format '{{json .Spec.Labels}}')"
    if printf '%s' "$labels_json" | grep -q 'traefik.http.routers.reeng-csi-core.middlewares'; then
      UPDATE_EXTRA+=(--label-rm "traefik.http.routers.reeng-csi-core.middlewares")
    fi
    if printf '%s' "$labels_json" | grep -q 'traefik.http.routers.reeng-csi-core-secure.middlewares'; then
      UPDATE_EXTRA+=(--label-rm "traefik.http.routers.reeng-csi-core-secure.middlewares")
    fi
  fi
  # shellcheck disable=SC2046
  docker service update \
    --force \
    --image "$IMAGE_REF" \
    --env-add "COLORS_AUTOMATION_ENABLED=false" \
    --env-add "PULSONITOR_ENABLED=false" \
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
    --env "COLORS_AUTOMATION_ENABLED=false" \
    --env "PULSONITOR_ENABLED=false" \
    "${PUBLISH_ARGS[@]}" \
    $(label_args_create) \
    "$IMAGE_REF"
fi
docker service ps "$SERVICE_NAME" --no-trunc | head -n 10
REMOTE

echo "==> Done. Smoke (Host header, no DNS required):"
echo "    curl -sS -D- -o /tmp/csi-stg.html -H 'Host: ${TRAEFIK_HOST}' http://${CLEAN_HOST}/csi | head"
echo "    curl -sS -H 'Host: ${TRAEFIK_HOST}' http://${CLEAN_HOST}/healthz"
echo "    If staging access gate is on: add -u USER:PASS (from operator vault)"
