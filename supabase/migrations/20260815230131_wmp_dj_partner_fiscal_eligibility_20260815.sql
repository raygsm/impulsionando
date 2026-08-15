alter table public.wmp_parceiros add column if not exists razao_social text;
alter table public.wmp_parceiros add column if not exists cnpj text;
alter table public.wmp_parceiros add column if not exists invoice_required boolean not null default true;
alter table public.wmp_parceiros add column if not exists payout_terms_days integer not null default 10;
alter table public.wmp_parceiros add column if not exists partner_terms_accepted_at timestamptz;
create unique index if not exists idx_wmp_parceiros_tenant_cnpj on public.wmp_parceiros(tenant_id,core_normalize_cnpj(cnpj)) where cnpj is not null;

create or replace function public.wmp_validate_partner_fiscal_eligibility()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.cnpj is not null and trim(new.cnpj)<>'' then
    new.cnpj:=public.core_normalize_cnpj(new.cnpj);
    if not public.core_is_valid_cnpj(new.cnpj) then raise exception 'invalid_partner_cnpj'; end if;
  end if;
  if new.status='APPROVED' and new.categoria='dj' then
    if coalesce(trim(new.razao_social),'')='' then raise exception 'dj_partner_razao_social_required'; end if;
    if coalesce(trim(new.cnpj),'')='' or not public.core_is_valid_cnpj(new.cnpj) then raise exception 'dj_partner_valid_cnpj_required'; end if;
    if new.invoice_required is not true then raise exception 'dj_partner_invoice_requirement_cannot_be_disabled'; end if;
  end if;
  new.updated_at:=now();
  return new;
end
$function$;

drop trigger if exists trg_wmp_validate_partner_fiscal_eligibility on public.wmp_parceiros;
create trigger trg_wmp_validate_partner_fiscal_eligibility
before insert or update of cnpj,razao_social,status,categoria,invoice_required on public.wmp_parceiros
for each row execute function public.wmp_validate_partner_fiscal_eligibility();

revoke all on function public.wmp_validate_partner_fiscal_eligibility() from public,anon,authenticated;
