/** Garantias e logística Rio Med — contrato Core atual. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getRiomedCompanyId(supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from("communication_tenants")
    .select("company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id as string;
}

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
    const cid = await getRiomedCompanyId(supabase);
    const { data: item, error: readError } = await supabase
      .from("riomed_shipment_items")
      .select("id, shipment:riomed_shipments!inner(company_id)")
      .eq("id", data.shipment_item_id)
      .maybeSingle();
    if (readError) throw readError;
    if (!item || (item as any).shipment?.company_id !== cid) throw new Error("Item de remessa não encontrado");
    const { error } = await supabase
      .from("riomed_shipment_items")
      .update({ warranty_days: Math.floor(data.warranty_days) })
      .eq("id", data.shipment_item_id);
    if (error) throw error;
    return { ok: true };
  });

export const markShipmentDelivered = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { shipment_id: string; delivered_at?: string }) => {
    if (!d?.shipment_id) throw new Error("shipment_id obrigatório");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const delivered_at = data.delivered_at ?? new Date().toISOString();
    const { data: row, error } = await supabase
      .from("riomed_shipments")
      .update({ status: "delivered", delivered_at })
      .eq("id", data.shipment_id)
      .eq("company_id", cid)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Remessa não encontrada");
    return { ok: true, delivered_at };
  });

export const listShipmentsForLogistics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const cid = await getRiomedCompanyId(supabase);
    const { data: shipments, error } = await supabase
      .from("riomed_shipments")
      .select("id, shipment_code, status, hospital_id, expected_at, delivered_at, tracking_code, carrier_name, created_at")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const ids = (shipments ?? []).map((s: any) => s.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: its, error: itemError } = await supabase
        .from("riomed_shipment_items")
        .select("id, shipment_id, product_id, serial_number, quantity, warranty_days, warranty_starts_at, warranty_ends_at")
        .in("shipment_id", ids);
      if (itemError) throw itemError;
      items = its ?? [];
    }
    return { shipments: shipments ?? [], items };
  });

export const listMyWarranties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, claims } = context as any;
    const email = String(claims?.email ?? "").trim().toLowerCase();
    const cid = await getRiomedCompanyId(supabase);

    let hospitalId: string | null = null;
    if (email) {
      const { data: hosp, error: hospitalError } = await supabase
        .from("riomed_hospital_accounts")
        .select("id")
        .eq("company_id", cid)
        .ilike("contact_email", email)
        .maybeSingle();
      if (hospitalError) throw hospitalError;
      hospitalId = hosp?.id ?? null;
    }
    if (!hospitalId) return { hospital_id: null, warranties: [] };

    const { data, error } = await supabase
      .from("riomed_my_warranties")
      .select("*")
      .eq("company_id", cid)
      .eq("hospital_id", hospitalId)
      .order("ends_at", { ascending: false });
    if (error) throw error;
    return { hospital_id: hospitalId, warranties: data ?? [] };
  });
