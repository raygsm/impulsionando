# Image and runtime layout (paper sketch)

> **EXPLORATORY — not authorized for implementation until Phase 0 exit + Phase 1 gate.**
>
> Paper-only description of target containers/images. **No** server provisioning, **no** “buy VPS”, **no** wipe/rebuild instructions, **no** Dokploy setup steps. Phase 0 remains active; ADRs remain Proposed.

Companion domain design: [`NEST-DOMAIN-PAPER-DESIGN.md`](NEST-DOMAIN-PAPER-DESIGN.md).

Authority: [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md), [`TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md), [`REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md).

---

## Target deployable units

| Image / app | Role | Serves public HTTP? | Owns domain rules? |
| --- | --- | --- | --- |
| `platform-web` | Impulsionando institutional site (TanStack Start) | Yes | No — thin BFF only |
| `tenant-web` | Public / white-label tenant sites (one image, hostname resolves branding) | Yes | No |
| `app-web` | Authenticated product UI | Yes | No |
| `api` | NestJS + Fastify modular monolith | Yes (API only) | Yes |
| `worker` | Durable job consumer(s) | No (no general public traffic) | Executes work published by api/domain |

Managed **Supabase** (Postgres, Auth, Storage, Realtime, proposed Queues) sits outside these images.

Edge (Cloudflare) and origin proxy (Traefik via Dokploy — Proposed) are infrastructure boundaries, not product modules. They must not select different code SHAs per tenant.

---

## Logical traffic sketch

```text
Internet
  → Cloudflare (DNS, proxy, WAF, edge rate limits)
    → Traefik (TLS termination / origin routing)   [Proposed ops]
        → platform-web
        → tenant-web
        → app-web
        → api

api
  → Supabase (data, auth validation, storage policies)
  → durable queue publish

worker
  → queue consume
  → Supabase
  → integration adapters (n8n, Evolution, mail, payments, AI tools)
```

Forbidden couplings (target):

- Browser → privileged integrations directly.
- Worker started as child of SSR or `api` process.
- Nginx/Traefik choosing commit/version by tenant.
- AI model with arbitrary SQL or unrestricted HTTP.

---

## Image identity (intent only)

- Built once; promoted by environment ([`PRINCIPLES.md`](../../00-foundation/PRINCIPLES.md)).
- Immutable identity by full Git commit SHA in GHCR (ADR-007 Proposed).
- `latest` is not an auditable release identity.
- Each unit exposes health/readiness appropriate to its role (web vs api vs worker).

No Dockerfile, registry path, or cluster sizing is specified here.

---

## Mapping from today’s core

| Today (observed / STATIC) | Target unit |
| --- | --- |
| Single TanStack Start monolith (pages + ~111 HTTP routes + ~331 `createServerFn`) | Split across `platform-web`, `tenant-web`, `app-web` + gradual move of domain to `api` |
| Workers co-started with web (`pulsonitor-worker`, `colors-automation-worker`) | Independent `worker` image(s) |
| Supabase Edge Functions (billing, Chrismed comms, etc.) | Absorb via Integrations/Billing/Communications adapters over time — not part of Nest pilot |
| VPS publisher / competing Actions | Future CI → GHCR SHA → Dokploy promotion (Phase 2+) — out of scope for this paper |

---

## Relation to Nest pilot

The Support pilot in [`NEST-DOMAIN-PAPER-DESIGN.md`](NEST-DOMAIN-PAPER-DESIGN.md) would eventually run inside `api`, with UI remaining on TanStack (`app-web` / public forms on `platform-web` or `tenant-web`). Ticket side effects that need async delivery would publish to a queue for `worker` — **not** in the first paper pilot scope.

---

## Non-goals

- Ordering hardware, wiping hosts, or migrating DNS.
- Writing Compose/Dokploy manifests.
- Creating `apps/*` directories or installing runtimes.
- Declaring production topology complete.

```text
DO NOT IMPLEMENT YET — exploratory layout only.
```
