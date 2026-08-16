-- CHRISMED transactional communication catalog.
-- Historical ordering note: this migration predates creation of the universal
-- communication Core tables in a clean replay. The canonical idempotent seed
-- is therefore deferred to 20260816143000_chrismed_transactional_templates_deferred_seed.sql.
--
-- Keep this historical slot intentionally as a no-op so existing production
-- migration history is not reinterpreted and clean replays remain deterministic.
do $m$
begin
  raise notice 'CHRISMED transactional communication seed deferred until communication Core is available';
end
$m$;
