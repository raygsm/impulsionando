import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RegisterSchema = z.object({
  tenantSlug: z.string().max(120).nullable().optional(),
  mode: z.enum(["demo", "producao"]).default("demo"),
  regua: z.string().max(60).nullable().optional(),
  action: z.enum(["download", "download_zip", "activate", "test"]).default("download"),
  files: z.array(z.string().max(500)).max(200).default([]),
  note: z.string().max(500).nullable().optional(),
});

export const registerAutomationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegisterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("automation_approvals")
      .insert({
        user_id: userId,
        tenant_slug: data.tenantSlug ?? null,
        mode: data.mode,
        regua: data.regua ?? null,
        action: data.action,
        files: data.files,
        note: data.note ?? null,
        status: "pending",
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id, createdAt: row.created_at };
  });

export const listAutomationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        tenantSlug: z.string().max(120).nullable().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("automation_approvals")
      .select("id, tenant_slug, mode, regua, action, files, note, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.tenantSlug) query = query.eq("tenant_slug", data.tenantSlug);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getAutomationApprovalCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ tenantSlug: z.string().max(120).nullable().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("automation_approvals")
      .select("status", { head: false });
    if (data.tenantSlug) query = query.eq("tenant_slug", data.tenantSlug);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const counts = { pending: 0, approved: 0, rejected: 0, registered: 0, total: 0 };
    for (const r of rows ?? []) {
      counts.total++;
      const s = (r as { status: string }).status;
      if (s === "pending") counts.pending++;
      else if (s === "approved") counts.approved++;
      else if (s === "rejected") counts.rejected++;
      else if (s === "registered") counts.registered++;
    }
    return counts;
  });

