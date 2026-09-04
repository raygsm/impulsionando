#!/usr/bin/env bash
# Build CSI-capable Nitro SSR image with PROD Vite public inputs (.env.local by default).
# Does NOT flip DNS. Pair with deploy ALLOW_PROD_CSI_HOST=1 for Host-header smoke only.
#
# Usage (from repo root):
#   ./scripts/build-csi-core-prod.sh
#   IMAGE_TAG=<sha>-csi7bprod SKIP_PULL=1 ALLOW_PROD_CSI_HOST=1 \
#     SERVICE_NAME=reengineering-csi-core-prod \
#     TRAEFIK_HOST=csi.impulsionando.com.br \
#     STAGING_ACCESS_GATE=0 \
#     ./scripts/deploy-reengineering-csi-core-clean-host.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GIT_SHA="$(git rev-parse HEAD)"
IMAGE_TAG="${IMAGE_TAG:-${GIT_SHA}-csi7bprod}"
IMAGE_REF="${IMAGE_REF:-ghcr.io/raygsm/impulsionando-csi-core:${IMAGE_TAG}}"
PROD_ENV="${PROD_ENV:-${ROOT}/.env.local}"

[[ -f "${PROD_ENV}" ]] || { echo "error: missing ${PROD_ENV}" >&2; exit 1; }

# Load only Vite public build inputs — never echo values.
while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    ''|\#*) continue ;;
    VITE_*)
      export "$line"
      ;;
  esac
done < "${PROD_ENV}"

# Refuse accidental staging Supabase bake into a "prod" image.
case "${VITE_SUPABASE_URL:-}" in
  *aamorcqznimmleafavai*)
    echo "error: ${PROD_ENV} VITE_SUPABASE_URL looks like staging — refuse prod CSI bake" >&2
    exit 1
    ;;
  *arygtqrdpcdkwnuwsgmm*) ;;
  *)
    echo "error: ${PROD_ENV} VITE_SUPABASE_URL missing or not prod ref arygtqrd…" >&2
    exit 1
    ;;
esac

export NODE_ENV=production
export NITRO_PRESET=node-server
export VITE_PUBLIC_SITE_URL="${VITE_PUBLIC_SITE_URL:-https://csi.impulsionando.com.br}"
export VITE_GIT_COMMIT="${VITE_GIT_COMMIT:-${GIT_SHA}}"
export VITE_GIT_BRANCH="${VITE_GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

echo "==> Building Nitro SSR (NODE_ENV=production) for CSI prod-shaped image"
echo "==> SITE_URL set (value not printed) · IMAGE_REF=${IMAGE_REF}"
pnpm run build

echo "==> docker buildx linux/amd64 → ${IMAGE_REF}"
docker buildx build --platform linux/amd64 \
  -f infra/compose/Dockerfile.csi-core \
  --build-arg "GIT_SHA=${GIT_SHA}" \
  -t "${IMAGE_REF}" \
  --load .

echo "==> Done. Next (Host-header only — no Cloudflare flip):"
echo "    docker save ${IMAGE_REF} | gzip | ssh -i ~/.ssh/id_ed25519_impulsionando root@2.25.123.224 'gunzip | docker load'"
echo "    IMAGE_TAG=${IMAGE_TAG} SKIP_PULL=1 ALLOW_PROD_CSI_HOST=1 \\"
echo "      SERVICE_NAME=reengineering-csi-core-prod TRAEFIK_HOST=csi.impulsionando.com.br \\"
echo "      STAGING_ACCESS_GATE=0 \\"
echo "      ./scripts/deploy-reengineering-csi-core-clean-host.sh"
