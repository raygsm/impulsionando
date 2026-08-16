-- Repair legacy functions identified by the production DB linter.
-- No tables/data are dropped. Public function signatures remain unchanged.

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
 select jsonb_agg(jsonb_build_object('clause_key',wlc.clause_key,'version',wlc.version,'title',wlc.title,'body',wlc.body,'parameters',wlc.parameters) order by wlc.clause_key) into v_clauses
 from public.wmp_legal_clause_versions wlc
 where wlc.tenant_id=v_proposal.tenant_id and wlc.status='ACTIVE' and wlc.effective_from<=now() and (wlc.effective_until is null or wlc.effective_until>now());
 if coalesce(jsonb_array_length(coalesce(v_clauses,'[]'::jsonb)),0)=0 then raise exception 'legal_terms_not_configured'; end if;
 select * into v_contract from public.wmp_contracts wc where wc.proposal_id=v_proposal.id and wc.proposal_version_id=v_version.id;
 if v_contract.id is not null then
   v_token:=encode(extensions.gen_random_bytes(32),'hex');
   update public.wmp_contracts wc set access_token_hash=encode(extensions.digest(v_token,'sha256'),'hex'),token_expires_at=now()+interval '7 days',updated_at=now() where wc.id=v_contract.id returning * into v_contract;
   return query select v_contract.id,v_contract.contract_number,v_token,v_contract.status; return;
 end if;
 v_year:=to_char(now(),'YYYY');
 select coalesce(count(*),0)+1 into v_seq from public.wmp_contracts wc where wc.tenant_id=v_proposal.tenant_id and extract(year from wc.created_at)=extract(year from now());
 v_token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.wmp_contracts(tenant_id,proposal_id,proposal_version_id,contract_number,status,client_snapshot,event_snapshot,commercial_snapshot,clauses_snapshot,access_token_hash,token_expires_at,created_by)
 values(v_proposal.tenant_id,v_proposal.id,v_version.id,'WMP-CON-'||v_year||'-'||lpad(v_seq::text,6,'0'),'READY',v_proposal.client_snapshot,v_proposal.event_snapshot,v_proposal.commercial_summary,v_clauses,encode(extensions.digest(v_token,'sha256'),'hex'),now()+interval '7 days',auth.uid()) returning * into v_contract;
 insert into public.wmp_audit_logs(tenant_id,actor_user_id,entity_table,entity_id,action,after_data) values(v_proposal.tenant_id,auth.uid(),'wmp_contracts',v_contract.id,'CREATED',jsonb_build_object('contract_number',v_contract.contract_number,'proposal_id',v_proposal.id));
 return query select v_contract.id,v_contract.contract_number,v_token,v_contract.status;
end $function$;

create or replace function public.colors_my_dashboard()
returns jsonb language plpgsql security definer set search_path to 'public','auth'
as $function$
declare v_uid uuid:=auth.uid(); v_colors uuid; v_core uuid; v_profile jsonb; v_orders jsonb; v_group jsonb;
begin
 if v_uid is null then raise exception 'not_authenticated'; end if; perform public.colors_link_current_user();
 select colors_contact_id,communication_contact_id into v_colors,v_core from public.colors_customer_accounts where user_id=v_uid;
 select jsonb_build_object('id',c.id,'name',c.full_name,'email',c.email,'whatsapp',c.whatsapp,'lifecycle_stage',c.lifecycle_stage,'lead_score',c.lead_score,'next_best_action',c.next_best_action) into v_profile from public.colors_contacts c where c.id=v_colors;
 select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'number',o.order_number,'status',o.status,'currency',o.currency,'subtotal',o.subtotal,'discount',o.discount_total,'shipping',coalesce((o.metadata->>'shipping')::numeric,0),'total',o.total,'created_at',o.created_at,'metadata',o.metadata,'items',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'description',i.description,'quantity',i.quantity,'unit_price',i.unit_price,'discount',i.discount,'total',i.total)),'[]'::jsonb) from public.sales_order_items i where i.order_id=o.id)) order by o.created_at desc),'[]'::jsonb) into v_orders from public.sales_orders o where o.contact_id=v_core and o.company_id=(select id from public.companies where document='58.255.587/0001-60' limit 1);
 perform public.colors_refresh_group_eligibility(v_colors);
 select jsonb_build_object('status',eligibility_status,'reason',eligibility_reason,'invited_at',invite_sent_at,'joined_at',joined_at) into v_group from public.colors_group_access where contact_id=v_colors and eligibility_status in ('pending','eligible','invited','joined') order by created_at desc limit 1;
 return jsonb_build_object('profile',v_profile,'orders',v_orders,'group_access',coalesce(v_group,'{}'::jsonb));
