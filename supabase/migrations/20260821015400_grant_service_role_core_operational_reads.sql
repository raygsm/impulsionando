-- service_role is the backend operational identity. These two tables had
-- explicit ACLs that omitted SELECT, causing backend security regression tests
-- to fail even though anonymous access remained correctly blocked.
grant select on table public.core_inventory_reservations to service_role;
grant select on table public.core_service_access_state to service_role;
