# Pendências — Automação & N8N

Consolidado do que falta para sair do rascunho. Nada aqui é executado
sem aprovação explícita.

## Credenciais (por tenant)

- [ ] Z-API por tenant (WhatsApp): número + token + webhook de entrada.
- [ ] SMTP/Resend por tenant: domínio verificado (SPF/DKIM/DMARC).
- [ ] Meta Business: homologação dos templates WhatsApp.
- [ ] Chaves de gateway (quando aplicável a workflows financeiros
      específicos).

## N8N (infra)

- [ ] Instância N8N provisionada (ou multi-tenant compartilhada) com:
  - `IMPULSIONANDO_N8N_BASE` configurado.
  - `IMPULSIONANDO_WEBHOOK_SECRET` idêntico ao backend.
  - Credencial `impulsionando-hook-log` apontando para
    `/api/public/hooks/n8n-log` com HMAC helper.
- [ ] Pastas por categoria (Captação, Conversão, ...).
- [ ] Sub-workflows compartilhados (`_shared/fallback-humano`,
      `_shared/plano-gate`, `_shared/mask-pii`) importados uma única
      vez.

## Backend / Codex (fora do lock frontend)

Todas as itens abaixo dependem de aprovação explícita para tocar
backend:

- [ ] Coluna `tenants.modo_automacao` (`demo|producao`) ou tabela
      `tenant_automation_settings`.
- [ ] Tabela `n8n_workflow_registry` (id, slug, versão, categoria,
      plano_min, nichos[]).
- [ ] Tabela `tenant_workflow_state` (tenant_id, workflow_slug,
      status, ultima_execucao, aprovacao_manual_em).
- [ ] View `v_n8n_metrics` agregando `n8n_workflow_runs`.
- [ ] Endpoint `/api/public/hooks/n8n-approve` para registrar
      aprovações manuais com auditoria.
- [ ] Cron para monitorar `sla-vencendo` (workflow 52).
- [ ] Integração com módulo Suporte para abrir ticket via fallback
      humano.

## Frontend (próximas ondas — este lock)

- [ ] Onda 2: geração dos 60+ JSONs importáveis em
      `docs/n8n/workflows/**` + payloads em `docs/n8n/payloads/**`.
- [ ] Onda 3: UI Core `/core/automacao` com 15 subáreas.
- [ ] Onda 4: link cruzado `/admin/clientes/$slug/automacoes`.

## Legal / LGPD

- [ ] Política de retenção de logs revisada com jurídico.
- [ ] Fluxo de "esquecer-me" cobre logs n8n com PII.
- [ ] Termo de aceite específico para automações no onboarding.

## Observabilidade

- [ ] Alertas em `#ops-impulsionando` quando falha > 5% / 15min.
- [ ] Dashboards Grafana / Metabase apontando para `v_n8n_metrics`.
- [ ] Traceparent propagado do backend → N8N → canais.
