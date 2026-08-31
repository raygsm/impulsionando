# Pre-sales readiness — main / live prod

- **Date (UTC):** 2026-08-31, audit window ~14:11–14:27Z
- **Operator:** Cursor Grok 4.6 (read-only auditor on Cauã machine)
- **Git branch tested:** `main` @ `08e7178a55a501b095a870f06428065d7db1f70a` (`origin/main` identical; commit subject `fix(tenants): ship official logos, readable contrast, and CSI-only Investito`, authored 2026-08-31 09:49:42 -0300)
- **Prod release observed:** (per host) — see Split-brain table. Apex + P0 tenant `/api/public/version` all returned the same SHA as GitHub `main`.
- **Safety:** no prod DB writes, no deploys, no real payments, no customer comms, no secrets in this file.
- **Out of scope (honored):** reengineering/program, clean VPS `2.25.123.224`, Nest, staging restore, prod DNS/nginx changes.

## Executive summary (plain language for Raygs)

- **Verdict:** **SELL WITH CAVEATS**
- **Top 3 blockers**
  1. **Colors Saúde short URLs break.** Canonical host `colorssaude.impulsionando.com.br` home works, but `/entrar`, `/rastreio`, `/super-green-black` returned **404** at 14:25Z (they had returned **200** at 14:11Z on the same SHA). Browser hard-load of those paths is a **white screen**. Prefixed paths `/colors/entrar`, `/colors/rastreio`, `/colors/super-green-black` return 200. Do **not** demo Colors product/login/tracking via the short URL.
  2. **Authenticated product is unproven.** No test accounts in env (`E2E_EMAIL` / similar absent). Login **pages** render; fake credentials on apex `/auth` correctly show “E-mail ou senha incorretos.” Session, logout, and cross-tenant deny tests are **BLOCKED**.
  3. **Quality gates on `main` are red locally.** `npm test` → 14 failed + 23 suites aborting (missing Supabase service-role env). `test:rls:recent` fails for the same reason. Playwright timed out starting the local Vite server (120s). `npm run lint` reported ~97 805 errors (mostly Prettier). This does **not** disprove live HTML, but you cannot tell a buyer “CI is green.”
- **Top 3 risks to disclose to buyers**
  1. **Backup / disaster recovery is not proven** (journey J-16 already recorded as failed/unproven in program docs). Selling “we can restore you” would be false.
  2. **Checkout is a catalog, not a proven payment.** `/checkout` loads plans (Essencial R$ 810,50 / Ideal R$ 1.621 / Full R$ 3.242) — **no real charge was attempted**. Webhook/reconciliation remain UNKNOWN.
  3. **Status page is cosmetic.** `/status` says “Todos os sistemas operacionais” but **0 services monitored** (“Sem checagens públicas no momento”). Health JSON is HTTP 200 with `release: "unknown"` and DB check `status: 401` while `ok: true`. HTTP 200 ≠ operational proof.

**What you *can* sell today:** the Impulsionando institutional site (home, planos, contato, trial, checkout *entry*, suporte, login form) and **Chrismed** public site + scheduling wizard (previous white-screen report is **not** reproducing). **WMP** home + quote form entry work. Use those three as live demos. Treat Colors as a **broken reference** until short URLs stop 404/white-screening.

## P0 tenant results

