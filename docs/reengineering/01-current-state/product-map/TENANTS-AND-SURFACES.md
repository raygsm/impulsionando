# Tenants and product surfaces

This registry records static product surfaces. It does not prove that every route is active, complete, safe, or connected to the intended production runtime.

## Priority tenants

| Product/tenant | Public entry | Known public capabilities | Known authenticated/operational capabilities | Sensitive domains | Evidence |
| --- | --- | --- | --- | --- | --- |
| Impulsionando | apex and `www` | institutional content, plans, contact, trial, checkout, support, status | platform administration, tenant administration, CRM, billing, modules, publication, integrations, communications, audit | identity, billing, credentials, communications | `STATIC`; host partially `LIVE` |
| Chrismed | `chrismed.impulsionando.com.br`, `/chrismed`, custom agenda host declared | clinic, professionals, specialties, exams, home care, occupational medicine, events, offers, scheduling, teleconsultation, checkout, account, documents | appointments, patients, professionals, records, teleconsultation, occupational operations, events, check-in, fiscal, WhatsApp, integrations, payouts | medical, identity, documents, financial, fiscal | `STATIC`; host partially `LIVE` |
| Colors Saúde | aliases in hostname resolver and `/colors` routes | catalog/brand pages, products, account, orders, tracking, affiliates, events, agenda, support | Colors operations and automation surfaces | identity, orders, affiliate finance, sales webhooks, AI chat | `STATIC`; host partially `LIVE` |
| WMP | `wmp.impulsionando.com.br`, `/wmp` | packages, quote, companies, DJs, partner registration, contract token, conversation protocol, whereabouts | proposals, contracts, equipment, agenda, operations, briefing evidence | contracts, location/evidence, commercial and personal data | `STATIC`; host partially `LIVE` |

## Other explicitly detected tenant products

| Product/tenant | Declared entry | Statically detected purpose | Evidence/status |
| --- | --- | --- | --- |
| Ana Madu | `anamadu.impulsionando.com.br`, `/anamadu` | jewelry catalog, product detail, order, PIX order, artisan request, AI assistant | `STATIC`; payment behavior uncharacterized |
| RioMed | `riomed.impulsionando.com.br`, `/riomed` | medical products, quotes, cart, checkout, vendors, hospitals, service, warranties, AI assistant | `STATIC`; health/commercial behavior uncharacterized |
| CSI | `csi.impulsionando.com.br`, `/csi` | public site, account surfaces, WhatsApp, Investito AI chat | `STATIC`; ownership/criticality unknown |
| Marocas | `marocas.impulsionando.com.br`, `/marocas` | hospitality/event-oriented public and account surfaces, reports | `STATIC`; live use unknown |
| Grupo EVR | `grupoevr.impulsionando.com.br`, `/grupo-evr` | health/pharma/group public surfaces | `STATIC`; ownership and live use unknown |
| Revela | `revela.impulsionando.com.br`, `/revela` | public landing plus authenticated support/operation | `STATIC`; separate runtime was previously observed |
| Garrido | hostname aliases and `/garrido` routes | public tenant surface | `STATIC`; live use unknown |
| Dynamic vitrines | unreserved subdomain fallback | `/vitrine/{slug}` white-label/public tenant surface | `DECLARED`/`STATIC`; allowed host inventory unknown |

## Cross-product capability families

| Capability | Main surfaces detected | Canonical current owner | Status |
| --- | --- | --- | --- |
| Tenant/domain resolution | Cloudflare, Nginx, `infra/subdomains/clients.json`, `src/lib/subdomain.ts`, route shells | `UNKNOWN` | split-brain live topology |
| Identity/session | Supabase Auth, auth middleware/attacher, login/reset routes | `UNKNOWN` | E2E pending |
| Membership and permissions | companies, memberships, access profiles, roles, RLS | `UNKNOWN` | canonical model pending |
| Plans/modules/features | company plans, modules, feature values, flags, admin/core routes | `UNKNOWN` | behavior pending |
| CRM and acquisition | lead/funnel routes, CRM tables, notification hooks | `UNKNOWN` | consumer and dedupe pending |
| Checkout/billing | checkout routes, Mercado Pago, Paddle, Edge Functions, payment hooks | `UNKNOWN` | production/sandbox and reconciliation pending |
| Agenda | shared agenda plus vertical scheduling | `UNKNOWN` | collision/timezone/authorization pending |
| Communications | e-mail, WhatsApp, Meta, n8n, Evolution, templates | `UNKNOWN` | provider ownership and replay pending |
| Automation | cron/tick endpoints, workers, n8n, outbox | `UNKNOWN` | scheduler and idempotency pending |
| Files/documents | Supabase Storage, Google Drive, tenant-specific buckets | `UNKNOWN` | access and retention pending |
| Fiscal | Focus NFe, fiscal routes/tables/reports | `UNKNOWN` | legal/provider ownership pending |
| AI assistants | Impulsionito, Iris, Anita, Medicito, Millito, Investito | `UNKNOWN` | model, tools, privacy, cost, and authorization pending |
| Support/status | ticket endpoint, status routes, subscriber/webhook jobs | `UNKNOWN` | operational owner pending |
| Publication/release | Actions, publisher, Nginx, Docker/systemd, release directories | Cauã/Raygs approval; technical mechanism fragmented | containment active |

## Tenant resolution rule requiring proof

The intended legacy behavior appears to be:

```text
request hostname
→ known apex or www: Impulsionando route
→ known tenant/custom host: mapped internal tenant route
→ reserved operational subdomain: special handling or rejection
→ other subdomain: dynamic vitrine fallback
```

This is not yet a security contract. Phase 0 must prove host normalization, proxy behavior, spoofed `Host` handling, custom-domain ownership, tenant lookup, unknown-host behavior, and whether the authenticated tenant context can ever diverge from the hostname.

