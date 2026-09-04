# Phase 8 — core app scope

Created: **2026-09-04** · Evidence level: **STATIC** (repo scan, no live usage data)
Authority: [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md) · Board: [`README.md`](./README.md)

This document answers one question precisely: **what is "the Impulsionando core app", and how much of it is Phase 8 actually rebuilding?**

It extends Phase 0 rather than repeating it. Route counts, split-brain topology, the 111-endpoint API catalog and the Supabase scale numbers already exist in [`../../01-current-state/phase-0/`](../../01-current-state/phase-0/); what is new here is the **product-role classification** of the authenticated surface and the resulting build budget.

## 1. The four surfaces of the legacy monolith

| Surface | Files | Serves | Phase 8 |
| --- | --- | --- | --- |
| Public marketing / platform pages | ~120 top-level routes (`index`, `planos`, `contratar`, `checkout.*`, `modulos.*`, `nichos.*`, `showroom.*`, `demo.*`, legal, status) | Anonymous visitors, `platform-web` target | **Out** — `platform-web` track |
| Public tenant / white-label sites | ~160 top-level routes (`chrismed.*`, `csi.*`, `wmp.*`, `colors.*`, `garrido.*`, `marocas.*`, `riomed.*`, `clube.*`, `foodservice.*`, `grupo-evr.*`, `templates.$brand.*`, `vitrine.*`) | Tenant end-customers, `tenant-web` target | **Out** — Phase 7 / `tenant-web` track |
| **Authenticated product** | **576** files under `_authenticated/**` | Paying tenants and Impulsionando staff | **In** — this phase |
| Nitro server API | 111 files under `routes/api/**` | Cron, webhooks, outbox, public tokens | Partially in — see §5 |
| Command Center | 12 files (`_command.*`) | Impulsionando staff | **In**, folded into the staff console |

## 2. Classifying the 576 authenticated files

Three product roles, measured by route prefix and screen content:

| Bucket | Files | Meaning | Phase 8 lane |
| --- | --- | --- | --- |
| **Tenant product** | **206** | Generic SaaS any paying tenant can buy | P-lane (8D–8F) |
| **Platform staff only** | **283** | Impulsionando operating its own platform | A-lane (8G), consolidated |
| **One-tenant bespoke** | **87** | Ops screens built for a single tenant | V-lane, **deferred** |

### 2.1 Tenant product — 206 files

| Group | Prefixes (file count) |
| --- | --- |
| Core spine | `dashboard` 1, `inicio` 1, `dashboards` 6, `insights` 3, `bi` 5, `reports` 7, `notifications` 1, `perfil` 1, `settings` 1, `busca`/`buscar` 2, `ajuda` 1 |
| Identity & access | `users` 2, `permissions` 1, `access-profiles` 2, `sectors` 1, `units` 1, `companies` 1, `tenants` 2, `seguranca` 2, `privacy` 2, `audit`/`auditoria` 2, `legal-aceites` 1 |
| Commercial (tenant-side) | `assinatura` 1, `minha-assinatura` 1, `monetizacao` 1, `contrato` 1, `commercial` 1, `repasses` 1, `modules` 1, `meu-projeto` 1, `onboarding` 3, `comecar` 1, `saiba-mais` 3, `impulsionando` 1 |
| CRM & customers | `crm` 7, `customers` 1, `marketing` 2 |
| Agenda | `agenda` 10 |
| Finance | `finance` 10, `erp-financeiro` 1 |
| Sales & inventory | `sales` 6, `inventory` 6 |
| Support & ops | `support` 1, `ops` 4, `operations` 1, `cockpits` 1, `radar` 1, `automacoes` 1 |
| Growth & ecosystem | `affiliates` 19, `marketplace-eco` 1, `comunidade` 2, `area-clube` 2, `white-label` 2, `consumer` 1, `niches` 1, `cp-seguro` 1, `master-observer` 1, `core` 2, `adm` 1, `_authenticated` 1 |
| **Vertical packs** (inside this bucket, but V-lane) | `imobiliaria` 19, `contabilidade` 12, `cervejaria` 6, `restaurante` 5, `bar` 2, `educacao` 3, `ehr` 2, `eventos` 2, `talentos`/`talents` 2, `realestate` 1 |

Subtracting the vertical packs (**54 files**) leaves roughly **152 files of genuinely cross-tenant product** as the P-lane target.

### 2.2 Platform staff only — 283 files

| Prefix | Files |
| --- | --- |
| `admin.*` | 189 |
| `core.*` | 92 |
| `adm.*` | 2 |

Plus the 12 `_command.*` routes, which are a third staff surface with overlapping intent.

### 2.3 One-tenant bespoke — 87 files

| Prefix | Files | Tenant |
| --- | --- | --- |
| `admin.clientes.<tenant>.*` | 40 | RioMed, Colors, others |
| `chrismed.*` | 23 | ChrisMed |
| `wmp.*` | 10 | WMP |
| `marocas.*` | 4 | Marocas |
| `revela.*` | 4 | Revela |
| `torre.*` | 3 | Torre |
| `area-cliente`, `riomed`, `showroom` | 3 | mixed |