| Tenant | URL | HTTP | Load quality | Version/SHA | Blocker? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| P0-1 Impulsionando | `https://impulsionando.com.br/` | 200, 244–63591 B, TTFB ~67–244 ms | **PASS** — hero, logo, CTAs, footer `v. 08e7178` | `08e7178a…` via `/api/public/version` | No | Cookie + “Chat Privado” overlays. No broken images. |
| P0-1 www | `https://www.impulsionando.com.br/` | **301** → apex (nginx/1.24.0, **not** Cloudflare) | Redirect OK | same as apex after follow | No | Split www vs CF-proxied apex still true. |
| P0-1 planos | `/planos` | 200, 9167 B SSR | **PASS** after hydrate (~2.8 k chars) | footer SHA | No | Early a11y snapshot thin until JS; then CTAs present. |
| P0-1 contato | `/contato` | 200, 9188 B | **PASS** — “Fale com a Impulsionando Tecnologia” | — | No | Form **not** submitted. |
| P0-1 trial | `/trial` | 200, 40009 B | **PASS** — “Começar Trial de 7 dias” | footer SHA | No | Copy discloses auto-charge after 7 days. Not started. |
| P0-1 auth | `/auth` | 200, 7867 B | **PASS** — form + Google; empty submit focuses email; fake login → “E-mail ou senha incorretos.” | — | No (page only) | Session/logout **BLOCKED**. |
| P0-1 checkout | `/checkout` | 200, 26278 B | **PASS** — plan picker, no payment completed | — | Caveat | J-05 entry only. |
| P0-1 status | `/status` | 200, 17193 B | **DEGRADED** — page works, 0 public checks | — | Caveat | See J-13. |
| P0-1 suporte | `/suporte` | 200, 37492 B | **PASS** — ticket/email/help CTAs | footer SHA | No | Ticket **not** opened. |
| P0-2 Chrismed | `https://chrismed.impulsionando.com.br/` | 200, 61836 B | **PASS** — **not** a white screen. Logo `/brand/chrismed/logo-horizontal.webp` 1024×237. CTA Agendar. | `08e7178a…` `host=chrismed.impulsionando.com.br` | **No** (previous white-screen **fixed** in this sample) | Mobile 390×844: hamburger + Agendar still visible. |
| P0-2 agendar | `/agendar` | **302** → `/?acao=agendar`; browser `/agendar` hydrates wizard | **PASS** — “Como você quer ser atendido?” steps 1–8 | same | No | Did not complete booking/payment. |
| P0-2 clinica | `/clinica` | 200, 47559 B | **PASS** (SSR title Medicina Ambulatorial) | same | No | |
| P0-2 auth | `/auth` | 200, 7504–7867 B | **PASS** page title “Acessar sua conta” | same | No | Prefixed tenant login chrome UNKNOWN vs apex. |
| P0-2 minha-conta | `/minha-conta` | 200, 19883 B | SSR “Área do Paciente” | same | UNKNOWN | Unauthenticated HTML only. |
| Apex `/chrismed` | `https://impulsionando.com.br/chrismed` | **308** → `http://chrismed.impulsionando.com.br/` then **301** HTTPS | Works after hop | — | Caveat | **HTTP** intermediate redirect. |
| P0-3 Colors home | `https://colorssaude.impulsionando.com.br/` | 200, ~29 kB | **PASS** catalog + “Comprar original” | `08e7178a…` | No for home | After hydrate, `<title>` leaked “Impulsionando Tecnologia … — colorssaude”. |
| P0-3 product short | `/super-green-black`, `/produto/sos-hair` | **200 at 14:11Z** then **404 at 14:25Z** | Browser: **FAIL white screen** (bodyTextLen 0, empty title, ~16 kB loader CSS only) | same SHA/uptime | **YES** | Same Node uptime (~73 s at 14:11 → ~917 s at 14:25). Unstable short-path routing. |
| P0-3 product prefixed | `/colors/super-green-black`, `/colors/produto/sos-hair` | 200 | SSR titles correct | — | Caveat | Client `<Link>` from home goes to `/colors/…` on the tenant host (double prefix). |
| P0-3 login short | `/entrar` | 200 @ 14:11Z / **404 @ 14:25Z** | Browser white screen | — | **YES** | |
| P0-3 login prefixed | `/colors/entrar` | 200, 13607 B | **PASS** — “Bem-vinda de volta”, email/senha | — | No if you use this URL | |
| P0-3 rastreio short | `/rastreio` | 200 → **404** | FAIL short path | — | **YES** | |
| P0-3 rastreio prefixed | `/colors/rastreio` | 200, 11196 B | SSR “Rastrear pedido” | — | Caveat | Browser prefixed path not re-checked after 14:25Z. |
| P0-4 WMP home | `https://wmp.impulsionando.com.br/` | 200, 47121 B | **PASS** — logo, “Quero produzir um evento”, “Solicitar proposta” | `08e7178a…` | No | Hydrated `<title>` leaked Impulsionando + `— wmp`. |
| P0-4 pacotes | `/pacotes` | **301** → `/wmp/pacotes` | Prefixed 200, 29700 B | — | Caveat | Path prefix leak (same class as Colors). |
| P0-4 orçamento | `/orcamento` | **301** → `/wmp/orcamento` | **PASS** quote wizard (contato fields). **Not submitted.** | — | No for entry | |
| P0-4 auth | `/auth` | 200, 7867 B | Page “Acessar sua conta” | — | No (page only) | |

