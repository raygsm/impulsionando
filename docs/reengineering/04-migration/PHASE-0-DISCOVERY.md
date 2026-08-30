# Fase 0 — Contenção e descoberta

## Objetivo

Impedir que o alvo continue mudando e entender o que realmente está em uso.

## Trabalho

- congelar deploys automáticos concorrentes;
- definir owner temporário de produção;
- completar inventários de domínios, API, banco, jobs e integrações;
- medir tráfego e uso por rota/tenant;
- identificar fluxos críticos e SLAs;
- confirmar backups sem executar limpeza;
- capturar comportamento com smoke e characterization tests.

## Entregáveis

- mapa domínio -> runtime -> commit;
- catálogo de endpoints e consumidores;
- catálogo de dados e RLS;
- catálogo de jobs/webhooks;
- mapa de jornadas críticas;
- lista classificada: manter, migrar, substituir, remover ou desconhecido.

## Critério de saída

Nenhum componente crítico permanece com owner, consumidor ou estratégia desconhecidos. Produção possui uma autoridade temporária única e mudanças emergenciais são auditadas.

