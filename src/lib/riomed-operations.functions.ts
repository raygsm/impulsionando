import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data } = await ctx.supabase.from("user_profiles").select("company_id").eq("user_id", ctx.userId).maybeSingle();
  if (!data?.company_id) throw new Error("Empresa não encontrada");
  return data.company_id as string;
}

export const getOperationsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const [os, techs, assets, contracts] = await Promise.all([
      sb.from("service_orders").select("id,status,priority,assigned_to,opened_at,closed_at,sla_due_at,total_cost").eq("company_id", cid).order("opened_at", { ascending: false }).limit(500),
      sb.from("riomed_technicians").select("id,full_name,available,status,rating").eq("company_id", cid),
      sb.from("rental_assets").select("id,asset_code,name,status,daily_rate").eq("company_id", cid),
      sb.from("rental_contracts").select("id,contract_number,customer_name,start_date,end_date,status,total_amount").eq("company_id", cid).order("start_date", { ascending: false }).limit(300),
    ]);
    const osArr = os.data ?? [];
    const techsArr = techs.data ?? [];
    const assetsArr = assets.data ?? [];
    const contractsArr = contracts.data ?? [];
    const now = Date.now();
    const osByStatus: Record<string, number> = {};
    let slaOverdue = 0; let revenueOs = 0;
    for (const o of osArr) {
      osByStatus[(o as any).status] = (osByStatus[(o as any).status] ?? 0) + 1;
      if ((o as any).sla_due_at && new Date((o as any).sla_due_at).getTime() < now && (o as any).status !== "closed") slaOverdue++;
      revenueOs += Number((o as any).total_cost ?? 0);
    }
    const osByTech: Record<string, number> = {};
    for (const o of osArr) {
      const t = (o as any).assigned_to ?? "—";
      osByTech[t] = (osByTech[t] ?? 0) + 1;
    }
    const techNameById: Record<string, string> = Object.fromEntries(techsArr.map((t: any) => [t.id, t.full_name]));
    const techWorkload = Object.entries(osByTech).map(([id, n]) => ({ technicianId: id, name: techNameById[id] ?? "Não atribuído", count: n }));

    const activeContracts = contractsArr.filter((c: any) => c.status === "active" || c.status === "running");
    const revenueRental = contractsArr.reduce((s: number, c: any) => s + Number(c.total_amount ?? 0), 0);
    const assetUtilization = assetsArr.length ? Math.round((assetsArr.filter((a: any) => a.status === "rented" || a.status === "in_use").length / assetsArr.length) * 100) : 0;

    return {
      os: { total: osArr.length, byStatus: osByStatus, slaOverdue, revenue: revenueOs },
      techs: { total: techsArr.length, available: techsArr.filter((t: any) => t.available).length, workload: techWorkload },
      rental: {
        assets: assetsArr.length, activeContracts: activeContracts.length,
        totalContracts: contractsArr.length, revenue: revenueRental, utilization: assetUtilization,
      },
      recentOs: osArr.slice(0, 20),
      recentContracts: contractsArr.slice(0, 20),
    };
  });

export const assignTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orderId: z.string().uuid(),
    technicianId: z.string().uuid().nullable(),
    slaDueAt: z.string().datetime().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const patch: any = { assigned_to: data.technicianId };
    if (data.slaDueAt) patch.sla_due_at = data.slaDueAt;
    if (data.technicianId) patch.status = "in_progress";
    const { error } = await sb.from("service_orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    await sb.from("service_order_events").insert({
      service_order_id: data.orderId, event_type: "technician_assigned",
      payload: { technician_id: data.technicianId, sla_due_at: data.slaDueAt ?? null },
    } as never);
    return { ok: true };
  });

export const updateOsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orderId: z.string().uuid(),
    status: z.enum(["open","in_progress","awaiting_parts","closed","cancelled"]),
    resolution: z.string().optional(),
    laborCost: z.number().optional(),
    partsCost: z.number().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const patch: any = { status: data.status };
    if (data.status === "closed") patch.closed_at = new Date().toISOString();
    if (data.resolution) patch.resolution = data.resolution;
    if (typeof data.laborCost === "number") patch.labor_cost = data.laborCost;
    if (typeof data.partsCost === "number") patch.parts_cost = data.partsCost;
    if (typeof data.laborCost === "number" || typeof data.partsCost === "number") {
      patch.total_cost = (data.laborCost ?? 0) + (data.partsCost ?? 0);
    }
    const { error } = await sb.from("service_orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    await sb.from("service_order_events").insert({
      service_order_id: data.orderId, event_type: `status_${data.status}`,
      payload: { resolution: data.resolution ?? null },
    } as never);
    return { ok: true };
  });