end $function$;

create or replace function public.colors_my_order(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','auth'
as $function$
declare v_uid uuid:=auth.uid(); v_core uuid; v_order jsonb;
begin
 if v_uid is null then raise exception 'not_authenticated'; end if; perform public.colors_link_current_user(); select communication_contact_id into v_core from public.colors_customer_accounts where user_id=v_uid;
 select jsonb_build_object('id',o.id,'number',o.order_number,'status',o.status,'currency',o.currency,'subtotal',o.subtotal,'discount',o.discount_total,'shipping',coalesce((o.metadata->>'shipping')::numeric,0),'total',o.total,'created_at',o.created_at,'metadata',o.metadata,'items',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'description',i.description,'quantity',i.quantity,'unit_price',i.unit_price,'discount',i.discount,'total',i.total)),'[]'::jsonb) from public.sales_order_items i where i.order_id=o.id)) into v_order from public.sales_orders o where o.id=p_order_id and o.contact_id=v_core and o.company_id=(select id from public.companies where document='58.255.587/0001-60' limit 1);
 if v_order is null then raise exception 'order_not_found'; end if; return v_order;
end $function$;

create or replace function public.cp_create_invitation(p_phone text,p_alias_hint text default null::text)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public','auth','extensions'
as $function$
declare v_uid uuid:=auth.uid(); v_phone text; v_token text; v_hash text; v_phone_hash text; v_id uuid;
begin
 if v_uid is null then raise exception 'authentication_required'; end if;
 v_phone:=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g'); if length(v_phone)<10 or length(v_phone)>15 then raise exception 'invalid_phone'; end if;
 v_token:=encode(extensions.gen_random_bytes(32),'hex'); v_hash:=encode(extensions.digest(v_token,'sha256'),'hex'); v_phone_hash:=encode(extensions.digest(v_phone,'sha256'),'hex');
 insert into public.cp_invitations(inviter_user_id,invited_phone_hash,invited_alias_hint,invitation_token_hash,state,expires_at) values(v_uid,v_phone_hash,nullif(trim(p_alias_hint),''),v_hash,'invited',now()+interval '72 hours') returning id into v_id;
 return jsonb_build_object('invitation_id',v_id,'invitation_token',v_token,'expires_at',now()+interval '72 hours');
end $function$;

create or replace function public.cp_accept_invitation(p_token text)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public','auth','extensions'
as $function$
declare v_uid uuid:=auth.uid(); v_aal text:=coalesce(auth.jwt()->>'aal',''); v_hash text; v_inv public.cp_invitations%rowtype; v_phone text; v_phone_hash text;
begin
 if v_uid is null then raise exception 'authentication_required'; end if; if v_aal<>'aal2' then raise exception 'aal2_required'; end if; if nullif(trim(p_token),'') is null then raise exception 'token_required'; end if;
 v_hash:=encode(extensions.digest(p_token,'sha256'),'hex'); select * into v_inv from public.cp_invitations where invitation_token_hash=v_hash for update;
 if v_inv.id is null then raise exception 'invitation_not_found'; end if; if v_inv.state<>'invited' then raise exception 'invalid_invitation_state'; end if;
 if v_inv.expires_at<=now() then update public.cp_invitations set state='expired',updated_at=now() where id=v_inv.id; raise exception 'invitation_expired'; end if;
 select regexp_replace(coalesce(phone,''),'[^0-9]','','g') into v_phone from auth.users where id=v_uid; if nullif(v_phone,'') is null then raise exception 'verified_phone_required'; end if;
 v_phone_hash:=encode(extensions.digest(v_phone,'sha256'),'hex'); if v_phone_hash<>v_inv.invited_phone_hash then raise exception 'invitation_identity_mismatch'; end if;
 update public.cp_invitations set invitee_user_id=v_uid,state='invitee_accepted',second_factor_type='supabase_aal2',second_factor_verified_at=now(),invitee_accepted_at=now(),updated_at=now() where id=v_inv.id;
 return jsonb_build_object('accepted',true,'invitation_id',v_inv.id,'state','invitee_accepted','requires_inviter_confirmation',true);
