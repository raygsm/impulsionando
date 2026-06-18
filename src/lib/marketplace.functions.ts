/**
 * Marketplace B2B — server functions.
 *
 * Conecta fornecedores (microcervejarias, distribuidores, vinícolas etc.) a
 * compradores (bares, restaurantes, hotéis, eventos), com cálculo automático
 * da Taxa de Intermediação Digital e registro auditável de GMV no ledger.
 *
 * IMPORTANTE: "Taxa de Intermediação Digital" — nunca chamar de "comissão"
 * na UI nem nos nomes de campos visíveis ao usuário.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============================================================================
// Helpers
// ============================================================================

/** Retorna o fee_pct aplicável: supplier override > niche policy > default. */
async function resolveFeePct(
  supabase: any,
  supplierId: string,
): Promise<{ fee_pct: number; source: string }> {
  // 1) override no próprio fornecedor
  const { data: sup } = await supabase
    .from("mp_suppliers")
    .select("id,supplier_type,custom_fee_pct")
    .eq("id", supplierId)
    .maybeSingle();
  if (sup?.custom_fee_pct != null) {
    return { fee_pct: Number(sup.custom_fee_pct), source: "supplier" };
  }

  // 2) policy por nicho
  if (sup?.supplier_type) {
    const { data: niche } = await supabase
      .from("mp_fee_policies")
      .select("fee_pct")
      .eq("scope", "niche")
      .eq("niche_slug", sup.supplier_type)
      .eq("active", true)
      .maybeSingle();
    if (niche?.fee_pct != null) {
      return { fee_pct: Number(niche.fee_pct), source: "niche" };
    }
  }

  // 3) default
  const { data: def } = await supabase
    .from("mp_fee_policies")
    .select("fee_pct")
    .eq("scope", "default")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { fee_pct: Number(def?.fee_pct ?? 0.005), source: "default" };
}

// ============================================================================
// Suppliers & Buyers (admin/Core)
// ============================================================================

export const listMarketplaceSuppliers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mp_suppliers")
      .select("id,company_id,supplier_type,display_name,description,regions_served,status,custom_fee_pct,created_at")
      .order("display_name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const listMarketplaceBuyers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mp_buyers")
      .select("id,company_id,buyer_type,display_name,delivery_address,status,created_at")
      .order("display_name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const UpsertSupplierInput = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  supplier_type: z.enum([
    "microcervejaria", "distribuidor", "vinicola", "cafe_especial",
    "destilaria", "alimentos_artesanais", "outros",
  ]),
  display_name: z.string().min(1),
  description: z.string().nullish(),
  regions_served: z.array(z.string()).default([]),
  status: z.enum(["active", "paused", "blocked"]).default("active"),
  custom_fee_pct: z.number().min(0).max(0.2).nullish(),
});
export const upsertMarketplaceSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSupplierInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("mp_suppliers")
      .upsert(data, { onConflict: "company_id" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

const UpsertBuyerInput = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  buyer_type: z.enum(["bar", "restaurante", "hotel", "eventos", "outros"]),
  display_name: z.string().min(1),
  delivery_address: z.any().nullish(),
  status: z.enum(["active", "paused", "blocked"]).default("active"),
});
export const upsertMarketplaceBuyer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertBuyerInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("mp_buyers")
      .upsert(data, { onConflict: "company_id" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ============================================================================
// Catalog
// ============================================================================

export const listSupplierCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ supplierId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: items, error } = await context.supabase
      .from("mp_catalog_items")
      .select("id,supplier_id,sku,name,description,unit,price_cents,min_order_qty,stock_qty,active")
      .eq("supplier_id", data.supplierId)
      .order("name", { ascending: true });
    if (error) throw error;
    return items ?? [];
  });

