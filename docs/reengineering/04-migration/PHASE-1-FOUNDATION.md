# Fase 1 — Contratos e fundação

## Objetivo

Definir limites antes de produzir scaffolding.

## Trabalho

- aprovar módulos de domínio e seus owners;
- unificar identidade de tenant e membership;
- definir RBAC/capabilities;
- definir convenções REST, erros, paginação e versionamento;
- definir idempotência, audit trail e correlation IDs;
- definir contrato de eventos e jobs;
- estabelecer padrões de migrations e compatibilidade;
- escrever ADRs das escolhas tecnológicas.

## Primeiro fluxo vertical

Selecionar um fluxo pequeno, real e representativo que atravesse frontend, API, banco, autorização, logs e deploy. Evitar escolher pagamento, saúde clínica ou IA como primeiro fluxo.

## Critério de saída

ADRs aprovadas, contratos executáveis, módulo piloto escolhido e testes-base de auth/tenant funcionando em ambiente não produtivo.

