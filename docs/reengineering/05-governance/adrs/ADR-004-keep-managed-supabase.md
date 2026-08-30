# ADR-004 — Manter Supabase gerenciado

## Estado

Aceita-com-condições

Aceite formal: 2026-08-30 — Cauã + Raygs (WhatsApp / pacote de aceite). Aceita ≠ implementar Nest/Dokploy/monorepo/DNS no dia do aceite; gates das Fases 2+.

## Contexto

O banco principal e os serviços Auth/Storage/Realtime já estão em **Supabase gerenciado (plano Pro)**, fora da VPS. A auditoria live de 2026-08-28 mostrou escala e complexidade reais: 577 tabelas públicas, 680 policies, 603 functions públicas, 363 `SECURITY DEFINER`, 559 versões no histórico de migrations, drift grave entre live e repositório/tipos TypeScript.

Self-hostar Supabase ou migrar para outro Postgres “nu” agora transferiria risco operacional (Auth, Storage, Realtime, upgrades) para a equipe sem resolver drift, identidade multi-tenant inconsistente (`company_id` vs `tenant_id`) nem ausência de source of truth de schema.

O objetivo declara self-host do Supabase fora de escopo inicial. Dados devem ser tratados como reais (clarificação 2026-08-30).

Esta ADR não autoriza migrations corretivas, `db push`, reset linked nem mudanças de schema na Fase 0.

## Decisão

**Manter Supabase gerenciado** como plataforma de dados e serviços gerenciados:

- PostgreSQL transacional;
- Auth (identidade/sessão);
- Storage;
- Realtime onde apropriado;
- Queues/pgmq conforme ADR-005.

Limites:

- Supabase **não** é instalado no Dokploy/VPS de aplicação;
- RLS é defesa em profundidade; Auth não decide sozinho permissões de negócio;
- `service_role` só em processos server-side autorizados;
- migrations imutáveis com estratégia expand/contract quando a reconciliação estiver definida;
- identidade canônica de tenant/membership é decisão de fundação (Phase 1+), não inventada na Fase 0;
- nenhuma migration corretiva durante a Fase 0; primeiro baseline live, backup/restore comprovado e estratégia de reconciliação;
- tipos TypeScript atuais **não** são contrato confiável frente ao live.

## Alternativas consideradas

- **Self-host Supabase na VPS/Dokploy** — fora de escopo inicial; aumenta carga operacional e acopla dados ao split-brain atual.
- **Postgres gerenciado sem Supabase (RDS/etc.) + Auth/Storage próprios** — migração massiva de Auth/Storage/policies; não cabe no horizonte inicial.
- **Trocar de projeto Supabase agora** — sem restore comprovado e sem inventário completo, risco inaceitável.

## Consequências

### Positivas

- Continuidade operacional sem big bang de dados.
- Auth/Storage/Realtime gerenciados enquanto a aplicação ganha fronteiras.
- Alinhamento com `OBJECTIVE.md` e `TARGET-STACK.md`.
- Permite focar a reengenharia em autoridade de domínio, RLS testada e reconciliação de schema.

### Negativas e custos

- Débito estrutural permanece até reconciliação: drift migrations/tipos, policies com UUID hardcoded, functions anônimas a auditar.
- Dependência de vendor e modelo de grants/RLS do Supabase.
- Tentação de “corrigir” o live na Fase 0 — proibida até evidência e aceite.
- Staging de dados ainda não confirmado; cópia de produção exige procedimento aprovado.

## Critérios de revisão

- Falhas recorrentes de disponibilidade/limites do plano que bloqueiem SLOs após contenção e operação disciplinada.
- Requisito regulatório que exija outro provedor ou região com evidência formal.
- Custo ou features (ex.: filas, Auth) que justifiquem migração planejada pós-cutover, não durante descoberta.

## Evidências

- [`../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md`](../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md)
- [`../../01-current-state/BASELINE.md`](../../01-current-state/BASELINE.md) — banco fora da VPS.
- [`../../00-foundation/OBJECTIVE.md`](../../00-foundation/OBJECTIVE.md) — self-host fora de escopo.
- [`../../02-target-architecture/SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)
- [`../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)
- [`../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md`](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md) — tratar dados como reais; identidade tenant UNKNOWN/DECLARED.
- [`../DECISIONS.md`](../DECISIONS.md)
