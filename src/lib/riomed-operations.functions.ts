import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data, error } = await ctx.supabase.from("communication_tenants").select("company_id")
    .eq("slug", "rio-med").eq("active", true).is("deleted_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id as string;
}

export const getOperationsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const [os, techs, assets, contracts] = await Promise.all([
      sb.from("service_orders").select("id,status,priority,assigned_to,opened_at,closed_at,sla_due_at,total_cost").eq("company_id", cid).order("opened_at", { ascending: false }).limit(500),
      sb.from("riomed_technicians").select("id,full_name,status,specialties,service_areas").eq("company_id", cid),
      sb.from("rental_assets").select("id,asset_code,name,status,daily_rate").eq("company_id", cid),
      sb.from("rental_contracts").select("id,contract_number,customer_name,start_date,end_date,status,total_amount").eq("company_id", cid).order("start_date", { ascending: false }).limit(300),
    ]);
    for (const r of [os, techs, assets, contracts]) if (r.error) throw new Error(r.error.message);
    const osArr = os.data ?? [], techsArr = techs.data ?? [], assetsArr = assets.data ?? [], contractsArr = contracts.data ?? [];
    const now = Date.now();
    const osByStatus: Record<string, number> = {};
    let slaOverdue = 0, revenueOs = 0;
    for (const order of osArr) {
      osByStatus[(order as any).status] = (osByStatus[(order as any).status] ?? 0) + 1;
      if ((order as any).sla_due_at && new Date((order as any).sla_due_at).getTime() < now && !["closed", "cancelled"].includes((order as any).status)) slaOverdue++;
      revenueOs += Number((order as any).total_cost ?? 0);
    }
    const osByTech: Record<string, number> = {};
    for (const order of osArr) {
      const id = (order as any).assigned_to ?? "unassigned";
      osByTech[id] = (osByTech[id] ?? 0) + 1;
    }
    const techNameById: Record<string, string> = Object.fromEntries(techsArr.map((t: any) => [t.id, t.full_name]));
    const techWorkload = Object.entries(osByTech).map(([id, count]) => ({ technicianId: id, name: id === "unassigned" ? "Não atribuído" : techNameById[id] ?? "Técnico", count }));
    const activeContracts = contractsArr.filter((c: any) => ["active", "running", "scheduled"].includes(c.status));
    const revenueRental = contractsArr.reduce((s: number, c: any) => s + Number(c.total_amount ?? 0), 0);
    const assetUtilization = assetsArr.length ? Math.round((assetsArr.filter((a: any) => ["rented", "in_use"].includes(a.status)).length / assetsArr.length) * 100) : 0;
    return {
      os: { total: osArr.length, byStatus: osByStatus, slaOverdue, revenue: revenueOs },
      techs: { total: techsArr.length, available: techsArr.filter((t: any) => ["approved", "active"].includes(t.status)).length, workload: techWorkload },
      rental: { assets: assetsArr.length, activeContracts: activeContracts.length, totalContracts: contractsArr.length, revenue: revenueRental, utilization: assetUtilization },
      recentOs: osArr.slice(0, 20), recentContracts: contractsArr.slice(0, 20),
    };
  });

export const assignTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), technicianId: z.string().uuid().nullable(), slaDueAt: z.string().datetime().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    if (data.technicianId) {
      const { data: tech, error: techError } = await sb.from("riomed_technicians").select("id,status").eq("id", data.technicianId).eq("company_id", cid).maybeSingle();
      if (techError) throw new Error(techError.message);
      if (!tech || !["approved", "active"].includes(tech.status)) throw new Error("Técnico não está ativo/aprovado para atribuição");
    }
    const patch: any = { assigned_to: data.technicianId };
    if (data.slaDueAt) patch.sla_due_at = data.slaDueAt;
    if (data.technicianId) patch.status = "in_progress";
    const { data: order, error } = await sb.from("service_orders").update(patch).eq("id", data.orderId).eq("company_id", cid).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Ordem de serviço não encontrada");
    const { error: eventError } = await sb.from("service_order_events").insert({ order_id: data.orderId, event_type: "technician_assigned", actor_id: (context as any).userId ?? null, metadata: { technician_id: data.technicianId, sla_due_at: data.slaDueAt ?? null } });
    if (eventError) throw new Error(eventError.message);
    return { ok: true };
  });

export const updateOsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), status: z.enum(["open", "in_progress", "awaiting_parts", "closed", "cancelled"]), resolution: z.string().optional(), laborCost: z.number().min(0).optional(), partsCost: z.number().min(0).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const patch: any = { status: data.status };
    if (data.status === "closed") patch.closed_at = new Date().toISOString();
    if (data.resolution) patch.resolution = data.resolution;
    if (typeof data.laborCost === "number") patch.labor_cost = data.laborCost;
    if (typeof data.partsCost === "number") patch.parts_cost = data.partsCost;
    if (typeof data.laborCost === "number" || typeof data.partsCost === "number") patch.total_cost = (data.laborCost ?? 0) + (data.partsCost ?? 0);
    const { data: order, error } = await sb.from("service_orders").update(patch).eq("id", data.orderId).eq("company_id", cid).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Ordem de serviço não encontrada");
    const { error: eventError } = await sb.from("service_order_events").insert({ order_id: data.orderId, event_type: `status_${data.status}`, actor_id: (context as any).userId ?? null, metadata: { resolution: data.resolution ?? null } });
    if (eventError) throw new Error(eventError.message);
    return { ok: true };
  });

