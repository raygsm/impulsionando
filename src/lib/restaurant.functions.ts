/**
 * Restaurante — server functions para mesas e comandas.
 *
 * - listRestaurantTables: mesas da empresa do usuário com sessão ativa e total.
 * - createRestaurantTable / updateRestaurantTable / deleteRestaurantTable.
 * - openTableSession / closeTableSession.
 * - listOpenSessions: visão do salão.
 *
 * Reaproveita sales_orders como comanda; cada nova sessão cria 1 pedido aberto.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function resolveCompanyId(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Usuário sem empresa vinculada.");
  return data.company_id as string;
}

export const listRestaurantTables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select(
        `id, number, label, capacity, area, status, qr_token, is_active, notes, current_session_id,
         session:current_session_id ( id, customer_name, party_size, total, opened_at, status )`,
      )
      .eq("company_id", companyId)
      .order("number");
    if (error) throw new Error(error.message);
    return { tables: data ?? [] };
  });

const CreateInput = z.object({
  number: z.number().int().min(1).max(9999),
  capacity: z.number().int().min(1).max(50).default(4),
  area: z.string().max(40).optional(),
  label: z.string().max(40).optional(),
});

export const createRestaurantTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { data: row, error } = await supabase
      .from("restaurant_tables")
      .insert({
        company_id: companyId,
        number: data.number,
        capacity: data.capacity,
        area: data.area ?? null,
        label: data.label ?? null,
      })
      .select("id, qr_token")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  number: z.number().int().min(1).max(9999).optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  area: z.string().max(40).nullable().optional(),
  label: z.string().max(40).nullable().optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const updateRestaurantTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { id, ...rest } = data;
    const { error } = await supabase
      .from("restaurant_tables")
      .update(rest)
      .eq("id", id)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRestaurantTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { error } = await supabase
      .from("restaurant_tables")
      .delete()
      .eq("id", data.id)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const OpenInput = z.object({
  table_id: z.string().uuid(),
  customer_name: z.string().max(120).optional(),
  customer_phone: z.string().max(40).optional(),
  party_size: z.number().int().min(1).max(50).default(1),
});

export const openTableSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OpenInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);

    // bloqueia abrir 2 sessões na mesma mesa
    const { data: tbl, error: tErr } = await supabase
      .from("restaurant_tables")
      .select("id, current_session_id")
      .eq("id", data.table_id)
      .eq("company_id", companyId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!tbl) throw new Error("Mesa não encontrada.");
    if (tbl.current_session_id) throw new Error("Mesa já está ocupada.");

    // Cria pedido de venda (comanda) zerado
    const { data: order, error: oErr } = await supabase
      .from("sales_orders")
      .insert({
        company_id: companyId,
        status: "aberto",
        customer_name: data.customer_name ?? null,
        subtotal: 0,
        discount: 0,
        total: 0,
        notes: `Mesa ${data.table_id.slice(0, 8)}`,
        created_by: userId,
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { data: sess, error: sErr } = await supabase
      .from("restaurant_table_sessions")
      .insert({
        company_id: companyId,
        table_id: data.table_id,
        sales_order_id: order.id,
        customer_name: data.customer_name ?? null,
        customer_phone: data.customer_phone ?? null,
        party_size: data.party_size,
        opened_by: userId,
      })
      .select("id")
      .single();
    if (sErr) throw new Error(sErr.message);
    return { session_id: sess.id, order_id: order.id };
  });

export const closeTableSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { error } = await supabase
      .from("restaurant_table_sessions")
      .update({ status: "fechada", closed_at: new Date().toISOString() })
      .eq("id", data.session_id)
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listOpenSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { data, error } = await supabase
      .from("restaurant_table_sessions")
      .select(
        `id, customer_name, customer_phone, party_size, total, opened_at, status,
         table:table_id ( id, number, label, area, capacity ),
         order:sales_order_id ( id, total, subtotal )`,
      )
      .eq("company_id", companyId)
      .eq("status", "aberta")
      .order("opened_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { sessions: data ?? [] };
  });
