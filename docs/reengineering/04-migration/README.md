# Plano de migração por fases

A migração segue o padrão strangler: o sistema novo assume fluxos completos gradualmente enquanto o legado permanece disponível e observável.

| Fase | Documento | Resultado principal |
|---|---|---|
| 0 | [Contenção e descoberta](PHASE-0-DISCOVERY.md) | produção congelada e inventários confiáveis |
| 1 | [Contratos e fundação](PHASE-1-FOUNDATION.md) · [board](phase-1/README.md) | contratos, segurança e módulos definidos |
| 2 | [Plataforma e staging](PHASE-2-PLATFORM.md) · [board](phase-2/README.md) | staging e deploy reproduzível |
| 3 | [Nova API modular](PHASE-3-API.md) | API modular operando em paralelo |
| 4 | [Frontends e tenants](PHASE-4-TENANTS.md) | 4A resolve fechado; 4B configuração/frontends/tenant piloto aberta |
| 5 | [Workers e integrações](PHASE-5-INTEGRATIONS.md) | workers e integrações desacoplados |
| 6 | [Plataforma de IA](PHASE-6-AI.md) | IA governada e mensurável |
| 7 | [Cutover e retirada do legado](PHASE-7-CUTOVER.md) · [board](phase-7/README.md) · [parallel plan](phase-7/PARALLEL-SPEED-PLAN.md) | 7A–7E cutover; **7F PARKED** |

## Operational canvas (current)

Live task board: [`UPDATE-CANVAS.md`](./UPDATE-CANVAS.md) · [`ACCELERATION-BOARD.md`](./ACCELERATION-BOARD.md) · Phase 7 Wave 0: [`phase-7/PARALLEL-SPEED-PLAN.md`](./phase-7/PARALLEL-SPEED-PLAN.md)

## Product-intake integration plan

Raygs's root [`../../../product-intake/`](../../../product-intake/) corpus is mapped into phase-gated platform foundations, vertical waves, and separately gated regulated programs in:

[`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md)

The plan adds Phase 4B, explicit Phase 5A–5G and Phase 6A–6F gates, vertical migration waves, and a narrow Phase 7 cutover boundary. Intake remains product input; it does not authorize implementation by itself.

## Phase 2 planning opened 2026-08-30

ADRs 001–008 Aceitas / Aceita-com-condições. **Planejamento** da Fase 2 autorizado; **não** provisionar Dokploy, mudar DNS, wipe VPS, bootstrap Nest, nem `db push`/reset — Aceita ≠ implementar hoje. Workboard e planos: [`phase-2/README.md`](phase-2/README.md), [`phase-2/CLEAN-INFRA-TOPOLOGY.md`](phase-2/CLEAN-INFRA-TOPOLOGY.md), [`phase-2/GHCR-AND-PROMOTE.md`](phase-2/GHCR-AND-PROMOTE.md). Residual Fase 1 (restore staging + auth/tenant non-prod) permanece gate para *implementação* de plataforma.

## Regra de avanço

Uma fase não termina por percentual subjetivo. Ela termina quando seus critérios de saída possuem evidência revisável. Trabalho exploratório da fase seguinte pode ocorrer, mas não pode criar dependência de produção antes do gate.

## Exploratory (paper only — not a phase gate)

> **EXPLORATORY — paper design only.** Nest/Dokploy/monorepo still phase-gated; Aceita ADRs ≠ Day-0 implementation.

| Document | Purpose |
| --- | --- |
| [Nest domain paper design](exploratory/NEST-DOMAIN-PAPER-DESIGN.md) | Proposed Nest modules, TanStack temporary boundaries, pilot slice, contract sketch — **no Nest code** |
| [Image and runtime layout](exploratory/IMAGE-AND-RUNTIME-LAYOUT.md) | Target `platform-web` / `tenant-web` / `app-web` / `api` / `worker` on paper — **no provisioning** |

These files do not replace the Phase 2 board or authorize provisioning.