## Journey matrix

| Journey | Status | Evidence |
| --- | --- | --- |
| J-01 Domain & tenant resolution | **DEGRADED** | P0 hosts resolve distinct products (Chrismed / Colors / WMP / apex). No obvious *content* cross-tenant bleed on landings. Residual: title suffixes `— colorssaude` / `— wmp`; apex `/chrismed` 308 to **http**; Colors/WMP require `/colors` or `/wmp` prefix for many routes; Colors short paths flapped 200→404. |
| J-02 Auth | **DEGRADED** / **BLOCKED** for session | Apex `/auth` renders; invalid login expected error; HTML5 empty submit. Colors login works on `/colors/entrar` only. No test user → login success, persist, logout, deny-test **BLOCKED**. |
| J-03 Onboarding | **NOT TESTED** | No signup completed. |
| J-04 Acquisition | **PASS** (public) | Apex home, `/planos`, `/contato`, `/trial` load with CTAs. Forms not posted. |
| J-05 Checkout | **DEGRADED** | `/checkout` plan grid loads; **no charge**. Providers/webhooks UNKNOWN. |
| J-06 Comms | **NOT TESTED** | Policy: no WhatsApp/SMS/email blast. |
| J-07 Automation | **NOT TESTED** | Out of sales demo; workers not probed. |
| J-08 Chrismed scheduling | **PASS** (entry) | Home + `/agendar` wizard “Como você quer ser atendido?”. Booking/payment not completed. |
| J-09 Colors commerce | **FAIL** (short URLs) / **DEGRADED** (prefixed) | Home catalog OK. Product/login/tracking short paths 404 + white screen. Prefixed SSR 200. |
| J-10 WMP quote | **PASS** (entry) | Home CTAs + `/wmp/orcamento` 6-step form. Not submitted. `/pacotes` only via `/wmp/pacotes`. |
| J-11 Ana Madu | **NOT TESTED** (P1 GET only) | `https://anamadu.impulsionando.com.br/` HTTP 200, title Ana Madú, 23905 B. |
| J-12 RioMed | **NOT TESTED** (P1 GET only) | `https://riomed.impulsionando.com.br/` 200, 38936 B. |
| J-13 Support/status | **DEGRADED** | `/suporte` PASS. `/status` PASS chrome, **0 monitors**. |
| J-14 AI | **UNKNOWN** | Impulsionito / Oliver / Íris / Milito widgets visible; no tool/allow-deny test. |
| J-15 Release identity | **DEGRADED** | Live `/version` SHA **matches** `origin/main`. `/health.release` = `unknown`. `/impulsionando-front-sha.txt` and `/impulsionando-release.json` **404** (SPA HTML). Historical split-brain (apex Docker `commit: unknown` vs tenant `ebcc52f0`, 2026-08-30) **not observed on version JSON today**. |
| J-16 Backup/DR | **UNKNOWN** / historically **FAIL** | Not re-tested. Program docs: restore unproven. Disclose. |

## Automated tests

