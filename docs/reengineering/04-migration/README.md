# Plano de migração por fases

A migração segue o padrão strangler: o sistema novo assume fluxos completos gradualmente enquanto o legado permanece disponível e observável.

| Fase | Documento | Resultado principal |
|---|---|---|
| 0 | [Contenção e descoberta](PHASE-0-DISCOVERY.md) | produção congelada e inventários confiáveis |
| 1 | [Contratos e fundação](PHASE-1-FOUNDATION.md) | contratos, segurança e módulos definidos |
| 2 | [Plataforma e staging](PHASE-2-PLATFORM.md) | staging e deploy reproduzível |
| 3 | [Nova API modular](PHASE-3-API.md) | API modular operando em paralelo |
| 4 | [Frontends e tenants](PHASE-4-TENANTS.md) | frontends e tenants migrados gradualmente |
| 5 | [Workers e integrações](PHASE-5-INTEGRATIONS.md) | workers e integrações desacoplados |
| 6 | [Plataforma de IA](PHASE-6-AI.md) | IA governada e mensurável |
| 7 | [Cutover e retirada do legado](PHASE-7-CUTOVER.md) | produção consolidada e legado retirado |

## Regra de avanço

Uma fase não termina por percentual subjetivo. Ela termina quando seus critérios de saída possuem evidência revisável. Trabalho exploratório da fase seguinte pode ocorrer, mas não pode criar dependência de produção antes do gate.

## Exploratory (paper only — not a phase gate)

> **EXPLORATORY — not authorized for implementation until Phase 0 exit + Phase 1 gate.**

| Document | Purpose |
| --- | --- |
| [Nest domain paper design](exploratory/NEST-DOMAIN-PAPER-DESIGN.md) | Proposed Nest modules, TanStack temporary boundaries, pilot slice, contract sketch — **no Nest code** |
| [Image and runtime layout](exploratory/IMAGE-AND-RUNTIME-LAYOUT.md) | Target `platform-web` / `tenant-web` / `app-web` / `api` / `worker` on paper — **no provisioning** |

These files do not advance Phase 0 or authorize Phases 1–7.
