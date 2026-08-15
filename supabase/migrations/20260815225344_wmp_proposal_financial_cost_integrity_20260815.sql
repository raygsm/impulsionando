create or replace function public.wmp_after_proposal_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_subtotal bigint;
  v_total bigint;
  v_internal bigint;
  v_operational bigint;
begin
  v_subtotal := coalesce((new.commercial_summary->>'subtotal_cents')::bigint,(new.commercial_summary->>'total_cents')::bigint,(new.commercial_summary->>'valor_total_cents')::bigint,0);
  v_total := coalesce((new.commercial_summary->>'total_cents')::bigint,(new.commercial_summary->>'valor_total_cents')::bigint,0);
  v_internal := coalesce((new.commercial_summary->>'internal_cost_cents')::bigint,(new.commercial_summary->>'custo_interno_cents')::bigint,0);
  v_operational := coalesce((new.commercial_summary->>'operational_cost_cents')::bigint,(new.commercial_summary->>'custo_operacional_cents')::bigint,0);

  insert into public.wmp_proposal_versions(
    tenant_id,proposal_id,version,status,snapshot,legal_terms_version,
    subtotal_cents,total_cents,internal_cost_cents,operational_cost_cents,gross_margin_cents,
    generated_at,created_by
  ) values(
    new.tenant_id,new.id,new.current_version,new.status,
    jsonb_build_object('proposal_number',new.proposal_number,'title',new.title,'client',new.client_snapshot,'event',new.event_snapshot,'commercial',new.commercial_summary),
    'WMP-LEGAL-2026.1',v_subtotal,v_total,v_internal,v_operational,v_total-v_internal,
    case when new.status in ('GENERATED','SENT','DELIVERED','VIEWED','NEGOTIATION','REVISION_REQUESTED','ACCEPTED','SIGNED','WON') then now() else null end,
    new.created_by
  ) on conflict (proposal_id,version) do nothing;

  insert into public.wmp_audit_logs(tenant_id,actor_user_id,entity_table,entity_id,action,after_data)
  values(new.tenant_id,new.created_by,'wmp_proposals',new.id,'CREATED',jsonb_build_object(
    'proposal_number',new.proposal_number,'status',new.status,'opportunity_id',new.opportunity_id,
    'total_cents',v_total,'internal_cost_cents',v_internal,'operational_cost_cents',v_operational
  ));
  return new;
end
$function$;