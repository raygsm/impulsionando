/**
 * Garantia de produtos (Rio Med).
 *
 * Fluxo:
 *  1. Logística informa o prazo (em dias) por item da remessa antes da entrega.
 *  2. Ao marcar a remessa como entregue, um trigger no banco gera registros
 *     permanentes em `riomed_warranties` (idempotente por item).
 *  3. O cliente consulta o histórico permanente em `riomed_my_warranties`
 *     (view com `days_remaining` e `is_finished`).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getRiomedCompanyId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("companies").select("id").ilike("name", "%riomed%").limit(1).maybeSingle();
  if (data?.id) return data.id;
  const { data: any2 } = await supabase.from("companies").select("id").limit(1).maybeSingle();
  if (!any2?.id) throw new Error("RioMed company not found");
  return any2.id;
}

/** Logística: define prazo de garantia (dias) em um item de remessa. */
export const setShipmentItemWarrantyDays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { shipment_item_id: string; warranty_days: number }) => {
    if (!d?.shipment_item_id) throw new Error("shipment_item_id obrigatório");
    if (!Number.isFinite(d.warranty_days) || d.warranty_days < 0 || d.warranty_days > 3650)
      throw new Error("warranty_days inválido (0 a 3650)");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase
      .from("riomed_shipment_items")
      .update({ warranty_days: Math.floor(data.warranty_days) })
      .eq("id", data.shipment_item_id);
    if (error) throw error;
    return { ok: true };
  });

/** Logística: marca a remessa como entregue — dispara geração de garantias. */
export const markShipmentDelivered = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { shipment_id: string; delivered_at?: string }) => {
    if (!d?.shipment_id) throw new Error("shipment_id obrigatório");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const delivered_at = data.delivered_at ?? new Date().toISOString();
    const { error } = await supabase
      .from("riomed_shipments")
      .update({ status: "delivered", delivered_at })
      .eq("id", data.shipment_id);
    if (error) throw error;
    return { ok: true, delivered_at };
  });

/** Logística: lista remessas pendentes/entregues com itens e garantia. */
export const listShipmentsForLogistics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const { data: shipments, error } = await supabase
      .from("riomed_shipments")
      .select("id, shipment_code, status, hospital_id, expected_at, delivered_at, tracking_code, created_at")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    const ids = (shipments ?? []).map((s: any) => s.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: its } = await supabase
        .from("riomed_shipment_items")
        .select("id, shipment_id, product_id, serial_number, quantity, warranty_days, warranty_starts_at, warranty_ends_at")
        .in("shipment_id", ids);
      items = its ?? [];
    }
    return { shipments: shipments ?? [], items };
  });

/** Cliente: histórico permanente de garantias (sem limite de tempo). */
export const listMyWarranties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, claims } = context as any;
    const email = (claims?.email ?? "").toLowerCase();
    const cid = await getRiomedCompanyId(supabase);

    // Identifica o hospital do usuário pelo e-mail (mesmo padrão da área do cliente).
    let hospital_id: string | null = null;
    if (email) {
      const { data: hosp } = await supabase
        .from("riomed_hospital_accounts")
        .select("id")
        .eq("company_id", cid)
        .ilike("contact_email", email)
        .maybeSingle();
      hospital_id = hosp?.id ?? null;
    }

    let query = supabase
      .from("riomed_my_warranties")
      .select("*")
      .eq("company_id", cid)
      .order("ends_at", { ascending: false });
    if (hospital_id) query = query.eq("hospital_id", hospital_id);
    // sem hospital: devolve vazio (RLS já protegeria; reforço aqui).
    else query = query.eq("hospital_id", "00000000-0000-0000-0000-000000000000");

    const { data, error } = await query;
    if (error) throw error;
    return { hospital_id, warranties: data ?? [] };
  });
