create or replace function public.chrismed_list_public_events()
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  description text,
  cover_url text,
  venue_name text,
  venue_address text,
  city text,
  starts_at timestamptz,
  ends_at timestamptz,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  capacity integer,
  seats_remaining integer,
  price_cents integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id, e.slug, e.title, e.summary, e.description, e.cover_url,
    e.venue_name, e.venue_address, e.city, e.starts_at, e.ends_at,
    e.registration_opens_at, e.registration_closes_at, e.capacity,
    greatest(e.capacity - coalesce(sum(r.quantity) filter (where r.status = 'confirmed'), 0)::integer, 0) as seats_remaining,
    e.price_cents
  from public.chrismed_events e
  left join public.chrismed_event_registrations r on r.event_id = e.id
  where e.status = 'published'
    and e.ends_at >= now()
  group by e.id
  order by e.starts_at;
$$;
revoke all on function public.chrismed_list_public_events() from public;
grant execute on function public.chrismed_list_public_events() to anon, authenticated;
