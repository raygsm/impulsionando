# Fase 4 — Frontends e tenants

## Objetivo

Substituir builds e rotas específicas por uma plataforma white-label dirigida por configuração.

## Trabalho

- separar site institucional, app autenticado e tenant web;
- criar resolução canônica hostname -> tenant;
- modelar branding, conteúdo, módulos e feature flags;
- reduzir rotas duplicadas em componentes e configurações compartilhadas;
- migrar um tenant de baixa criticidade;
- repetir cutover usando o checklist padrão.

## Ordem sugerida de tenant

Começar por tenant com baixo tráfego, poucas integrações e responsável disponível. Chrismed, pagamentos e fluxos clínicos não devem ser o piloto sem uma razão documentada.

## Critério de saída

Tenants ativos usam imagens comuns, diferenças são declaradas em dados/configuração e o proxy não escolhe commits por hostname ou path.