const CatalogItemInput = z.object({
  id: z.string().uuid().optional(),
  supplier_id: z.string().uuid(),
  sku: z.string().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
  unit: z.string().default("un"),
  price_cents: z.number().int().min(0),
  min_order_qty: z.number().min(0).default(1),
  stock_qty: z.number().nullish(),
  active: z.boolean().default(true),
});
export const upsertCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CatalogItemInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("mp_catalog_items")
      .upsert(data)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

// ============================================================================
// Orders
// ============================================================================

const PlaceOrderInput = z.object({
  supplier_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  items: z.array(z.object({
    catalog_item_id: z.string().uuid().optional(),
    name: z.string().min(1),
    unit: z.string().default("un"),
    unit_price_cents: z.number().int().min(0),
    qty: z.number().min(0.001),
  })).min(1),
  notes: z.string().nullish(),
});

export const placeMarketplaceOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlaceOrderInput.parse(d))
  .handler(async ({ context, data }) => {
    const subtotal = data.items.reduce(
      (acc, it) => acc + Math.round(it.unit_price_cents * it.qty),
      0,
    );
    const { fee_pct } = await resolveFeePct(context.supabase, data.supplier_id);
    const fee_cents = Math.round(subtotal * fee_pct);
    const total_cents = subtotal; // a Taxa é deduzida do fornecedor (não soma)
    const supplier_net_cents = subtotal - fee_cents;

    const { data: order, error } = await context.supabase
      .from("mp_orders")
      .insert({
        supplier_id: data.supplier_id,
        buyer_id: data.buyer_id,
        status: "pending_approval",
        subtotal_cents: subtotal,
        fee_pct,
        fee_cents,
        total_cents,
        supplier_net_cents,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    const items = data.items.map((it) => ({
      order_id: order.id,
      catalog_item_id: it.catalog_item_id ?? null,
      name_snapshot: it.name,
      unit: it.unit,
      unit_price_cents: it.unit_price_cents,
      qty: it.qty,
      line_total_cents: Math.round(it.unit_price_cents * it.qty),
    }));
    const { error: iErr } = await context.supabase.from("mp_order_items").insert(items);
    if (iErr) throw iErr;

    // Notifica fornecedor do novo pedido (todos os usuários ativos da empresa)
    const { data: sup } = await context.supabase
      .from("mp_suppliers").select("company_id, display_name").eq("id", data.supplier_id).maybeSingle();
    const { data: buy } = await context.supabase
      .from("mp_buyers").select("display_name").eq("id", data.buyer_id).maybeSingle();
    if (sup?.company_id) {
      await notify(context.supabase, {
        company_id: sup.company_id,
        category: "marketplace",
        severity: "info",
        title: "Novo pedido recebido",
        message: `Pedido #${order.order_number} de ${buy?.display_name ?? "comprador"} — ${(subtotal/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}`,
        action_url: `/cervejaria/marketplace?order=${order.id}`,
      });
    }

    // Audit: pedido enviado
    await audit(context.supabase, context.userId, {
      order_id: order.id,
      event_type: "placed",
      notes: data.notes ?? null,
      role: "buyer",
    });

    return order;
  });

const UpdateOrderStatusInput = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "in_production", "in_delivery", "invoiced", "completed", "canceled"]),
  decision_notes: z.string().nullish(),
});

async function notify(
  supabase: any,
  args: { company_id: string | null; category: string; severity: string; title: string; message: string; action_url?: string },
) {
  if (!args.company_id) return;
  const { data: users } = await supabase
    .from("user_profiles").select("user_id").eq("company_id", args.company_id).eq("is_active", true);
  const rows = (users ?? []).map((u: any) => ({
    user_id: u.user_id,
    company_id: args.company_id,
    category: args.category,
    severity: args.severity,
    title: args.title,
    message: args.message,
    action_url: args.action_url ?? null,
  }));
  if (rows.length) await supabase.from("notifications").insert(rows);
}

