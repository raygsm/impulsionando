create or replace function public.chrismed_mark_teleconsult_presence(p_appointment_id uuid, p_role text, p_user_agent text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_actual_role text;
  v_event text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select case
    when ap.user_id=v_uid then 'professional'
    when a.patient_user_id=v_uid then 'patient'
    when public.is_impulsionando_staff(v_uid) then 'admin'
    else null
  end into v_actual_role
  from public.chrismed_appointments a
  join public.agenda_professionals ap on ap.id=a.professional_id
  where a.id=p_appointment_id;

  if v_actual_role is null then raise exception 'not_authorized'; end if;
  if p_role is distinct from v_actual_role and v_actual_role <> 'admin' then raise exception 'role_mismatch'; end if;

  v_event := case
    when v_actual_role='professional' then 'ready_confirmed'
    when v_actual_role='patient' then 'joined_call'
    else 'opened_room'
  end;

  return public.chrismed_mark_teleconsult_presence(p_appointment_id,v_event);
end;
$$;

revoke all on function public.chrismed_mark_teleconsult_presence(uuid,text,text) from public,anon;
grant execute on function public.chrismed_mark_teleconsult_presence(uuid,text,text) to authenticated,service_role;

create or replace function public.billing_run_cycle()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_contract public.billing_contracts%rowtype;
  v_inv public.billing_invoices%rowtype;
  v_policy public.billing_dunning_policy%rowtype;
  v_step jsonb;
  v_ch text;
  v_offset int;
  v_generated int:=0;
  v_queued int:=0;
  v_suspended int:=0;
  v_disabled uuid[];
  v_company public.companies%rowtype;
begin
  for v_contract in select * from public.billing_contracts where status not in('cancelled','archived') loop
    if v_contract.next_due_date<=current_date+5 then
      insert into public.billing_invoices(contract_id,company_id,period_start,period_end,due_date,amount,pix_key,pix_copy_paste)
      values(v_contract.id,v_contract.company_id,(v_contract.next_due_date-interval '1 month')::date,(v_contract.next_due_date-interval '1 day')::date,v_contract.next_due_date,v_contract.recurring_amount,v_contract.pix_key,v_contract.pix_copy_paste)
      on conflict(contract_id,due_date) do nothing;
      if found then v_generated:=v_generated+1; end if;
    end if;
  end loop;

  for v_inv in select * from public.billing_invoices where status in('open','overdue') loop
    select * into v_contract from public.billing_contracts where id=v_inv.contract_id;
    select * into v_company from public.companies where id=v_inv.company_id;
    select * into v_policy from public.billing_dunning_policy where id=coalesce(v_contract.policy_id,(select id from public.billing_dunning_policy where is_default=true limit 1));
    if v_policy.id is null then continue; end if;
    if current_date>v_inv.due_date and v_inv.status='open' then
      update public.billing_invoices set status='overdue',updated_at=now() where id=v_inv.id;
    end if;

    for v_step in select value from jsonb_array_elements(v_policy.steps) loop
      v_offset:=(v_step->>'offset_days')::int;
      if (v_inv.due_date+v_offset)=current_date then
        for v_ch in select jsonb_array_elements_text(v_step->'channels') loop
          if not exists(select 1 from public.billing_dunning_runs r where r.invoice_id=v_inv.id and r.step=v_step->>'code' and r.channel=v_ch) then
            insert into public.billing_dunning_runs(invoice_id,step,channel,status)
            values(v_inv.id,v_step->>'code',v_ch,'queued');

            if v_ch='email' and v_company.email is not null then
              insert into public.message_outbox(company_id,event_code,channel,recipient_email,recipient_name,subject,body,payload,status,reference_type,reference_id,idempotency_key)
              values(
                v_inv.company_id,v_step->>'template_code','email',v_company.email,v_company.name,
                'Cobrança Impulsionando — '||to_char(v_inv.due_date,'DD/MM/YYYY'),
                'Olá '||v_company.name||'. Existe uma cobrança de R$ '||to_char(v_inv.amount,'FM999999990D00')||' com vencimento em '||to_char(v_inv.due_date,'DD/MM/YYYY')||'. Consulte sua área para os dados atualizados de pagamento.',
                jsonb_build_object('invoice_id',v_inv.id,'due_date',v_inv.due_date,'amount',v_inv.amount),
                'queued','billing_invoices',v_inv.id::text,
                'billing:'||v_inv.id::text||':'||(v_step->>'code')||':email'
              ) on conflict do nothing;
              v_queued:=v_queued+1;
            elsif v_ch='whatsapp' and v_company.phone is not null then
              insert into public.message_outbox(company_id,event_code,channel,recipient_phone,recipient_name,body,payload,status,reference_type,reference_id,idempotency_key)
              values(
                v_inv.company_id,v_step->>'template_code','whatsapp',v_company.phone,v_company.name,
                'Olá '||v_company.name||'. Sua cobrança Impulsionando de R$ '||to_char(v_inv.amount,'FM999999990D00')||' vence/venceu em '||to_char(v_inv.due_date,'DD/MM/YYYY')||'. Consulte sua área para pagamento.',
                jsonb_build_object('invoice_id',v_inv.id,'due_date',v_inv.due_date,'amount',v_inv.amount),
                'queued','billing_invoices',v_inv.id::text,
                'billing:'||v_inv.id::text||':'||(v_step->>'code')||':whatsapp'
              ) on conflict do nothing;
              v_queued:=v_queued+1;
            end if;
          end if;
        end loop;
      end if;
    end loop;

    if current_date>=v_inv.due_date+v_policy.suspend_offset_days and v_contract.status not in('suspended','cancelled','archived') then
      select coalesce(array_agg(module_id),'{}'::uuid[]) into v_disabled from public.company_modules where company_id=v_inv.company_id and is_enabled=true;
      update public.company_modules set is_enabled=false,updated_at=now() where company_id=v_inv.company_id and is_enabled=true;
      update public.billing_contracts set status='suspended',updated_at=now() where id=v_contract.id;
      insert into public.billing_suspensions(contract_id,company_id,invoice_id,reason,disabled_module_ids)
      values(v_contract.id,v_inv.company_id,v_inv.id,'invoice_overdue',v_disabled);
      v_suspended:=v_suspended+1;
    elsif current_date>v_inv.due_date and v_contract.status='active' then
      update public.billing_contracts set status='past_due',updated_at=now() where id=v_contract.id;
    end if;
  end loop;

  return jsonb_build_object('generated',v_generated,'queued',v_queued,'suspended',v_suspended,'at',now());
end;
$$;

revoke all on function public.billing_run_cycle() from public,anon,authenticated;
grant execute on function public.billing_run_cycle() to service_role;