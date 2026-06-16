// Audit log for exports (CSV/PDF) generated from the UI.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  kind: z.enum(["csv", "pdf"]),
  scope: z.string().min(1).max(80),
  params: z.record(z.string(), z.any()).default({}),
  rowCount: z.number().int().nonnegative().default(0),
  companyId: z.string().uuid().nullable().optional(),
  notes: z.string().max(400).optional(),
});

export const logExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("core_export_logs").insert({
      user_id: userId,
      company_id: data.companyId ?? null,
      kind: data.kind,
      scope: data.scope,
      params: data.params,
      row_count: data.rowCount,
      notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ListSchema = z.object({
  scope: z.string().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listExportLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ListSchema.parse(data))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("core_export_logs")
      .select("id,user_id,company_id,kind,scope,params,row_count,notes,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.scope) q = q.eq("scope", data.scope);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
