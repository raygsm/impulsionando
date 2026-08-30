# Raygs / Cauã — Phase 0 decision packet

**Purpose:** Close Phase 0 questions that only humans can answer.  
**Audience:** Raygs (product owner) + Cauã (technical co-approver).  
**Date opened:** 2026-08-30  
**Status:** Draft for Raygs accept/edit — **no answers invented**.

Authority: `docs/reengineering/` only. Stakeholder vision is input, not authorization. This packet does **not** authorize Nest, Dokploy, VPS wipe, DNS changes, migrations, workflow re-enable, or Phases 1–7.

**How to use:** Fill blanks and checkboxes in a short call. Leave `UNKNOWN` where still unknown. Do not paste secrets here.

---

## Pre-filled from Cauã (2026-08-30) — do not re-litigate unless Raygs corrects

| Topic | Value | Evidence |
| --- | --- | --- |
| Product ownership | Raygs owns all products; clients = web users only | `DECLARED` |
| Technical approvers | Cauã + Raygs | confirmed 2026-08-28 |
| `company_id` ≈ tenant | Believed, **not proven** table-by-table | belief / proof open |
| Impulsionando platform vs `company` row | **UNKNOWN** | do not invent model in Phase 0 |
| Canonical payments provider | **DECLARED** — see [`PAYMENTS-CANONICAL.md`](./PAYMENTS-CANONICAL.md) | Impulsionando=MP; Colors=MaisFy; CHRISMED=MP segregated; Paddle not canonical; sandbox account ID still UNKNOWN |
| Comms / Evolution / Meta | **UNKNOWN** | inventory-first |
| Data handling | Treat **all** data as real | no prod user export to git |
| AI | High-priority **todo inventory**, not Phase 6 build | J-14 |
| P0 tenant order | Impulsionando → Chrismed → Colors → WMP | sequencing hypothesis |
| Docs authority | `docs/reengineering/` only | overrides older `docs/` / `mem/` |

---

## 1. Emergency change process (draft — Raygs accept / edit)

Use this form for any production-affecting emergency during Phase 0 discovery. Both approvers required unless Raygs edits the rule below.

### Incident fields

| Field | Value (fill) |
| --- | --- |
| Incident ID / short name | ________________ |
| Detected at (UTC−3) | ____-__-__ __:__ |
| Reported by | ________________ |
| Severity (SEV1 / SEV2 / SEV3) | ________________ |
| Affected tenant(s) / surface(s) | ________________ |
| Exact target (host, service, workflow, table, provider) | ________________ |
| Symptom / user impact | ________________ |
| Evidence link (log path, ticket, screenshot — **no secrets**) | ________________ |
| Proposed change (one sentence) | ________________ |
| Why it cannot wait for normal Phase 0 freeze | ________________ |
| Expected side effects | ________________ |
| Rollback plan (step-by-step, reversible) | ________________ |
| Rollback owner | ________________ |
| Verification after change | ________________ |
| Verification after rollback (if used) | ________________ |

### Approvals

- [ ] **Cauã** approves (name + timestamp): ________________
- [ ] **Raygs** approves (name + timestamp): ________________
- [ ] Raygs edits this rule: only one of the above is enough in SEV1 — **yes / no** (circle): ______

### Logging location (Raygs confirm or assign)

Where completed emergency forms are stored (path or system — not secrets):

| Option | Choose one |
| --- | --- |
| Append to `docs/reengineering/01-current-state/phase-0/EXECUTION-LOG.md` | [ ] |
| Dedicated file under `docs/reengineering/01-current-state/phase-0/incidents/` | [ ] |
| External tracker (name + link pattern, no secrets): ________________ | [ ] |
| Other: ________________ | [ ] |

### Post-incident

- [ ] Entry logged at the location above within 24h
- [ ] Contained publishers / workflows left as decided (no silent re-enable)
- [ ] Follow-up open question filed in `OPEN-QUESTIONS.md` if needed

**Raygs:** [ ] Accept as-is / [ ] Accept with edits noted: ________________

---

