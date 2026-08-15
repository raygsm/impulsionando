create table if not exists public.wmp_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  proposal_id uuid not null references public.wmp_proposals(id) on delete restrict,
  proposal_version_id uuid not null references public.wmp_proposal_versions(id) on delete restrict,
  contract_number text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','READY','SENT','VIEWED','SIGNED','CANCELLED','EXPIRED')),
  client_snapshot jsonb not null default '{}'::jsonb,
  event_snapshot jsonb not null default '{}'::jsonb,
  commercial_snapshot jsonb not null default '{}'::jsonb,
  clauses_snapshot jsonb not null default '[]'::jsonb,
  access_token_hash text,
  token_expires_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  signer_document text,
  signer_ip inet,
  signer_user_agent text,
  acceptance_evidence jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, contract_number),
  unique (proposal_id, proposal_version_id)
);
create index if not exists idx_wmp_contracts_tenant_status on public.wmp_contracts(tenant_id,status,created_at desc);
create index if not exists idx_wmp_contracts_proposal on public.wmp_contracts(proposal_id);
create unique index if not exists idx_wmp_contracts_token_hash on public.wmp_contracts(access_token_hash) where access_token_hash is not null;
alter table public.wmp_contracts enable row level security;
drop policy if exists wmp_contracts_member_select on public.wmp_contracts;
create policy wmp_contracts_member_select on public.wmp_contracts for select to authenticated using (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']));
drop policy if exists wmp_contracts_member_insert on public.wmp_contracts;
create policy wmp_contracts_member_insert on public.wmp_contracts for insert to authenticated with check (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']));
drop policy if exists wmp_contracts_member_update on public.wmp_contracts;
create policy wmp_contracts_member_update on public.wmp_contracts for update to authenticated using (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR'])) with check (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']));

