-- Grupo EVR — authorization helpers used by EVR RLS policies.
-- Keeps Core company membership valid while allowing explicit group-level access.

create or replace function public.evr_user_can_view_company(p_user_id uuid, p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.user_belongs_to_company(p_user_id, p_company_id)
    or exists (
      select 1
      from public.evr_group_user_access ga
      join public.evr_group_user_company_access ca on ca.group_user_access_id = ga.id
      join public.evr_group_companies gc on gc.group_id = ga.group_id and gc.company_id = ca.company_id
      where ga.user_id = p_user_id
        and ga.active = true
        and ca.company_id = p_company_id
        and ca.can_view = true
        and gc.active = true
    )
    or exists (
      select 1
      from public.evr_group_user_access ga
      join public.evr_group_companies gc on gc.group_id = ga.group_id
      where ga.user_id = p_user_id
        and ga.active = true
        and ga.access_level = 'super_master'
        and gc.company_id = p_company_id
        and gc.active = true
    );
$$;

create or replace function public.evr_user_can_operate_company(p_user_id uuid, p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.user_belongs_to_company(p_user_id, p_company_id)
    or exists (
      select 1
      from public.evr_group_user_access ga
      join public.evr_group_user_company_access ca on ca.group_user_access_id = ga.id
      where ga.user_id = p_user_id
        and ga.active = true
        and ca.company_id = p_company_id
        and ca.can_operate = true
    )
    or exists (
      select 1
      from public.evr_group_user_access ga
      join public.evr_group_companies gc on gc.group_id = ga.group_id
      where ga.user_id = p_user_id
        and ga.active = true
        and ga.access_level = 'super_master'
        and gc.company_id = p_company_id
        and gc.active = true
    );
$$;

grant execute on function public.evr_user_can_view_company(uuid, uuid) to authenticated;
grant execute on function public.evr_user_can_operate_company(uuid, uuid) to authenticated;

-- Replace broad EVR table policies with group-aware authorization.
drop policy if exists evr_business_units_member on public.evr_business_units;
create policy evr_business_units_select on public.evr_business_units for select to authenticated using (public.evr_user_can_view_company(auth.uid(), company_id));
create policy evr_business_units_write on public.evr_business_units for all to authenticated using (public.evr_user_can_operate_company(auth.uid(), company_id)) with check (public.evr_user_can_operate_company(auth.uid(), company_id));

drop policy if exists evr_patient_consents_member on public.evr_patient_consents;
create policy evr_patient_consents_select on public.evr_patient_consents for select to authenticated using (public.evr_user_can_view_company(auth.uid(), company_id));
create policy evr_patient_consents_write on public.evr_patient_consents for all to authenticated using (public.evr_user_can_operate_company(auth.uid(), company_id)) with check (public.evr_user_can_operate_company(auth.uid(), company_id));

drop policy if exists evr_clinical_orders_member on public.evr_clinical_orders;
create policy evr_clinical_orders_select on public.evr_clinical_orders for select to authenticated using (public.evr_user_can_view_company(auth.uid(), company_id));
create policy evr_clinical_orders_write on public.evr_clinical_orders for all to authenticated using (public.evr_user_can_operate_company(auth.uid(), company_id)) with check (public.evr_user_can_operate_company(auth.uid(), company_id));

drop policy if exists evr_pharmacy_fulfillments_member on public.evr_pharmacy_fulfillments;
create policy evr_pharmacy_fulfillments_select on public.evr_pharmacy_fulfillments for select to authenticated using (public.evr_user_can_view_company(auth.uid(), company_id));
create policy evr_pharmacy_fulfillments_write on public.evr_pharmacy_fulfillments for all to authenticated using (public.evr_user_can_operate_company(auth.uid(), company_id)) with check (public.evr_user_can_operate_company(auth.uid(), company_id));

drop policy if exists evr_appointment_waitlist_member on public.evr_appointment_waitlist;
create policy evr_appointment_waitlist_select on public.evr_appointment_waitlist for select to authenticated using (public.evr_user_can_view_company(auth.uid(), company_id));
create policy evr_appointment_waitlist_write on public.evr_appointment_waitlist for all to authenticated using (public.evr_user_can_operate_company(auth.uid(), company_id)) with check (public.evr_user_can_operate_company(auth.uid(), company_id));

drop policy if exists evr_appointment_slot_offers_member on public.evr_appointment_slot_offers;
create policy evr_appointment_slot_offers_select on public.evr_appointment_slot_offers for select to authenticated using (public.evr_user_can_view_company(auth.uid(), company_id));
create policy evr_appointment_slot_offers_write on public.evr_appointment_slot_offers for all to authenticated using (public.evr_user_can_operate_company(auth.uid(), company_id)) with check (public.evr_user_can_operate_company(auth.uid(), company_id));

drop policy if exists evr_management_events_member on public.evr_management_events;
create policy evr_management_events_select on public.evr_management_events for select to authenticated using (public.evr_user_can_view_company(auth.uid(), company_id));

comment on function public.evr_user_can_view_company(uuid, uuid) is 'Grupo EVR company access gate used by RLS. Supports direct Core membership plus explicit EVR group access.';
