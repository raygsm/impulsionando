# Acceleration board — parallel strangler tracks

Atualizado em: **2026-09-01**

Program SoT: [`../STATUS.md`](../STATUS.md)

## Princípio

Acelerar implementação via **verticais strangler em paralelo**, não via atalhos de governança.

| Permitido | Proibido |
| --- | --- |
| Seeds e slices de fases futuras em branches/PRs pequenos | Pular phase gates ou marcar fase como concluída sem evidência |
| Múltiplos tracks de engenharia simultâneos (API, tenant, worker, observability) | Cutover de DNS prod, piloto Chrismed, ou tenant prod |
| Evidência incremental em `STATUS.md` + pastas de fase | Movimento mecânico de todas as rotas TanStack |
| Deploy staging / clean host com SHA pinado | Dokploy ou mutação no VPS legacy |

**Aceitação de ADR ≠ licença para cutover.** Cada fase mantém critérios de saída próprios; paralelismo reduz tempo de fila, não remove gates.

## Tracks ativos

| Track | Fase | Estado | Escopo | Evidência |
| --- | --- | --- | --- | --- |
| **P3 Support** | 3 | **LIVE** | Nest Support pilot em `api.stg` · strangler TanStack | [`phase-3/`](./phase-3/) |
| **P3 residuals** | 3 | Em execução | API redeployed `badfb94d…` ✅ · GHCR push denied (scope) · staff smoke needs valid JWT/password in `.env.staging` | [`phase-3/README.md`](./phase-3/README.md) |
| **P4 tenant resolve** | 4 | **In progress** | RPC applied ✅ · smoke **200** ✅ · API `gitSha=badfb94d…` · GHCR push pending | [`phase-4/`](./phase-4/) |
| **P5 worker skeleton** | 5 | **Iniciada (seed)** | Processo worker independente (bootstrap, health, fila stub) | [`phase-5/`](./phase-5/) |
| **P2 observability** | 2 | Residual | Alertas · RPO/RTO numérico · grey-cloud TLS opcional | [`phase-2/`](./phase-2/) |

## Método de trabalho

1. **Subagentes em paralelo** — um track por agente quando as dependências forem independentes (ex.: P3 residuals + P4 seed + P5 seed).
2. **Evidência obrigatória** — toda mutação registrada em `STATUS.md` e na pasta da fase (`phase-N/`, `clean-host/IMPLEMENTATION-LOG.md` quando VPS).
3. **Um vertical por PR slice** — PR pequeno, revisável, com contrato/teste/smoke quando aplicável; sem “big bang” de rotas.
4. **Staging first** — Supabase staging (`aamorcqznimmleafavai`), clean host `2.25.123.224`; legacy prod `187.77.232.52` é rollback only.
5. **Fechar antes de promover** — seed ≠ fase concluída; gate de saída permanece no README da fase.

## Proibido (todos os tracks)

- Cutover de DNS prod / apex / tenant prod
- Dokploy, wipe ou deploy no VPS legacy (`187.77.232.52`)
- Movimento mecânico de todas as rotas ou `createServerFn` para Nest
- `db push` / reset em prod
- Tratar `latest` ou `build-info.ts` como identidade de release
- Co-start de worker com SSR/API em produção (track P5 é skeleton only)
- Piloto Chrismed ou cutover de tenant antes do gate Phase 4

## Links

| Doc | Uso |
| --- | --- |
| [`STATUS.md`](../STATUS.md) | Estado geral e próximo gate |
| [`phase-3/README.md`](./phase-3/README.md) | Support pilot (LIVE) |
| [`phase-4/README.md`](./phase-4/README.md) | Tenant resolve (seed) |
| [`phase-5/README.md`](./phase-5/README.md) | Worker skeleton (seed) |
| [`phase-2/clean-host/`](./phase-2/clean-host/) | Log de mutações no clean VPS |