end $function$;

create or replace function public.wmp_bind_verified_user_to_ticket(p_protocol text,p_full_name text,p_cpf text)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','public','auth'
as $function$
declare v_uid uuid:=auth.uid(); v_contact uuid; v_cpf text:=regexp_replace(coalesce(p_cpf,''),'[^0-9]','','g');
begin
 if v_uid is null then return false; end if; if length(trim(coalesce(p_full_name,'')))<5 or length(v_cpf)<>11 then return false; end if; if not exists(select 1 from auth.users where id=v_uid and email_confirmed_at is not null and phone_confirmed_at is not null) then return false; end if;
 select t.contact_id into v_contact from public.communication_conversation_tickets t join public.communication_tenants ct on ct.id=t.tenant_id and ct.slug='wmp' where t.protocol=p_protocol;
 if v_contact is null then return false; end if;
 update public.communication_contacts set user_id=v_uid,display_name=trim(p_full_name),attributes=coalesce(attributes,'{}'::jsonb)||jsonb_build_object('cpf',v_cpf),updated_at=now() where id=v_contact;
 update public.communication_conversation_tickets t set export_status='READY',updated_at=now() where t.protocol=p_protocol; return true;
end $function$;

create or replace function public.wmp_bind_verified_user_to_ticket(p_protocol text,p_access_token uuid,p_full_name text,p_cpf text)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','public','auth'
as $function$
declare v_uid uuid:=auth.uid(); v_contact uuid; v_existing uuid;
begin
 if v_uid is null or not public.wmp_valid_cpf(p_cpf) or length(trim(coalesce(p_full_name,'')))<5 then return false; end if; if not exists(select 1 from auth.users where id=v_uid and email_confirmed_at is not null and phone_confirmed_at is not null) then return false; end if;
 select t.contact_id,c.user_id into v_contact,v_existing from public.communication_conversation_tickets t join public.communication_contacts c on c.id=t.contact_id join public.communication_tenants ct on ct.id=t.tenant_id and ct.slug='wmp' where t.protocol=p_protocol and t.access_token=p_access_token;
 if v_contact is null or (v_existing is not null and v_existing<>v_uid) then return false; end if;
 update public.communication_contacts set user_id=v_uid,display_name=trim(p_full_name),attributes=coalesce(attributes,'{}'::jsonb)||jsonb_build_object('cpf',regexp_replace(p_cpf,'[^0-9]','','g')),updated_at=now() where id=v_contact;
 update public.communication_conversation_tickets t set export_status='READY',updated_at=now() where t.protocol=p_protocol and t.access_token=p_access_token; return true;
end $function$;

create or replace function public.wmp_get_verified_transcript(p_protocol text,p_access_token uuid)
returns jsonb language plpgsql stable security definer set search_path to 'pg_catalog','public','auth'
as $function$
declare v_uid uuid:=auth.uid(); v_ticket public.communication_conversation_tickets%rowtype; v_eligible boolean; v_messages jsonb;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select t.* into v_ticket from public.communication_conversation_tickets t join public.communication_tenants ct on ct.id=t.tenant_id and ct.slug='wmp' where t.protocol=p_protocol and t.access_token=p_access_token;
 if v_ticket.id is null then raise exception 'TICKET_NOT_FOUND'; end if;
 if not exists(select 1 from public.communication_contacts c where c.id=v_ticket.contact_id and c.user_id=v_uid) then raise exception 'FORBIDDEN'; end if;
 select coalesce((public.wmp_export_eligibility(v_ticket.contact_id)->>'eligible')::boolean,false) into v_eligible; if not v_eligible then raise exception 'VERIFICATION_REQUIRED'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'author_type',m.author_type,'direction',m.direction,'body_text',m.body_text,'content',m.content,'occurred_at',m.occurred_at) order by m.occurred_at,m.created_at),'[]'::jsonb) into v_messages from public.communication_conversation_messages m where m.conversation_id=v_ticket.conversation_id and m.tenant_id=v_ticket.tenant_id;
 return jsonb_build_object('protocol',v_ticket.protocol,'closed_at',v_ticket.closed_at,'messages',v_messages);
