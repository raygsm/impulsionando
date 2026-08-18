-- HOMOLOGACAO: fixes for two inventory functions introduced in the universal showcase/ERP work.
-- No production promotion without CI + RLS + E2E validation.

begin;

create or replace function public.core_search_paid_inventory(
  p_query text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_radius_km numeric default 50,
  p_brand text default null,
  p_category text default null,
  p_facet_key text default null,
  p_facet_value text default null,
  p_limit integer default 50
)
returns table (
  company_id uuid,
  company_name text,
  product_id uuid,
  product_name text,
  brand text,
  category text,
  variant_id uuid,
  variant_name text,
  location_id uuid,
  location_name text,
  address jsonb,
  latitude numeric,
  longitude numeric,
  distance_km numeric,
  availability_status text,
  exact_available_quantity numeric,
  public_price numeric,
  show_price boolean,
  allow_online_purchase boolean,
  allow_pickup boolean,
  stock_updated_at timestamptz
)
language plpgsql
security definer
set search_path=public,auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.core_club_memberships m
    where m.user_id=auth.uid()
      and m.tier='CLUB_PAID'
      and m.status='ACTIVE'
      and (m.paid_until is null or m.paid_until>now())
  ) then
    raise exception 'CLUB_PAID_REQUIRED' using errcode='42501';
  end if;

  return query
  with base as (
    select
      sp.company_id as b_company_id,
      sp.public_name as b_company_name,
      pr.id as b_product_id,
      pr.name as b_product_name,
      pr.brand as b_brand,
      pr.category as b_category,
      pv.id as b_variant_id,
      pv.variant_name as b_variant_name,
      il.id as b_location_id,
      il.name as b_location_name,
      il.address as b_address,
      il.latitude as b_latitude,
      il.longitude as b_longitude,
      case
        when p_latitude is not null and p_longitude is not null and il.latitude is not null and il.longitude is not null then
          6371 * 2 * asin(sqrt(
            power(sin(radians((il.latitude-p_latitude)::double precision)/2),2) +
            cos(radians(p_latitude::double precision))*cos(radians(il.latitude::double precision))*
            power(sin(radians((il.longitude-p_longitude)::double precision)/2),2)
          ))::numeric
        else null
      end as b_distance_km,
      case
        when coalesce(ib.available,ib.on_hand-ib.reserved)>10 then 'IN_STOCK'
        when coalesce(ib.available,ib.on_hand-ib.reserved)>0 then 'LOW_STOCK'
        else 'OUT_OF_STOCK'
      end as b_availability_status,
      case
        when sp.show_exact_stock_to_paid and ip.show_exact_quantity then coalesce(ib.available,ib.on_hand-ib.reserved)
        else null
      end as b_exact_available_quantity,
      case when ip.show_price then ip.public_price else null end as b_public_price,
      ip.show_price as b_show_price,
      ip.allow_online_purchase as b_allow_online_purchase,
      ip.allow_pickup as b_allow_pickup,
      ib.updated_at as b_stock_updated_at
    from public.core_client_showcase_profiles sp
    join public.core_inventory_publications ip
      on ip.company_id=sp.company_id and ip.published=true
    join public.core_products pr
      on pr.id=ip.product_id and pr.company_id=sp.company_id and pr.active=true
    left join public.core_product_variants pv
      on pv.id=ip.variant_id and pv.active=true
    join public.core_inventory_locations il
      on il.company_id=sp.company_id and il.active=true and (ip.location_id is null or ip.location_id=il.id)
    join public.core_inventory_balances ib
      on ib.company_id=sp.company_id
     and ib.product_id=ip.product_id
     and ib.location_id=il.id
     and ib.variant_id is not distinct from ip.variant_id
    where sp.published=true
      and sp.showcase_authorized=true
      and sp.opted_out_at is null
      and sp.show_inventory_to_paid=true
      and coalesce(ib.available,ib.on_hand-ib.reserved)>0
      and (ip.starts_at is null or ip.starts_at<=now())
      and (ip.ends_at is null or ip.ends_at>now())
      and (p_brand is null or lower(coalesce(pr.brand,''))=lower(trim(p_brand)))
      and (p_category is null or lower(coalesce(pr.category,''))=lower(trim(p_category)))
      and (
        p_query is null or trim(p_query)='' or
        lower(coalesce(pr.name,'')||' '||coalesce(pr.brand,'')||' '||coalesce(pr.category,'')||' '||coalesce(pr.model,'')||' '||coalesce(pv.variant_name,'')) like '%'||lower(trim(p_query))||'%'
        or exists (
          select 1
          from public.core_product_facets f
          where f.company_id=sp.company_id
            and f.product_id=pr.id
            and (f.variant_id is null or f.variant_id is not distinct from pv.id)
            and f.searchable=true
            and lower(f.facet_value) like '%'||lower(trim(p_query))||'%'
        )
      )
      and (
        p_facet_key is null or p_facet_value is null or exists (
          select 1
          from public.core_product_facets f
          where f.company_id=sp.company_id
            and f.product_id=pr.id
            and (f.variant_id is null or f.variant_id is not distinct from pv.id)
            and f.searchable=true
            and lower(f.facet_key)=lower(trim(p_facet_key))
            and lower(f.facet_value)=lower(trim(p_facet_value))
        )
      )
  )
  select
    b.b_company_id,
    b.b_company_name,
    b.b_product_id,
    b.b_product_name,
    b.b_brand,
    b.b_category,
    b.b_variant_id,
    b.b_variant_name,
    b.b_location_id,
    b.b_location_name,
    b.b_address,
    b.b_latitude,
    b.b_longitude,
    b.b_distance_km,
    b.b_availability_status,
    b.b_exact_available_quantity,
    b.b_public_price,
    b.b_show_price,
    b.b_allow_online_purchase,
    b.b_allow_pickup,
    b.b_stock_updated_at
  from base b
  where p_latitude is null
     or p_longitude is null
     or b.b_distance_km is null
     or b.b_distance_km<=greatest(coalesce(p_radius_km,50),0)
  order by b.b_distance_km nulls last, b.b_company_name, b.b_product_name
  limit least(greatest(coalesce(p_limit,50),1),200);
