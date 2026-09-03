-- Phase 5B follow-up — service_role can read job ledgers (staging smokes).
-- Tables already RLS-enabled with no anon/authenticated GRANT.
-- Do not GRANT these tables to anon or authenticated.

GRANT SELECT ON TABLE public.reengineering_job_effects TO service_role;
GRANT SELECT ON TABLE public.reengineering_job_idempotency TO service_role;

CREATE OR REPLACE FUNCTION public.get_reengineering_job_effect(p_scope_key TEXT)
RETURNS TABLE (
  scope_key TEXT,
  tenant_id UUID,
  effect_type TEXT,
  job_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT e.scope_key, e.tenant_id, e.effect_type, e.job_id, e.created_at
  FROM public.reengineering_job_effects e
  WHERE e.scope_key = p_scope_key;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reengineering_job_effect(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reengineering_job_effect(TEXT) TO service_role;
