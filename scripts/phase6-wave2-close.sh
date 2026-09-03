#!/usr/bin/env bash
# Phase 6 Wave 2 close orchestrator — staging clean host only.
#
# Parallel-ready steps after GHCR images exist:
#   1) Promote API (+ optional worker)
#   2) Optionally enable AI_CHAT_ENABLED via PHASE6_CHAT=1
#   3) Run phase6:staging:verify (needs PHASE6_AI_BEARER)
#
# Usage:
#   IMAGE_TAG=<full-sha>[-phase6cdef] ./scripts/phase6-wave2-close.sh
#   IMAGE_TAG=<sha> PHASE6_CHAT=1 SKIP_PULL=0 ./scripts/phase6-wave2-close.sh
#
# Does NOT touch legacy VPS. Does NOT print secrets.
# Requires SSH key ~/.ssh/id_ed25519_impulsionando (or SSH_KEY=).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CLEAN_HOST="2.25.123.224"
LEGACY_DENY="187.77.232.52"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519_impulsionando}"
IMAGE_TAG="${IMAGE_TAG:-}"
PHASE6_CHAT="${PHASE6_CHAT:-0}"
SKIP_PULL="${SKIP_PULL:-0}"
DEPLOY_WORKER="${DEPLOY_WORKER:-1}"
RUN_VERIFY="${RUN_VERIFY:-1}"

die() { echo "error: $*" >&2; exit 1; }

[[ -n "${IMAGE_TAG}" ]] || die "IMAGE_TAG required (full git SHA or sha-suffix tag)"
[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY} — cannot promote from this machine"
case "${IMAGE_TAG}" in
  *"${LEGACY_DENY}"*) die "refuses legacy VPS reference" ;;
esac

echo "==> Phase 6 Wave 2 close"
echo "==> Clean host ${CLEAN_HOST} (not ${LEGACY_DENY})"
echo "==> IMAGE_TAG=${IMAGE_TAG} SKIP_PULL=${SKIP_PULL} PHASE6_CHAT=${PHASE6_CHAT}"

echo "==> [P] Deploy API"
IMAGE_TAG="${IMAGE_TAG}" SKIP_PULL="${SKIP_PULL}" \
  PHASE6_CHAT="${PHASE6_CHAT}" \
  "${ROOT}/scripts/deploy-reengineering-api-clean-host.sh"

if [[ "${DEPLOY_WORKER}" == "1" ]]; then
  echo "==> [P] Deploy worker"
  IMAGE_TAG="${IMAGE_TAG}" SKIP_PULL="${SKIP_PULL}" \
    "${ROOT}/scripts/deploy-reengineering-worker-clean-host.sh" || {
      echo "WARN: worker deploy failed — continuing if API-only verify is enough" >&2
    }
fi

if [[ "${PHASE6_CHAT}" == "1" ]]; then
  echo "==> [E] Ensure AI_CHAT_ENABLED on API service (value not printed beyond name)"
  ssh -i "${SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
    "root@${CLEAN_HOST}" \
    "docker service update --env-add AI_CHAT_ENABLED=true --update-order start-first reengineering-api" \
    || die "failed to set AI_CHAT_ENABLED on reengineering-api"
fi

if [[ "${RUN_VERIFY}" == "1" ]]; then
  echo "==> [S] Live verify matrix"
  DRY_RUN=0 npm run phase6:staging:verify
else
  echo "==> RUN_VERIFY=0 — skipped live verify"
fi

echo "==> Wave 2 orchestrator finished. If verify PASS: update STATUS.md Phase 6 CLOSED + clean-host log."
