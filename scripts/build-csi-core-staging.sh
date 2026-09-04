#!/usr/bin/env bash
# Build CSI-capable Nitro SSR image for clean-host staging rehearsal.
# Forces NODE_ENV=production (do NOT source full .env.staging — its NODE_ENV
# is not production and poisons the JSX runtime → jsxDEV is not a function).
#
# Usage (from repo root):
#   ./scripts/build-csi-core-staging.sh
#   IMAGE_TAG=<sha>-csi7b SKIP_PULL=1 ./scripts/deploy-reengineering-csi-core-clean-host.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GIT_SHA="$(git rev-parse HEAD)"
IMAGE_TAG="${IMAGE_TAG:-${GIT_SHA}-csi7b}"
IMAGE_REF="${IMAGE_REF:-ghcr.io/raygsm/impulsionando-csi-core:${IMAGE_TAG}}"
STAGING_ENV="${STAGING_ENV:-${ROOT}/.env.staging}"

[[ -f "${STAGING_ENV}" ]] || { echo "error: missing ${STAGING_ENV}" >&2; exit 1; }

# Load only Vite public build inputs from staging env file.
while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    ''|\#*) continue ;;
    VITE_*)
      export "$line"
      ;;
  esac
done < "${STAGING_ENV}"

export NODE_ENV=production
export NITRO_PRESET=node-server
export VITE_PUBLIC_SITE_URL="${VITE_PUBLIC_SITE_URL:-https://csi.stg.impulsionando.com.br}"
export VITE_GIT_COMMIT="${VITE_GIT_COMMIT:-${GIT_SHA}}"
export VITE_GIT_BRANCH="${VITE_GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

echo "==> Building Nitro SSR (NODE_ENV=production) for ${VITE_PUBLIC_SITE_URL}"
pnpm run build

echo "==> docker buildx linux/amd64 → ${IMAGE_REF}"
docker buildx build --platform linux/amd64 \
  -f infra/compose/Dockerfile.csi-core \
  --build-arg "GIT_SHA=${GIT_SHA}" \
  -t "${IMAGE_REF}" \
  --load .

echo "==> Done. Next:"
echo "    docker save ${IMAGE_REF} | gzip | ssh root@2.25.123.224 'gunzip | docker load'"
echo "    IMAGE_TAG=${IMAGE_TAG} SKIP_PULL=1 ./scripts/deploy-reengineering-csi-core-clean-host.sh"