These are **deferred**. Each one moves when its tenant moves under Phase 7, using the core spine Phase 8 builds. Rebuilding them before the spine exists would mean rebuilding them twice.

## 3. What Phase 8 actually has to build

| Lane | Legacy files | Target scope | Note |
| --- | --- | --- | --- |
| F — foundation | — | 9 tracks | Nothing product-visible; unblocks everything |
| S — core spine | ~25 (identity/access/settings) | 4 slices | Highest correctness risk in the phase |
| P — tenant product | ~152 | 10 slices | The product tenants pay for |
| A — staff console | 283 + 12 | 6 slices | **Consolidation target, not a port** |
| V — verticals + bespoke | 54 + 87 | deferred | Bound to tenant cutovers |

## 4. The staff console consolidation budget

The 283 staff files are not 283 capabilities. Measured composition of `admin.*`:

| Pattern | Files | Reality |
| --- | --- | --- |
| `admin.*-health.tsx` | **57** | Near-identical KPI dashboards, one per domain (`agenda-health`, `agenda-ops-health`, `agenda-operations-health`, `agenda-resources-health`, `billing-health`, `comms-health`, …). Four of them are for agenda alone. |
| `admin.clientes.$slug.*` | ~16 | The genuine Cliente 360 — one parameterized surface, not 16 |
| `admin.clientes.<tenant>.*` | ~40 | One-tenant bespoke (§2.3), deferred |
| Remaining `admin.*` | ~76 | Real staff capabilities, with duplication |
| `core.*` | 92 | Factory, clients, automation hub, modules, publication, observability, BI |

**Budget rule for 8G:** the staff console targets **≈35–45 screens**, not 295. Concretely:

- the 57 `*-health` pages collapse into **one parameterized platform-health surface** driven by a domain registry plus the Phase 5G ops metrics endpoint (`GET /api/v1/ops/queue-metrics`) and the Phase 2 observability minimum;
- `admin.clientes.$slug.*` and `core.cliente.$id.*` collapse into **one Cliente 360** with tabs;
- `core.automacao.*` (17 files) collapses into **one automation hub** with views;
- `_command.*` (12) is not preserved as a separate surface — its intent (aprovações, atendimento, clientes, financeiro, IA) maps onto the same console.

Any request to port a staff screen 1:1 needs a named operator who uses it. Absent that, it is a candidate for deletion, not migration. This is recorded as a **human decision** at gate G0 in [`GATES.md`](./GATES.md).

## 5. The 111 Nitro API routes

These are **not** the product's read/write API — the UI mostly talks to Supabase directly or through `createServerFn`. The 111 files are predominantly cron hooks, webhooks and public-token endpoints.

| Class | Phase 8 treatment |
| --- | --- |
| Payment/provider webhooks (Mercado Pago, Paddle, Monetizze, Meta) | Route to the Nest webhook ingress proven in Phase 5D; do not re-implement in `app-web` |
| Cron/tick endpoints | Become worker jobs on the Phase 5B queue; the HTTP entry point is retired, not moved |
| Outbox/comms dispatch | Already has a Phase 5C/5E home |
| Status page / public tokens | Belong to `platform-web` / `tenant-web`, not `app-web` |
| Support create-ticket | Already delegates to Nest (`src/routes/api/public/support/create-ticket.ts`) — the pattern to repeat |

Phase 8 owns only the subset that backs migrated authenticated capabilities. The rest is tracked but untouched.

## 6. Where the business logic actually is

| Location | Mass | Consequence for Phase 8 |
| --- | --- | --- |
| `createServerFn` call sites | 1,476 across 331 files | The real backend. Nest extraction is the bulk of the work, not React. |
| `*.functions.ts` modules | 317 files, 57,477 lines | Slice boundaries must be drawn on these modules, not on route files |
| Direct browser → Supabase calls | ~32% of authenticated screens | Every one is an authorization hole to close when its slice moves |
| Postgres RPC | 158 typed / 603 live functions | Some logic is genuinely data-centric and stays; most is not |

Roughly **63%** of authenticated screens call server functions and **32%** call Supabase directly from the browser. The direct-Supabase share is the reason [`DATA-AND-IDENTITY-PLAN.md`](./DATA-AND-IDENTITY-PLAN.md) makes server-side authorization a precondition for every write slice.

## 7. What is deliberately *not* measured here

| Item | State |
| --- | --- |
| Which authenticated screens are used in production, and by whom | **UNKNOWN** — no 30/90-day usage export exists ([`../../01-current-state/INVENTORY.md`](../../01-current-state/INVENTORY.md) open item) |
| Which of the 57 health dashboards anyone opens | **UNKNOWN** |
| Live behaviour of each screen (vs. its static shape) | **UNKNOWN** — product-map journeys are still `STATIC` |
| Whether `user_profiles` exists in the production database | **UNKNOWN** — code comment says legacy, not verified |

These are inputs to gate G0. Migrating a screen nobody opens is the cheapest mistake to avoid and the easiest to make.
