with ctx as (
  select t.id tenant_id,b.id brand_id
  from public.communication_tenants t
  left join public.communication_brands b on b.tenant_id=t.id and lower(b.name)=lower('Impulsionando Tecnologia')
  where t.slug='impulsionando'
), defs(template_key,event_type,category,subject_txt,body_txt,required_vars) as (
  values
  ('account.welcome','account.welcome','ACCOUNT'::public.communication_category,'Bem-vindo(a) à Impulsionando','Olá, {{recipient_name}}. Seu acesso ao ecossistema Impulsionando foi criado com sucesso.\\n\\nAcesse sua área: {{access_url}}',array['recipient_name','access_url']::text[]),
  ('account.access.created','account.access.created','ACCOUNT'::public.communication_category,'Seu acesso Impulsionando está disponível','Olá, {{recipient_name}}. Sua área exclusiva está disponível.\\n\\nEntrar agora: {{access_url}}',array['recipient_name','access_url']::text[]),
  ('billing.upcoming','billing.upcoming','BILLING'::public.communication_category,'Próxima cobrança Impulsionando','Olá, {{recipient_name}}. Sua próxima cobrança de {{amount}} vence em {{due_date}}.\\n\\nVer financeiro: {{billing_url}}',array['recipient_name','amount','due_date','billing_url']::text[]),
  ('billing.due.today','billing.due.today','BILLING'::public.communication_category,'Sua cobrança Impulsionando vence hoje','Olá, {{recipient_name}}. Sua cobrança de {{amount}} vence hoje.\\n\\nVer cobrança: {{billing_url}}',array['recipient_name','amount','billing_url']::text[]),
  ('billing.payment.approved','billing.payment.approved','BILLING'::public.communication_category,'Pagamento confirmado','Olá, {{recipient_name}}. Confirmamos o pagamento de {{amount}}. Obrigado.\\n\\nVer financeiro: {{billing_url}}',array['recipient_name','amount','billing_url']::text[]),
  ('billing.payment.failed','billing.payment.failed','BILLING'::public.communication_category,'Não conseguimos confirmar seu pagamento','Olá, {{recipient_name}}. O pagamento de {{amount}} não foi confirmado. Atualize a forma de pagamento para evitar interrupções.\\n\\nRegularizar: {{billing_url}}',array['recipient_name','amount','billing_url']::text[]),
  ('billing.overdue','billing.overdue','BILLING'::public.communication_category,'Cobrança Impulsionando em aberto','Olá, {{recipient_name}}. Identificamos uma cobrança de {{amount}} em aberto desde {{due_date}}.\\n\\nRegularizar: {{billing_url}}',array['recipient_name','amount','due_date','billing_url']::text[]),
  ('billing.restricted','billing.restricted','BILLING'::public.communication_category,'Atenção ao acesso da sua conta','Olá, {{recipient_name}}. Sua conta entrou em período de restrição por uma cobrança em aberto. Seus dados permanecem preservados.\\n\\nRegularizar: {{billing_url}}',array['recipient_name','billing_url']::text[]),
  ('billing.suspended','billing.suspended','BILLING'::public.communication_category,'Conta temporariamente suspensa','Olá, {{recipient_name}}. O acesso aos módulos contratados foi temporariamente suspenso por inadimplência. Nenhum dado foi excluído.\\n\\nRegularizar: {{billing_url}}',array['recipient_name','billing_url']::text[]),
  ('billing.reactivated','billing.reactivated','BILLING'::public.communication_category,'Sua conta Impulsionando foi reativada','Olá, {{recipient_name}}. O pagamento foi identificado e os acessos da sua conta foram reativados.\\n\\nAcessar: {{access_url}}',array['recipient_name','access_url']::text[]),
  ('checkout.abandoned','checkout.abandoned','MARKETING'::public.communication_category,'Seu cadastro ficou quase pronto','Olá, {{recipient_name}}. Você iniciou a contratação de {{product_name}}, mas não concluiu. Seus dados foram preservados para facilitar a retomada.\\n\\nContinuar: {{resume_url}}',array['recipient_name','product_name','resume_url']::text[]),
  ('registration.abandoned','registration.abandoned','ACCOUNT'::public.communication_category,'Continue seu cadastro na Impulsionando','Olá, {{recipient_name}}. Seu cadastro ainda está incompleto. Você pode continuar exatamente de onde parou.\\n\\nContinuar cadastro: {{resume_url}}',array['recipient_name','resume_url']::text[]),
  ('lead.welcome','lead.welcome','MARKETING'::public.communication_category,'Recebemos seu interesse','Olá, {{recipient_name}}. Recebemos seu interesse em {{product_name}}. O Impulsionito pode ajudar a identificar a configuração mais adequada para sua operação.\\n\\nContinuar: {{conversation_url}}',array['recipient_name','product_name','conversation_url']::text[]),
  ('support.ticket.created','support.ticket.created','SUPPORT'::public.communication_category,'Chamado {{ticket_code}} recebido','Olá, {{recipient_name}}. Recebemos o chamado {{ticket_code}}: {{ticket_subject}}.\\n\\nAcompanhar: {{ticket_url}}',array['recipient_name','ticket_code','ticket_subject','ticket_url']::text[]),
  ('support.ticket.updated','support.ticket.updated','SUPPORT'::public.communication_category,'Atualização no chamado {{ticket_code}}','Olá, {{recipient_name}}. Há uma nova atualização no chamado {{ticket_code}}.\\n\\nAcompanhar: {{ticket_url}}',array['recipient_name','ticket_code','ticket_url']::text[]),
  ('support.ticket.resolved','support.ticket.resolved','SUPPORT'::public.communication_category,'Chamado {{ticket_code}} resolvido','Olá, {{recipient_name}}. O chamado {{ticket_code}} foi marcado como resolvido.\\n\\nVer solução: {{ticket_url}}',array['recipient_name','ticket_code','ticket_url']::text[]),
  ('customer.nps','customer.nps','SURVEY'::public.communication_category,'Como está sua experiência com a Impulsionando?','Olá, {{recipient_name}}. Sua opinião nos ajuda a melhorar continuamente o ecossistema.\\n\\nAvaliar experiência: {{survey_url}}',array['recipient_name','survey_url']::text[]),
  ('customer.reactivation','customer.reactivation','MARKETING'::public.communication_category,'Podemos ajudar sua operação a voltar a evoluir','Olá, {{recipient_name}}. Identificamos que sua operação está há algum tempo sem utilizar alguns recursos da Impulsionando.\\n\\nRevisar sua configuração: {{access_url}}',array['recipient_name','access_url']::text[]),
  ('integration.error','integration.error','OPERATIONS'::public.communication_category,'Alerta de integração — {{integration_name}}','A integração {{integration_name}} apresentou uma falha em {{occurred_at}}.\\n\\nDetalhes técnicos: {{integration_url}}',array['integration_name','occurred_at','integration_url']::text[])
), inserted as (
  insert into public.communication_templates(tenant_id,brand_id,template_key,event_type,channel,category,locale,status,current_version)
  select ctx.tenant_id,ctx.brand_id,d.template_key,d.event_type,'EMAIL',d.category,'pt-BR','PUBLISHED',1
  from ctx cross join defs d
  on conflict(tenant_id,template_key,locale) do update set
    event_type=excluded.event_type,channel=excluded.channel,category=excluded.category,status='PUBLISHED',current_version=1,updated_at=now()
  returning id,tenant_id,template_key
)
insert into public.communication_template_versions(
  tenant_id,template_id,version,subject_template,preheader_template,html_template,text_template,
  variables_schema,required_variables,optional_variables,fallback_values,approval_status,published_at
)
select ct.tenant_id,ct.id,1,d.subject_txt,null,
  '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211f">'||replace(replace(d.body_txt,'&','&amp;'),E'\\n','<br>')||'</div>',
  d.body_txt,'{}'::jsonb,d.required_vars,'{}'::text[],'{}'::jsonb,'APPROVED',now()
