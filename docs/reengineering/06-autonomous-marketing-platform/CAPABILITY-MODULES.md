# Capability modules

Created: **2026-09-04**  
UI module checks are **cosmetic**. Nest authorization is authoritative.

## States

```text
NOT_ENTITLED | CONFIGURING | READY | ACTIVE | DEGRADED | SUSPENDED | DISABLED
```

Every module surface in `app-web` must render: loading, empty, error, forbidden, configuring, degraded, unknown data, active.

## Mapping (transitional)

Until Nest returns a typed module catalog, the adapter maps `TenantEntitlementsV1.modules[]` slugs onto dashboard areas. Unknown slugs are ignored (default-deny in the UI). Missing campaign cost/attribution **must** display `UNKNOWN`, not `0`.

| Area | Example entitlement slugs (legacy vocabulary, STATIC) | Nest today |
| --- | --- | --- |
| Home | (always on if session+membership) | context + config |
| Growth | `crm`, `marketing` | journeys invite only |
| Customers | `crm` | not a list API |
| Operations | `agenda`, `ops` | queue metrics only |
| Management / ERP | `finance`, `inventory`, `sales` | none |
| Help | support (pilot) | **exists** |
| Settings | always (membership) | config read |
| Communications | `whatsapp`, `email` / flags | worker sink; no connection status API |
| Agent | AI entitlements / flags | **exists** (governed) |

Exact slug strings in production are **UNKNOWN**; fixtures in tests are labeled as fixtures.
