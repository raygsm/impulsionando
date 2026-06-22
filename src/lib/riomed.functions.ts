import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getRioMedId(supabase: any): Promise<string | null> {
  const { data } = await supabase.from("companies").select("id").eq("subdomain", "riomed").maybeSingle();
  return data?.id ?? null;
}

// ============ RENTAL ASSETS ============
export const listRentalAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) return [];
    const { data } = await context.supabase
      .from("rental_assets").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const createRentalAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    asset_code: z.string().min(1), name: z.string().min(1), category: z.string().optional(),
    brand: z.string().optional(), model: z.string().optional(), serial_number: z.string().optional(),
    daily_rate: z.number().optional(), monthly_rate: z.number().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) throw new Error("Tenant RioMed não encontrado");
    const { data: row, error } = await context.supabase.from("rental_assets").insert({ ...data, company_id: companyId }).select().single();
    if (error) throw error;
    return row;
  });

// ============ RENTAL CONTRACTS ============
export const listRentalContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) return [];
    const { data } = await context.supabase
      .from("rental_contracts").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

// ============ SERVICE ORDERS ============
export const listServiceOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) return [];
    const { data } = await context.supabase
      .from("service_orders").select("*").eq("company_id", companyId).order("opened_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const createServiceOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    order_number: z.string().min(1), customer_name: z.string().min(1),
    equipment_description: z.string().min(1), equipment_serial: z.string().optional(),
    service_type: z.enum(["preventive", "corrective", "installation", "calibration"]).default("corrective"),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) throw new Error("Tenant RioMed não encontrado");
    const { data: row, error } = await context.supabase.from("service_orders").insert({ ...data, company_id: companyId }).select().single();
    if (error) throw error;
    return row;
  });

// ============ ROUTING RULES ============
export const listRoutingRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) return [];
    const { data } = await context.supabase
      .from("crm_lead_routing_rules").select("*").eq("company_id", companyId).order("priority").limit(200);
    return data ?? [];
  });

export const createRoutingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1), priority: z.number().int().default(100),
    conditions: z.record(z.string(), z.any()).default({}),
    assign_strategy: z.enum(["specific", "round_robin", "least_loaded"]).default("round_robin"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) throw new Error("Tenant RioMed não encontrado");
    const { data: row, error } = await context.supabase.from("crm_lead_routing_rules").insert({ ...data, company_id: companyId }).select().single();
    if (error) throw error;
    return row;
  });

// ============ ABANDONED CARTS ============
export const listAbandonedCarts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getRioMedId(context.supabase);
    if (!companyId) return { carts: [], stats: { pending: 0, recovered: 0, total_value: 0 } };
    const { data } = await context.supabase
      .from("commerce_abandoned_carts").select("*").eq("company_id", companyId).order("abandoned_at", { ascending: false }).limit(200);
    const carts = data ?? [];
    const stats = {
      pending: carts.filter((c: any) => c.recovery_status === "pending").length,
      recovered: carts.filter((c: any) => c.recovery_status === "recovered").length,
      total_value: carts.reduce((s: number, c: any) => s + Number(c.cart_value || 0), 0),
    };
    return { carts, stats };
  });
