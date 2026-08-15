-- Tracks production migration 20260815103603.
alter table public.wmp_parceiros add column if not exists municipio_ibge text;
create index if not exists wmp_parceiros_municipio_ibge_idx on public.wmp_parceiros(municipio_ibge) where municipio_ibge is not null;
comment on column public.wmp_parceiros.municipio_ibge is 'Código IBGE canônico do município selecionado no cadastro.';
