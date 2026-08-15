create or replace function public.core_is_valid_br_document(p_type text,p_value text)
returns boolean language sql immutable set search_path=public as $$
  select case upper(trim(coalesce(p_type,'')))
    when 'CPF' then public.core_is_valid_cpf(p_value)
    when 'CNPJ' then public.core_is_valid_cnpj(p_value)
    else false
  end
$$;
grant execute on function public.core_is_valid_br_document(text,text) to anon,authenticated,service_role;

alter table public.companies add column if not exists document_type text;
update public.companies set document_type='CNPJ' where document_type is null and document is not null and public.core_is_valid_cnpj(document);
alter table public.companies drop constraint if exists companies_document_type_check;
alter table public.companies add constraint companies_document_type_check check(document_type is null or document_type in ('CNPJ','FOREIGN_REGISTRATION','OTHER')) not valid;
alter table public.companies validate constraint companies_document_type_check;
alter table public.companies drop constraint if exists companies_br_document_integrity_check;
alter table public.companies add constraint companies_br_document_integrity_check check(document is null or document_type is null or document_type <> 'CNPJ' or public.core_is_valid_cnpj(document)) not valid;
alter table public.companies validate constraint companies_br_document_integrity_check;

alter table public.wmp_briefings drop constraint if exists wmp_briefings_document_type_check;
alter table public.wmp_briefings add constraint wmp_briefings_document_type_check check(contratante_tipo_documento is null or contratante_tipo_documento in ('CPF','CNPJ','PASSPORT','FOREIGN_REGISTRATION','OTHER')) not valid;
alter table public.wmp_briefings validate constraint wmp_briefings_document_type_check;
alter table public.wmp_briefings drop constraint if exists wmp_briefings_br_document_integrity_check;
alter table public.wmp_briefings add constraint wmp_briefings_br_document_integrity_check check(contratante_documento is null or contratante_tipo_documento is null or contratante_tipo_documento not in ('CPF','CNPJ') or public.core_is_valid_br_document(contratante_tipo_documento,contratante_documento)) not valid;
alter table public.wmp_briefings validate constraint wmp_briefings_br_document_integrity_check;

alter table public.chrismed_occupational_intakes add column if not exists organization_document_type text;
alter table public.chrismed_occupational_intakes drop constraint if exists chrismed_occ_document_type_check;
alter table public.chrismed_occupational_intakes add constraint chrismed_occ_document_type_check check(organization_document_type is null or organization_document_type in ('CNPJ','FOREIGN_REGISTRATION','OTHER')) not valid;
alter table public.chrismed_occupational_intakes validate constraint chrismed_occ_document_type_check;
alter table public.chrismed_occupational_intakes drop constraint if exists chrismed_occ_br_document_integrity_check;
alter table public.chrismed_occupational_intakes add constraint chrismed_occ_br_document_integrity_check check(organization_document is null or organization_document_type is null or organization_document_type <> 'CNPJ' or public.core_is_valid_cnpj(organization_document)) not valid;
alter table public.chrismed_occupational_intakes validate constraint chrismed_occ_br_document_integrity_check;
