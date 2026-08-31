# Feature spec — TEMPLATE

Copy to `inbox/YYYY-MM-DD-feature-<slug>.md` and fill. Delete instructional lines marked `(guide)`.

---

## Metadata

| Field | Value |
| --- | --- |
| ID | _e.g. FEAT-001 or LIN-42_ |
| Title | _short name_ |
| Type | feature |
| Requested by | _Raygs / tenant name / internal_ |
| Intake date | _YYYY-MM-DD_ |
| Status | draft \| product-review \| accepted \| in-progress \| done \| rejected |
| Priority | _P0 blocker / P1 / P2 / nice-to-have_ |
| Target phase | _hotfix legacy / Phase 1–7 / post-reengineering / unknown_ |

---

## Summary for product owner (plain language)

(guide: 3–6 sentences Raygs can read without jargon. What changes for the user? What problem goes away?)

---

## Problem & objective

### Problem statement

(guide: What hurts today? Who feels it? How often?)

### Objective

(guide: One measurable outcome — e.g. "Support operator can export tickets to CSV without developer help.")

### Non-goals (out of scope)

- 
- 

---

## Users & context

| Actor | Role | Needs |
| --- | --- | --- |
| _e.g. Raygs admin_ | | |
| _e.g. tenant user_ | | |

### Where in the product

(guide: URLs, menus, tenant brands, mobile vs desktop — be concrete.)

---

## Current behavior

(guide: What happens today? Screenshots/links optional — no secrets in repo.)

---

## Desired behavior

(guide: Step-by-step user journey in plain language.)

1. 
2. 
3. 

---

## Theoretical structure (conceptual model)

(guide: Entities and relationships in business terms — not SQL yet.)

```text
Example:
  Ticket belongs to Company (tenant)
  Operator belongs to Company with role Support
  Export = filtered list of Tickets → CSV file
```

### Business rules

- 
- 

---

## Technical definitions (for engineering)

(guide: Fill after interview; mark UNKNOWN if not yet decided.)

| Topic | Definition |
| --- | --- |
| Tenants affected | _all / list / platform-only_ |
| Auth surface | _logged-in role / public / API_ |
| Data read/write | _tables or domains; staging-first?_ |
| Integrations | _Supabase / n8n / payments / WhatsApp / none_ |
| Multi-tenant isolation | _must not leak across company_id — allow/deny tests?_ |
| Prod vs staging | _staging proof first? prod cutover gate?_ |

### API / UI touchpoints (if known)

- 

### Migration / schema

- _expand-only / no schema / UNKNOWN_

---

## Acceptance criteria

(guide: Testable. Prefer Given / When / Then.)

- [ ] **AC-1:** Given … When … Then …
- [ ] **AC-2:** 
- [ ] **Deny case:** User from tenant B cannot …

---

## Risks & dependencies

| Risk | Mitigation |
| --- | --- |
| | |

Dependencies:

- 

---

## Open questions

| # | Question | Owner | Answer |
| ---: | --- | --- | --- |
| 1 | | Raygs / Cauã | _TBD_ |

---

## Interview log (intake)

(guide: Agent fills Q&A bullets during interview — compress raw chat.)

| Asked | Answer (stakeholder words) | Interpreted as |
| --- | --- | --- |
| | | |

---

## Product sign-off

| Role | Name | Date | OK |
| --- | --- | --- | --- |
| Product owner | Raygs | | ☐ |
| Technical | Cauã | | ☐ |

---

## Implementation record (engineering)

| Field | Value |
| --- | --- |
| Started | |
| Branch / PR | |
| Evidence paths | |
| Verified | |