export const checkRentalAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    assetId: z.string().uuid(),
    startDate: z.string(),
    endDate: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    // Buscar todos os contratos da empresa que tocam o intervalo
    const { data: contracts } = await sb.from("rental_contracts")
      .select("id, start_date, end_date, status, contract_number")
      .eq("company_id", cid).in("status", ["active", "running", "scheduled"]);
    const list = contracts ?? [];
    if (!list.length) return { available: true, conflicts: [] };
    const ids = list.map((c: any) => c.id);
    const { data: items } = await sb.from("rental_contract_items")
      .select("contract_id, asset_id").eq("asset_id", data.assetId).in("contract_id", ids);
    const conflictContractIds = new Set((items ?? []).map((i: any) => i.contract_id));
    const conflicts = list.filter((c: any) => {
      if (!conflictContractIds.has(c.id)) return false;
      const cs = c.start_date; const ce = c.end_date ?? "9999-12-31";
      return cs <= data.endDate && ce >= data.startDate;
    });
    return { available: conflicts.length === 0, conflicts };
  });

export const createRentalContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    customerName: z.string().min(2),
    customerDocument: z.string().optional(),
    startDate: z.string(),
    endDate: z.string(),
    deliveryAddress: z.string().optional(),
    notes: z.string().optional(),
    billingCycle: z.enum(["daily","weekly","monthly"]).default("monthly"),
    items: z.array(z.object({
      assetId: z.string().uuid(),
      description: z.string(),
      quantity: z.number().int().min(1).default(1),
      unitRate: z.number().min(0),
    })).min(1),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);

    // Conflict check para cada asset
    const { data: contracts } = await sb.from("rental_contracts")
      .select("id, start_date, end_date, status, contract_number")
      .eq("company_id", cid).in("status", ["active", "running", "scheduled"]);
    const ids = (contracts ?? []).map((c: any) => c.id);
    const { data: existingItems } = ids.length
      ? await sb.from("rental_contract_items").select("contract_id, asset_id").in("contract_id", ids)
      : { data: [] };
    for (const it of data.items) {
      const touchingContracts = (existingItems ?? []).filter((x: any) => x.asset_id === it.assetId).map((x: any) => x.contract_id);
      const conflict = (contracts ?? []).find((c: any) =>
        touchingContracts.includes(c.id) &&
        c.start_date <= data.endDate && (c.end_date ?? "9999-12-31") >= data.startDate
      );
      if (conflict) throw new Error(`Asset já reservado no contrato ${conflict.contract_number}`);
    }

    const days = Math.max(1, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000));
    const itemsWithTotal = data.items.map((i) => ({
      asset_id: i.assetId, description: i.description, quantity: i.quantity,
      unit_rate: i.unitRate, total: +(i.unitRate * i.quantity * days).toFixed(2),
    }));
    const totalAmount = itemsWithTotal.reduce((s, i) => s + i.total, 0);

    const contractNumber = `LOC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const { data: contract, error } = await sb.from("rental_contracts").insert({
      company_id: cid, contract_number: contractNumber, customer_name: data.customerName,
      customer_document: data.customerDocument ?? null, start_date: data.startDate, end_date: data.endDate,
      delivery_address: data.deliveryAddress ?? null, notes: data.notes ?? null,
      billing_cycle: data.billingCycle, status: "active", total_amount: totalAmount,
    } as never).select("id").single();
    if (error) throw new Error(error.message);

    const { error: e2 } = await sb.from("rental_contract_items").insert(
      itemsWithTotal.map((i) => ({ ...i, contract_id: (contract as any).id })) as never,
    );
    if (e2) throw new Error(e2.message);

    // Marca assets como rented
    await sb.from("rental_assets").update({ status: "rented" } as never).in("id", data.items.map((i) => i.assetId));

    return { ok: true, contractId: (contract as any).id, contractNumber, totalAmount, days };
  });

export const closeRentalContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contractId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { data: items } = await sb.from("rental_contract_items").select("asset_id").eq("contract_id", data.contractId);
    const { error } = await sb.from("rental_contracts").update({ status: "closed", end_date: new Date().toISOString().slice(0, 10) } as never).eq("id", data.contractId);
    if (error) throw new Error(error.message);
    const assetIds = (items ?? []).map((i: any) => i.asset_id).filter(Boolean);
    if (assetIds.length) await sb.from("rental_assets").update({ status: "available" } as never).in("id", assetIds);
    return { ok: true };
  });

export const listTechnicians = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data } = await sb.from("riomed_technicians").select("*").eq("company_id", cid).order("full_name");
    return data ?? [];
  });