| Command | Result | Notes |
| --- | --- | --- |
| `git fetch` + `checkout main` + `pull` | **PASS** | Local = `origin/main` = `08e7178a55a501b095a870f06428065d7db1f70a`. (Stashed unrelated `reengineering/program` WIP first.) |
| `npm run phase0:smoke` | **N/A on main** | Script **missing** on this branch (`package.json` has no `phase0:smoke`; `scripts/audits/phase0-public-smoke.mjs` not in `main`). Equivalent HTTPS probes run manually. |
| `npm ci` | **PASS** | 707 packages, 21 s. npm reported 11 vulns (not investigated). |
| `npm run lint` | **FAIL** | First run: `✖ 97944 problems (97805 errors, 139 warnings)` — overwhelmingly `prettier/prettier`. Exit code of piped run was masked; treat as **fail**. |
| `npm test` | **FAIL** | 28 files failed / 35 passed; **14 tests failed**, 364 passed (378). 23 files threw `Missing SUPABASE env vars (URL, ANON, SERVICE_ROLE)` (no service role in this environment — **not** used against prod). Assertion fails included `rbac-e2e`, `chrismed-booking-security`, `planos-avancado-price`, `nichos-funnel-routes`, `chrismed-events-and-contrast`. |
| `npm run test:rls:recent` | **FAIL** | Same missing SERVICE_ROLE. **BLOCKED**, not a live RLS proof. |
| `npm run ci:security` | **NOT RUN** | Would fail on the same RLS env gap. |
| `npm run build` | **NOT RUN** | Timeboxed; local OOM/timeout UNKNOWN. |
| `npm run test:e2e` (named `tests/e2e/*` on `desktop-chromium`) | **FAIL** | `Error: Timed out waiting 120000ms from config.webServer.` (`bun run dev --host 127.0.0.1 --port 4173`). Default `playwright.config.ts` `testDir` is `./e2e` (30+ specs × 6 projects) — **not** executed in full. |
| Per-file named specs | **NOT RUN** (infra) | `legacy-redirect.spec.ts`, `admin-logo.spec.ts` (needs `E2E_EMAIL`/`E2E_PASSWORD`), `dashboards-consumidor-subnav.spec.ts`, `home-clube-cta.spec.ts` — blocked by webServer timeout. `legacy-redirect` still assumes `colorssaude` → `colors.impulsionando.com.br` (stale vs live canonical `colorssaude`). |

Green local tests **do not** prove prod. Red local tests **also** do not prove prod is down — they prove this checkout of `main` is not a clean CI story.

## Split-brain / infra

| Host | SHA / runtime hint | Matches main? |
| --- | --- | --- |
| `impulsionando.com.br` `/api/public/version` | `commit: 08e7178a55a501b095a870f06428065d7db1f70a`, `builtAt: 2026-08-31T12:59:21.922Z`, `mode: production` | **YES** |
| `impulsionando.com.br` `/api/public/health` | HTTP **200** `{status:"ok", release:"unknown", checks.db.ok:true, checks.db.status:401}` | SHA not in health; **release unknown** |
| `www.impulsionando.com.br` | 301 nginx/1.24.0 Ubuntu, **no** `cf-ray` | N/A (redirect) |
| `chrismed` / `colorssaude` / `wmp` `/api/public/version` | **same commit + builtAt**; `host` field matches each hostname; similar `uptime_ms` ⇒ **same process** | **YES** |
| `/impulsionando-front-sha.txt` | **404**, 8015 B HTML (app shell) | No marker |
| `/impulsionando-release.json` | **404**, same class | No marker |
| vs 2026-08-30 `DOMAINS-AND-RUNTIMES.md` | Then: apex Docker `:3490` `commit: unknown` + health **503**; tenants systemd `:3000` `ebcc52f0` | **Changed.** Today version identity is unified on `08e7178`. Residual split: www DNS/nginx vs CF apex; health `release` still unknown; marker files still unpublished. |

**Do not assume** GitHub `main` tip = prod forever — it matched **this** sample. Re-check `/api/public/version` before any sales call.

## Blockers (must fix before sales)

1. **Colors short-path routing** — `/entrar`, `/rastreio`, `/produto/*`, `/super-green-black` on `colorssaude.impulsionando.com.br` must 200 **and** hydrate (no white `#root`). Today they 404 or white-screen; only `/colors/...` works. Client links still emit `/colors/...` on the tenant host.
2. **Do not promise Colors as a working storefront** until (1) is stable across a 15+ minute window (observed 200 then 404 on one process).
3. **Do not promise login/session/tenant isolation** until a human supplies non-prod test accounts and deny tests pass.
4. **Do not promise “status/uptime”** until `/status` has real checks and `/health.release` is not `unknown`.

## Caveats (can sell if disclosed)