export const checkRentalAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ assetId: z.string().uuid(), startDate: z.string(), endDate: z.string() }).refine(d => d.startDate <= d.endDate, { message: "Período inválido" }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: asset, error: assetError } = await sb.from("rental_assets").select("id").eq("id", data.assetId).eq("company_id", cid).maybeSingle();
    if (assetError) throw new Error(assetError.message);
    if (!asset) throw new Error("Ativo não encontrado");
    const { data: contracts, error } = await sb.from("rental_contracts").select("id,start_date,end_date,status,contract_number").eq("company_id", cid).in("status", ["active", "running", "scheduled"]);
    if (error) throw new Error(error.message);
    const list = contracts ?? [];
    if (!list.length) return { available: true, conflicts: [] };
    const ids = list.map((c: any) => c.id);
    const { data: items, error: itemError } = await sb.from("rental_contract_items").select("contract_id,asset_id").eq("asset_id", data.assetId).in("contract_id", ids);
    if (itemError) throw new Error(itemError.message);
    const conflictIds = new Set((items ?? []).map((i: any) => i.contract_id));
    const conflicts = list.filter((c: any) => conflictIds.has(c.id) && c.start_date <= data.endDate && (c.end_date ?? "9999-12-31") >= data.startDate);
    return { available: conflicts.length === 0, conflicts };
  });

export const createRentalContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    customerName: z.string().min(2), customerDocument: z.string().optional(), startDate: z.string(), endDate: z.string(),
    deliveryAddress: z.string().optional(), notes: z.string().optional(), billingCycle: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
    items: z.array(z.object({ assetId: z.string().uuid(), description: z.string(), quantity: z.number().int().min(1).default(1), unitRate: z.number().min(0) })).min(1),
  }).refine(d => d.startDate <= d.endDate, { message: "Período inválido" }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const assetIds = data.items.map(i => i.assetId);
    const { data: ownedAssets, error: assetError } = await sb.from("rental_assets").select("id").eq("company_id", cid).in("id", assetIds);
    if (assetError) throw new Error(assetError.message);
    if ((ownedAssets ?? []).length !== new Set(assetIds).size) throw new Error("Um ou mais ativos não pertencem ao Rio Med");

    const { data: contracts, error: contractError } = await sb.from("rental_contracts").select("id,start_date,end_date,status,contract_number").eq("company_id", cid).in("status", ["active", "running", "scheduled"]);
    if (contractError) throw new Error(contractError.message);
    const ids = (contracts ?? []).map((c: any) => c.id);
    const { data: existingItems, error: existingError } = ids.length ? await sb.from("rental_contract_items").select("contract_id,asset_id").in("contract_id", ids).in("asset_id", assetIds) : { data: [], error: null };
    if (existingError) throw new Error(existingError.message);
    for (const item of data.items) {
      const touching = (existingItems ?? []).filter((x: any) => x.asset_id === item.assetId).map((x: any) => x.contract_id);
      const conflict = (contracts ?? []).find((c: any) => touching.includes(c.id) && c.start_date <= data.endDate && (c.end_date ?? "9999-12-31") >= data.startDate);
      if (conflict) throw new Error(`Ativo já reservado no contrato ${conflict.contract_number}`);
    }

    const days = Math.max(1, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000) + 1);
    const itemsWithTotal = data.items.map(i => ({ asset_id: i.assetId, description: i.description, quantity: i.quantity, unit_rate: i.unitRate, total: +(i.unitRate * i.quantity * days).toFixed(2) }));
    const totalAmount = itemsWithTotal.reduce((s, i) => s + i.total, 0);
    const contractNumber = `LOC-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    const { data: contract, error } = await sb.from("rental_contracts").insert({ company_id: cid, contract_number: contractNumber, customer_name: data.customerName, customer_document: data.customerDocument ?? null, start_date: data.startDate, end_date: data.endDate, delivery_address: data.deliveryAddress ?? null, notes: data.notes ?? null, billing_cycle: data.billingCycle, status: "active", total_amount: totalAmount }).select("id").single();
    if (error) throw new Error(error.message);
    const { error: itemError } = await sb.from("rental_contract_items").insert(itemsWithTotal.map(i => ({ ...i, contract_id: contract.id })));
    if (itemError) throw new Error(itemError.message);
    const { error: updateError } = await sb.from("rental_assets").update({ status: "rented" }).eq("company_id", cid).in("id", assetIds);
    if (updateError) throw new Error(updateError.message);
    return { ok: true, contractId: contract.id, contractNumber, totalAmount, days };
  });

export const closeRentalContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contractId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: contract, error: readError } = await sb.from("rental_contracts").select("id").eq("id", data.contractId).eq("company_id", cid).maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!contract) throw new Error("Contrato não encontrado");
    const { data: items, error: itemError } = await sb.from("rental_contract_items").select("asset_id").eq("contract_id", data.contractId);
    if (itemError) throw new Error(itemError.message);
    const { error } = await sb.from("rental_contracts").update({ status: "closed", end_date: new Date().toISOString().slice(0, 10) }).eq("id", data.contractId).eq("company_id", cid);
    if (error) throw new Error(error.message);
    const assetIds = (items ?? []).map((i: any) => i.asset_id).filter(Boolean);
    if (assetIds.length) {
      const { error: assetUpdateError } = await sb.from("rental_assets").update({ status: "available" }).eq("company_id", cid).in("id", assetIds);
      if (assetUpdateError) throw new Error(assetUpdateError.message);
    }
    return { ok: true };
  });

export const listTechnicians = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data, error } = await sb.from("riomed_technicians").select("*").eq("company_id", cid).order("full_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });