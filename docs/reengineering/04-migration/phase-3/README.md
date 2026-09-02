# Phase 3 — Nest Support API (pilot)

Opened: **2026-08-31**  
Status: **IN PROGRESS** — pilot **LIVE** on `api.stg`; residuals block close (GHCR SHA promote, staff list/update smoke)  
Exit report: [`PHASE-3-EXIT-REPORT.md`](./PHASE-3-EXIT-REPORT.md)

Program SoT: [`../../STATUS.md`](../../STATUS.md)  
Schema adapter: [`SUPPORT-SCHEMA-ADAPTER.md`](./SUPPORT-SCHEMA-ADAPTER.md)  
Clean host log: [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md)

## Goal

Ship a NestJS + Fastify **Support pilot** that consumes **staging** Supabase (`aamorcqznimmleafavai`) via service role, with AuthZ in Nest — not a full monorepo move, not prod cutover.

## Progress

| Item | State |
| --- | --- |
| `apps/api` Nest bootstrap + Support module | **Done** ✅ |
| Contracts create / list / update-status | **Done** ✅ (`@impulsionando/contracts`) |
| Staging CRM schema adapter (contract ↔ DB) | **Done** ✅ — see adapter doc |
| Swarm service `reengineering-api` on clean host | **Done** ✅ (`2.25.123.224` · 1/1) |
| Traefik Host `api.stg.impulsionando.com.br` → Nest `:3100` | **Done** ✅ |
| TanStack strangler (`abrir-ticket` → `create-ticket` → Nest when `PHASE3_API_BASE`) | **Done** ✅ |
| Public create smoke on `api.stg` | **Done** ✅ POST **201** |
| GHCR image `ghcr.io/raygsm/impulsionando-api:<full-sha>` | Workflow ready; **publish pending** ⏳ |
| Staff list + update-status smoke (JWT) | **Pending** ⏳ |

## Schema drift (important)

Staging `support_tickets` is the **CRM foundation** schema — **not** the legacy prod form / contracts vocabulary.

| Surface | Vocabulary |
| --- | --- |
| Contracts / API response shape | `protocol`, `type`, `priority=medium`, `status=new`, requester email fields |
| Staging DB (CRM) | `ticket_code`, `category`, `priority=normal`, `status=open`, `company_id` required, `source_channel`, `requester_user_id`, `metadata` |

Do **not** invent prod-form columns (`protocol`, `type`, `origin`, `requester_email`, `status=new`, `priority=medium`) on staging. Map at the service adapter layer — details in [`SUPPORT-SCHEMA-ADAPTER.md`](./SUPPORT-SCHEMA-ADAPTER.md).

## Endpoints (v1)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | none | Traefik / smoke |
| `GET` | `/health/ready` | none | readiness |
| `POST` | `/api/v1/support/tickets` | optional Bearer | create |
| `GET` | `/api/v1/support/tickets` | Bearer | list (staff = all; else scoped) |
| `PATCH` | `/api/v1/support/tickets/:id/status` | Bearer staff | update-status |

Local port: **3100**. App package: `@impulsionando/api`. Dockerfile: `infra/compose/Dockerfile.api`.

## Image + deploy target

| Field | Value |
| --- | --- |
| Image | `ghcr.io/raygsm/impulsionando-api:<full-git-sha>` |
| Workflow | `.github/workflows/reengineering-ghcr-api.yml` (`workflow_dispatch` only) |
| Deploy host | Clean VPS **`2.25.123.224`** (`srv1942777`) — Dokploy + Traefik |
| Swarm service | `reengineering-api` on `dokploy-network` |
| Public Host | `api.stg.impulsionando.com.br` (web + websecure → container port **3100**) |
| Deploy script | [`../../../../scripts/deploy-reengineering-api-clean-host.sh`](../../../../scripts/deploy-reengineering-api-clean-host.sh) |
| **Forbidden** | Legacy VPS `187.77.232.52` · prod DNS · prod Supabase keys |

`api.stg` is owned by **`reengineering-api`** (Nest). Phase 2 placeholder keeps `stg.impulsionando.com.br` only — `api.stg` removed from placeholder Traefik rules (see clean-host log 2026-08-31T21:12Z).

## Authorization boundary

| Allowed | Forbidden |
| --- | --- |
| Nest Support pilot against staging | Mechanical move of all TanStack routes |
| GHCR SHA promote + clean-host Swarm | Dokploy / mutate legacy VPS |
| Schema adapter (contracts ↔ CRM columns) | `db push` / reset prod; invent prod-form columns on staging |
| Staging Traefik Host for API | Prod DNS / apex cutover |

## Residual / blockers

| Item | Detail |
| --- | --- |
| `support_ticket_seq` 42501 | Staging: `permission denied for sequence support_ticket_seq` when insert relies on DEFAULT `ticket_code` |
| Nest workaround | Explicit `ticket_code` on insert (`IMP-P3-YYYYMMDD-<8hex>`) until GRANT applied — see [`SUPPORT-SCHEMA-ADAPTER.md`](./SUPPORT-SCHEMA-ADAPTER.md) |
| Proper fix (operator, staging only) | `GRANT USAGE, SELECT ON SEQUENCE public.support_ticket_seq TO service_role;` (and postgres/authenticator as needed). **Do not** invent prod grants |
| GHCR SHA promote | Image today is local tag `reengineering-api:phase3-local` — workflow publish + Swarm pull pending |
| Staff list / update-status smoke | Create **201** ✅; list blocked — `.env.staging` token is not a JWT; set `TEST_USER_PASSWORD` or fresh `access_token` |

## Evidence checklist (Phase 3 deploy — LIVE 2026-09-01)

| # | Check | State |
| --- | --- | --- |
| 1 | Image tagged with **full** commit SHA on GHCR (not `latest`) | ⏳ local tag only |
| 2 | Swarm `reengineering-api` 1/1 on `2.25.123.224` | ✅ |
| 3 | `GET https://api.stg.impulsionando.com.br/health` → Nest (not placeholder) | ✅ `gitSha=phase3-tcode-1830` |
| 4 | Create against staging CRM schema (adapter mapping) | ✅ POST **201** · explicit `ticket_code` |
| 5 | List + update-status (staff) on `api.stg` | ⏳ |
| 6 | TanStack strangler wired (`PHASE3_API_BASE` → Nest) | ✅ |
| 7 | Entry in [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md) | ✅ |

Close gate: items **1** and **5** → update [`PHASE-3-EXIT-REPORT.md`](./PHASE-3-EXIT-REPORT.md) to **CLOSED**.