end $function$;

create or replace function public.wmp_register_conversation_export(p_protocol text,p_access_token uuid,p_full_name text,p_email text,p_whatsapp text,p_optional jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public'
as $function$
declare v_ticket public.communication_conversation_tickets%rowtype; v_name text:=trim(coalesce(p_full_name,'')); v_email text:=lower(trim(coalesce(p_email,''))); v_phone text:=regexp_replace(coalesce(p_whatsapp,''),'[^0-9]','','g'); v_optional jsonb:=coalesce(p_optional,'{}'::jsonb);
begin
 if length(v_name)<5 then raise exception 'FULL_NAME_REQUIRED'; end if; if v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then raise exception 'VALID_EMAIL_REQUIRED'; end if; if length(v_phone)<10 or length(v_phone)>15 then raise exception 'VALID_MOBILE_REQUIRED'; end if;
 select t.* into v_ticket from public.communication_conversation_tickets t join public.communication_tenants ct on ct.id=t.tenant_id and ct.slug='wmp' and ct.active=true where t.protocol=trim(p_protocol) and t.access_token=p_access_token;
 if v_ticket.id is null then raise exception 'TICKET_NOT_FOUND'; end if;
 insert into public.wmp_contact_registrations(tenant_id,contact_id,full_name,email,whatsapp,status,source,consent_export_email,registered_at,updated_at) values(v_ticket.tenant_id,v_ticket.contact_id,v_name,v_email,v_phone,'ACTIVE','MILLITO',true,now(),now()) on conflict (tenant_id,contact_id) do update set full_name=excluded.full_name,email=excluded.email,whatsapp=excluded.whatsapp,status='ACTIVE',consent_export_email=true,updated_at=now();
 update public.communication_contacts set display_name=v_name,attributes=coalesce(attributes,'{}'::jsonb)||jsonb_build_object('email',v_email,'whatsapp',v_phone,'wmp_registration_completed_at',now())||jsonb_strip_nulls(jsonb_build_object('cpf',nullif(regexp_replace(coalesce(v_optional->>'cpf',''),'[^0-9]','','g'),''),'cep',nullif(regexp_replace(coalesce(v_optional->>'cep',''),'[^0-9]','','g'),''),'logradouro',nullif(trim(coalesce(v_optional->>'logradouro','')),''),'numero',nullif(trim(coalesce(v_optional->>'numero','')),''),'complemento',nullif(trim(coalesce(v_optional->>'complemento','')),''),'bairro',nullif(trim(coalesce(v_optional->>'bairro','')),''),'cidade',nullif(trim(coalesce(v_optional->>'cidade','')),''),'estado',nullif(trim(coalesce(v_optional->>'estado','')),''),'is_company',case when v_optional?'is_company' then v_optional->'is_company' else null end,'company_name',nullif(trim(coalesce(v_optional->>'company_name','')),''),'company_document',nullif(regexp_replace(coalesce(v_optional->>'company_document',''),'[^0-9]','','g'),''))),updated_at=now() where id=v_ticket.contact_id and tenant_id=v_ticket.tenant_id;
 update public.communication_conversation_tickets set export_requested_at=coalesce(export_requested_at,now()),export_status='READY',updated_at=now() where id=v_ticket.id;
 return jsonb_build_object('ok',true,'protocol',v_ticket.protocol,'export_status','READY','email',v_email,'contact_id',v_ticket.contact_id);
end $function$;
