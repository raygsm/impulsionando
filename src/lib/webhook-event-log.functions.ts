/**
 * Server functions para a tela de log de webhooks (financeiro).
 *
 * - listWebhookEventLog: filtros (source, status, busca textual em target_id).
 * - replayWebhookEvent: reprocessa um evento de close-invoice de forma
 *   idempotente. Registra motivo + usuário em `webhook_event_log`
 *   (replay_reason / replayed_by / replayed_at / replay_count).
 *
 * Apenas perfis master / manager / admin / support podem replay.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ListInput = z.object({
  source: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const listWebhookEventLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("webhook_event_log")
      .select(
        "id, source, event_id, target_kind, target_id, status, error, replay_count, replay_reason, replayed_at, replayed_by, payload, result, processed_at",
      )
      .order("processed_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (data.source) q = q.eq("source", data.source);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) {
      q = q.or(
        `target_id.ilike.%${data.search}%,event_id.ilike.%${data.search}%`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const webhookEventLogSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await context.supabase
      .from("webhook_event_log")
      .select("status, source")
      .gte("processed_at", since);
    if (error) throw new Error(error.message);
    const total = data?.length ?? 0;
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    (data ?? []).forEach((r: any) => {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      bySource[r.source] = (bySource[r.source] ?? 0) + 1;
    });
    return { total, byStatus, bySource };
  });

const ReplayInput = z.object({
  id: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

/**
 * Reprocessa de forma segura: chama internamente a mesma rota
 * `/api/public/payments/close-invoice/replay` (que respeita idempotência).
 */
export const replayWebhookEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReplayInput.parse(d))
  .handler(async ({ data, context }) => {
    // valida role
    const roleCheck = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const allowed = (roleCheck.data ?? []).some((r: any) =>
      ["master", "manager", "admin", "support"].includes(String(r.role)),
    );
    if (!allowed) throw new Error("Apenas admins/master/manager/suporte podem reprocessar.");

    const { data: row, error } = await context.supabase
      .from("webhook_event_log")
      .select("id, source, event_id, target_kind, target_id, payload, status, replay_count")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Evento não encontrado");
    if (row.source !== "close-invoice") {
      throw new Error(`Replay não suportado para source=${row.source}`);
    }

    // chama o RPC de auditoria primeiro
    const { data: regRes, error: regErr } = await context.supabase.rpc(
      "webhook_log_register_replay",
      { _id: data.id, _reason: data.reason, _user: context.userId },
    );
    if (regErr) throw new Error(regErr.message);
    if (!(regRes as any)?.ok) throw new Error((regRes as any)?.error ?? "register_failed");

    // reexecuta o RPC de fechamento (idempotente: já trata already_paid)
    const RPC_BY_KIND: Record<string, string> = {
      consumer: "mark_membership_invoice_paid",
      erp: "mark_billing_invoice_paid",
      table: "restaurant_mark_table_invoice_paid",
    };
    const kind = row.target_kind as string;
    const rpc = RPC_BY_KIND[kind];
    if (!rpc) throw new Error(`Kind desconhecido: ${kind}`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rpcRes, error: rpcErr } = await (supabaseAdmin as any).rpc(rpc, {
      _invoice_id: row.target_id,
    });
    if (rpcErr) {
      await supabaseAdmin
        .from("webhook_event_log")
        .update({ status: "error", error: rpcErr.message })
        .eq("id", data.id);
      throw new Error(rpcErr.message);
    }
    await supabaseAdmin
      .from("webhook_event_log")
      .update({
        result: { ok: true, rpc, data: rpcRes, replay: true },
        status: "processed",
        error: null,
      })
      .eq("id", data.id);

    // auditoria
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "webhook_event_log.replay",
      entity: "webhook_event_log",
      entity_id: data.id,
      after: { reason: data.reason, rpc, kind, target_id: row.target_id },
    });

    return { ok: true, rpc, result: rpcRes };
  });
