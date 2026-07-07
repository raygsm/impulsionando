# Checklist de Ativação por Tenant

Nenhum workflow vai para `modo: producao` sem TODOS os itens abaixo
concluídos e registrados em `/core/automacao/aprovacoes`.

## Pré-requisitos do tenant

- [ ] Tenant cadastrado no core (`companies`) com `plan`, `niche`,
      `subdomain` preenchidos.
- [ ] Responsável de automação designado (usuário com papel `admin` do
      tenant).
- [ ] LGPD revisada: consentimento coletado e armazenado por canal.
- [ ] Endereço legal + política de privacidade publicados.

## Canais

- [ ] WhatsApp: número conectado ao Z-API (ou provedor equivalente),
      templates homologados na Meta.
- [ ] E-mail: domínio verificado (SPF/DKIM/DMARC), remetente ativo.
- [ ] Impulsionito: habilitado no plano do tenant.
- [ ] Notificação interna: papéis destinatários definidos por régua.

## Workflows

- [ ] Subset selecionado a partir do `CATALOGO.md` (filtro
      plano × nicho).
- [ ] Cada workflow importado no N8N como `modo: demo`.
- [ ] Payload de exemplo testado (ver `payloads/*.json`).
- [ ] Log real registrado em `n8n_workflow_runs` com `status: ok`.
- [ ] Fallback humano testado (força erro proposital).

## Segurança & LGPD

- [ ] `IMPULSIONANDO_WEBHOOK_SECRET` configurado no N8N e no backend.
- [ ] HMAC validando corretamente (log com `status: ok`, sem 401).
- [ ] Consentimento por canal armazenado (`consent.lgpd_ok`).
- [ ] Opt-out funcionando em WhatsApp e e-mail.
- [ ] Retenção de logs respeitando política do tenant.

## Governança

- [ ] Templates aprovados pelo responsável (WA + e-mail + Impulsionito).
- [ ] Aprovação manual de "go-live" registrada com nome + data.
- [ ] Plano de rollback documentado (`pausar` + comunicação a clientes).
- [ ] Monitoramento configurado (`/core/automacao/monitoramento`).

## Pós-ativação (D+7)

- [ ] Revisão de métricas: entrega, falhas, opt-out.
- [ ] Ajuste de templates conforme resposta.
- [ ] Retrospectiva rápida com responsável do tenant.