- Apex **can** be used as the sales site: planos, trial, contato, checkout *entry*, suporte, login form.
- Chrismed public + agenda wizard **can** be demoed; do not complete a real appointment or payment in a pitch.
- WMP home + `/wmp/orcamento` **can** be demoed; do not submit a quote (would create a lead / WhatsApp).
- Trial copy says billing starts automatically on day 7 — sales must say that out loud.
- `www` is origin nginx; apex is Cloudflare. Certs: no TLS errors observed on probed HTTPS URLs.
- Tenant pages show Impulsionando chrome (“Produzido e Gerenciado por…”) and sometimes wrong `<title>` after hydrate.
- WMP `/pacotes` and `/orcamento` 301 to `/wmp/...` — ugly but functional.
- Payments, WhatsApp, workers, HIPAA/fiscal, backup restore: **not** in this audit.
- Local `main` lint/tests/e2e are red or blocked — disclose “live pages were checked; the repo is not CI-clean.”

## P1 issues (non-blocking)

| Host | HTTP | Title / bytes | Notes |
| --- | --- | --- | --- |
| `csi.impulsionando.com.br` | 200 | CSI Invest, 34009 B | GET only |
| `anamadu.impulsionando.com.br` | 200 | Ana Madú, 23905 B | GET only |
| `riomed.impulsionando.com.br` | 200 | RioMed, 38936 B | GET only |
| `marocas.impulsionando.com.br` | 200 | Marocas, 30436 B | GET only |
| `grupoevr.impulsionando.com.br` | 200 | Grupo EVR, 25787 B | GET only |
| `revela.impulsionando.com.br` | 200 | REVELA, 24058 B | GET only; historically separate runtime — **not** re-compared via SSH |
| Dynamic vitrine | — | — | **NOT TESTED** |

RBAC unit tests on `main` failed (e.g. consumidor menu includes `Dashboard`; superOnly list missing `Empresas`). Treat as **engineering debt**, not live proof of a privilege bug.

## Recommended fix order (no implementation in this task)

1. **Colors host rewrite** — map `colorssaude` public paths (`/`, `/entrar`, `/rastreio`, `/produto/:slug`, `/super-green-black`) without requiring `/colors` prefix; stop client `Link`s from navigating to `/colors/...` on the already-canonical host. Add a smoke that fails if short URL 404s.
2. **Stabilize routing** — explain 14:11 200 vs 14:25 404 on the same uptime (cache vs origin vs race). Until explained, do not demo Colors.
3. **Publish release markers** or drop them from health contracts; set `/api/public/health.release` to the git SHA (today `unknown` while `/version` is correct).
4. **Status page** — either wire real checks or stop saying “todos os sistemas operacionais.”
5. **Apex `/chrismed` 308** — HTTPS-only Location.
6. **Test fixtures** — vaulted E2E users per P0 tenant; then J-02/J-03/J-05/J-08 payment-less booking.
7. **CI honesty** — Prettier/lint baseline, skip or env-gate RLS without service role, Playwright `webServer` that actually starts on this repo.
8. **J-16 restore drill** (already a program gate; not a sales-page bug).

## UNKNOWN / needs human decision

- Provide **test logins** (never in git) so Layer D can run.
- Is Colors a **must-demo** P0 for this sales cycle? If yes, short-URL fix is a hard gate. If no, sell apex+Chrismed+WMP and keep Colors off the pitch.
- Accept **trial auto-charge** language as-is, or change copy before sending trial links to prospects.
- Whether to tell buyers that **backup restore is unproven**.
- `npm audit` 11 vulnerabilities: not triaged.
- Revela/Grupo EVR still on possibly distinct runtimes: not SSH-inspected this round (forbidden: no VPS mutation; SSH not required for this public audit).

## Method notes

- Layer A: manual `fetch` of manifest-equivalent URLs + P0 paths; body sniff for empty `#root` / Application error / tiny HTML.
- Layer B: `main` @ SHA above; `npm ci`, lint, `vitest run`, `test:rls:recent`.
- Layer C: Playwright webServer timeout; named specs not executed.
- Layer D: **BLOCKED** — no credentials.
- Browser: Cursor IDE browser, HTTPS only. Screenshots stored locally under Cursor screenshot dir (`presales-apex-home`, `presales-chrismed-home`, `presales-colors-home`, `presales-colors-produto-sos-hair` white screen, `presales-colors-entrar`, `presales-wmp-home`, `presales-chrismed-mobile`).
- **HTTP 200 ≠ healthy** applied: Colors product/login short URLs and white screens counted **FAIL** despite earlier 200s.
