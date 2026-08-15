-- Completa o replay de Inventory Core e Migração Assistida com índices, RLS e RPCs.

create index if not exists core_products_company_name_idx on public.core_products(company_id,name);
create index if not exists core_products_lookup_idx on public.core_products(company_id,brand,model,category);
create index if not exists core_inventory_balances_available_idx on public.core_inventory_balances(company_id,location_id,available) where available>0;
create unique index if not exists core_inventory_reservations_external_ref_idx on public.core_inventory_reservations(company_id,external_reference) where external_reference is not null;
create index if not exists core_import_jobs_company_status_idx on public.core_import_jobs(company_id,status,created_at desc);
create index if not exists core_import_row_results_job_status_idx on public.core_import_row_results(job_id,status);

revoke all on public.core_products,public.core_product_variants,public.core_inventory_locations,public.core_inventory_balances,public.core_inventory_publications,public.core_inventory_reservations,
  public.core_import_jobs,public.core_import_field_mappings,public.core_import_duplicate_candidates,public.core_import_row_results from anon;
grant select,insert,update,delete on public.core_products,public.core_product_variants,public.core_inventory_locations,public.core_inventory_balances,public.core_inventory_publications,public.core_inventory_reservations,
  public.core_import_jobs,public.core_import_field_mappings,public.core_import_duplicate_candidates,public.core_import_row_results to authenticated;

do $$ declare t text; begin
  foreach t in array array['core_products','core_product_variants','core_inventory_locations','core_inventory_balances','core_inventory_publications','core_inventory_reservations'] loop
    execute format('drop policy if exists %I_company on public.%I',t,t);
    execute format('create policy %I_company on public.%I for all to authenticated using (public.user_belongs_to_company((select auth.uid()),company_id) or public.is_impulsionando_staff((select auth.uid()))) with check (public.user_belongs_to_company((select auth.uid()),company_id) or public.is_impulsionando_staff((select auth.uid())))',t,t);
  end loop;
end $$;

drop policy if exists core_import_jobs_company on public.core_import_jobs;
create policy core_import_jobs_company on public.core_import_jobs for all to authenticated
using (public.user_belongs_to_company((select auth.uid()),company_id) or public.is_impulsionando_staff((select auth.uid())))
with check (public.user_belongs_to_company((select auth.uid()),company_id) or public.is_impulsionando_staff((select auth.uid())));

drop policy if exists core_import_field_mappings_company on public.core_import_field_mappings;
create policy core_import_field_mappings_company on public.core_import_field_mappings for all to authenticated
using (exists(select 1 from public.core_import_jobs j where j.id=job_id and (public.user_belongs_to_company((select auth.uid()),j.company_id) or public.is_impulsionando_staff((select auth.uid())))))
with check (exists(select 1 from public.core_import_jobs j where j.id=job_id and (public.user_belongs_to_company((select auth.uid()),j.company_id) or public.is_impulsionando_staff((select auth.uid())))));

drop policy if exists core_import_duplicate_candidates_company on public.core_import_duplicate_candidates;
create policy core_import_duplicate_candidates_company on public.core_import_duplicate_candidates for all to authenticated
using (exists(select 1 from public.core_import_jobs j where j.id=job_id and (public.user_belongs_to_company((select auth.uid()),j.company_id) or public.is_impulsionando_staff((select auth.uid())))))
with check (exists(select 1 from public.core_import_jobs j where j.id=job_id and (public.user_belongs_to_company((select auth.uid()),j.company_id) or public.is_impulsionando_staff((select auth.uid())))));

drop policy if exists core_import_row_results_company on public.core_import_row_results;
create policy core_import_row_results_company on public.core_import_row_results for all to authenticated
using (exists(select 1 from public.core_import_jobs j where j.id=job_id and (public.user_belongs_to_company((select auth.uid()),j.company_id) or public.is_impulsionando_staff((select auth.uid())))))
with check (exists(select 1 from public.core_import_jobs j where j.id=job_id and (public.user_belongs_to_company((select auth.uid()),j.company_id) or public.is_impulsionando_staff((select auth.uid())))));

create or replace function public.core_inventory_search(p_query text,p_limit integer default 30)
returns table(company_id uuid,company_name text,product_id uuid,product_name text,brand text,model text,sku text,image_url text,location_name text,available boolean,quantity numeric,price numeric,allow_online_purchase boolean,allow_pickup boolean)
language sql stable security definer set search_path to 'pg_catalog','public' as $$
  select p.company_id,c.name,p.id,p.name,p.brand,p.model,coalesce(v.sku,p.sku),p.image_url,l.name,
         (b.available>0),case when pub.show_exact_quantity then b.available else null end,
         case when pub.show_price then coalesce(pub.public_price,v.sale_price) else null end,
         pub.allow_online_purchase,pub.allow_pickup
  from public.core_inventory_publications pub
  join public.core_products p on p.id=pub.product_id and p.active
  left join public.core_product_variants v on v.id=pub.variant_id and v.active
  join public.core_inventory_balances b on b.company_id=pub.company_id and b.product_id=pub.product_id and b.variant_id is not distinct from pub.variant_id
  join public.core_inventory_locations l on l.id=b.location_id and l.active and (pub.location_id is null or pub.location_id=l.id)
  join public.companies c on c.id=p.company_id
  where pub.published=true and b.available>0
    and (pub.starts_at is null or pub.starts_at<=now()) and (pub.ends_at is null or pub.ends_at>now())
    and (coalesce(trim(p_query),'')='' or p.name ilike '%'||p_query||'%' or p.brand ilike '%'||p_query||'%' or p.model ilike '%'||p_query||'%' or p.sku ilike '%'||p_query||'%' or v.sku ilike '%'||p_query||'%' or v.barcode ilike '%'||p_query||'%')
  order by p.name,l.name limit least(greatest(coalesce(p_limit,30),1),100)