from public.communication_templates ct
join ctx on ctx.tenant_id=ct.tenant_id
join defs d on d.template_key=ct.template_key
where ct.locale='pt-BR'
on conflict(template_id,version) do update set
  subject_template=excluded.subject_template,
  html_template=excluded.html_template,
  text_template=excluded.text_template,
  required_variables=excluded.required_variables,
  approval_status='APPROVED',
  published_at=coalesce(public.communication_template_versions.published_at,now());

insert into public.communication_automations(tenant_id,automation_key,version,n8n_workflow_id,status,config)
select t.id,k,1,null,'DRAFT',jsonb_build_object(
  'mode','prepared',
  'tenant_slug','impulsionando',
  'execution_engine','n8n',
  'idempotency_required',true,
  'correlation_id_required',true,
  'requires_n8n_connection',true
)
from public.communication_tenants t
cross join unnest(array[
  'new-lead','registration-abandoned','checkout-abandoned','account-welcome',
  'billing-upcoming','billing-due','billing-failed','billing-overdue','billing-suspension','billing-reactivation',
  'support-ticket-created','support-ticket-updated','support-ticket-resolved','customer-nps','customer-reactivation','integration-error','outbox-processor','failed-delivery-recovery'
]) as k
where t.slug='impulsionando'
  and not exists(select 1 from public.communication_automations a where a.tenant_id=t.id and a.automation_key=k);