create or replace function public.create_wmp_contract_from_accepted_proposal(p_proposal_id uuid)
returns table(contract_id uuid, contract_number text, access_token text, status text)
language plpgsql security definer set search_path to 'public','private','extensions'
as $function$
declare v_proposal public.wmp_proposals%rowtype; v_version public.wmp_proposal_versions%rowtype; v_clauses jsonb; v_token text; v_contract public.wmp_contracts%rowtype; v_year text; v_seq bigint;
begin
  select * into v_proposal from public.wmp_proposals where id=p_proposal_id;
  if v_proposal.id is null then raise exception 'proposal_not_found'; end if;
  if not private.is_tenant_member(v_proposal.tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']) then raise exception 'not_authorized'; end if;
  if v_proposal.status not in ('ACCEPTED','SIGNED','WON') then raise exception 'proposal_must_be_accepted_first'; end if;
  select * into v_version from public.wmp_proposal_versions where proposal_id=v_proposal.id and version=v_proposal.current_version;
  if v_version.id is null then raise exception 'proposal_version_not_found'; end if;
  select jsonb_agg(jsonb_build_object('clause_key',clause_key,'version',version,'title',title,'body',body,'parameters',parameters) order by clause_key) into v_clauses from public.wmp_legal_clause_versions where tenant_id=v_proposal.tenant_id and status='ACTIVE' and effective_from<=now() and (effective_until is null or effective_until>now());
  if coalesce(jsonb_array_length(coalesce(v_clauses,'[]'::jsonb)),0)=0 then raise exception 'legal_terms_not_configured'; end if;
  select * into v_contract from public.wmp_contracts where proposal_id=v_proposal.id and proposal_version_id=v_version.id;
  if v_contract.id is not null then
    v_token := encode(extensions.gen_random_bytes(32),'hex');
    update public.wmp_contracts set access_token_hash=encode(extensions.digest(v_token,'sha256'),'hex'), token_expires_at=now()+interval '7 days', updated_at=now() where id=v_contract.id returning * into v_contract;
    return query select v_contract.id,v_contract.contract_number,v_token,v_contract.status; return;
  end if;
  v_year:=to_char(now(),'YYYY'); select coalesce(count(*),0)+1 into v_seq from public.wmp_contracts where tenant_id=v_proposal.tenant_id and extract(year from created_at)=extract(year from now());
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.wmp_contracts(tenant_id,proposal_id,proposal_version_id,contract_number,status,client_snapshot,event_snapshot,commercial_snapshot,clauses_snapshot,access_token_hash,token_expires_at,created_by)
  values(v_proposal.tenant_id,v_proposal.id,v_version.id,'WMP-CON-'||v_year||'-'||lpad(v_seq::text,6,'0'),'READY',v_proposal.client_snapshot,v_proposal.event_snapshot,v_proposal.commercial_summary,v_clauses,encode(extensions.digest(v_token,'sha256'),'hex'),now()+interval '7 days',auth.uid()) returning * into v_contract;
  insert into public.wmp_audit_logs(tenant_id,actor_user_id,entity_table,entity_id,action,after_data) values(v_proposal.tenant_id,auth.uid(),'wmp_contracts',v_contract.id,'CREATED',jsonb_build_object('contract_number',v_contract.contract_number,'proposal_id',v_proposal.id));
  return query select v_contract.id,v_contract.contract_number,v_token,v_contract.status;
end $function$;

create or replace function public.get_wmp_contract_by_token(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v public.wmp_contracts%rowtype;
begin
  if length(coalesce(p_token,''))<40 then return null; end if;
  select * into v from public.wmp_contracts where access_token_hash=encode(extensions.digest(p_token,'sha256'),'hex') limit 1;
  if v.id is null or v.status in ('CANCELLED','EXPIRED') or v.token_expires_at<now() then return null; end if;
  if v.status in ('READY','SENT') then update public.wmp_contracts set status='VIEWED',viewed_at=coalesce(viewed_at,now()),updated_at=now() where id=v.id; end if;
  return jsonb_build_object('id',v.id,'contract_number',v.contract_number,'status',case when v.status in ('READY','SENT') then 'VIEWED' else v.status end,'client',v.client_snapshot,'event',v.event_snapshot,'commercial',v.commercial_snapshot,'clauses',v.clauses_snapshot,'signed_at',v.signed_at,'token_expires_at',v.token_expires_at);
end $function$;

create or replace function public.sign_wmp_contract_by_token(p_token text,p_signer_name text,p_signer_document text,p_ip inet default null,p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path to 'public','extensions'
as $function$
declare v public.wmp_contracts%rowtype; v_now timestamptz:=now();
begin
  if length(coalesce(p_token,''))<40 then raise exception 'invalid_token'; end if;
  select * into v from public.wmp_contracts where access_token_hash=encode(extensions.digest(p_token,'sha256'),'hex') limit 1 for update;
  if v.id is null then raise exception 'invalid_token'; end if; if v.token_expires_at<v_now then raise exception 'expired_token'; end if;
  if v.status='SIGNED' then return jsonb_build_object('ok',true,'contract_id',v.id,'contract_number',v.contract_number,'signed_at',v.signed_at,'already_signed',true); end if;
  if v.status not in ('READY','SENT','VIEWED') then raise exception 'contract_not_signable'; end if;
  if length(trim(coalesce(p_signer_name,'')))<3 then raise exception 'signer_name_required'; end if;
  update public.wmp_contracts set status='SIGNED',signed_at=v_now,signer_name=trim(p_signer_name),signer_document=nullif(trim(coalesce(p_signer_document,'')),''),signer_ip=p_ip,signer_user_agent=left(p_user_agent,500),acceptance_evidence=jsonb_build_object('method','explicit_web_acceptance','accepted_at',v_now,'contract_number',v.contract_number,'proposal_id',v.proposal_id),updated_at=v_now where id=v.id;
  update public.wmp_proposals set status='SIGNED',updated_at=v_now where id=v.proposal_id and status='ACCEPTED';
  update public.wmp_proposal_versions set status='SIGNED',signed_at=coalesce(signed_at,v_now) where id=v.proposal_version_id and status='ACCEPTED';
  insert into public.wmp_audit_logs(tenant_id,entity_table,entity_id,action,after_data) values(v.tenant_id,'wmp_contracts',v.id,'SIGNED',jsonb_build_object('contract_number',v.contract_number,'signed_at',v_now));
  return jsonb_build_object('ok',true,'contract_id',v.id,'contract_number',v.contract_number,'signed_at',v_now,'already_signed',false);
end $function$;
revoke all on function public.create_wmp_contract_from_accepted_proposal(uuid) from public,anon;
grant execute on function public.create_wmp_contract_from_accepted_proposal(uuid) to authenticated;
revoke all on function public.get_wmp_contract_by_token(text) from public;
grant execute on function public.get_wmp_contract_by_token(text) to anon,authenticated;
revoke all on function public.sign_wmp_contract_by_token(text,text,text,inet,text) from public;
grant execute on function public.sign_wmp_contract_by_token(text,text,text,inet,text) to anon,authenticated;
