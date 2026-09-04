# Tenant cutover story — old house → staging VPS → production (no legacy)

Created: **2026-09-04**  
Audience: operators who want the stupid-simple map  
SoT: [`../../STATUS.md`](../../STATUS.md) · [`CSI-PILOT-7B.md`](./CSI-PILOT-7B.md) · [`PHASE-7-CUTOVER.md`](../PHASE-7-CUTOVER.md)

> This is the **flux**, not a claim that it is finished. CSI is the **first** door. Apex/all tenants come later. **7F** (delete old VPS) is last.

---

## 1. Two computers (never confuse them)

| Nickname | IP | Job today |
| --- | --- | --- |
| **Old house** | `187.77.232.52` | Almost all real tenants live here (legacy monolith) |
| **New house** | `2.25.123.224` | Dokploy + Nest API + worker + stubs — mostly **staging** (`*.stg`) |

**Staging** = practice copy (practice DB).  
**Production** = real users + real DB.

You **practice** on the new house with staging.  
You **release** by pointing real hostnames at the new house with **prod** config.  
You **never** point real users at staging DB.

---

## 2. What “a tenant” is (three layers)

Each tenant is not one file. It is three things that must agree:

```text
1. DOOR     = hostname (csi.impulsionando.com.br)
2. APP      = the UI + APIs that answer that door
3. DATA     = Supabase (and jobs/webhooks) for that tenant
```

| Layer | Old world | New world |
| --- | --- | --- |
| Door | Cloudflare → old VPS Nginx | Cloudflare → new Traefik |
| App | One big TanStack app (`src/routes/...`) | Split: Nest `api` + `tenant-web` / `platform-web` / `app-web` (+ maybe temp SSR) |
| Data | Prod Supabase | **Same** managed Supabase (usually) — we change **who serves**, not “copy the whole company to a new planet” |

---

## 3. What the code turns into (strangler — not rewrite everything)

```text
TODAY (old house)
┌─────────────────────────────────────────┐
│  Legacy monorepo (this git repo too)    │
│  subdomain.ts → /csi /wmp /chrismed … │
│  All HTML + most APIs in one Node app   │
└─────────────────────────────────────────┘

TARGET (new house)
┌──────────────────┐  ┌────────────────────┐  ┌─────────────┐
│ platform-web     │  │ tenant-web         │  │ Nest api    │
│ (Impulsionando   │  │ (per-tenant UI     │  │ + worker    │
│  platform shell) │  │  slices over time) │  │             │
└──────────────────┘  └────────────────────┘  └─────────────┘
         ▲                      ▲                    ▲
         └──────── Traefik by Host(hostname) ────────┘
```

| Old thing | Becomes |
| --- | --- |
| `src/routes/csi.*` (and friends) | Migrated **slice by slice** into `apps/tenant-web` (or served temporarily by a **legacy SSR container** on the new VPS until migrated) |
| `src/routes/api/...` business APIs | Nest modules under `apps/api` (Support already started; more modules later) |
| Background jobs / n8n / webhooks | Nest worker + allowlisted adapters (Phase 5 spine); n8n retired per flow |
| `subdomain.ts` host → path | `@impulsionando/tenant-host` + Nest tenant resolve |
| One Nginx on old VPS | Traefik on new VPS (Dokploy) |
| “Latest” random release on disk | **SHA-tagged** GHCR images |

**You do not rebuild every screen from zero before any move.**  
**You do not flip a door until that door has an app on the new house that can answer it.**

---

## 4. States every tenant walks through

```text
[A] LEGACY_ONLY
      Door → old VPS. App = old monolith. Data = prod.
        │
        │  (optional) build + test on staging
        ▼
[B] STAGING_READY
      Same code path proven on new VPS with *.stg + staging DB.
      No real users yet.
        │
        │  prod image + prod env + Traefik Host(real door)
        ▼
[C] PROD_ON_NEW (pilot / strangler)
      Door → new VPS. App = new (or temp SSR). Data = prod.
      Old VPS must NOT still write for that flow (or dual-run is explicit).
        │
        │  more hostnames one-by-one (7D)
        ▼
[D] LEGACY_DRAINED
      No tenant doors left on old VPS for required flows.
        │
        ▼
[E] LEGACY_GONE (7F — later)
      Old VPS retired after backup/restore proof.
```

| State | User sees | Old VPS | New VPS |
| --- | --- | --- | --- |
| A | Old site | Serves them | Irrelevant |
| B | Nothing (or internal `*.stg`) | Still serves prod | Practice only |
| C | New site (that hostname) | Idle for that door | Serves them |
| D | All on new | Idle | Serves all |
| E | All on new | Deleted/off | Only home |

**CSI today = mostly A**, with **B started** (seed + stub + chosen as first pilot).  
**CSI is not C** until HTML+prod env+DNS are real.

---

## 5. The flux (one tenant, e.g. CSI)

### Step 1 — Pick the door
Choose hostname (CSI = `csi.impulsionando.com.br`). Small blast radius first; apex last-ish.

### Step 2 — Put the app on the new house (staging)
- Build from **this repo** whatever serves `/csi` (migrate to tenant-web **or** run legacy SSR image on new VPS as a bridge).
- Wire Traefik to a **staging** name (`stg.csi.impulsionando.com.br` — `stg` first).
- Staging Supabase only.
- Prove: HTML loads, login/resolve/membership allow+deny.

### Step 3 — Prod-shaped promote (still no DNS if you want)
- Same image (or SHA) with **prod** env → **prod** Supabase.
- Traefik rule ready for real `csi.impulsionando.com.br`.
- Rollback kit ready.

### Step 4 — Flip the door (7B)
- Cloudflare: **only that hostname** → `2.25.123.224`.
- Watch ≥24h. Break → point DNS back to old house.

### Step 5 — Freeze old writers for that tenant (7E bit)
- Stop legacy jobs/webhooks/n8n that still think CSI lives on old VPS.

### Step 6 — Next tenant (7D)
- Repeat for WMP, Garrido, … then platform/apex when ready.

### Step 7 — Kill old house (7F — last)
- Only when **no** required door/job depends on `187.77…`.

---

## 6. What must change vs what stays

| Must change | Stays (usually) |
| --- | --- |
| Which server answers the hostname | Tenant rows / business data in managed Supabase |
| How Host → tenant is resolved (shared package + Nest) | Brand meaning of “CSI”, “WMP”, … |
| Where UI code lives over time (`apps/*`) | Product rules (until you intentionally change them) |
| Deploy identity = git SHA images | — |
| Edge = Traefik + Cloudflare | — |

---

## 7. Impulsionando platform vs tenant doors

| Track | Meaning |
| --- | --- |
| **Impulsionando development** | Build platform on **new stack + staging** now (Nest, shells, CRM later). Does **not** require CSI DNS flipped. |
| **Tenant cutover (Phase 7)** | Move real **doors** one-by-one to new VPS with prod config. |
| **“Never see old VPS”** | End state after all doors + jobs drained + **7F**. Not day-one of CSI select. |

---

## 8. One-sentence version

**Old tenants keep working on the old server until we copy/serve their app on the new server (practice on staging first), point only their hostname at the new server with the real database, freeze the old server for that tenant, repeat, then shut the old server off.**
