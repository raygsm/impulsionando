# Issue report — TEMPLATE

Copy to `inbox/YYYY-MM-DD-issue-<slug>.md` for bugs / broken behavior.

---

## Metadata

| Field | Value |
| --- | --- |
| ID | _e.g. ISS-001 or LIN-43_ |
| Title | |
| Type | issue / bug |
| Reported by | |
| Intake date | |
| Status | draft \| confirmed \| in-progress \| fixed \| wont-fix |
| Severity | _P0 prod down / P1 major / P2 minor / cosmetic_ |
| Environment | _prod / staging / local / which URL_ |

---

## Summary for product owner

(Plain language: what's broken from the user's point of view.)

---

## Steps to reproduce

1. 
2. 
3. 

**Expected:**  
**Actual:**  

---

## Scope

| Question | Answer |
| --- | --- |
| Who is affected? | _one tenant / all / one user_ |
| Since when? | _date or "always"_ |
| Blocking work? | _yes/no_ |
| Regression? | _worked before? last known good?_ |

---

## Evidence (no secrets)

- URL / tenant / screen:
- Screenshot or HAR: _path or "attached in Linear"_
- Error message (exact text):

---

## Technical notes (engineering)

| Topic | Notes |
| --- | --- |
| Likely layer | _frontend / API / Supabase / nginx / DNS / unknown_ |
| Legacy vs reengineering track | |
| Safe to test on staging? | |

---

## Acceptance criteria (fix done when)

- [ ] Repro steps no longer fail on _environment_
- [ ] No regression on _related flow_
- [ ] _optional: test added_

---

## Interview log

| Asked | Answer | Notes |
| --- | --- | --- |
| | | |

---

## Resolution record

| Field | Value |
| --- | --- |
| Root cause | |
| Fix PR / commit | |
| Verified by | |
| Closed date | |
