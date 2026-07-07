# Plano de Homologação

Objetivo: validar cada workflow em ambiente demo antes de qualquer
tentativa de produção.

## Ambientes

- **Demo**: `tenant.slug = demo`, dados fictícios, nodes de canal
  `disabled: true`, apenas logs.
- **Sandbox por tenant**: mesmo tenant real mas com flag
  `modo_padrao: demo`. Usa credenciais reais somente em nodes
  explicitamente ligados para o teste.
- **Produção**: só após checklist completo.

## Fases

### Fase 1 — Import & smoke (por workflow)

1. Importar o JSON no N8N sob a pasta `Impulsionando / {categoria}`.
2. Ajustar webhook para `/webhook/impulsionando/demo/{workflow_slug}`.
3. Executar manualmente com o payload de exemplo em
   `docs/n8n/payloads/{workflow_slug}.json`.
4. Verificar log em `/core/automacao/logs` (status `ok` esperado).
5. Marcar workflow como `pronto` no `CATALOGO.md`.

### Fase 2 — Fallback & resiliência

1. Forçar erro (URL inválida no node de canal) → esperar 3 retries →
   sub-workflow `_shared/fallback-humano.json` → log `failed`.
2. Enviar payload inválido → esperar 422 sem execução.
3. Reenviar payload duplicado com mesmo `idempotency_key` → 2ª chamada
   retorna `duplicate: true`.

### Fase 3 — Homologação por tenant

1. Duplicar workflow com prefixo do tenant (`{tenant}/lead-captado`).
2. Substituir templates por versões aprovadas do tenant.
3. Executar com payload real (mas com destinatário interno do tenant).
4. Validar entrega no canal real.
5. Preencher checklist (`checklist-ativacao.md`) para aquele workflow.

## Critérios de aceitação

- 100% dos workflows core em `pronto` ou `ativo`.
- 0 falhas silenciosas (todo erro registra log `failed`).
- Tempo médio de execução ≤ 3s (P95 ≤ 8s).
- Fallback humano acionado em 100% dos cenários de erro simulados.
