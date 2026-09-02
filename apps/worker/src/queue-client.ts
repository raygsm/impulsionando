import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type QueueMessage = {
  msgId: number;
  readCt: number;
  message: Record<string, unknown>;
};

export function createWorkerSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function readJobBatch(
  client: SupabaseClient,
  batchSize: number,
  visibilityTimeoutSeconds: number,
): Promise<QueueMessage[]> {
  const { data, error } = await client.rpc("read_reengineering_job_batch", {
    batch_size: batchSize,
    vt: visibilityTimeoutSeconds,
  });
  if (error) throw error;
  return (data ?? []).map((row: { msg_id: number; read_ct: number; message: Record<string, unknown> }) => ({
    msgId: row.msg_id,
    readCt: row.read_ct,
    message: row.message,
  }));
}

export async function deleteJobMessage(client: SupabaseClient, msgId: number): Promise<void> {
  const { error } = await client.rpc("delete_reengineering_job", { message_id: msgId });
  if (error) throw error;
}

export async function moveJobToDlq(
  client: SupabaseClient,
  msgId: number,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await client.rpc("move_reengineering_job_to_dlq", {
    message_id: msgId,
    payload,
  });
  if (error) throw error;
}

export type IdempotencyClaim = "claimed" | "skip_completed" | "skip_processing";

export async function claimIdempotency(
  client: SupabaseClient,
  input: {
    scopeKey: string;
    tenantId: string;
    jobType: string;
    idempotencyKey: string;
    jobId: string;
  },
): Promise<IdempotencyClaim> {
  const { data, error } = await client.rpc("claim_reengineering_job_idempotency", {
    p_scope_key: input.scopeKey,
    p_tenant_id: input.tenantId,
    p_job_type: input.jobType,
    p_idempotency_key: input.idempotencyKey,
    p_job_id: input.jobId,
  });
  if (error) throw error;
  return data as IdempotencyClaim;
}

export async function completeIdempotency(client: SupabaseClient, scopeKey: string): Promise<void> {
  const { error } = await client.rpc("complete_reengineering_job_idempotency", {
    p_scope_key: scopeKey,
  });
  if (error) throw error;
}

export async function failIdempotency(client: SupabaseClient, scopeKey: string): Promise<void> {
  const { error } = await client.rpc("fail_reengineering_job_idempotency", {
    p_scope_key: scopeKey,
  });
  if (error) throw error;
}

export async function recordJobEffect(
  client: SupabaseClient,
  input: { scopeKey: string; tenantId: string; effectType: string; jobId: string },
): Promise<boolean> {
  const { data, error } = await client.rpc("record_reengineering_job_effect", {
    p_scope_key: input.scopeKey,
    p_tenant_id: input.tenantId,
    p_effect_type: input.effectType,
    p_job_id: input.jobId,
  });
  if (error) throw error;
  return Boolean(data);
}
