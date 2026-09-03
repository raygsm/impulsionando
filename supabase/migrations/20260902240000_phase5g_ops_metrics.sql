-- Phase 5G — read-only ops metrics RPCs (depends on 5B pgmq + idempotency ledger).
-- Additive only. DO NOT apply from this agent session — operator applies on staging when ready.
-- No writes to queues; service_role execute only.

CREATE OR REPLACE FUNCTION public.get_reengineering_queue_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  jobs_length BIGINT := 0;
  jobs_oldest INT := NULL;
  jobs_newest INT := NULL;
  jobs_total BIGINT := NULL;
  jobs_visible BIGINT := NULL;
  dlq_length BIGINT := 0;
  dlq_oldest INT := NULL;
  dlq_newest INT := NULL;
  dlq_total BIGINT := NULL;
  dlq_visible BIGINT := NULL;
  processing_count BIGINT := 0;
  completed_count BIGINT := 0;
  failed_count BIGINT := 0;
BEGIN
  BEGIN
    SELECT
      m.queue_length,
      m.oldest_msg_age_sec,
      m.newest_msg_age_sec,
      m.total_messages,
      m.queue_visible_length
    INTO
      jobs_length,
      jobs_oldest,
      jobs_newest,
      jobs_total,
      jobs_visible
    FROM pgmq.metrics('reengineering_jobs') m;
  EXCEPTION
    WHEN OTHERS THEN
      jobs_length := 0;
      jobs_oldest := NULL;
      jobs_newest := NULL;
      jobs_total := NULL;
      jobs_visible := NULL;
  END;

  BEGIN
    SELECT
      m.queue_length,
      m.oldest_msg_age_sec,
      m.newest_msg_age_sec,
      m.total_messages,
      m.queue_visible_length
    INTO
      dlq_length,
      dlq_oldest,
      dlq_newest,
      dlq_total,
      dlq_visible
    FROM pgmq.metrics('reengineering_jobs_dlq') m;
  EXCEPTION
    WHEN OTHERS THEN
      dlq_length := 0;
      dlq_oldest := NULL;
      dlq_newest := NULL;
      dlq_total := NULL;
      dlq_visible := NULL;
  END;

  BEGIN
    SELECT
      COUNT(*) FILTER (WHERE state = 'processing'),
      COUNT(*) FILTER (WHERE state = 'completed'),
      COUNT(*) FILTER (WHERE state = 'failed')
    INTO processing_count, completed_count, failed_count
    FROM public.reengineering_job_idempotency;
  EXCEPTION
    WHEN undefined_table THEN
      processing_count := 0;
      completed_count := 0;
      failed_count := 0;
  END;

  RETURN jsonb_build_object(
    'schemaVersion', 1,
    'scrapedAt', now(),
    'queues', jsonb_build_array(
      jsonb_build_object(
        'queueName', 'reengineering_jobs',
        'backlog', COALESCE(jobs_length, 0),
        'oldestJobAgeSeconds', COALESCE(to_jsonb(jobs_oldest), 'null'::jsonb),
        'newestJobAgeSeconds', COALESCE(to_jsonb(jobs_newest), 'null'::jsonb),
        'totalMessages', COALESCE(to_jsonb(jobs_total), 'null'::jsonb),
        'visibleLength', COALESCE(to_jsonb(jobs_visible), 'null'::jsonb)
      ),
      jsonb_build_object(
        'queueName', 'reengineering_jobs_dlq',
        'backlog', COALESCE(dlq_length, 0),
        'oldestJobAgeSeconds', COALESCE(to_jsonb(dlq_oldest), 'null'::jsonb),
        'newestJobAgeSeconds', COALESCE(to_jsonb(dlq_newest), 'null'::jsonb),
        'totalMessages', COALESCE(to_jsonb(dlq_total), 'null'::jsonb),
        'visibleLength', COALESCE(to_jsonb(dlq_visible), 'null'::jsonb)
      )
    ),
    'idempotency', jsonb_build_object(
      'processing', processing_count,
      'completed', completed_count,
      'failed', failed_count
    ),
    'dlqBacklog', COALESCE(dlq_length, 0),
    'providerLatencyMsP50', 'null'::jsonb,
    'providerLatencyMsP95', 'null'::jsonb
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reengineering_queue_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reengineering_queue_metrics() TO service_role;

COMMENT ON FUNCTION public.get_reengineering_queue_metrics() IS
  'Phase 5G read-only queue/idempotency metrics for ops API. No secrets. No queue mutations.';