end;
$$;

revoke execute on function public.core_search_paid_inventory(text,numeric,numeric,numeric,text,text,text,text,integer) from public,anon;
grant execute on function public.core_search_paid_inventory(text,numeric,numeric,numeric,text,text,text,text,integer) to authenticated;

create or replace function public.core_consume_volume_from_pos(
  p_company_id uuid,
  p_product_id uuid,
  p_variant_id uuid,
  p_location_id uuid,
  p_volume_ml integer,
  p_external_event_id text,
  p_source text default 'PDV',
  p_sale_reference text default null,
  p_serving_label text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_needed integer := p_volume_ml;
  v_take integer;
  v_container record;
  v_total_remaining numeric;
  v_existing uuid;
begin
  if p_volume_ml <= 0 then raise exception 'INVALID_VOLUME_ML'; end if;
  if p_external_event_id is null or trim(p_external_event_id)='' then raise exception 'EXTERNAL_EVENT_ID_REQUIRED'; end if;

  select id into v_existing
  from public.core_inventory_volume_movements
  where company_id=p_company_id and source=p_source and external_event_id=p_external_event_id
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('status','IDEMPOTENT_ALREADY_APPLIED','movement_id',v_existing);
  end if;

  if (
    select coalesce(sum(remaining_volume_ml),0)
    from public.core_inventory_volume_containers
    where company_id=p_company_id
      and product_id=p_product_id
      and variant_id is not distinct from p_variant_id
      and location_id=p_location_id
      and status in ('SEALED','TAPPED')
      and remaining_volume_ml>0
  ) < p_volume_ml then
    raise exception 'INSUFFICIENT_DRAFT_VOLUME';
  end if;

  for v_container in
    select *
    from public.core_inventory_volume_containers
    where company_id=p_company_id
      and product_id=p_product_id
      and variant_id is not distinct from p_variant_id
      and location_id=p_location_id
      and status in ('TAPPED','SEALED')
      and remaining_volume_ml>0
    order by case when status='TAPPED' then 0 else 1 end, tapped_at nulls last, received_at, created_at
    for update
  loop
    exit when v_needed <= 0;
    v_take := least(v_needed,v_container.remaining_volume_ml);

    update public.core_inventory_volume_containers
    set remaining_volume_ml=remaining_volume_ml-v_take,
        status=case when remaining_volume_ml-v_take=0 then 'EMPTY' else 'TAPPED' end,
        tapped_at=coalesce(tapped_at,now()),
        emptied_at=case when remaining_volume_ml-v_take=0 then now() else emptied_at end,
        updated_at=now()
    where id=v_container.id;

    insert into public.core_inventory_volume_movements(
      company_id,container_id,product_id,variant_id,location_id,movement_type,volume_ml,source,external_event_id,sale_reference,serving_label,metadata
    ) values (
      p_company_id,v_container.id,p_product_id,p_variant_id,p_location_id,'SALE',v_take,p_source,
      case when v_needed=p_volume_ml then p_external_event_id else p_external_event_id||':'||v_container.id::text end,
      p_sale_reference,p_serving_label,coalesce(p_metadata,'{}'::jsonb)
    );

    v_needed := v_needed-v_take;
  end loop;

  select coalesce(sum(remaining_volume_ml),0)
    into v_total_remaining
  from public.core_inventory_volume_containers
  where company_id=p_company_id
    and product_id=p_product_id
    and variant_id is not distinct from p_variant_id
    and location_id=p_location_id
    and status in ('SEALED','TAPPED')
    and remaining_volume_ml>0;

  -- available is generated by the schema; never write it directly.
  update public.core_inventory_balances
  set on_hand=v_total_remaining,
      reserved=0,
      quantity_unit='ML',
      updated_at=now()
  where company_id=p_company_id
    and product_id=p_product_id
    and variant_id is not distinct from p_variant_id
    and location_id=p_location_id;

  if not found then
    insert into public.core_inventory_balances(
      company_id,product_id,variant_id,location_id,on_hand,reserved,quantity_unit,updated_at
    ) values (
      p_company_id,p_product_id,p_variant_id,p_location_id,v_total_remaining,0,'ML',now()
    );
  end if;

  return jsonb_build_object(
    'status','APPLIED',
    'consumed_ml',p_volume_ml,
    'consumed_liters',round((p_volume_ml/1000.0)::numeric,3),
    'remaining_ml',v_total_remaining,
    'remaining_liters',round((v_total_remaining/1000.0)::numeric,3)
  );
end;
$$;

revoke execute on function public.core_consume_volume_from_pos(uuid,uuid,uuid,uuid,integer,text,text,text,text,jsonb) from public,anon;
grant execute on function public.core_consume_volume_from_pos(uuid,uuid,uuid,uuid,integer,text,text,text,text,jsonb) to authenticated;

commit;
