# ADR-005 — Usar Supabase Queues inicialmente

## Estado

Aceita-com-condições

Aceite formal: 2026-08-30 — Cauã + Raygs (WhatsApp / pacote de aceite). Aceita ≠ implementar Nest/Dokploy/monorepo/DNS no dia do aceite; gates das Fases 2+.

## Contexto

Trabalho assíncrono hoje está fragmentado: workers iniciados com o web runtime (Pulsonitor, Colors), cron/tick HTTP, Edge Functions, GitHub scheduled workflows e n8n. Não há uma fila durável única com retries, dead-letter e correlation IDs como autoridade.

A Fase 0 registrou que `scripts/start-core-runtime.mjs` sobe web e workers no mesmo container/unidade — falha ou rollout de HTTP pode afetar jobs. Realtime do Supabase não substitui fila de trabalho. IA e integrações futuras (Fase 5–6) exigem jobs demorados fora do ciclo SSR/API.

Supabase Queues / pgmq é a direção inicial em `TARGET-STACK.md`, reutilizando o Postgres gerenciado (ADR-004) sem introduzir broker operacional na VPS legada.

Esta ADR não autoriza provisionar filas, reativar workflows contidos nem implementar workers novos na Fase 0.

## Decisão

Usar **Supabase Queues (pgmq)** como mecanismo **inicial** de fila durável entre `api` (publicação) e `worker` (consumo).

Limites:

- a fila armazena e retenta mensagens; **não** executa o job dentro do banco;
- worker Node é processo independente — não filho do SSR/API;
- retries, idempotência, dead-letter e correlation IDs são obrigatórios no desenho;
- n8n permanece orquestração auxiliar, não source of truth nem substituto da fila de domínio;
- Realtime não é fila de trabalho;
- specialized workers só com evidência de carga/isolamento;
- escolha é deliberadamente **inicial**: pode evoluir para Redis/SQS/etc. com ADR sucessora;
- implementação alinhada às Fases 3–5 após aceite; Fase 0 só inventário e riscos.

## Alternativas consideradas

- **BullMQ/Redis** — maduro; exige Redis operado (Dokploy/VPS) e mais superfície na infra limpa; pode ser evolução se pgmq não atender throughput/latência.
- **SQS / cloud queue** — desacopla do Postgres; adiciona vendor e operação cross-cloud cedo demais.
- **Manter só cron HTTP + workers acoplados ao web** — status quo; viola princípios de unidades de execução e idempotência.
- **Só n8n como fila** — n8n não deve comandar o domínio nem ser a durabilidade canônica.

## Consequências

### Positivas

- Durabilidade alinhada ao Postgres já gerenciado.
- Desacopla lifecycle de web/API do consumo de jobs.
- Base para webhooks, automações e tarefas de IA com retry/idempotência.
- Menos brokers na primeira plataforma limpa.

### Negativas e custos

- Acoplamento operacional fila ↔ Postgres (carga, retenção, particionamento — ex.: tabelas grandes já observadas no live).
- Maturidade/operação de Queues no projeto precisa ser validada em staging antes de produção.
- Migração dos padrões legados (tick HTTP, workers no start) será gradual e arriscada se idempotência falhar.
- Pode exigir ADR sucessora se limites de pgmq forem atingidos.

## Critérios de revisão

- Evidência de throughput, latência, retenção ou isolamento que pgmq não suporte após testes em staging.
- Contenção de recursos no projeto Supabase causada pela fila (impacto em OLTP).
- Requisito de multi-região ou broker gerenciado separado com dono e custo aprovados.

## Evidências

- [`../../01-current-state/phase-0/API-AND-JOBS.md`](../../01-current-state/phase-0/API-AND-JOBS.md)
- [`../../01-current-state/product-map/JOURNEYS.md`](../../01-current-state/product-map/JOURNEYS.md) — J-07 automation/outbox/worker.
- [`../../02-target-architecture/SYSTEM.md`](../../02-target-architecture/SYSTEM.md)
- [`../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)
- [`../../02-target-architecture/AI-READINESS.md`](../../02-target-architecture/AI-READINESS.md) — gate de fila durável antes da Fase 6.
- [`../../02-target-architecture/TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md)
- ADR-004 — manter Supabase gerenciado.
- [`../DECISIONS.md`](../DECISIONS.md)