## 2. Ownership — confirm or assign

Product owner rows pre-filled from Cauã. Technical rows blank for Raygs.

| Area | Product / business owner | Technical owner (ops) | Access notes | Raygs action |
| --- | --- | --- | --- | --- |
| All P0 products (Impulsionando, Chrismed, Colors, WMP) | **Raygs** | Cauã + Raygs (approvers) | Clients = web users only | Confirm ☐ |
| Cloudflare / DNS / zone `impulsionando.com.br` | | | | Confirm or assign: ________ |
| Domain registrar (who renews / transfers) | | | | Confirm or assign: ________ |
| Hostinger / VPS | | | | Confirm or assign: ________ |
| Supabase project / data / Auth / Storage | | | | Confirm or assign: ________ |
| Pagamentos / fiscal (incl. Focus NFe if used) | | | | Confirm or assign: ________ |
| n8n / workflows / webhooks automation | | | | Confirm or assign: ________ |
| Evolution / WhatsApp / Meta apps | | | | Confirm or assign: ________ |
| E-mail delivery (provider + senders) | | | | Confirm or assign: ________ |
| Secrets inventory (owner, rotation, env) — names only | | | | Confirm or assign: ________ |
| Backup / restore gate owner | | | | Confirm or assign: ________ |
| GitHub publishers / deploy authority | | | | Confirm or assign: ________ |

Clients do **not** get infra/admin access. Filling this table does not grant new permissions.

---

## 3. RPO / RTO — numeric fields per P0 tenant

Backup restore of Supabase is **not proven**. Fill numbers Raygs will accept as gates. Units: minutes or hours.

| Tenant (P0 order) | Max data loss RPO | Max recovery time RTO | Notes / exceptions |
| --- | --- | --- | --- |
| Impulsionando | ______ | ______ | |
| Chrismed | ______ | ______ | |
| Colors Saúde | ______ | ______ | |
| WMP | ______ | ______ | |

Shared platform failure (all tenants down): RPO ______ / RTO ______

---

## 4. Payments matrix — filled from checkout consolidation (2026-08-30)

Canonical rules are recorded in [`PAYMENTS-CANONICAL.md`](./PAYMENTS-CANONICAL.md). Remaining blanks are **live account / sandbox homologation only** (no secrets here).

| Provider | Canonical role | Used? | Sandbox account homologated? | Prod account? | Owner (name) | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Mercado Pago | Impulsionando SaaS + CHRISMED (segregated) | Y (intent) | Pattern TEST-… DECLARED; **specific account UNK** | UNK in this packet | Confirm: ________ | Two logical accounts: Core vs CHRISMED |
| Paddle | **Not canonical** | UNK (code may exist) | | | | Needs ADR to become canonical |
| MaisFy | **Colors checkout canonical** | Y (intent) | UNK | UNK | Confirm: ________ | No parallel Colors MP checkout |
| Monetizze | Colors history/ops only | UNK | | | | Not current Colors canonical |
| PerfectPay | Colors history/ops only | UNK | | | | Not current Colors canonical |
| Tenant-owned gateways | Per-tenant commerce | Y (model) | | | Tenant + Core integration | No universal gateway |

Fiscal / Focus NFe (if in scope): used? ______ owner? ______ sandbox/prod? ______

---

## 5. Communications — blanks

| Channel | Used? (Y/N/UNK) | Prod instances / apps | Sandbox / test dest | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Evolution / WhatsApp | | | | | |
| Meta (WhatsApp Cloud / webhooks) | | | | | |
| E-mail (provider + from domains) | | | | | |
| SMS / voice (if any) | | | | | |
| n8n as message orchestrator | | | | | |

---

## 6. Staging Supabase

Does a **non-production** Supabase project (or equivalent isolated DB) exist for safe restore / characterization?

- [ ] **Yes** — project name/ref (no secrets): ________________
- [ ] **No**
- [ ] **Unknown** — who will confirm by date ______: ________________

---

## 7. Schema source-of-truth acknowledgment

