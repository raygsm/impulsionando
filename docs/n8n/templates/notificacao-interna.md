# Templates de Notificação Interna (staff)

Renderizadas no sino do app via `notify_user`. Categoria: `system`,
`crm`, `financeiro`, `suporte`, `operacao`. Severidade: `info`, `warning`,
`error`.

## Financeiro

**int.inadimplencia**
- Título: `Cliente inadimplente — {{customer_name}}`
- Mensagem: `R$ {{payment_amount}} em atraso há {{trial_days_left}} dias.`
- Ação: `Abrir cobrança`

**int.repasse-pendente**
- Título: `Repasse pendente — parceiro {{tenant_name}}`
- Ação: `Ver repasses`

## Suporte

**int.sla-vencendo**
- Título: `SLA vencendo em 30 min — chamado #{{event_name}}`
- Severidade: `warning`

**int.avaliacao-negativa**
- Título: `Avaliação negativa recebida ({{customer_name}})`
- Severidade: `warning`

## Operação

**int.workflow-falhou**
- Título: `Workflow N8N falhou: {{workflow_slug}}`
- Mensagem: primeira linha do erro + `traceId`
- Ação: `Abrir trilha`

## Vitrine

**int.vitrine-removido**
- Título: `Tenant removido da vitrine — {{tenant_name}}`
- Severidade: `warning`
