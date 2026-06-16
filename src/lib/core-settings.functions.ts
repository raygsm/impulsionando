import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando");
}

export const listCoreSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("core_settings")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

const upsertSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().min(1).optional(),
});

export const upsertCoreSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {
      key: data.key,
      value: data.value,
      label: data.label ?? data.key,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    };
    if (data.description !== undefined) patch.description = data.description;
    if (data.category) patch.category = data.category;
    const { data: row, error } = await (supabaseAdmin as any)
      .from("core_settings")
      .upsert(patch, { onConflict: "key" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
