/**
 * Idempotência de webhooks de pagamento.
 *
 * Cada evento é registrado em `webhook_event_log` por (source, event_id).
 * Quando o provedor reenviar o mesmo evento, retornamos imediatamente o
 * resultado anterior sem reprocessar (evita baixar a fatura duas vezes e
 * disparar notificações duplicadas).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export interface IdempotencyHit {
  duplicate: boolean;
  previous_result?: unknown;
}

/** Calcula um event_id determinístico a partir do corpo bruto se o provedor não enviar um. */
export function computeEventId(rawBody: string, headerValue?: string | null): string {
  if (headerValue && headerValue.length <= 200) return headerValue;
  return createHash("sha256").update(rawBody).digest("hex").slice(0, 64);
}

/**
 * Tenta inserir o registro do evento. Se já existia, devolve `duplicate: true`
 * com o resultado anterior; se não, devolve `duplicate: false` e o caller
 * deve processar normalmente e depois chamar {@link recordWebhookResult}.
 */
export async function claimWebhookEvent(
  supabaseAdmin: SupabaseClient,
  args: {
    source: string;
    event_id: string;
    target_kind?: string;
    target_id?: string;
    payload?: unknown;
  },
): Promise<IdempotencyHit> {
  const { error } = await supabaseAdmin.from("webhook_event_log").insert({
    source: args.source,
    event_id: args.event_id,
    target_kind: args.target_kind ?? null,
    target_id: args.target_id ?? null,
    payload: args.payload ?? null,
  });
  if (!error) return { duplicate: false };

  // 23505 = unique_violation → duplicado
  const code = (error as any).code ?? "";
  if (code === "23505") {
    const { data } = await supabaseAdmin
      .from("webhook_event_log")
      .select("result")
      .eq("source", args.source)
      .eq("event_id", args.event_id)
      .maybeSingle();
    return { duplicate: true, previous_result: data?.result ?? null };
  }
  // Erro inesperado: deixa o caller decidir (não bloqueia processamento)
  console.warn("claimWebhookEvent insert failed", error);
  return { duplicate: false };
}

export async function recordWebhookResult(
  supabaseAdmin: SupabaseClient,
  args: {
    source: string;
    event_id: string;
    result: unknown;
    status?: "processed" | "error" | "duplicate" | "replayed";
    error?: string | null;
  },
): Promise<void> {
  const patch: Record<string, unknown> = { result: args.result as any };
  if (args.status) patch.status = args.status;
  if (args.error !== undefined) patch.error = args.error;
  await supabaseAdmin
    .from("webhook_event_log")
    .update(patch as any)
    .eq("source", args.source)
    .eq("event_id", args.event_id);
}

