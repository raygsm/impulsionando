# Phase 7 — legacy dependency inventory

Created: **2026-09-04** · Evidence base: Phase 0 [`DOMAINS-AND-RUNTIMES.md`](../../01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md) (2026-08-30)  
Status: **Wave 0 stub — refresh before 7B**  
No secrets.

## Goal

Know what still publishes or routes on legacy (`187.77.232.52` / `srv1777313`) so moving **one** hostname does not strand webhooks, n8n, or workers.

## Hosts (public) — declared / observed

| Host / surface | Legacy path (Phase 0) | Risk if moved alone | Notes |
| --- | --- | --- | --- |
| `impulsionando.com.br` / `app.` | Docker front `:3490` | High — apex | **Not** a first pilot |
| Shared tenants (`wmp`, `colorssaude`, `csi`, `anamadu`, …) | Nginx → `:3000` core | High — shared process | Prefer single low-risk slug later |
| `chrismed.impulsionando.com.br` | core `:3000` | **Exclude** — clinical | Not 7B |
| `riomed.impulsionando.com.br` | (declared) | **Exclude** — clinical | Not 7B |
| `revela.impulsionando.com.br` | Docker `:3017` | Medium — separate container | Candidate only if low-risk confirmed |
| `marocas.impulsionando.com.br` | static + core | Medium | Product vertical later |
| `n8n.impulsionando.com.br` | CNAME → legacy | High — automations | Do not cut without workflow map |
| `*.stg` / `api.stg` / `tenant.stg` | Clean `2.25.123.224` | N/A | Rehearsal only |

Refresh DNS with `dig` before any flip — Phase 0 snapshot may be stale.

## Runtimes / publishers (legacy)

| Component | Role | Freeze relevance (7E) |
| --- | --- | --- |
| `impulsionando-core.service` | Main tenant SSR/API on `:3000` | Writes for moved host must stop on legacy after cutover |
| Docker `impulsionando-final3-test` / front | Apex | Out of 7B scope |
| Pulsonitor / Colors workers | Side effects | Confirm no jobs for pilot tenant after flip |
| n8n (Hostinger CNAME → legacy) | Workflows | Inventory workflows that call pilot hostname |
| Contained GH workflows / cron | Signal / finalize | Phase 0 WORKFLOW-CATALOG — do not re-enable blindly |
| Webhook receivers on legacy | External POSTs | Repoint or dual-run before freeze |

## Target stack (clean — already staging)

| Component | Host | Notes |
| --- | --- | --- |
| Nest API | `api.stg` → Swarm `reengineering-api` | Prod API hostname TBD at 7B/7D |
| Worker | internal Swarm `reengineering-worker` | Outbox/comm/journey/AI sink |
| tenant-web stub | `tenant.stg` | Not full CRM UI |
| Traefik / Dokploy | `2.25.123.224` | Staging edge |

## Staging rehearsal mapping

| Staging surface | Purpose |
| --- | --- |
| `https://api.stg.impulsionando.com.br` | Nest health + API smokes |
| `https://tenant.stg.impulsionando.com.br` | Stub health |
| Operator secrets | Bearer / tenant ids for allow+deny |

## Open UNKNOWN (fill before 7B)

- [ ] Current Cloudflare rule list for candidate hostname  
- [ ] Exact prod edge path: Cloudflare → legacy vs future → clean Traefik  
- [ ] Webhook URLs still pointing at legacy for candidate tenant  
- [ ] n8n workflows referencing candidate hostname  
- [ ] Whether pilot uses custom domain (e.g. `agenda.chrismed.com.br` — exclude clinical)

## Explicit non-goals

- Full re-SSH of legacy in Wave 0  
- Mutating legacy as inventory “fix”  
