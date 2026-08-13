-- Reconciliacao de producao: registra no catalogo os workflows Impulsionando
-- comprovados no runtime n8n da VPS. IDs abaixo sao IDs externos do n8n,
-- nao IDs gerados pelo banco.
with live(workflow_slug, category, n8n_workflow_id, description) as (
  values
  ('impulsionando.captacao.lead-captado','captacao','kjdkkV9rjIMgAMdA','Lead captado'),
  ('impulsionando.captacao.lead-qualificado','captacao','YT7nYlKuQryGUNEq','Lead qualificado'),
  ('impulsionando.captacao.lead-sem-resposta','captacao','TwxMj5XSMgUEbXiD','Lead sem resposta'),
  ('impulsionando.captacao.lead-vitrine','captacao','NYX6Bo1dlyd7b3P7','Lead originado na vitrine'),
  ('impulsionando.captacao.lead-whatsapp','captacao','J2vrRXk9L2WoRfam','Lead originado no WhatsApp'),
  ('impulsionando.captacao.lead-quiz','captacao','s1fiGRPTRcyeAPyt','Lead originado em quiz'),
  ('impulsionando.captacao.lead-redes-sociais','captacao','CUFC3smxigoC5hOx','Lead originado em redes sociais'),
  ('impulsionando.conversao.cadastro-iniciado','conversao','FmNmDqMNYbbW3fM7','Cadastro iniciado'),
  ('impulsionando.conversao.cadastro-abandonado','conversao','WavassyWPggKwThY','Cadastro abandonado'),
  ('impulsionando.conversao.cadastro-concluido','conversao','cBPqXfXfP0H3pAbs','Cadastro concluido'),
  ('impulsionando.conversao.checkout-iniciado','conversao','7i5gHQnraIKzgdz1','Checkout iniciado'),
  ('impulsionando.conversao.pix-gerado','conversao','njO3SGf3tl3j8wh0','PIX gerado'),
  ('impulsionando.conversao.cartao-recusado','conversao','SXW6oLezwWFvAGwN','Cartao recusado'),
  ('impulsionando.conversao.boleto-emitido','conversao','y080sHJouKP66SAH','Boleto emitido'),
  ('impulsionando.conversao.pagamento-aprovado','conversao','iGZ5djNpjie6WSTB','Pagamento aprovado'),
  ('impulsionando.conversao.boleto-pago','conversao','VwGvbkMMVKU2CQ3E','Boleto pago'),
  ('impulsionando.conversao.trial-premium-iniciado','conversao','1QysKcsGaLHountH','Trial premium iniciado'),
  ('impulsionando.relacionamento.onboarding-d0','relacionamento','vvqBbKmhz6gF1szf','Onboarding D0'),
  ('impulsionando.relacionamento.onboarding-d1','relacionamento','hdyhky3EYUcOPaAk','Onboarding D1'),
  ('impulsionando.relacionamento.onboarding-d3','relacionamento','NcPcGGHAbAmbrMiG','Onboarding D3'),
  ('impulsionando.relacionamento.onboarding-d7','relacionamento','QSfPQDe2C63j7ZNp','Onboarding D7'),
  ('impulsionando.relacionamento.cliente-sem-uso','relacionamento','JJu7F0uXxS1RN7BK','Cliente sem uso'),
  ('impulsionando.relacionamento.cliente-engajado','relacionamento','0dA5lyMj9LtObOdg','Cliente engajado'),
  ('impulsionando.relacionamento.sugestao-recurso','relacionamento','SMbKe6dT2j2Qs9gt','Sugestao de recurso'),
  ('impulsionando.relacionamento.tutorial-automatico','relacionamento','F0asmrhkiplhhrYW','Tutorial automatico'),
  ('impulsionando.relacionamento.impulsionito-proativo','relacionamento','3m68WaCpdlC6G9Vh','Impulsionito proativo')
), upserted as (
  insert into public.n8n_workflow_registry(
    workflow_slug, version, category, description, trigger_type,
    n8n_workflow_id, status, config
  )
  select
    workflow_slug, 1, category, description, 'webhook', n8n_workflow_id, 'ACTIVE',
    jsonb_build_object(
      'source', 'live_vps_audit',
      'canonical_n8n_url', 'https://n8n.impulsionando.com.br'
    )
  from live
  on conflict (workflow_slug, version) do update
    set category = excluded.category,
        description = excluded.description,
        n8n_workflow_id = excluded.n8n_workflow_id,
        status = 'ACTIVE',
        config = public.n8n_workflow_registry.config || excluded.config,
        updated_at = now()
  returning id
)
insert into public.tenant_workflow_state(tenant_id, registry_id, status, config)
select tenant.id, registry.id, 'ACTIVE', jsonb_build_object('source', 'live_vps_audit')
from upserted registry
cross join lateral (
  select id
  from public.communication_tenants
  where slug = 'impulsionando' and active = true
  order by created_at asc
  limit 1
) tenant
on conflict (tenant_id, registry_id) do update
  set status = 'ACTIVE',
      config = public.tenant_workflow_state.config || excluded.config,
      updated_at = now();
