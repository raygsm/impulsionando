create index if not exists wmp_briefings_assigned_to_idx on public.wmp_briefings (assigned_to) where assigned_to is not null;
