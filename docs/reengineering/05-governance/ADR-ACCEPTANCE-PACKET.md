# Pacote de Aceite de ADRs — Fase 1 (P1-B)

Data: **2026-08-30**  
Trilha: Fase 1 / P1-B  
Autoridade: [`docs/reengineering/`](../README.md) (fonte da verdade)  
Signatários (Aceita): **somente Cauã + Raygs** — agentes recomendam; humanos marcam Aceita em cada arquivo de ADR.

## Status deste pacote

| Item | Valor |
| --- | --- |
| `Estado` nos arquivos de ADR | **Aceita** / **Aceita-com-condições** (atualizado 2026-08-30) |
| Recomendações | Aceitas por humanos (Cauã + Raygs via WhatsApp) |
| Licença de implementação | **Ainda gated por fase** — Aceita ≠ Nest/Dokploy/monorepo/DNS hoje |

## Aceita ≠ implementar Dokploy / Nest / monorepo hoje

Aceitar uma ADR registra a **direção**. **Não** autoriza:

- bootstrap Nest / criar `apps/api`;
- mover mecanicamente o monorepo / scaffold de todos os `apps/*`;
- instalar Dokploy, mudar DNS/Traefik, limpar ou reconstruir o VPS;
- rodar migrations corretivas em prod / `db push` / reset;
- cutover de tenants ou reativar workflows contidos sem decisão registrada.

| Gate | Ainda exigido após Aceita |
| --- | --- |
| Saída da Fase 1 | Contratos + piloto + baseline de auth/tenant em **não prod** ([`PHASE-1-FOUNDATION.md`](../04-migration/PHASE-1-FOUNDATION.md)) |
| Fase 2 | Staging + Dokploy/GHCR em infra **limpa** ([`STATUS.md`](../STATUS.md)) |
| Fase 3+ | API modular / workers / fronts de tenant conforme docs da fase |

A saída da Fase 0 já afirmou: ADRs permanecem Proposta até Aceita explícita; Nest/Dokploy/apps monorepo continuam **NO-GO** até saída da Fase 1 + gates da Fase 2 ([`PHASE-0-EXIT-REPORT.md`](../01-current-state/phase-0/PHASE-0-EXIT-REPORT.md)).

## Resumo das recomendações

| ID | Decisão | Recomendação | Justificativa principal (Fase 0) |
| --- | --- | --- | --- |
| ADR-001 | Monorepo com pnpm workspaces | **Aceita-com-condições** | Pacote único + acoplamento web/worker; precisa de limites de import/build sem polyrepo |
| ADR-002 | Manter TanStack Start | **Aceita** | Framework FE não é o modo de falha; trocar meta-framework está fora de escopo |
| ADR-003 | API modular NestJS + Fastify | **Aceita-com-condições** | Autoridade fragmentada em HTTP/`createServerFn`/Edge/DB; Nest é direção, não scaffold na Fase 1 |
| ADR-004 | Manter Supabase gerenciado | **Aceita-com-condições** | Projeto Pro ao vivo é SoT real; self-host/migrar DB agora é injustificado |
| ADR-005 | Supabase Queues inicialmente | **Aceita-com-condições** | Async fragmentado; pgmq só inicial — prova em staging antes de jobs em prod |
| ADR-006 | Dokploy em infra limpa | **Aceita-com-condições** | Publishers/proxy em split-brain; só infra paralela limpa — Fase 2 |
| ADR-007 | Imagens GHCR imutáveis por SHA completo | **Aceita** | HTTP 200 ≠ release; vários publishers; precisa build-once / promote-same |
| ADR-008 | Separar platform / tenant / app web | **Aceita-com-condições** | Superfícies de cliente intencionalmente separadas; split físico é Fase 4+, não no dia 1 |

---

## ADR-001 — Monorepo pnpm workspaces

**Arquivo:** [`adrs/ADR-001-pnpm-monorepo-workspaces.md`](adrs/ADR-001-pnpm-monorepo-workspaces.md)  
**Recomendação:** Aceita-com-condições

### Resumo

Adotar pnpm workspaces como único gerenciador de pacotes para um monorepo modular (`apps/*`, `packages/*`, `supabase/`, `infra/`), mantendo o legado no lugar até cada vertical ter substituto testado.

### Justificativa (evidência Fase 0)

