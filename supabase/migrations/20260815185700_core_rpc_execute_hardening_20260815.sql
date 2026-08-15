-- Harden RPC execution surface for newly added Core functions.
-- PostgreSQL grants EXECUTE to PUBLIC by default; revoke it explicitly.

revoke all on function public.core_import_approve(uuid) from public;
revoke all on function public.core_import_recalculate_summary(uuid) from public;
revoke all on function public.core_inventory_reserve(uuid,numeric,text,integer) from public;
revoke all on function public.whitelabel_next_tier(text) from public;
revoke all on function public.whitelabel_capacity_decision(text,integer,integer) from public;
revoke all on function public.billing_next_anchor_day5(date) from public;
revoke all on function public.billing_prorata_until_day5(numeric,numeric,date) from public;

grant execute on function public.core_import_approve(uuid) to authenticated;
grant execute on function public.core_import_recalculate_summary(uuid) to authenticated;
grant execute on function public.core_inventory_reserve(uuid,numeric,text,integer) to authenticated;
grant execute on function public.whitelabel_next_tier(text) to authenticated;
grant execute on function public.whitelabel_capacity_decision(text,integer,integer) to authenticated;
grant execute on function public.billing_next_anchor_day5(date) to authenticated;
grant execute on function public.billing_prorata_until_day5(numeric,numeric,date) to authenticated;

-- Public intentionally: returns only inventory explicitly opted into publication.
revoke all on function public.core_inventory_search(text,integer) from public;
grant execute on function public.core_inventory_search(text,integer) to anon,authenticated;
