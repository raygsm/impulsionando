# Execução da Fase 0

Início: 2026-08-28  
Atualizado: 2026-08-30

Estado: **CONCLUÍDA** (2026-08-30). Ver [`PHASE-0-EXIT-REPORT.md`](PHASE-0-EXIT-REPORT.md).

## Objetivo operacional

Parar alterações autônomas concorrentes em produção, preservar rotinas protetivas e transformar o legado em catálogos verificáveis antes de qualquer reestruturação.

## Trilhas

| Trilha | Estado | Saída |
| --- | --- | --- |
| Código, API e jobs | Snapshot estático + auth STATIC; consumers live pendentes | [`API-AND-JOBS.md`](API-AND-JOBS.md), [`AUTH-SESSION-TRACE.md`](AUTH-SESSION-TRACE.md) |
| Dados, RLS e Storage | Snapshot + live audit; SoT observacional registrado | [`DATA-AND-RLS.md`](DATA-AND-RLS.md), [`SCHEMA-SOURCE-OF-TRUTH.md`](SCHEMA-SOURCE-OF-TRUTH.md) |
| Supabase live | Inventário estrutural completo; comportamento/DEFINER pendente | [`SUPABASE-LIVE-AUDIT.md`](SUPABASE-LIVE-AUDIT.md) |
| Domínios e runtimes | **LIVE mapa host→upstream→SHA** (2026-08-30); CF rules export pendente | [`DOMAINS-AND-RUNTIMES.md`](DOMAINS-AND-RUNTIMES.md) |
| Deploy e automações | Registry reconciliado; 7 contidos; orphans ativos classificados | [`DEPLOYMENT-PUBLISHERS.md`](DEPLOYMENT-PUBLISHERS.md) |
| Integrações | Catálogo + containers n8n/Evolution LIVE; payments canonical DECLARED | [`INTEGRATIONS.md`](INTEGRATIONS.md), [`PAYMENTS-CANONICAL.md`](PAYMENTS-CANONICAL.md) |
| Assistentes IA (J-14) | Inventário estático; characterization pendente | [`AI-ASSISTANTS-INVENTORY.md`](AI-ASSISTANTS-INVENTORY.md) |
| Jornadas críticas | J-01/J-15 avançados; characterization parcial | [`CRITICAL-JOURNEYS.md`](CRITICAL-JOURNEYS.md) |
| Product map | Coverage completa; behavioral proof pendente | [`../product-map/README.md`](../product-map/README.md) |
| Contenção | 7 workflows disabled; residual orphans | [`CONTAINMENT.md`](CONTAINMENT.md) |
| Backups | Postura Pro documentada; restore **não** provado | [`BACKUPS.md`](BACKUPS.md) |
| Ownership/gates | Raygs product; Cauã+Raygs tech + emergency stub | [`OWNERSHIP-AND-GATES.md`](OWNERSHIP-AND-GATES.md) |
| Evidências | Índice atualizado | [`EVIDENCE-INDEX.md`](EVIDENCE-INDEX.md), [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) |
| Exit | Relatório obrigatório | [`PHASE-0-EXIT-REPORT.md`](PHASE-0-EXIT-REPORT.md) |

## Descobertas críticas

- Split-brain confirmado LIVE: apex `:3490` (`commit: unknown`) ≠ tenants `:3000` (`ebcc52f0`) ≠ candidate `:3500` (`d3ab3c8b`, não público).
- Candidate transient ainda running; Nginx não aponta para 3500.
- 209 registry / 168 checkout / 41 orphans; 202 ainda active.
- Health apex 503: `supabase env missing` no runtime público.
- Schema drift grave; SoT = live observacional.
- Restore Supabase não provado.

## Regras durante a fase

- Não limpar containers/releases/volumes/worktrees.
- Não imprimir secrets.
- Não mudar DNS/routing sem mapa + rollback.
- Nenhuma Fase 1–7.

## Gate de saída

Ainda aberto — lista mínima em OPEN-QUESTIONS e EXIT-REPORT.
