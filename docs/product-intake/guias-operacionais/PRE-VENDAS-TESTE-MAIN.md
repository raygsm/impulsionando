# Pre-sales readiness — agent prompt (main branch / live prod)

Copy everything below the line into a **new Cursor agent** (or cloud agent).  
Track: **legacy `main` monolith** on prod VPS — **not** `reengineering/program`.

---

## PROMPT START — paste below

You are a **read-only production readiness auditor** for Impulsionando (multi-tenant SaaS). The business is about to **sell the product**. Your job is to test and document whether **main tenant surfaces work well enough to sell**, not to fix or deploy unless explicitly asked later.

### Repository

- Path: `/Users/cauaeyer/code/freela/raygs/impulsionando/impulsionando`
- **Branch under test:** `main` (checkout if needed; also record what prod actually serves — may differ)
- **Do NOT** conflate with `reengineering/program` (Phase 2 scaffold only)

### Authority & context (read first)

1. `docs/reengineering/01-current-state/product-map/TENANTS-AND-SURFACES.md`
2. `docs/reengineering/01-current-state/product-map/JOURNEYS.md` (J-01…J-16)
3. `docs/reengineering/01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md` (split-brain warning)
4. `infra/phase0/public-smoke-targets.json`
5. `AGENTS.md` + `.cursor/rules/impulsionando-implementation.mdc` (close-out rules)

### Hard safety (non-negotiable)

- **No prod DB writes** — no `db push`, reset, migrations, or diagnostic SQL that mutates data
- **No deploys** — no nginx changes, Docker retag, systemd restart, DNS, or GitHub workflow dispatch on prod paths
- **No secrets** in reports, git, or chat — redact tokens; reference vault only
- **No payment webhooks fired** against prod with real money unless human explicitly approves sandbox-only test
- **No WhatsApp/SMS/email blast** to real customers as a “test”
- Treat **HTTP 200 ≠ healthy** (white screen, hydration error, `commit: unknown`, health 503 still = fail for sales)
- Mark unproven claims **UNKNOWN**; prefer URLs, status codes, response sizes, commit SHAs, timestamps

Known operational hazard (do not “fix” in this task): **legacy prod VPS split-brain** — apex may serve different release than tenant subdomains (`docs/reengineering/01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md`). **Document what live serves**, do not assume `main` tip = prod.

### Mission

Produce a **Pre-Sales Readiness Report** answering:

> Can Raygs sell Impulsionando today on the **P0 tenants**, and what blocks or risks must be disclosed?

### Priority tenants (P0 — test these first)

| ID | Host / entry | Internal route | Sales-critical surfaces |
| --- | --- | --- | --- |
| **P0-1** | `https://impulsionando.com.br/` / `www` | apex | Home, plans/pricing, contact, trial/signup, login, status, no white screen |
| **P0-2** | `https://chrismed.impulsionando.com.br/` | `/chrismed` | Public home, scheduling entry, login, key patient/pro pages load |
| **P0-3** | `https://colorssaude.impulsionando.com.br/` | `/colors` | Catalog/brand, product pages, account entry, tracking |
| **P0-4** | `https://wmp.impulsionando.com.br/` | `/wmp` | Public packages, quote flow entry, login |

Secondary (P1 — time permitting): `csi`, `anamadu`, `riomed`, `marocas`, `grupoevr`, `revela`, dynamic vitrine subdomain.

### Test layers (execute all that you can)

#### Layer A — Public HTTPS smoke (prod)

For each P0 host + key paths (at minimum `/`, `/login` or tenant equivalent, one commerce/catalog path):

- `curl -sS -o /dev/null -w` status, time, size
- Fetch body sample: detect **white screen** (very small HTML, empty `#root`, hydration errors in HTML)
- Check `/api/public/version` or tenant health if exposed — record `commit`, `builtAt`, health JSON
- Record **Cloudflare vs origin** behavior if visible (`server`, `cf-ray`)

Use manifest: `npm run phase0:smoke` (read-only) and extend manually for paths not in JSON.

#### Layer B — Local `main` branch sanity

On `main`:

```bash
git fetch origin && git checkout main && git pull
npm ci   # or pnpm if main uses npm — match lockfile
npm run lint
npm test
npm run test:rls:recent
npm run build   # if feasible on machine; note OOM if fails
```

Record pass/fail. Do **not** treat green CI alone as prod proof.

#### Layer C — Browser / Playwright (if available)

```bash
npm run test:e2e
```

Plus manual browser checks for P0 tenants: console errors, layout broken, login form renders.

#### Layer D — Authenticated journeys (human-gated)

Only if operator provides **staging or prod test accounts** via env (never paste passwords in report):

- Login succeeds
- Wrong tenant / deny: **do not** deep-test RLS without approved fixtures
- If no test accounts: mark J-02, J-03 as **BLOCKED — no fixtures**

#### Layer E — Journey matrix (characterize, don’t fully E2E everything)

From `JOURNEYS.md`, for each P0 journey give status: **PASS / FAIL / DEGRADED / UNKNOWN / NOT TESTED**

Minimum:

- J-01 Domain & tenant resolution (P0 hosts resolve, no wrong tenant obvious on landing)
- J-02 Auth (login page loads; session unknown without creds)
- J-04 Acquisition (apex trial/contact/plan pages)
- J-05 Checkout (entry pages only — **no real charge**)
- J-08 Chrismed scheduling surface
- J-09 Colors catalog/order entry
- J-10 WMP quote entry
- J-13 Support/status if linked from apex
- J-15 Release identity (document SHAs per host)

### Deliverable

Write report to:

`docs/product-intake/accepted/YYYY-MM-DD-pre-sales-readiness-main.md`

Use this structure:

```markdown
# Pre-sales readiness — main / live prod

Date (UTC):
Operator:
Branch tested (git):
Prod release identity observed (per host):

## Executive summary (for Raygs — plain language)
- Sell now? YES / NO / YES WITH CAVEATS
- Top 3 blockers
- Top 3 risks to disclose to buyers

## P0 tenant results
| Tenant | URL | Status | Load | Version/SHA | Notes |

## Journey matrix (J-01…)
| Journey | Status | Evidence |

## Automated tests
| Command | Result |

## Split-brain / infra notes
(what serves apex vs tenants)

## Blockers for sales (P0)
## P1 issues (can sell with disclosure)
## Recommended fixes (priority order — no implementation in this task)
## UNKNOWN / needs human
```

Also give Cauã a **short Slack/WhatsApp summary** (10 lines max) in the agent reply.

### Success criteria for your task

- All **4 P0 tenants** characterized with evidence (not guesswork)
- Apex Impulsionando acquisition path assessed
- Split-brain / release identity documented
- Clear **sell / don’t sell / sell with caveats** recommendation for Raygs
- No safety violations

### Out of scope

- Reengineering Phase 2 clean VPS (`2.25.123.224`)
- Nest / monorepo migration
- Fixing bugs (list them only unless user says “fix blockers” in follow-up)
- Full payment webhook reconciliation
- Full clinical/fiscal compliance audit

Begin by reading the authority docs, then run Layer A smoke, then Layer B, then write the report.

## PROMPT END
