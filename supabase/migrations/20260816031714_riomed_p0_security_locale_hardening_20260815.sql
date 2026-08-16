-- RioMed P0 hardening: tenant locale baseline, runtime consistency and SECURITY DEFINER surface.

update public.communication_tenants
set locale = 'es-BO',
    timezone = 'America/La_Paz',
    settings = coalesce(settings,'{}'::jsonb)
      || jsonb_build_object(
        'country','Bolivia',
        'headquarters','Santa Cruz de la Sierra',
        'content_locale_status','ES_BO_CANONICAL',
        'locale_review_required',false,
        'security_hardening_status','P0_APPLIED_2026_08_15'
      ),
    updated_at = now()
where slug='rio-med' and active=true and deleted_at is null;

update public.communication_agent_runtime r
set config = coalesce(r.config,'{}'::jsonb)
      || jsonb_build_object('locale','es-BO','country','BO','execution_policy','tool_first_no_fabrication'),
    privacy_policy = coalesce(r.privacy_policy,'{}'::jsonb)
      || jsonb_build_object('tenant_isolation',true,'pii_minimization',true,'no_medical_diagnosis',true),
    updated_at = now()
where r.agent_key='riomed-medicito';

-- Trigger/helper functions are not public RPCs.
revoke all on function public.riomed_cart_item_after() from public, anon, authenticated;
revoke all on function public.riomed_cart_recalc(uuid) from public, anon, authenticated;
revoke all on function public.riomed_quote_item_after() from public, anon, authenticated;
revoke all on function public.riomed_commercial_touch() from public, anon, authenticated;
revoke all on function public.riomed_quote_item_before() from public, anon, authenticated;
revoke all on function public.riomed_touch_generic() from public, anon, authenticated;
revoke all on function public.riomed_touch_updated_at() from public, anon, authenticated;

-- Internal distributor should never be directly callable by generic signed-in users.
revoke all on function public.riomed_assign_salesperson(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.riomed_assign_salesperson(uuid,uuid,text,text,text) to service_role;

-- Quote conversion must enforce company membership even if EXECUTE is granted to authenticated.
create or replace function public.riomed_convert_quote_to_order(_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  q public.riomed_quotes%rowtype;
  v_order uuid;
  v_number text;
  v_rule public.riomed_commission_rules%rowtype;
begin
  select * into q from public.riomed_quotes where id=_quote_id for update;
  if not found then raise exception 'Cotización no encontrada'; end if;

  if not (
    public.user_belongs_to_company(auth.uid(), q.company_id)
    or public.is_impulsionando_staff(auth.uid())
    or auth.role()='service_role'
  ) then
    raise exception 'Acesso negado';
  end if;

  if q.company_id is distinct from public.riomed_company_id() then
    raise exception 'Cotización fuera del alcance de RioMed';
  end if;

  if q.order_id is not null then return q.order_id; end if;
  if q.status in('rejected','lost','expired','cancelled') then
    raise exception 'Cotización no convertible en estado %',q.status;
  end if;

  v_number:='RM-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.sales_orders(company_id,quote_id,order_number,customer_id,status,currency,subtotal,discount_total,total,owner_user_id,metadata)
  values(q.company_id,q.id,v_number,q.customer_id,'confirmed',q.currency,q.subtotal,q.discount_total,q.total,q.owner_user_id,jsonb_build_object('source','riomed_quote'))
  returning id into v_order;

  insert into public.sales_order_items(order_id,company_id,product_id,description,quantity,unit_price,discount,total)
  select v_order,company_id,product_id,description,qty,unit_price,discount,total
  from public.riomed_quote_items where quote_id=q.id;

  update public.riomed_quotes set order_id=v_order,status='converted',won_at=now(),updated_at=now() where id=q.id;

  if q.owner_user_id is not null then
    select * into v_rule
    from public.riomed_commission_rules
    where company_id=q.company_id and active and scope='seller' and user_id=q.owner_user_id
    order by updated_at desc limit 1;
    if found then
      insert into public.riomed_commissions(company_id,order_id,quote_id,seller_user_id,rule_id,period,base_amount,rate_pct,amount,status)
      values(q.company_id,v_order,q.id,q.owner_user_id,v_rule.id,to_char(current_date,'YYYY-MM'),q.total,v_rule.rate_pct,round(q.total*v_rule.rate_pct/100,2),'pending');
    end if;
  end if;
  return v_order;
end
$function$;
revoke all on function public.riomed_convert_quote_to_order(uuid) from public, anon;
grant execute on function public.riomed_convert_quote_to_order(uuid) to authenticated, service_role;

-- Stale stock analytics must never accept cross-company reads.
create or replace function public.riomed_detect_stale_stock(_company_id uuid, _days_threshold integer default 90, _min_qty numeric default 1, _limit integer default 50)
returns table(product_id uuid, variant_id uuid, product_name text, sku text, qty numeric, unit_price numeric, reference_at timestamptz)
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
begin
  if _company_id is distinct from public.riomed_company_id() then
    raise exception 'Empresa inválida para RioMed';
  end if;
  if not (
    public.user_belongs_to_company(auth.uid(), _company_id)
    or public.is_impulsionando_staff(auth.uid())
    or auth.role()='service_role'
  ) then
    raise exception 'Acesso negado';
  end if;
  return query
  select p.id,
         v.id,
         p.name,
         coalesce(v.sku,p.sku),
         coalesce(v.stock,p.stock,0)::numeric,
         coalesce(v.price_sale,p.price_sale,0)::numeric,
         coalesce(
           nullif(v.metadata->>'last_stock_movement_at','')::timestamptz,
           nullif(p.metadata->>'last_stock_movement_at','')::timestamptz,
           v.updated_at,
           p.updated_at
         )
  from public.riomed_products p
  left join public.riomed_product_variants v on v.product_id=p.id and v.company_id=p.company_id and v.active=true
  where p.company_id=_company_id
    and p.is_active=true
    and coalesce(v.stock,p.stock,0) >= _min_qty
    and coalesce(
      nullif(v.metadata->>'last_stock_movement_at','')::timestamptz,
      nullif(p.metadata->>'last_stock_movement_at','')::timestamptz,
      v.updated_at,
      p.updated_at
    ) <= now() - make_interval(days => greatest(1,least(_days_threshold,720)))
  order by 7 asc
  limit greatest(1,least(_limit,200));
end
$function$;
revoke all on function public.riomed_detect_stale_stock(uuid,integer,numeric,integer) from public, anon;
grant execute on function public.riomed_detect_stale_stock(uuid,integer,numeric,integer) to authenticated, service_role;
