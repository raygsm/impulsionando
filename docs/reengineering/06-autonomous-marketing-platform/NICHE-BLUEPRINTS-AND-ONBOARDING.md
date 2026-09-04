# Niche blueprints and onboarding

Created: **2026-09-04**  
Status: **VISION** — frontend must not encode `if (tenant === 'chrismed')` trees.

## Rule

Niche is a **blueprint**: default widgets, terminology, and recommended modules. It is not a separate app.

v1 fixtures (tests / empty-state copy only):

| Blueprint | Typical optional widgets |
| --- | --- |
| Restaurant | orders, inventory, no-shows |
| Medical clinic | appointments, no-shows, tickets |
| Real estate | follow-ups, pipeline, documents |

Onboarding and first-run writes stay Nest (`tenants` + later identity). `app-web` may show a configuring Home when entitlements exist but modules are not `ACTIVE`.
