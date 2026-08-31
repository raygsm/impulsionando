# GHCR and promote path (Phase 2 planning)

Opened: **2026-08-30**  
Status: **PROMOTE PATH LIVE** — PR #100 merged; GHCR publishes; rollback drill PASS; DNS/TLS staging still human  
Authority: [`../../03-platform/CI-CD.md`](../../03-platform/CI-CD.md), [`../../05-governance/adrs/ADR-007-ghcr-immutable-sha-images.md`](../../05-governance/adrs/ADR-007-ghcr-immutable-sha-images.md), [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md)

## Evidence (2026-08-31)

| Item | Status |
| --- | --- |
| Workflow on default branch (`main`) | **yes** — merged PR [#100](https://github.com/raygsm/impulsionando/pull/100) @ `647308e7` |
| `gh workflow run` | **works** — runs [33433542700](https://github.com/raygsm/impulsionando/actions/runs/33433542700), [33433588827](https://github.com/raygsm/impulsionando/actions/runs/33433588827) |
| GHCR images | `ghcr.io/raygsm/impulsionando-reengineering-placeholder:<full-sha>` (public pull OK from clean host) |
| Rollback drill | **PASS** — [`ROLLBACK-DRILL.md`](./ROLLBACK-DRILL.md) |
| Live placeholder | full SHA `647308e7…` on `:8088` + Traefik Host `placeholder.staging.local` |
| Staging DNS / TLS | **still human** |

**Next:** Cloudflare staging hostnames; optional Dokploy UI recreate; ACME email.


## Goal

**Build once. Promote the same image.** Staging and production (when gated) run identical GHCR artifacts identified by the **full Git commit SHA**. Rollback = redeploy the previous known-good SHA.

## Target flow

```text
pull request
  → lint, types, unit, integration, contract, RLS, build
  → optional bounded preview (no production credentials)

merge to main
  → build each deployable image once in CI
  → publish ghcr.io/<org>/<service>:<full-commit-sha>
  → Dokploy (or equivalent) deploys that exact digest/tag to staging
  → health + readiness + migration job (controlled) + smoke/E2E
  → record release identity (SHA, build time, environment)

explicit production approval (human while migrating)
  → promote the SAME image (same SHA / digest) to clean production
  → external smoke: domain, TLS, runtime, full SHA, critical surface
  → retain previous known-good SHA for rollback window
```

No source build on the app VPS. No `git pull` as deploy. No rewriting live release directories over SSH as the happy path.

## Identity rules

| Rule | Detail |
| --- | --- |
| Authority tag | Full commit SHA (`40` hex) — e.g. `GHCR:<full-commit-sha>` per ADR-007 / CI-CD |
| Digest | Prefer pinning deploy to image digest when Dokploy/registry supports it — **UNKNOWN** until POC |
| Aliases | Semver or `staging-current` may exist as **non-authoritative** pointers; never the sole promote key |
| **Forbid `latest` as authority** | `latest` may exist as a registry side-effect; it must not decide what staging or prod runs |
| Local `build-info.ts` | Build noise — not release identity for public smoke |
| Per-service identity | Each deployable publishes SHA, build time, environment, health/readiness |

## What this replaces (multi-publisher mess)

Evidence: [`../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md`](../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md).

| Legacy / residual publisher class | Problem | Replacement posture |
| --- | --- | --- |
| Multiple GitHub Actions deploy/repair/recover/cutover workflows | Concurrent, opaque promotion; orphans still `active` | Single build+publish path; mutable prod publishers stay contained until deleted or `workflow_dispatch`-only by decision |
| SSH rewrite of release directories on VPS | Non-reproducible; no immutable artifact | Dokploy pulls GHCR SHA on clean infra |
| systemd publish worker / Compose ad-hoc | Parallel authority with Nginx upstream choice | Lifecycle via Dokploy; one image per service version |
| Docker `*:latest` on host | Mutable tag; live core `latest` ≠ host Node SHA | Full-SHA tags; smoke asserts SHA |
| Host Node vs Docker split-brain | Apex can serve unknown commit | Promote path only on clean infra; legacy left as rollback until Phase 7 |
| n8n / Cloudflare / emergency DNS workflows as “deploy” | Side-channel mutation | Edge/DNS changes are gated runbooks — not image promote |
| Preview or agent branches publishing to prod | Contaminates release identity | Branch of evidence never publishes; prod promote needs human gate |

Until cutover, legacy publishers may still exist on the old VPS. Phase 2 success is a **parallel** trustworthy path — not silently re-enabling every old workflow.

## Staging → production promote contract

1. Image built once from the merge commit on `main` (or the protected release ref agreed later — default `main`).
2. Staging deploy reference = that SHA (and digest if available).
3. Staging gates green: CI already green; health/readiness; migration job if any; smoke/E2E; rollback compatibility noted.
4. Production promote references **the same SHA** — no rebuild, no “prod Dockerfile tweak,” no cherry-pick image.
5. After promote: external verification of SHA on every critical hostname in scope.
6. Previous SHA retained and documented for the rollback window.

Database: migrations run as a **controlled job**, not on every replica startup; expand/contract so app rollback does not require reversing destructive DDL ([`CI-CD.md`](../../03-platform/CI-CD.md)).

## Explicit prohibitions

- `latest` (or any floating tag) as the source of truth for what is running
- Building application images on the production or legacy VPS
- Deploy by SSH that rewrites active release trees as the primary path
- Multiple workflows promoting the same service without a recorded single owner
- Silent fallback to an unidentified old release directory
- Selecting a different commit per tenant hostname
- Treating HTTP 200 alone as release proof

## Phase 2 planning vs implementation

| Planning (authorized 2026-08-30) | Implementation (needs separate gate) |
| --- | --- |
| This doc + CI workflow sketches | Enable GHCR push from `main` |
| Inventory which services get images first (minimal set) | Wire Dokploy pull credentials (secrets outside Git) |
| Define smoke checks that assert SHA | Auto-deploy staging; human prod promote |
| Map retirement of competing publishers | Disable/delete residual mutators after path proven |

Minimal first images (names **proposed**, timing Phase-gated): placeholder or thin `platform-web` / existing surface packaging as decided in implementation — Nest `api` remains Phase 3. See exploratory [`../exploratory/IMAGE-AND-RUNTIME-LAYOUT.md`](../exploratory/IMAGE-AND-RUNTIME-LAYOUT.md) (paper only).

## Rollback

- Redeploy previous immutable GHCR SHA to the environment.
- Do not depend on `git revert` on the server or on reversing a destructive migration.
- Record before/after SHA, operator, timestamp in execution evidence when drills run (P2-F).

## Open UNKNOWN items

- Exact GHCR package names / org visibility
- Retention policy and storage cost
- Whether Dokploy promotes by tag, digest, or both
- First service to onboard to the path
- GitHub Environment protection (reviewers) — currently weak on prod; must not be assumed fixed
