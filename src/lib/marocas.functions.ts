import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMarocasApartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marocas_apartments")
      .select("*, marocas_owners(full_name,email,phone,pix_key)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listMarocasServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { apartmentId?: string } = {}) => d)
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("marocas_services")
      .select("*, marocas_apartments(code,title), marocas_professionals(full_name,role)")
      .order("scheduled_for", { ascending: false })
      .limit(200);
    if (data?.apartmentId) q = q.eq("apartment_id", data.apartmentId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const listMarocasSupplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { apartmentId?: string } = {}) => d)
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("marocas_supplies")
      .select("*, marocas_apartments(code,title)")
      .order("category", { ascending: true });
    if (data?.apartmentId) q = q.eq("apartment_id", data.apartmentId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const listMarocasMaintenance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marocas_maintenance_requests")
      .select("*, marocas_apartments(code,title), marocas_maintenance_quotes(id,amount,estimated_hours,status,marocas_professionals(full_name,role))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listMarocasOwnerStatements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("marocas_owner_statements")
      .select("*, marocas_owners(full_name,pix_key), marocas_apartments(code,title)")
      .order("reference_month", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const ServiceStatusEnum = z.enum(["agendado","em_andamento","concluido","cancelado","atrasado"]);
export const updateMarocasServiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: z.infer<typeof ServiceStatusEnum> }) =>
    z.object({ id: z.string().uuid(), status: ServiceStatusEnum }).parse(d))
  .handler(async ({ context, data }) => {
    const patch: { status: typeof data.status; started_at?: string; completed_at?: string } = { status: data.status };
    if (data.status === "em_andamento") patch.started_at = new Date().toISOString();
    if (data.status === "concluido") patch.completed_at = new Date().toISOString();
    const { error } = await context.supabase.from("marocas_services").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const marcarRepasseMarocas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; pixTxid?: string }) =>
    z.object({ id: z.string().uuid(), pixTxid: z.string().max(64).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("marocas_owner_statements")
      .update({ status: "pago", paid_at: new Date().toISOString(), pix_txid: data.pixTxid ?? null })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// SLA padrão por tipo de serviço (em minutos)
export const MAROCAS_SLA_MINUTES: Record<string, number> = {
  limpeza: 120,
  enxoval: 60,
  manutencao: 180,
  vistoria: 45,
  check_in: 30,
  check_out: 30,
  lavanderia: 90,
  reposicao: 45,
};

const ChecklistItem = z.object({
  label: z.string().min(1).max(140),
  done: z.boolean(),
});

export const updateMarocasServiceChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    checklist?: Array<{ label: string; done: boolean }>;
    photos_before?: string[];
    photos_after?: string[];
    notes?: string;
  }) =>
    z.object({
      id: z.string().uuid(),
      checklist: z.array(ChecklistItem).max(50).optional(),
      photos_before: z.array(z.string().url()).max(20).optional(),
      photos_after: z.array(z.string().url()).max(20).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = {};
    if (data.checklist) patch.checklist = data.checklist;
    if (data.photos_before) patch.photos_before = data.photos_before;
    if (data.photos_after) patch.photos_after = data.photos_after;
    if (typeof data.notes === "string") patch.notes = data.notes;
    const { error } = await context.supabase
      .from("marocas_services")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Pedido automático de suprimentos: usa o campo `notes` como JSON com o estado do pedido
type SupplyOrder = {
  status: "pendente" | "aprovado" | "recebido";
  qty: number;
  requested_at: string;
  approved_at?: string;
  received_at?: string;
};

function parseOrder(notes: string | null | undefined): SupplyOrder | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && parsed.order) return parsed.order as SupplyOrder;
  } catch { /* not json */ }
  return null;
}

export const requestMarocasSupplyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; qty: number }) =>
    z.object({ id: z.string().uuid(), qty: z.number().int().positive().max(9999) }).parse(d))
  .handler(async ({ context, data }) => {
    const order: SupplyOrder = {
      status: "pendente",
      qty: data.qty,
      requested_at: new Date().toISOString(),
    };
    const { error } = await context.supabase
      .from("marocas_supplies")
      .update({ notes: JSON.stringify({ order }) })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const approveMarocasSupplyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error: rErr } = await context.supabase
      .from("marocas_supplies")
      .select("notes")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr) throw rErr;
    const order = parseOrder(row?.notes);
    if (!order) throw new Error("Pedido não encontrado");
    order.status = "aprovado";
    order.approved_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("marocas_supplies")
      .update({ notes: JSON.stringify({ order }) })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const receiveMarocasSupplyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error: rErr } = await context.supabase
      .from("marocas_supplies")
      .select("notes,current_qty")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr) throw rErr;
    const order = parseOrder(row?.notes);
    if (!order) throw new Error("Pedido não encontrado");
    order.status = "recebido";
    order.received_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("marocas_supplies")
      .update({
        notes: JSON.stringify({ order }),
        current_qty: Number(row?.current_qty ?? 0) + order.qty,
        last_restocked_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
