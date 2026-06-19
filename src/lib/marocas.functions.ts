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
    const patch: Record<string, unknown> = { status: data.status };
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