async function audit(
  supabase: any,
  userId: string,
  args: { order_id: string; event_type: string; notes?: string | null; role?: string },
) {
  const { data: profile } = await supabase
    .from("user_profiles").select("display_name,email").eq("user_id", userId).maybeSingle();
  await supabase.from("mp_order_events").insert({
    order_id: args.order_id,
    event_type: args.event_type,
    notes: args.notes ?? null,
    actor_user_id: userId,
    actor_display_name: profile?.display_name ?? profile?.email ?? null,
    actor_role: args.role ?? null,
  });
}

export const updateMarketplaceOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateOrderStatusInput.parse(d))
  .handler(async ({ context, data }) => {
    const nowIso = new Date().toISOString();
    const patch: {
      status: typeof data.status;
      decision_notes?: string | null;
      approved_at?: string;
      rejected_at?: string;
      invoiced_at?: string;
      completed_at?: string;
    } = { status: data.status };
    if (data.decision_notes != null) patch.decision_notes = data.decision_notes;
    if (data.status === "approved") patch.approved_at = nowIso;
    if (data.status === "rejected") patch.rejected_at = nowIso;
    if (data.status === "invoiced") patch.invoiced_at = nowIso;
    if (data.status === "completed") patch.completed_at = nowIso;

    const { data: order, error } = await context.supabase
      .from("mp_orders")
      .update(patch)
      .eq("id", data.order_id)
      .select(`*, supplier:mp_suppliers(company_id, display_name), buyer:mp_buyers(company_id, display_name)`)
      .single();
    if (error) throw error;


    // Notificações para AMBAS as partes (comprador + fornecedor)
    if (order && ["approved", "rejected", "in_production", "in_delivery", "invoiced", "completed", "canceled"].includes(data.status)) {
      const labelMap: Record<string, { title: string; sev: string }> = {
        approved: { title: "Pedido aprovado pelo fornecedor", sev: "success" },
        rejected: { title: "Pedido recusado pelo fornecedor", sev: "error" },
        in_production: { title: "Pedido em produção", sev: "info" },
        in_delivery: { title: "Pedido em entrega", sev: "info" },
        invoiced: { title: "Pedido faturado", sev: "info" },
        completed: { title: "Pedido concluído", sev: "success" },
        canceled: { title: "Pedido cancelado", sev: "warning" },
      };
      const l = labelMap[data.status];
      const msgBase = `Pedido #${order.order_number} · ${order.supplier?.display_name} ↔ ${order.buyer?.display_name}.`;
      const msg = `${msgBase} ${data.decision_notes ?? ""}`.trim();
      // Comprador
      await notify(context.supabase, {
        company_id: order.buyer?.company_id ?? null,
        category: "marketplace", severity: l.sev, title: l.title, message: msg,
        action_url: `/bar/marketplace?order=${order.id}`,
      });
      // Fornecedor (confirmação interna p/ equipe)
      await notify(context.supabase, {
        company_id: order.supplier?.company_id ?? null,
        category: "marketplace", severity: l.sev, title: l.title, message: msg,
        action_url: `/cervejaria/marketplace?order=${order.id}`,
      });
    }

    // Audit: registra o evento com o usuário responsável
    await audit(context.supabase, context.userId, {
      order_id: order.id,
      event_type: data.status,
      notes: data.decision_notes ?? null,
      role: "supplier",
    });

    // Ledger ao concluir
    if (data.status === "completed" && order) {
      const period = new Date(order.completed_at ?? order.placed_at);
      const period_month = `${period.getUTCFullYear()}-${String(period.getUTCMonth() + 1).padStart(2, "0")}-01`;
      await context.supabase.from("mp_transactions_ledger").upsert(
        {
          order_id: order.id,
          supplier_id: order.supplier_id,
          buyer_id: order.buyer_id,
          period_month,
          gmv_cents: order.subtotal_cents,
          fee_pct: order.fee_pct,
          fee_cents: order.fee_cents,
          supplier_net_cents: order.supplier_net_cents,
        },
        { onConflict: "order_id" },
      );
    }

    return order;
  });