- Baseline: um pacote (`impulsionando-core`); ~1.083 rotas, 111 rotas de API, 331 `createServerFn`; web e workers compartilham o start path ([`BASELINE.md`](../01-current-state/BASELINE.md), [`API-AND-JOBS.md`](../01-current-state/phase-0/API-AND-JOBS.md)).
- A forma alvo exige unidades deployáveis separadas sem microserviços prematuros ([`TARGET-STACK.md`](../02-target-architecture/TARGET-STACK.md), [`REPOSITORY.md`](../02-target-architecture/REPOSITORY.md)).
- Polyrepo bloquearia coexistência legado/novo na migração incremental.

### Checklist de aceite (evidência antes / no momento da Aceita)

- [ ] Humanos confirmam o layout de workspaces em [`REPOSITORY.md`](../02-target-architecture/REPOSITORY.md) (sem mover rotas mecanicamente).
- [ ] Regras de fronteira de import acordadas (fronts ↛ internos da api; `domain` ↛ infra).
- [ ] Condição explícita registrada: scaffold/filtros de CI só após saída dos contratos da Fase 1 (ou exceção mais estreita registrada) — não só com Aceita.
- [ ] Nx/Turborepo adiados (opcional depois), não exigência do Dia 1.

### Riscos se Aceita agora

- Agentes tratarem Aceita como licença para mover ~1k rotas ou criar apps vazios imediatamente.
- Custo de bootstrap de CI/workspaces desvia dos contratos (P1-C…G) e da contenção residual (P1-A).
- Pacotes “shared utils” sem donos recriam o monólito sob pastas novas.

### Condições (devem acompanhar a Aceita)

1. Sem migração mecânica de todas as rotas; uma vertical por vez.  
2. Sem trabalho Nest/Dokploy/imagem de prod a partir só desta ADR.  
3. Legado permanece até existir substituto + gate de tráfego.

---

## ADR-002 — Manter frontends TanStack Start

**Arquivo:** [`adrs/ADR-002-keep-tanstack-start-frontends.md`](adrs/ADR-002-keep-tanstack-start-frontends.md)  
**Recomendação:** Aceita

### Resumo

Manter TanStack Start (React/Vite/SSR) para `platform-web`, `tenant-web` e `app-web`; extrair domínio privilegiado para a API modular ao longo do tempo. BFF fino apenas.

### Justificativa (evidência Fase 0)

