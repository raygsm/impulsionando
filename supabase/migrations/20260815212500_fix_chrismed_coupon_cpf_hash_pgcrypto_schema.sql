create or replace function public.chrismed_coupon_cpf_hash(p_cpf text)
returns text
language sql
immutable
set search_path=public,extensions
as $$
  select encode(
    extensions.digest(
      convert_to(regexp_replace(coalesce(p_cpf,''),'[^0-9]','','g'),'UTF8'),
      'sha256'
    ),
    'hex'
  )
$$;