$$;
revoke all on function public.core_inventory_search(text,integer) from public;
grant execute on function public.core_inventory_search(text,integer) to anon,authenticated;

create or replace function public.core_inventory_reserve(p_balance_id uuid,p_quantity numeric,p_external_reference text default null,p_ttl_minutes integer default 15)
returns uuid language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare v_balance public.core_inventory_balances%rowtype; v_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  if p_quantity<=0 then raise exception 'invalid_quantity'; end if;
  select * into v_balance from public.core_inventory_balances where id=p_balance_id for update;
  if v_balance.id is null then raise exception 'balance_not_found'; end if;
  if not (public.user_belongs_to_company((select auth.uid()),v_balance.company_id) or public.is_impulsionando_staff((select auth.uid()))) then raise exception 'forbidden'; end if;
  if v_balance.available<p_quantity then raise exception 'insufficient_inventory'; end if;
  if p_external_reference is not null then
    select id into v_id from public.core_inventory_reservations where company_id=v_balance.company_id and external_reference=p_external_reference;
    if v_id is not null then return v_id; end if;
  end if;
  update public.core_inventory_balances set reserved=reserved+p_quantity,updated_at=now() where id=p_balance_id;
  insert into public.core_inventory_reservations(company_id,balance_id,quantity,external_reference,expires_at)
  values(v_balance.company_id,p_balance_id,p_quantity,p_external_reference,now()+make_interval(mins=>greatest(1,least(coalesce(p_ttl_minutes,15),1440)))) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.core_inventory_reserve(uuid,numeric,text,integer) from anon;
grant execute on function public.core_inventory_reserve(uuid,numeric,text,integer) to authenticated;

create or replace function public.core_import_approve(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare v_job public.core_import_jobs%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  select * into v_job from public.core_import_jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'job_not_found'; end if;
  if not (public.user_belongs_to_company((select auth.uid()),v_job.company_id) or public.is_impulsionando_staff((select auth.uid()))) then raise exception 'forbidden'; end if;
  if v_job.status not in ('dry_run_ready','awaiting_approval') then raise exception 'job_not_ready_for_approval'; end if;
  if exists(select 1 from public.core_import_field_mappings where job_id=p_job_id and required=true and approved=false) then raise exception 'required_mapping_not_approved'; end if;
  update public.core_import_jobs set status='approved',approved_at=now(),approved_by=(select auth.uid()),updated_at=now() where id=p_job_id;
  return jsonb_build_object('approved',true,'job_id',p_job_id,'approved_at',now());
end $$;
revoke all on function public.core_import_approve(uuid) from anon;
grant execute on function public.core_import_approve(uuid) to authenticated;

create or replace function public.core_import_recalculate_summary(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare v_company uuid; v_summary jsonb;
begin
  select company_id into v_company from public.core_import_jobs where id=p_job_id;
  if v_company is null then raise exception 'job_not_found'; end if;
  if not (public.user_belongs_to_company((select auth.uid()),v_company) or public.is_impulsionando_staff((select auth.uid()))) then raise exception 'forbidden'; end if;
  select jsonb_build_object('total',count(*),'valid',count(*) filter(where status='valid'),'duplicates',count(*) filter(where status='duplicate'),'review',count(*) filter(where status='review'),'imported',count(*) filter(where status='imported'),'updated',count(*) filter(where status='updated'),'skipped',count(*) filter(where status='skipped'),'errors',count(*) filter(where status='error'))
  into v_summary from public.core_import_row_results where job_id=p_job_id;
  update public.core_import_jobs set total_rows=coalesce((v_summary->>'total')::int,0),valid_rows=coalesce((v_summary->>'valid')::int,0),duplicate_rows=coalesce((v_summary->>'duplicates')::int,0),review_rows=coalesce((v_summary->>'review')::int,0),imported_rows=coalesce((v_summary->>'imported')::int,0),updated_rows=coalesce((v_summary->>'updated')::int,0),skipped_rows=coalesce((v_summary->>'skipped')::int,0),error_rows=coalesce((v_summary->>'errors')::int,0),dry_run_summary=v_summary,updated_at=now() where id=p_job_id;
  return v_summary;
end $$;
revoke all on function public.core_import_recalculate_summary(uuid) from anon;
grant execute on function public.core_import_recalculate_summary(uuid) to authenticated;
