# Templates de Fallback Humano

Quando o workflow falha após retries ou detecta cenário sensível
(LGPD, avaliação negativa, escalonamento), aciona-se o fallback humano
via sub-workflow `_shared/fallback-humano.json`.

## Ações padrão

1. Registra log `status: failed`, `channel: internal`.
2. Cria notificação interna (`int.workflow-falhou`) para o responsável
   do tenant.
3. Em produção, opcional: abre ticket no módulo Suporte com prioridade
   herdada.
4. Se `regua = financeiro`, notifica também administrador financeiro
   do tenant.
5. Se `regua = suporte` e `severity ≥ warning`, marca chamado como
   `escalonado_humano`.

## Template de mensagem ao responsável

**fb.responsavel-tenant** (in-app + e-mail interno)
- Assunto: `[Ação necessária] Workflow {{workflow_slug}} pausado`
- Corpo:
```
Olá,

O workflow {{workflow_slug}} do tenant {{tenant_name}} falhou após 3
tentativas.

- Régua: {{regua}}
- Evento: {{event_name}}
- Última mensagem de erro: {{error}}
- Trace: {{traceId}}

Ação sugerida: abrir a trilha em /core/automacao/logs e revisar
credencial / template / payload.

Fallback humano registrado às {{timestamp}}.
```

## Regras

- Nunca expor payloads com PII em texto plano — usar hash/mask.
- Fallback humano NUNCA dispara para o cliente final; apenas para staff
  do tenant.
- Em `modo: demo`, o fallback só gera log — não notifica staff real.
