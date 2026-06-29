import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supa: any, userId: string) {
  const { data, error } = await supa.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas equipe Impulsionando.");
}

export type ActionItem = { title: string; owner?: string | null; due_at?: string | null; done?: boolean };

export type PostmortemRow = {
  id: string;
  scope: string;
  url: string | null;
  severity: string;
  status: string;
  title: string;
  detected_at: string;
  resolved_at: string | null;
  postmortem_summary: string | null;
  postmortem_root_cause: string | null;
  postmortem_impact: string | null;
  postmortem_mitigation: string | null;
  postmortem_lessons: string | null;
  postmortem_action_items: ActionItem[];
  postmortem_published_at: string | null;
  mttr_minutes: number | null;
};

const SELECT =
  "id, scope, url, severity, status, title, detected_at, resolved_at, postmortem_summary, postmortem_root_cause, postmortem_impact, postmortem_mitigation, postmortem_lessons, postmortem_action_items, postmortem_published_at";

function shape(r: any): PostmortemRow {
  const mttr =
    r.resolved_at && r.detected_at
      ? Math.round((new Date(r.resolved_at).getTime() - new Date(r.detected_at).getTime()) / 60000)
      : null;
  return {
    ...r,
    postmortem_action_items: Array.isArray(r.postmortem_action_items) ? r.postmortem_action_items : [],
    mttr_minutes: mttr,
  } as PostmortemRow;
}

export const listPostmortems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const since = new Date(Date.now() - 180 * 86400000).toISOString();
    const { data, error } = await supa
      .from("core_incidents")
      .select(SELECT)
      .eq("status", "resolved")
      .gte("resolved_at", since)
      .order("resolved_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    const rows: PostmortemRow[] = (data ?? []).map(shape);
    const kpis = {
      total: rows.length,
      published: rows.filter((r) => r.postmortem_published_at).length,
      drafts: rows.filter((r) => r.postmortem_summary && !r.postmortem_published_at).length,
      missing: rows.filter((r) => !r.postmortem_summary).length,
      open_actions: rows.reduce(
        (s, r) => s + r.postmortem_action_items.filter((a: ActionItem) => !a.done).length,
        0,
      ),
    };
    return { rows, kpis };
  });

const actionSchema = z.object({
  title: z.string().min(1),
  owner: z.string().nullable().optional(),
  due_at: z.string().nullable().optional(),
  done: z.boolean().optional(),
});

const saveSchema = z.object({
  id: z.string().uuid(),
  summary: z.string().max(2000).optional().nullable(),
  root_cause: z.string().max(4000).optional().nullable(),
  impact: z.string().max(2000).optional().nullable(),
  mitigation: z.string().max(4000).optional().nullable(),
  lessons: z.string().max(4000).optional().nullable(),
  action_items: z.array(actionSchema).max(50).optional(),
  publish: z.boolean().optional(),
});

export const savePostmortem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const supa = context.supabase as any;
    const patch: any = {
      postmortem_summary: data.summary ?? null,
      postmortem_root_cause: data.root_cause ?? null,
      postmortem_impact: data.impact ?? null,
      postmortem_mitigation: data.mitigation ?? null,
      postmortem_lessons: data.lessons ?? null,
      postmortem_action_items: data.action_items ?? [],
      postmortem_author: context.userId,
    };
    if (data.publish) patch.postmortem_published_at = new Date().toISOString();
    // Mirror summary into legacy postmortem text column for backwards compatibility.
    patch.postmortem = data.summary ?? null;
    const { data: row, error } = await supa
      .from("core_incidents")
      .update(patch)
      .eq("id", data.id)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return shape(row);
  });
