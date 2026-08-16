-- RioMed N8N catalog: register required workflows in Core without falsely marking external n8n publication as active.
with tenant as (
  select id from public.communication_tenants where slug='rio-med' and active=true and deleted_at is null limit 1
), specs(workflow_slug,category,description,trigger_type,events) as (
  values
    ('rio-med.lead.intake','crm','Captação e qualificação inicial de leads RioMed','EVENT',array['LEAD_CREATED','MEDICITO_LEAD_CREATED','PORTAL_LEAD_CREATED']),
    ('rio-med.lead.assignment','crm','Distribuição inteligente e auditável de leads para vendedores RioMed','EVENT',array['LEAD_QUALIFIED','SELLER_ASSIGNMENT_REQUIRED']),
    ('rio-med.quote.lifecycle','comercial','Solicitação, envio, acompanhamento e decisão de cotação RioMed','EVENT',array['QUOTE_REQUESTED','QUOTE_SENT','QUOTE_VIEWED','QUOTE_APPROVED','QUOTE_REJECTED']),
    ('rio-med.meeting.lifecycle','agenda','Agendamento, confirmação, lembretes e resultado de reunião comercial RioMed','EVENT',array['MEETING_REQUESTED','MEETING_CONFIRMED','MEETING_REMINDER','MEETING_COMPLETED','MEETING_CANCELED']),
    ('rio-med.support.lifecycle','suporte','Criação, SLA, atualização, escalonamento e encerramento de tickets RioMed','EVENT',array['SUPPORT_TICKET_CREATED','SUPPORT_TICKET_UPDATED','SUPPORT_TICKET_ESCALATED','SUPPORT_TICKET_RESOLVED']),
    ('rio-med.order.lifecycle','comercial','Ciclo comercial do pedido RioMed','EVENT',array['ORDER_CREATED','ORDER_CONFIRMED','ORDER_CANCELED']),
    ('rio-med.payment.lifecycle','financeiro','Eventos financeiros de cobrança quando gateway homologado','EVENT',array['PAYMENT_PENDING','PAYMENT_APPROVED','PAYMENT_FAILED','PAYMENT_REFUNDED']),
    ('rio-med.delivery.lifecycle','logistica','Separação, expedição, atualização e entrega RioMed','EVENT',array['SHIPMENT_CREATED','ORDER_SHIPPED','DELIVERY_UPDATED','ORDER_DELIVERED']),
    ('rio-med.abandoned.cart','conversao','Recuperação de carrinho abandonado sem promessa de pagamento não homologado','EVENT',array['CART_ABANDONED','CART_RECOVERED']),
    ('rio-med.post.sale','relacionamento','Pós-venda, satisfação, manutenção preventiva e próxima melhor ação','EVENT',array['ORDER_DELIVERED','POST_SALE_DUE','NPS_DUE','MAINTENANCE_DUE']),
    ('rio-med.rental.lifecycle','locacao','Solicitação, proposta, contrato, entrega, renovação e devolução de locação RioMed','EVENT',array['RENTAL_REQUESTED','RENTAL_PROPOSED','RENTAL_ACTIVE','RENTAL_RENEWAL_DUE','RENTAL_RETURNED']),
    ('rio-med.maintenance.lifecycle','manutencao','Triagem, diagnóstico, orçamento, aprovação, reparo, teste e liberação','EVENT',array['MAINTENANCE_REQUESTED','MAINTENANCE_DIAGNOSED','MAINTENANCE_QUOTED','MAINTENANCE_APPROVED','MAINTENANCE_RELEASED']),
    ('rio-med.reactivation','relacionamento','Reativação de clientes e oportunidades inativas','SCHEDULE',array['CUSTOMER_INACTIVE','OPPORTUNITY_STALE']),
    ('rio-med.sla.watch','suporte','Monitoramento de tickets próximos do SLA, vencidos ou sem responsável','SCHEDULE',array['SLA_NEAR_DUE','SLA_BREACHED','TICKET_UNASSIGNED']),
    ('rio-med.integration.error','operacao','Tratamento de falhas de integração e dead-letter RioMed','EVENT',array['INTEGRATION_ERROR','WORKFLOW_FAILED']),
    ('rio-med.inventory.alerts','estoque','Alertas de estoque crítico, ruptura e demanda não atendida','EVENT',array['STOCK_CRITICAL','OUT_OF_STOCK','UNMET_DEMAND'])
)
insert into public.n8n_workflow_registry(workflow_slug,version,category,description,plan_min,niches,trigger_type,n8n_workflow_id,status,config)
select s.workflow_slug,1,s.category,s.description,'full',array['rio_med'],s.trigger_type,null,'READY',
       jsonb_build_object(
         'tenant_slug','rio-med',
         'agent','medicito',
         'events',to_jsonb(s.events),
         'source','riomed_master_execution_20260816',
         'requires_external_publish',true,
         'idempotency_required',true,
         'correlation_id_required',true,
         'dead_letter_required',true,
         'canonical_n8n_url','https://n8n.impulsionando.com.br'
       )
from specs s
where not exists (
  select 1 from public.n8n_workflow_registry r where r.workflow_slug=s.workflow_slug and r.version=1
);

with tenant as (
  select id from public.communication_tenants where slug='rio-med' and active=true and deleted_at is null limit 1
), regs as (
  select r.workflow_slug,r.id,r.n8n_workflow_id,r.config
  from public.n8n_workflow_registry r
  where r.workflow_slug like 'rio-med.%' and r.version=1
)
insert into public.communication_automations(tenant_id,automation_key,version,n8n_workflow_id,status,config)
select t.id,r.workflow_slug,1,r.n8n_workflow_id,'DRAFT',
       coalesce(r.config,'{}'::jsonb) || jsonb_build_object('registry_id',r.id,'activation_gate','EXTERNAL_N8N_PUBLISH_AND_E2E_REQUIRED')
from tenant t cross join regs r
where not exists (
  select 1 from public.communication_automations a
  where a.tenant_id=t.id and a.automation_key=r.workflow_slug and a.version=1
);
