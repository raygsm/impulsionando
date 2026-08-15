alter table public.wmp_parceiros drop constraint if exists wmp_parceiros_categoria_check;

create or replace function public.wmp_validate_partner_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.reference_options ro
    join public.reference_option_sets ros on ros.id = ro.set_id
    where ros.key = 'wmp_partner_categories'
      and ros.active = true
      and ro.active = true
      and ro.code = new.categoria
  ) then
    raise exception 'Categoria WMP inválida ou inativa: %', new.categoria using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.wmp_validate_partner_category() from public, anon, authenticated;
grant execute on function public.wmp_validate_partner_category() to service_role;

drop trigger if exists trg_wmp_validate_partner_category on public.wmp_parceiros;
create trigger trg_wmp_validate_partner_category
before insert or update of categoria on public.wmp_parceiros
for each row execute function public.wmp_validate_partner_category();

comment on function public.wmp_validate_partner_category() is 'Valida categoria de parceiro WMP contra a taxonomia canônica ativa em reference_options, eliminando enum estático divergente do front.';