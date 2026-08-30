#!/usr/bin/env bash
# Phase 0: disable high-risk / orphan-class mutative workflows.
# Preserves: db-backup-daily, e2e*, tests-gate, security-*, dns-vps-check, smoke/audit checks listed below.
# Run from repo root with gh auth that can admin Actions:
#   bash scripts/audits/phase0-disable-high-risk-workflows.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

FILES=(
  emergency-apex-dns-cutover.yml
  emergency-apex-dns-cutover-pr.yml
  emergency-edge-origin-repair.yml
  reconstruct-legacy-schema.yml
  vps-n8n-repair.yml
  p0-recover-fronts.yml
  grupoevr-pr-publish.yml
  core-backup-restore.yml
  tmp-patch-pega-schema.yml
  tmp-repair-core-n8n-hmac.yml
  tmp-final-branch-cleanup.yml
  vps-oliver-bridge-secret.yml
  wmp-n8n-canonical-cutover.yml
  wmp-n8n-raw-hmac-cutover.yml
  wmp-cloudflare-origin-repair-current.yml
  colors-cloudflare-origin-cutover.yml
  colors-edge-redirect-repair.yml
  n8n-universal-ready-provisioner-v2.yml
  n8n-universal-ready-provisioner-v3.yml
  universal-client-subdomains.yml
  grupoevr-dns-publish.yml
  provision-evolution-homologacao.yml
  chrismed-emergency-restore-shell.yml
  chrismed-ehr-schema-repair.yml
  chrismed-n8n-recover-now-v2.yml
  chrismed-n8n-volume-recovery.yml
  impulsionando-front-final-recovery.yml
  production-front.yml
  wildcard-subdomain-dns.yml
  remove-production-environment-gates.yml
  core-release-retention.yml
  wmp-vps-safe-cleanup.yml
  vps-safe-cleanup.yml
  n8n-universal-ready-provisioner.yml
)

ok=0
skip=0
fail=0
for f in "${FILES[@]}"; do
  if gh workflow disable "$f"; then
    echo "DISABLED $f"
    ok=$((ok + 1))
  else
    echo "SKIP_OR_FAIL $f"
    skip=$((skip + 1))
  fi
done

echo "Done. disabled_ok=$ok skip_or_fail=$skip"
echo "Active remaining:"
gh api repos/raygsm/impulsionando/actions/workflows --paginate \
  -q '[.workflows[] | select(.state=="active")] | length'
