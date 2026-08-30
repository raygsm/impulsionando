# ADR-001 — Adotar monorepo com pnpm workspaces

## Estado

Aceita-com-condições

Aceite formal: 2026-08-30 — Cauã + Raygs (WhatsApp / pacote de aceite). Aceita ≠ implementar Nest/Dokploy/monorepo/DNS no dia do aceite; gates das Fases 2+.

## Contexto

O repositório atual é um pacote único (`impulsionando-core`) sem workspaces. Frontend, SSR, endpoints HTTP, `createServerFn`, workers e integrações convivem no mesmo grafo de dependências e, em produção, o runtime pode iniciar web e workers no mesmo supervisor.

A Fase 0 observou ~1.083 arquivos em `src/routes`, 111 endpoints sob `src/routes/api`, 331 usos de `createServerFn` e acoplamento web/worker no start do core. A arquitetura-alvo exige unidades de execução separadas (`platform-web`, `tenant-web`, `app-web`, `api`, `worker`) com pacotes compartilhados de contratos, domínio e adapters — sem explosão prematura de microserviços.

Sem um gerenciador de workspace único, a migração incremental (legado convivendo com o novo) carece de fronteiras de importação, builds por app e promoção de imagens por serviço.

Esta ADR não autoriza scaffolding do monorepo na Fase 0.

## Decisão

Adotar **pnpm workspaces** como único gerenciador de pacotes do monorepo modular, com a estrutura-alvo descrita em `02-target-architecture/REPOSITORY.md`:

- `apps/*` — runtimes deployáveis;
- `packages/*` — contratos, domínio, auth, database, integrations, UI, etc.;
- `supabase/` e `infra/` fora dos apps.

Limites:

- TypeScript strict; imports controlados por lint;
- frontends não importam implementações internas do `api`;
- `packages/domain` não depende de infraestrutura;
- não mover mecanicamente as ~1.083 rotas; migrar um fluxo vertical por vez;
- código legado permanece no local atual até haver substituto testado e tráfego migrado;
- implementação só após aceite desta ADR e gate da fase correspondente (não antes do fim da Fase 0 / início da Fase 1).

## Alternativas consideradas

- **Manter pacote único e pastas internas** — mais barato no curto prazo; não impõe fronteiras de dependência nem builds/imagens por unidade de execução.
- **npm/yarn workspaces** — equivalentes em conceito; pnpm é a escolha alinhada a `TARGET-STACK.md` e a isolamento de `node_modules` por pacote.
- **Polyrepo (um repositório por app)** — aumenta custo de contratos versionados e de migração coordenada; inviável enquanto legado e novo precisam coexistir no mesmo programa.
- **Nx/Turborepo como orchestrator obrigatório desde o dia 1** — pode ser avaliado depois; não é pré-requisito para a decisão de workspace.

## Consequências

### Positivas

- Fronteiras explícitas entre apps e packages alinhadas ao monólito modular.
- Builds e imagens por serviço (`api`, `worker`, fronts) sem rebuild acoplado desnecessário.
- Contratos compartilhados (`packages/contracts`) sem copiar tipos entre superfícies.
- Migração incremental: legado e novo no mesmo repositório com gates por fluxo.

### Negativas e custos

- Custo de bootstrap e CI (filtros pnpm, pipelines por package/app).
- Disciplina de imports e ownership de packages; risco de “utils” genéricos sem dono.
- Curva de aprendizado para quem hoje trabalha só no pacote único.
- Tentação de scaffold prematuro antes dos gates — deve ser recusada enquanto a ADR estiver Proposta.

## Critérios de revisão

- Evidência de que o grafo de workspaces impede um fluxo vertical crítico (latência de CI, deadlock de dependências).
- Necessidade comprovada de polyrepo por isolamento regulatório ou times separados.
- Substituição do gerenciador por outro com benefícios medidos (cache, DX) sem perder as fronteiras.

## Evidências

- [`../../01-current-state/BASELINE.md`](../../01-current-state/BASELINE.md) — pacote único, rotas, server functions, workers no mesmo runtime.
- [`../../01-current-state/phase-0/API-AND-JOBS.md`](../../01-current-state/phase-0/API-AND-JOBS.md) — web e workers no mesmo start.
- [`../../02-target-architecture/REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md)
- [`../../02-target-architecture/TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md)
- [`../../00-foundation/PRINCIPLES.md`](../../00-foundation/PRINCIPLES.md) — monólito modular, migração incremental.
- [`../DECISIONS.md`](../DECISIONS.md)
