# ADR-002 — Manter TanStack Start nos frontends

## Estado

Aceita

Aceite formal: 2026-08-30 — Cauã + Raygs (WhatsApp / pacote de aceite). Aceita ≠ implementar Nest/Dokploy/monorepo/DNS no dia do aceite; gates das Fases 2+.

## Contexto

O produto já é TanStack Start + React + Vite. O problema central da reengenharia não é o framework de frontend: é a ausência de limites entre UI, regras de negócio, workers e integrações privilegiadas concentradas em routes e `createServerFn`.

Substituir TanStack Start agora forçaria reescrita ampla das superfícies públicas e autenticadas (incluindo white-label por tenant) sem resolver autoridade de domínio, multi-tenancy ou releases. O objetivo declara explicitamente fora de escopo “troca completa do frontend apenas por preferência tecnológica”.

A arquitetura-alvo mantém TanStack Start para React, SSR, routing e BFF fino, extraindo gradualmente o backend embutido para a API NestJS.

Esta ADR não autoriza refatoração em massa de routes na Fase 0.

## Decisão

**Manter TanStack Start** como stack dos frontends (`platform-web`, `tenant-web`, `app-web`).

Limites:

- TanStack pode fazer SSR e BFF fino; **não** concentra domínio, workers nem integrações privilegiadas;
- server functions existentes podem atuar como adapters temporários durante a migração;
- novos casos de uso nascem no domínio/`api` após o gate correspondente;
- componentes React não importam acesso privilegiado ao banco;
- contratos compartilhados vivem em `packages/contracts`;
- não há big bang de reescrita de todas as rotas;
- implementação de apps separados depende de ADR-001 e ADR-008 aceitas e da fase autorizada.

## Alternativas consideradas

- **Migrar para Next.js / Remix / outro meta-framework** — custo alto, benefício incerto; não resolve fronteiras de domínio.
- **SPA pura sem SSR** — perde SEO e first paint em superfícies públicas/tenant; incompatível com o papel atual de várias homepages.
- **Substituir TanStack Start imediatamente ao extrair Nest** — acopla duas migrações; aumenta risco de regressão em tenants P0.

## Consequências

### Positivas

- Preserva investimento e conhecimento do time no stack atual.
- Permite extrair backend sem reescrever toda a UI de uma vez.
- Alinha `TECHNOLOGY-BOUNDARIES.md`: UI/SSR vs API modular.
- Reduz risco em tenants white-label (clarificação: superfícies cliente visualmente separadas).

### Negativas e custos

- Risco de continuar colocando regras de negócio em `createServerFn` se a disciplina de fronteira falhar.
- Dois estilos de servidor (BFF fino + Nest) durante a convivência legado/novo.
- Necessidade de adapters temporários e contratos versionados até a extração completar.

## Critérios de revisão

- Evidência sustentada de que TanStack Start bloqueia requisitos de SSR, multi-tenant routing ou observabilidade que outro framework resolve com custo menor que a migração.
- Decisão formal de unificar BFF e API em um único runtime HTTP (avaliar impacto em workers e deploys).
- Mudança de produto que elimine a necessidade de SSR nas superfícies públicas.

## Evidências

- [`../../01-current-state/BASELINE.md`](../../01-current-state/BASELINE.md)
- [`../../00-foundation/OBJECTIVE.md`](../../00-foundation/OBJECTIVE.md) — fora de escopo: troca completa do frontend por preferência.
- [`../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md) — regra TanStack versus NestJS.
- [`../../02-target-architecture/SYSTEM.md`](../../02-target-architecture/SYSTEM.md)
- [`../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md`](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md) — superfícies cliente separadas.
- [`../DECISIONS.md`](../DECISIONS.md)
