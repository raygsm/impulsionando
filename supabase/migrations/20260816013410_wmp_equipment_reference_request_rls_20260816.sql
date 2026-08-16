drop policy if exists wmp_equipment_reference_requests_select on public.wmp_equipment_reference_requests;
drop policy if exists wmp_equipment_reference_requests_insert on public.wmp_equipment_reference_requests;
drop policy if exists wmp_equipment_reference_requests_update on public.wmp_equipment_reference_requests;
drop policy if exists wmp_equipment_reference_requests_delete on public.wmp_equipment_reference_requests;

create policy wmp_equipment_reference_requests_select
on public.wmp_equipment_reference_requests
for select to authenticated
using (private.is_tenant_member(tenant_id));

create policy wmp_equipment_reference_requests_insert
on public.wmp_equipment_reference_requests
for insert to authenticated
with check (
  private.is_tenant_member(tenant_id, array['OWNER','ADMIN','EDITOR','OPERATOR'])
  and requested_by = auth.uid()
);

create policy wmp_equipment_reference_requests_update
on public.wmp_equipment_reference_requests
for update to authenticated
using (private.is_tenant_member(tenant_id, array['OWNER','ADMIN']))
with check (private.is_tenant_member(tenant_id, array['OWNER','ADMIN']));

create policy wmp_equipment_reference_requests_delete
on public.wmp_equipment_reference_requests
for delete to authenticated
using (private.is_tenant_member(tenant_id, array['OWNER','ADMIN']));