const ListOrdersInput = z.object({
  status: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  buyerId: z.string().uuid().optional(),
  sinceDays: z.number().int().min(1).max(365).optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listMarketplaceOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListOrdersInput.parse(d))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("mp_orders")
      .select(`
        id, order_number, status, subtotal_cents, fee_pct, fee_cents, total_cents,
        supplier_net_cents, placed_at, approved_at, rejected_at, invoiced_at, completed_at,
        notes, decision_notes,
        supplier:mp_suppliers(id, display_name, supplier_type, company_id),
        buyer:mp_buyers(id, display_name, buyer_type, company_id),
        items:mp_order_items(id, name_snapshot, unit, unit_price_cents, qty, line_total_cents)
      `)
      .order("placed_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    if (data.supplierId) q = q.eq("supplier_id", data.supplierId);
    if (data.buyerId) q = q.eq("buyer_id", data.buyerId);
    if (data.sinceDays) {
      const since = new Date(Date.now() - data.sinceDays * 86400_000).toISOString();
      q = q.gte("placed_at", since);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// Preview da Taxa de Intermediação Digital antes de gerar o pedido
export const previewMarketplaceFee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ supplier_id: z.string().uuid(), subtotal_cents: z.number().int().min(0) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { fee_pct, source } = await resolveFeePct(context.supabase, data.supplier_id);
    const fee_cents = Math.round(data.subtotal_cents * fee_pct);
    return {
      fee_pct,
      fee_cents,
      supplier_net_cents: data.subtotal_cents - fee_cents,
      total_cents: data.subtotal_cents,
      source,
    };
  });

// ============================================================================
// KPIs / GMV
// ============================================================================

export const fetchMarketplaceKPIs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ sinceDays: z.number().int().min(1).max(365).default(30) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sinceIso = new Date(Date.now() - data.sinceDays * 86400_000).toISOString();
    const { data: ledger, error } = await context.supabase
      .from("mp_transactions_ledger")
      .select("gmv_cents,fee_cents,supplier_net_cents,period_month,supplier_id,buyer_id")
      .gte("recorded_at", sinceIso);
    if (error) throw error;

    const gmv = (ledger ?? []).reduce((a, r) => a + (r.gmv_cents || 0), 0);
    const fee = (ledger ?? []).reduce((a, r) => a + (r.fee_cents || 0), 0);
    const supplierNet = (ledger ?? []).reduce((a, r) => a + (r.supplier_net_cents || 0), 0);

    // Top fornecedores
    const bySupplier = new Map<string, number>();
    (ledger ?? []).forEach((r) => bySupplier.set(r.supplier_id, (bySupplier.get(r.supplier_id) || 0) + r.gmv_cents));
    const topSuppliers = [...bySupplier.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([supplier_id, gmv_cents]) => ({ supplier_id, gmv_cents }));

    return {
      window_days: data.sinceDays,
      gmv_cents: gmv,
      fee_cents: fee,
      supplier_net_cents: supplierNet,
      orders: ledger?.length ?? 0,
      top_suppliers: topSuppliers,
    };
  });

// ============================================================================
// Fee policies
// ============================================================================

export const listFeePolicies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mp_fee_policies")
      .select("id,scope,niche_slug,supplier_id,fee_pct,label,active,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// ============================================================================
// Buyer self-service
// ============================================================================

/** Retorna o perfil de comprador (mp_buyers) das empresas do usuário logado. */
export const getMyBuyerProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mp_buyers")
      .select("id,company_id,buyer_type,display_name,delivery_address,status")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

/** Lista fornecedores ativos visíveis no marketplace (sem exigir Core). */
export const listActiveSuppliersPublic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mp_suppliers")
      .select("id,supplier_type,display_name,description,regions_served,status")
      .eq("status", "active")
      .order("display_name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