Live Supabase structure is an **observational baseline**. Repo migrations/types diverge. Phase 0 must not push schema or reset production to match git.

- [ ] **Raygs acknowledges:** live DB is observational baseline for Phase 0; **no schema push / reset / destructive sync** against production in Phase 0.
- [ ] **Cauã acknowledges** the same.

Name + date: Raygs ______________ / Cauã ______________

Canonical schema SoT for Phase 1+ remains a later ADR — not decided here.

---

## 8. What blocks Phase 0 exit vs nice-to-have

### Blocks Phase 0 exit (human answers and/or proven evidence required)

These map to open blockers in `OPEN-QUESTIONS.md` and journey gates (esp. J-15, J-16, J-05, J-07).

| # | Question | Human fill in this packet? | Evidence still required elsewhere |
| ---: | --- | --- | --- |
| B1 | Emergency change process accepted | §1 checkboxes | Logged first use when needed |
| B2 | Formal owners: DNS/CF, Supabase/data, payments/fiscal, n8n/Evolution, secrets | §2 | Access lists without secrets |
| B3 | Numeric RPO/RTO per P0 tenant (+ shared) | §3 | Proven isolated restore (J-16) |
| B4 | Restorable Supabase backup exists and is owned | §2 backup owner + §6 staging | Restore test with checksum/date |
| B5 | Payment providers: canonical matrix DECLARED in PAYMENTS-CANONICAL; fill live sandbox/prod owners in §4 | §4 | Signed webhook / idempotency characterization |
| B6 | Active n8n workflows, Evolution instances, external webhooks | §5 + owners | Live inventory export (read-only) |
| B7 | Schema SoT rule for Phase 0 (no push/reset) | §7 | Live vs migrations drift already documented |
| B8 | Staging / isolated restore target exists or explicit “no → create later” | §6 | Isolated restore run |
| B9 | Host/prefix → runtime → release → SHA map complete | — | Topology evidence (J-01) |
| B10 | Single temporary publish authority; other publishers contained | — | Publisher registry (J-15) |
| B11 | Privileged `anon`-callable functions: auth, tenant, rate limit, idempotency | — | Security characterization |
| B12 | Secrets: owner, rotation, environment (names only) | §2 | Rotation procedure offline |
| B13 | SentinelX / related process needed for deploy or ops? | Raygs: ______ (Y/N/UNK) | Evidence of dependency or removal |
| B14 | Old workflows absent from checkout still triggerable via GitHub? | — | GitHub inventory (read-only) |

### Nice-to-have for Phase 0 (do not block topology / containment closeout if B-list done)

| # | Item | Notes |
| ---: | --- | --- |
| N1 | How free-trial usage will be measured post go-live | Product analytics decision |
| N2 | Per-tenant personal / medical / fiscal / financial data categories | Structural inventory first; classification can refine |
| N3 | Impulsionando platform vs `company` row canonical identity | Phase 1 ADR; leave UNKNOWN |
| N4 | Prove `company_id` ≡ tenant on every table | Belief stands; table proof can continue |
| N5 | Multi-company membership for one Auth user | Product-map follow-up |
| N6 | Password-reset canonical host | Product-map follow-up |
| N7 | Full E2E authenticated journeys with anonymized fixtures | Strongly desired; not all must finish before exit if blockers above clear |
| N8 | AI assistant inventory depth (J-14) | High priority backlog; not Phase 6 build |
| N9 | Ana Madu / RioMed prioritization beyond P0 four | Unless Raygs reprioritizes |
| N10 | Maintenance window policy | Ops preference; continuous availability already stated |

**Waivers:** Any B-item waived for Phase 0 exit must be signed by **Raygs + Cauã** with risk accepted and a dated follow-up. Blank waiver = not waived.

Waiver notes (if any): ________________

---

## Sign-off

| Role | Name | Date | Packet accepted? |
| --- | --- | --- | --- |
| Raygs (product) | | | [ ] Yes [ ] Yes with edits |
| Cauã (technical) | | | [ ] Yes [ ] Yes with edits |

Edits summary: ________________