- O modo de falha é falta de fronteiras de domínio/auth/worker, não o meta-framework FE ([`OBJECTIVE.md`](../00-foundation/OBJECTIVE.md) — troca total de FE fora de escopo).
- Intenção de produto: superfícies de cliente tenant parecem produtos separados ([`CLARIFICATIONS-2026-08-30.md`](../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md) #7).
- Trocar Start enquanto extrai Nest dobra o risco de migração para tenants P0.

### Checklist de aceite

- [ ] Concordar: TanStack = UI/SSR/BFF fino; não domínio, workers ou integrações privilegiadas.
- [ ] Concordar: `createServerFn` existentes podem ser adapters temporários; novos casos de uso entram em `api` após o gate da Fase 3.
- [ ] Sem reescrita big-bang de rotas atrelada à Aceita.

### Riscos se Aceita agora

- Continuar despejando regras de negócio em server functions se contratos/disciplina atrasarem.
- Dois estilos de servidor (BFF + Nest) na coexistência — esperado; precisa de ownership claro.

### Condições

Nenhuma além dos limites da própria ADR. O split físico de apps ainda depende de ADR-001 / ADR-008 e da Fase 4.

---

## ADR-003 — API modular NestJS + Fastify

**Arquivo:** [`adrs/ADR-003-nestjs-fastify-modular-api.md`](adrs/ADR-003-nestjs-fastify-modular-api.md)  
**Recomendação:** Aceita-com-condições

### Resumo

Adotar NestJS com adapter Fastify como runtime modular de `api` para authz, transações, contratos externos, publicação de jobs e health — monólito modular primeiro.

### Justificativa (evidência Fase 0)

- Autoridade fragmentada entre rotas TanStack, server functions, Edge Functions, workers, n8n e DB (`SECURITY DEFINER`) ([`API-AND-JOBS.md`](../01-current-state/phase-0/API-AND-JOBS.md), [`SUPABASE-LIVE-AUDIT.md`](../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md)).
- Pagamentos e clínico não podem ser a primeira vertical; Support (J-13) é o piloto pretendido ([`PHASE-1-FOUNDATION.md`](../04-migration/PHASE-1-FOUNDATION.md), [`PAYMENTS-CANONICAL.md`](../01-current-state/phase-0/PAYMENTS-CANONICAL.md)).
- Alinha com [`TECHNOLOGY-BOUNDARIES.md`](../02-target-architecture/TECHNOLOGY-BOUNDARIES.md) e o plano da Fase 3.

### Checklist de aceite

- [ ] Texto da Aceita afirma: **sem** bootstrap de `apps/api` até saída da Fase 1 **e** staging da Fase 2 saudável ([`STATUS.md`](../STATUS.md)).
- [ ] Módulo piloto não-pagamento / não-clínico (Support / J-13) confirmado.
- [ ] Contratos da Fase 1 para HTTP, identidade de tenant, RBAC, eventos/jobs existem ou estão em andamento (P1-C…F).
- [ ] `service_role` / secrets permanecem só no servidor (documentado).

### Riscos se Aceita agora

- Scaffold Nest prematuro antes dos contratos → fronteiras de módulo erradas.
- “Módulos deus” e autoridade paralela com server functions legadas.
- Tratar Aceita como início da Fase 3 antes do staging.

### Condições

1. Implementação só na Fase 3+ após gates das Fases 1+2.  
2. Primeiro fluxo migrado ≠ billing, clínico ou IA.  
3. Monólito modular; sem extrair microserviço de domínio sem evidência.

---

## ADR-004 — Manter Supabase gerenciado

**Arquivo:** [`adrs/ADR-004-keep-managed-supabase.md`](adrs/ADR-004-keep-managed-supabase.md)  
**Recomendação:** Aceita-com-condições

### Resumo

Manter Supabase gerenciado (Pro) para Postgres, Auth, Storage, Realtime e filas (conforme ADR-005). Não self-host no Dokploy/VPS. Não tratar os tipos TS atuais como contrato de schema.

### Justificativa (evidência Fase 0)

- Auditoria ao vivo: schema public grande, superfície pesada de RLS/DEFINER, drift do histórico de migrations vs repo ([`SUPABASE-LIVE-AUDIT.md`](../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md), [`SCHEMA-SOURCE-OF-TRUTH.md`](../01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md)).
- Self-host / Postgres greenfield adiados em [`OBJECTIVE.md`](../00-foundation/OBJECTIVE.md).
- Dados tratados como reais ([`CLARIFICATIONS-2026-08-30.md`](../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md) #5); backup confirmado, **restore não provado** ([`PHASE-0-EXIT-REPORT.md`](../01-current-state/phase-0/PHASE-0-EXIT-REPORT.md)).
- Identidade de tenant (`company_id` vs modelo de plataforma) ainda é trabalho de contrato da Fase 1 (clarificações #1–2).

### Checklist de aceite

- [ ] Sem migrations corretivas em prod / `db push` / reset até padrão expand-contract (P1-G) + plano de restore em staging (P1-I).
- [ ] Schema ao vivo permanece SoT observacional até estratégia de reconciliação escrita.
- [ ] Projeto Supabase de staging + drill de restore isolado agendado (fecha dívida J-16).
- [ ] RLS = defesa em profundidade; Auth sozinha não decide permissões de negócio.

### Riscos se Aceita agora

- Falsa sensação de que a plataforma de dados está “pronta” enquanto drift, UUIDs hardcoded em policies e dívida de anon DEFINER permanecem.
- Pressão para “consertar” o schema ao vivo sem prova de restore.
- Acoplamento de vendor aceito sem critérios de saída mensurados (já nos critérios de revisão da ADR).

### Condições

1. Reconciliação de schema e contratos de identidade são entregáveis da Fase 1, não efeitos colaterais da Aceita.  
2. Staging + drill de restore antes de confiar no backup para planejamento de cutover.  
3. Supabase fica fora do Dokploy.

---

## ADR-005 — Supabase Queues inicialmente

**Arquivo:** [`adrs/ADR-005-supabase-queues-initially.md`](adrs/ADR-005-supabase-queues-initially.md)  
**Recomendação:** Aceita-com-condições

### Resumo

Usar Supabase Queues (pgmq) como fila durável **inicial** entre `api` (publica) e `worker` Node independente (consome). Retries, idempotência, DLQ e correlation IDs obrigatórios. ADR sucessora permitida se limites forem atingidos.

### Justificativa (evidência Fase 0)

- Jobs hoje: workers co-iniciados com web, cron/tick HTTP, Edge, schedules GH, n8n — sem autoridade durável única ([`API-AND-JOBS.md`](../01-current-state/phase-0/API-AND-JOBS.md)).
- Realtime ≠ fila de trabalho; n8n ≠ SoT de domínio ([`TARGET-STACK.md`](../02-target-architecture/TARGET-STACK.md)).
- Prontidão de IA exige jobs duráveis antes da Fase 6 ([`AI-READINESS.md`](../02-target-architecture/AI-READINESS.md)).
- Depende da ADR-004 (Postgres gerenciado).

### Checklist de aceite

- [ ] Contrato de eventos/jobs (P1-F) define idempotência, DLQ, correlation IDs.
- [ ] Explícito: a fila armazena mensagens; **não** executa jobs dentro do DB.
- [ ] Validação em staging de Queues/pgmq antes de qualquer cutover de job em produção (Fase 2/5).
- [ ] Ciclo de vida do worker independente de SSR/API (não filho do web).
- [ ] Caminho sucessor (Redis/SQS/etc.) reconhecido se contenção OLTP ou throughput falhar no staging.

### Riscos se Aceita agora

- Contenção OLTP em tabelas já grandes ao vivo se filas forem para prod sem prova de carga em staging.
- Reativar workflows contidos “na fila nova” sem gates da Fase 5.
- Tratar Aceita como licença para provisionar filas / novos workers agora.

### Condições

1. Implementação alinhada às Fases 3–5 após Aceita + prova em staging.  
2. Escolha é **inicial**; limites disparam ADR sucessora, não proliferação silenciosa de brokers.  
3. Sem reativação de mutators contidos sem decisão registrada.

---

## ADR-006 — Dokploy em infra limpa

**Arquivo:** [`adrs/ADR-006-dokploy-clean-infra.md`](adrs/ADR-006-dokploy-clean-infra.md)  
**Recomendação:** Aceita-com-condições

### Resumo

Adotar Dokploy como control plane de deploy em infra **nova e limpa** (prod + staging; control plane de preferência separado), Traefik como router de origem, Cloudflare na edge. VPS legado permanece rollback até a Fase 7. Supabase fica fora do Dokploy.

### Justificativa (evidência Fase 0)

- Split-brain: Nginx (não Traefik) como proxy real; Docker + systemd; vários publishers; apex vs tenant podem servir releases diferentes ([`DOMAINS-AND-RUNTIMES.md`](../01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md), [`DEPLOYMENT-PUBLISHERS.md`](../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md)).
- Smoke: HTTP 200 sem identidade de release; padrões de health 503 ([`PUBLIC-SMOKE-BASELINE-2026-08-30.md`](../01-current-state/phase-0/PUBLIC-SMOKE-BASELINE-2026-08-30.md), relatório de saída).
- Instalar Dokploy no VPS legado foi rejeitado na ADR; [`DOKPLOY.md`](../03-platform/DOKPLOY.md) é arquitetura da Fase 2.

### Checklist de aceite

- [ ] Topologia escrita: prod limpa isolada; limites de staging (± controle compartilhado) explícitos se orçamento apertar.
- [ ] Aceita afirma: **sem** install/DNS/cutover/wipe de VPS no dia da Aceita — Fase 2 só após saída da Fase 1.
- [ ] Progresso da contenção residual de publishers (P1-A) reconhecido como risco paralelo.
- [ ] Dokploy não escolhe commit-por-tenant; emparelha com ADR-007.

### Riscos se Aceita agora

- Maior risco de leitura errada: Aceita → provisionar Dokploy / tocar DNS / limpar VPS imediatamente.
- Publishers paralelos enquanto o legado ainda está vivo se a dívida de contenção (~129 workflows mutativos) permanecer.
- Atalhos de topologia por orçamento que misturam prod com control plane.

### Condições

1. Gate da Fase 2 obrigatório para qualquer provisionamento.  
2. Nunca limpar/reinstalar o VPS legado como “preparação.”  
3. Produção nova permanece isolada do legado e de cópias de dados de staging sem procedimento aprovado.

---

## ADR-007 — Imagens GHCR imutáveis por SHA completo

**Arquivo:** [`adrs/ADR-007-ghcr-immutable-sha-images.md`](adrs/ADR-007-ghcr-immutable-sha-images.md)  
**Recomendação:** Aceita

### Resumo

GHCR como registry de imagens de app; identidade = SHA completo do commit Git; build once; promover a mesma imagem staging → prod; proibir `latest` como autoridade de release; rollback = imagem conhecida anterior. `build-info.ts` local não é identidade de release.

### Justificativa (evidência Fase 0)

- Vários publishers e diretórios de release; commit no VPS ≠ conteúdo público ([`DEPLOYMENT-PUBLISHERS.md`](../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md)).
- Smoke público provou HTTP 200 ≠ prova de release ([`PUBLIC-SMOKE-BASELINE-2026-08-28.md`](../01-current-state/phase-0/PUBLIC-SMOKE-BASELINE-2026-08-28.md), baseline 2026-08-30).
- Alinha com [`CI-CD.md`](../03-platform/CI-CD.md) / princípios (build once; nunca `latest` como identidade).

### Checklist de aceite

- [ ] Concordar: SHA é autoritativo; aliases semver/`latest` não autoritativos se usados.
- [ ] Smoke deve checar domínio, TLS, runtime, SHA, superfície — não só status code.
- [ ] Caminho de publish de CI desenhado para Fase 2; push GHCR em prod não exigido na Aceita.
- [ ] `src/generated/build-info.ts` no working tree tratado como ruído local (regra do programa).

### Riscos se Aceita agora

- Baixo risco de direção; risco residual é implementar pipelines de publish em prod antes de contenção/staging.
- Releases legadas fora do GHCR continuam até o cutover — coexistência esperada.

### Condições

Nenhuma além do timing de implementação na Fase 2. Complementa a ADR-006; não exige Aceita do Dokploy antes, mas o fluxo de promoção assume uma autoridade única de deploy eventualmente.

---

## ADR-008 — Separar platform-web / tenant-web / app-web

**Arquivo:** [`adrs/ADR-008-split-platform-tenant-app-web.md`](adrs/ADR-008-split-platform-tenant-app-web.md)  
**Recomendação:** Aceita-com-condições

### Resumo

Três apps web deployáveis: institucional (`platform-web`), white-label público (`tenant-web`, uma imagem para todos os tenants), autenticado (`app-web`). Hostname → config, nunca → commit/imagem diferente por tenant.

### Justificativa (evidência Fase 0)

- Um runtime hoje mistura institucional, vitrine de tenant, app e muito backend; roteamento por host é path/subdomain ([`DOMAINS-AND-RUNTIMES.md`](../01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md)).
- Clarificação #7: apps de cliente são produtos visualmente separados; #3: Raygs é dono da plataforma ([`CLARIFICATIONS-2026-08-30.md`](../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md)).
- Apex/tenant já podem divergir por release — precisa de superfícies intencionais + disciplina same-SHA da ADR-007.

### Checklist de aceite

- [ ] Papéis dos três apps confirmados com Raygs (ownership / raio de blast).
- [ ] Regra travada: hosts desconhecidos/não verificados falham seguro; sem commit-por-tenant no proxy.
- [ ] Split físico adiado para Fase 4+ depois que a API estiver estável o bastante para o módulo migrando.
- [ ] Host canônico de password-reset permanece ABERTO — não inventado na Aceita ([follow-ups das clarificações](../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md)).
- [ ] Depende da direção ADR-001 + ADR-002; emparelha com ADR-007.

### Riscos se Aceita agora

- Split prematuro de rotas antes dos contratos de identidade de tenant e auth (P1-C/D).
- UI duplicada sem disciplina de `packages/ui`.
- Cutover de DNS/host tentado sob “aceitamos os três apps.”

### Condições

1. Sem cutover de DNS/roteamento a partir da Aceita.  
2. Migrar uma vertical por vez; sem mover mecanicamente todas as rotas.  
3. Fase 4+ para o split deployável após fundações das Fases 1–3.

---

## Notas transversais

### Pagamentos / clínico / IA

[`PAYMENTS-CANONICAL.md`](../01-current-state/phase-0/PAYMENTS-CANONICAL.md) fecha a intenção de provedores (MP / MaisFy / CHRISMED segregado / Paddle não canônico). Essa matriz **não** cria uma ADR de pagamentos e **não** deve ser a primeira vertical Nest. IA permanece inventário/governança até a Fase 6.

### Dívida residual da Fase 0 que a Aceita não limpa

- ~129 workflows mutativos/diagnose ainda ativos por match de nome (P1-A).  
- Restore isolado Supabase + RPO/RTO (P1-I).  
- Auth allow/deny CHARACTERIZED E2E ainda aberto.  
- Identidade de release do apex ainda desconhecida no último smoke.

### Ordem sugerida de assinatura (opcional)

1. ADR-002, ADR-007 (menor acoplamento).  
2. ADR-004 → ADR-005.  
3. ADR-001 → ADR-008.  
4. ADR-003, ADR-006 (condições mais fortes de “não implementar ainda”).

Humanos podem assinar tudo de uma vez se as condições acima forem aceitas no bloco de assinatura.

---

## Bloco de assinatura humana

Ao assinar, Cauã e Raygs:

1. Aceitam ou rejeitam cada recomendação abaixo (preencher a coluna Status).  
2. Confirmam que entendem **Aceita ≠** bootstrap Nest, move mecânico de monorepo, install Dokploy, mudanças de DNS/VPS ou fixes de schema em prod.  
3. Autorizam atualizar o `Estado` de cada arquivo de ADR para **Aceita** (ou Adiar/Rejeitar) somente após ambas as assinaturas daquela ADR.

| ID | Recomendação neste pacote | Status humano (preencher) | Data Cauã | Data Raygs | Notas / condições reconhecidas |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | Aceita-com-condições | **Aceita-com-condições** | 2026-08-30 | 2026-08-30 | Condições do pacote reconhecidas |
| ADR-002 | Aceita | **Aceita** | 2026-08-30 | 2026-08-30 | |
| ADR-003 | Aceita-com-condições | **Aceita-com-condições** | 2026-08-30 | 2026-08-30 | Nest só Fase 3+; piloto Support |
| ADR-004 | Aceita-com-condições | **Aceita-com-condições** | 2026-08-30 | 2026-08-30 | Staging + restore antes de cutover trust |
| ADR-005 | Aceita-com-condições | **Aceita-com-condições** | 2026-08-30 | 2026-08-30 | pgmq inicial; prova em staging |
| ADR-006 | Aceita-com-condições | **Aceita-com-condições** | 2026-08-30 | 2026-08-30 | Infra limpa só; sem wipe VPS legado |
| ADR-007 | Aceita | **Aceita** | 2026-08-30 | 2026-08-30 | |
| ADR-008 | Aceita-com-condições | **Aceita-com-condições** | 2026-08-30 | 2026-08-30 | Split físico Fase 4+ |

**Assinatura do programa (pacote revisado):**

| Papel | Nome | Data | Assinatura / confirmação |
| --- | --- | --- | --- |
| Operador técnico | Cauã | 2026-08-30 | Confirmado (operador; registra Aceita no repo) |
| Dono de produto / plataforma | Raygs | 2026-08-30 | Confirmado via WhatsApp (Cauã reportou acordo com recomendações do pacote) |

Piloto vertical: **Support (J-13)** aceito formalmente na mesma data — ver [`PILOT-SUPPORT.md`](../04-migration/phase-1/PILOT-SUPPORT.md).

Após ambos assinarem Aceita para uma ADR: atualizar o `Estado` daquela ADR, sincronizar [`DECISIONS.md`](DECISIONS.md) e [`adrs/README.md`](adrs/README.md), e registrar a decisão no log de execução se o processo da Fase 1 exigir.

---

## Relacionados

- [`DECISIONS.md`](DECISIONS.md)  
- [`adrs/README.md`](adrs/README.md)  
- [`../04-migration/phase-1/README.md`](../04-migration/phase-1/README.md)  
- [`../STATUS.md`](../STATUS.md)  
- [`../01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](../01-current-state/phase-0/PHASE-0-EXIT-REPORT.md)
