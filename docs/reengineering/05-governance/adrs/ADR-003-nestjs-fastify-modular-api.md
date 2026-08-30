# ADR-003 — Adotar NestJS com Fastify para o API modular

## Estado

Aceita-com-condições

Aceite formal: 2026-08-30 — Cauã + Raygs (WhatsApp / pacote de aceite). Aceita ≠ implementar Nest/Dokploy/monorepo/DNS no dia do aceite; gates das Fases 2+.

## Contexto

Hoje não há uma única fronteira de API: HTTP routes TanStack, `createServerFn`, Edge Functions, workers e n8n podem alterar o mesmo estado. Autorização, casos de uso e contratos externos estão fragmentados; o browser e automações podem chegar perto demais de integrações privilegiadas.

A Fase 0 documentou 111 endpoints sob `src/routes/api`, centenas de server functions e lógica privilegiada também no banco (functions `SECURITY DEFINER`, triggers). O objetivo é concentrar autorização, transações, publicação de jobs e contratos externos em uma API modular, mantendo monólito modular (extração de serviços só com evidência).

NestJS + Fastify é a direção em `TARGET-STACK.md` e `TECHNOLOGY-BOUNDARIES.md`: módulos de domínio, validação de ambiente, contratos Zod/OpenAPI.

Esta ADR **não** autoriza bootstrap Nest, scaffolding de `apps/api` nem implementação na Fase 0.

## Decisão

Adotar **NestJS com adapter Fastify** como runtime do `api` modular.

Responsabilidades do `api`:

- autenticação/autorização de casos de uso;
- transações e invariantes de domínio;
- contratos externos e webhooks assinados;
- publicação de jobs para o worker;
- health/readiness próprios.

Limites:

- não renderiza UI nem controla deploy;
- começa como monólito modular; microserviço por domínio só com evidência de escala, disponibilidade ou isolamento regulatório;
- módulos iniciais alinhados a `SYSTEM.md` (Identity, Tenants, Billing, CRM, Communications, Automations, Integrations, Support, Audit, AI Runtime);
- durante a migração, server functions podem adaptar temporariamente; novos casos de uso nascem no `api` após o gate (Fase 3+);
- `service_role` e secrets privilegiados só em processos server-side autorizados;
- implementação somente após aceite desta ADR e staging saudável conforme `STATUS.md`.

## Alternativas consideradas

- **Manter backend só em TanStack server functions** — perpetua fragmentação e acopla domínio ao ciclo de vida do SSR.
- **Fastify “nu” ou Hono/Express sem Nest** — menos opinião; exige reinventar módulos, DI e padrões de app que Nest já estrutura.
- **NestJS + Express** — suportado; Fastify é a escolha alinhada a desempenho e ao stack proposto.
- **Backend-only em Supabase Edge Functions** — inadequado como dono de domínio; já há 8 Edge Functions e lógica espalhada no Postgres.

## Consequências

### Positivas

- Um dono claro para regras de negócio e autorização.
- Escalabilidade e deploy do `api` independentes dos frontends e do worker.
- Contratos versionados e testes de módulo/contrato próximos ao código.
- Base para policy gates de IA (Fase 6) sem atalhos pelo browser.

### Negativas e custos

- Curva Nest + disciplina de módulos; risco de “god modules”.
- Convivência longa com server functions e Edge Functions legado.
- Esforço de caracterização e testes de contrato antes de migrar cada fluxo.
- Tentação de implementar na Fase 0 — explicitamente proibida.

## Critérios de revisão

- Evidência de que Nest atrasa entregas críticas sem ganho de fronteira (avaliar Fastify nu ou outro framework com mesmos limites).
- Necessidade comprovada de extrair o primeiro serviço separado (revisar escopo do monólito, não necessariamente abandonar Nest).
- Bloqueio técnico do adapter Fastify em requisito de produção documentado.

## Evidências

- [`../../01-current-state/BASELINE.md`](../../01-current-state/BASELINE.md)
- [`../../01-current-state/phase-0/API-AND-JOBS.md`](../../01-current-state/phase-0/API-AND-JOBS.md)
- [`../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md`](../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md) — lógica privilegiada no banco; não substitui API de aplicação.
- [`../../02-target-architecture/SYSTEM.md`](../../02-target-architecture/SYSTEM.md)
- [`../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)
- [`../../02-target-architecture/TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md)
- [`../../04-migration/PHASE-3-API.md`](../../04-migration/PHASE-3-API.md)
- [`../DECISIONS.md`](../DECISIONS.md)
