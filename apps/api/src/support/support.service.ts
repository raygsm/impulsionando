import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SupportTicketCreateBody } from "@impulsionando/contracts";

@Injectable()
export class SupportService {
  private client(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
    return createClient(url, key, { auth: { persistSession: false } });
  }

  async createTicket(
    body: SupportTicketCreateBody,
    opts: { idempotencyKey?: string; correlationId: string },
  ) {
    const sb = this.client();
    const row = {
      subject: body.subject,
      description: body.description,
      type: body.type ?? "other",
      priority: body.priority ?? "medium",
      status: "new",
      source: body.source ?? "api.v1.support",
      page: body.page ?? null,
      requester_name: body.requester?.name ?? null,
      requester_email: body.requester?.email ?? null,
      requester_phone: body.requester?.phone ?? null,
      idempotency_key: opts.idempotencyKey ?? null,
      correlation_id: opts.correlationId,
    };

    const { data, error } = await sb
      .from("support_tickets")
      .insert(row as never)
      .select("id, subject, status, created_at")
      .single();

    if (error) {
      // Table/columns may differ on staging — surface code for operators.
      throw new Error(`SUPPORT_INSERT_FAILED:${error.code || error.message}`);
    }

    return data;
  }
}
