// Core Admin Menu — server fns para consumir a árvore de navegação master
// parametrizável (tabela `core_admin_menu`).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ListInput = z.object({
  vertente: z.enum(["impulsionando", "clientes"]).optional(),
});

export type AdminMenuItem = {
  id: string;
  vertente: "impulsionando" | "clientes";
  group_key: string;
  group_label: string;
  group_order: number;
  item_key: string;
  item_label: string;
  item_order: number;
  route: string;
  icon: string | null;
  description: string | null;
  enabled: boolean;
};

export type AdminMenuGroup = {
  vertente: "impulsionando" | "clientes";
  group_key: string;
  group_label: string;
  group_order: number;
  items: AdminMenuItem[];
};

export const listAdminMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const { userId } = context;

    // Gate super-only via RPC existente
    const { data: staff } = await supa.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    let q = supa
      .from("core_admin_menu")
      .select("*")
      .eq("enabled", true)
      .order("group_order", { ascending: true })
      .order("item_order", { ascending: true });
    if (data.vertente) q = q.eq("vertente", data.vertente);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Agrupa por (vertente, group_key)
    const groups = new Map<string, AdminMenuGroup>();
    for (const r of (rows ?? []) as AdminMenuItem[]) {
      const key = `${r.vertente}::${r.group_key}`;
      const g = groups.get(key) ?? {
        vertente: r.vertente,
        group_key: r.group_key,
        group_label: r.group_label,
        group_order: r.group_order,
        items: [],
      };
      g.items.push(r);
      groups.set(key, g);
    }

    return { groups: Array.from(groups.values()) };
  });

const ToggleInput = z.object({
  id: z.string().uuid(),
  enabled: z.boolean(),
});

export const toggleAdminMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ToggleInput.parse(d))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const { userId } = context;

    const { data: staff } = await supa.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { error } = await supa
      .from("core_admin_menu")
      .update({ enabled: data.enabled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Audit
    await supa.from("audit_logs").insert({
      actor_id: userId,
      action: "admin_menu.toggle",
      entity: "core_admin_menu",
      entity_id: data.id,
      metadata: { enabled: data.enabled },
    });

    return { ok: true };
  });

// === LIST ALL (admin CRUD) ===
export const listAdminMenuAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supa = context.supabase as any;
    const { userId } = context;
    const { data: staff } = await supa.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { data: rows, error } = await supa
      .from("core_admin_menu")
      .select("*")
      .order("vertente", { ascending: true })
      .order("group_order", { ascending: true })
      .order("item_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { items: (rows ?? []) as AdminMenuItem[] };
  });

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  vertente: z.enum(["impulsionando", "clientes"]),
  group_key: z.string().min(1),
  group_label: z.string().min(1),
  group_order: z.number().int().min(0),
  item_key: z.string().min(1),
  item_label: z.string().min(1),
  item_order: z.number().int().min(0),
  route: z.string().min(1),
  icon: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
});

export const upsertAdminMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertInput.parse(d))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const { userId } = context;
    const { data: staff } = await supa.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const payload = { ...data, updated_at: new Date().toISOString() };
    let result: any;
    if (data.id) {
      const { data: row, error } = await supa
        .from("core_admin_menu").update(payload).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      result = row;
    } else {
      const { data: row, error } = await supa
        .from("core_admin_menu").insert(payload).select().single();
      if (error) throw new Error(error.message);
      result = row;
    }
    await supa.from("audit_logs").insert({
      actor_id: userId,
      action: data.id ? "admin_menu.update" : "admin_menu.create",
      entity: "core_admin_menu",
      entity_id: result.id,
      metadata: { item_key: data.item_key, route: data.route },
    });
    return { item: result as AdminMenuItem };
  });

const DeleteInput = z.object({ id: z.string().uuid() });
export const deleteAdminMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const { userId } = context;
    const { data: staff } = await supa.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { error } = await supa.from("core_admin_menu").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await supa.from("audit_logs").insert({
      actor_id: userId, action: "admin_menu.delete",
      entity: "core_admin_menu", entity_id: data.id, metadata: {},
    });
    return { ok: true };
  });

const ReorderInput = z.object({
  items: z.array(z.object({ id: z.string().uuid(), item_order: z.number().int().min(0) })).min(1),
});
export const reorderAdminMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReorderInput.parse(d))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const { userId } = context;
    const { data: staff } = await supa.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    for (const it of data.items) {
      const { error } = await supa
        .from("core_admin_menu")
        .update({ item_order: it.item_order, updated_at: new Date().toISOString() })
        .eq("id", it.id);
      if (error) throw new Error(error.message);
    }
    await supa.from("audit_logs").insert({
      actor_id: userId, action: "admin_menu.reorder",
      entity: "core_admin_menu", entity_id: null,
      metadata: { count: data.items.length },
    });
    return { ok: true };
  });
