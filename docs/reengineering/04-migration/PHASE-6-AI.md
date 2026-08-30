# Fase 6 — Plataforma de IA

## Objetivo

Adicionar capacidades de IA sem violar isolamento, segurança ou previsibilidade de custos.

## Trabalho

- gateway de modelos e configuração por ambiente;
- contexto autorizado server-side;
- tool registry e classes de risco;
- approval gates;
- RAG isolado por tenant;
- filas para tarefas longas;
- rate limit e orçamento por tenant;
- evals offline e canary;
- telemetria de tokens, custo, latência e resultado;
- políticas de retenção e redaction de dados.

## Critério de saída

Nenhuma ação depende apenas do prompt para segurança; todas as tools revalidam autorização, ações sensíveis são auditadas e existe kill switch por capability/tenant.

