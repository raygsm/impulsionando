# Reengenharia da Plataforma Impulsionando

Esta pasta é a fonte de verdade do programa de reengenharia da plataforma.

## Objetivo

Transformar o sistema atual em uma plataforma multi-tenant previsível, segura e escalável, capaz de receber novos produtos, integrações e recursos de IA sem repetir a fragmentação operacional existente.

O objetivo não é simplesmente trocar frameworks ou limpar a VPS. O objetivo é obter:

- uma arquitetura compreensível;
- uma única cadeia de deploy reproduzível;
- isolamento verificável entre tenants;
- web, API e processamento assíncrono com responsabilidades claras;
- migração incremental, com rollback e sem reescrita do tipo big bang;
- base segura para automações e IA auditável.

## Regra de autoridade

Os documentos antigos em `docs/` descrevem decisões, ondas e intenções históricas. Eles continuam úteis como evidência do legado, mas não governam a reengenharia, salvo quando forem explicitamente incorporados aqui.

Em caso de conflito:

1. decisões aceitas em `05-governance/DECISIONS.md` prevalecem;
2. a arquitetura em `02-target-architecture/` prevalece sobre documentos históricos;
3. o estado registrado em `STATUS.md` prevalece sobre listas informais;
4. comportamento observado e testes prevalecem sobre documentação antiga.

## Mapa da documentação

| Área           | Entrada principal                                                                                                                               | Pergunta respondida                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Fundação       | [Objetivo](00-foundation/OBJECTIVE.md), [princípios](00-foundation/PRINCIPLES.md) e [visão do stakeholder](00-foundation/STAKEHOLDER-VISION.md) | Por que estamos fazendo isso, o que o stakeholder deseja e quais regras não podem ser quebradas? |
| Estado atual   | [Baseline](01-current-state/BASELINE.md) e [inventário](01-current-state/INVENTORY.md)                                                          | O que existe hoje e o que ainda precisa ser inventariado?                                        |
| Product map    | [Product map](01-current-state/product-map/README.md)                                                                                           | Which actors, surfaces, and journeys form the current product end to end?                         |
| Arquitetura    | [Sistema-alvo](02-target-architecture/SYSTEM.md), [stack-alvo](02-target-architecture/TARGET-STACK.md) e [fronteiras de tecnologia](02-target-architecture/TECHNOLOGY-BOUNDARIES.md) | Como será o sistema novo e qual tecnologia faz o quê?                                            |
| Plataforma     | [Dokploy](03-platform/DOKPLOY.md) e [CI/CD](03-platform/CI-CD.md)                                                                               | Como ambientes, builds e releases funcionarão?                                                   |
| Migração       | [Plano por fases](04-migration/README.md)                                                                                                       | Em que ordem migraremos sem interromper produção?                                                |
| Governança     | [Decisões](05-governance/DECISIONS.md), [riscos](05-governance/RISKS.md), [Definition of Done](05-governance/DEFINITION-OF-DONE.md), [Implementation rules (agents)](05-governance/IMPLEMENTATION-RULES.md) | Como decisões, riscos, close-out de agentes e conclusão serão controlados? |
| Produto proposto | [Autonomous Marketing Platform](06-autonomous-marketing-platform/README.md)                                                                      | Qual produto único, dashboard, módulos, blueprints e agentes a nova estrutura deve entregar?     |
| Acompanhamento | [Status](STATUS.md) · [Update canvas](04-migration/UPDATE-CANVAS.md) · [Acceleration board](04-migration/ACCELERATION-BOARD.md) | Onde estamos, tasks abertas e lanes paralelas? |

## Sequência obrigatória

1. Ler [objetivo](00-foundation/OBJECTIVE.md) e [princípios](00-foundation/PRINCIPLES.md).
2. Confirmar o baseline e completar o inventário.
3. Aprovar a arquitetura-alvo e registrar decisões pendentes.
4. Construir staging e CI/CD antes de migrar funcionalidades.
5. Migrar por módulo e tenant usando o padrão strangler.
6. Adicionar IA somente depois dos limites de autorização, filas e auditoria.
7. Remover o legado somente após cutover comprovado e janela de rollback.

## Estado deste documento

A Fase 0 foi **concluída em 2026-08-30** ([exit report](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md)); as Fases 1–6 foram posteriormente fechadas em staging. A Fase 7 está **IN PROGRESS** e a Fase 8 está em **PLANNING — NOT STARTED**. A formulação de produto em [`06-autonomous-marketing-platform/`](06-autonomous-marketing-platform/README.md) é **PROPOSED** e não altera gates por si só. Estado corrente e ações proibidas: [`STATUS.md`](STATUS.md).
