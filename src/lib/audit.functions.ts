import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    company_id?: string;
    white_label_id?: string;
    user_email?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("audit_logs")
      .select("id, company_id, user_id, user_email, action, entity, entity_id, before, after, metadata, created_at, companies:company_id(name)")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 500, 2000));
    if (data.company_id) q = q.eq("company_id", data.company_id);
    if (data.user_email) q = q.ilike("user_email", `%${data.user_email}%`);
    if (data.action) q = q.ilike("action", `%${data.action}%`);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const auditFilterOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [actions, entities, companies] = await Promise.all([
      context.supabase.from("audit_logs").select("action").limit(2000),
      context.supabase.from("audit_logs").select("entity").limit(2000),
      context.supabase.from("companies").select("id, name").order("name").limit(500),
    ]);
    const uniq = (arr: { action?: string; entity?: string }[] | null, k: "action" | "entity") =>
      Array.from(new Set((arr ?? []).map((r) => r[k]).filter(Boolean) as string[])).sort();
    return {
      actions: uniq(actions.data, "action"),
      entities: uniq(entities.data, "entity"),
      companies: companies.data ?? [],
    };
  });

import { z } from "zod";

/**
 * Exporta audit_logs em CSV, com filtros por company_id, contract_number e version,
 * incluindo tipo de download (variant) e timestamp. Respeita RLS via supabase do contexto.
 */
export const exportAuditLogsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      company_id: z.string().uuid().optional(),
      contract_number: z.string().optional(),
      version: z.number().int().optional(),
      action: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.number().int().max(20000).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("audit_logs")
      .select("id, created_at, company_id, user_email, action, entity, entity_id, metadata, companies:company_id(name)")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 5000, 20000));

    if (data.company_id) q = q.eq("company_id", data.company_id);
    if (data.action) q = q.ilike("action", `%${data.action}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);

    const { data: rows, error } = await q;
    if (error) throw error;

    let filtered = rows ?? [];
    if (data.contract_number) {
      filtered = filtered.filter((r: any) => r?.metadata?.contract_number === data.contract_number);
    }
    if (typeof data.version === "number") {
      filtered = filtered.filter((r: any) => Number(r?.metadata?.version) === data.version);
    }

    const header = [
      "timestamp",
      "company_id",
      "company_name",
      "user_email",
      "action",
      "entity",
      "entity_id",
      "contract_number",
      "version",
      "parent_document_id",
      "download_variant",
      "signed_variant",
      "idempotency_key",
    ];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    for (const r of filtered as any[]) {
      const m = r.metadata ?? {};
      lines.push(
        [
          r.created_at,
          r.company_id,
          r.companies?.name ?? "",
          r.user_email ?? "",
          r.action ?? "",
          r.entity ?? "",
          r.entity_id ?? "",
          m.contract_number ?? "",
          m.version ?? "",
          m.parent_document_id ?? "",
          m.variant ?? "",
          m.signed_variant ?? "",
          m.idempotency_key ?? "",
        ].map(esc).join(","),
      );
    }
    const csv = lines.join("\n");
    return {
      filename: `audit_logs_${data.contract_number ?? "all"}_${Date.now()}.csv`,
      count: filtered.length,
      csv,
    };
  });
