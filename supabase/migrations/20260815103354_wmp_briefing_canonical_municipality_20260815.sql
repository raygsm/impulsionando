-- Tracks production migration 20260815103354.
alter table public.wmp_briefings add column if not exists evento_municipio_ibge text;
create index if not exists wmp_briefings_municipio_ibge_idx on public.wmp_briefings(evento_municipio_ibge) where evento_municipio_ibge is not null;
comment on column public.wmp_briefings.evento_municipio_ibge is 'Código IBGE do município; chave canônica para evitar variações de nome digitado.';
