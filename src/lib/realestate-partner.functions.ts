import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// =============== Authenticated (broker management) ===============
export const listPartnerBrokers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("realestate_partner_brokers")
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { brokers: rows ?? [] };
  });

export const upsertPartnerBroker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      companyId: z.string().uuid(),
      broker_name: z.string().min(1).max(200),
      email: z.string().email().max(255).nullable().optional(),
      phone: z.string().max(40).nullable().optional(),
      notes: z.string().max(2000).nullable().optional(),
      status: z.enum(["pending", "active", "paused"]).default("pending"),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const row = {
      company_id: data.companyId,
      broker_name: data.broker_name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      status: data.status,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase.from("realestate_partner_brokers").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await context.supabase
      .from("realestate_partner_brokers").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

// =============== Public (token-based, partner portal) ===============
export const fetchPartnerBrokerPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: meta, error } = await sb.rpc("resolve_realestate_partner_token", { _token: data.token });
    if (error || !meta) return { ok: false as const };
    const m = meta as any;

    // Load published properties of the company that broker can offer
    const { data: properties } = await sb
      .from("realestate_properties")
      .select("id,title,reference_code,operation,property_type,sale_price,rent_price,bedrooms,bathrooms,parking_spots,city,neighborhood,photos")
      .eq("company_id", m.company_id)
      .eq("is_published", true)
      .eq("approval_status", "approved")
      .in("status", ["ativo", "reservado"])
      .order("created_at", { ascending: false })
      .limit(60);

    return {
      ok: true as const,
      partner: {
        id: m.partner_id,
        broker_name: m.broker_name,
        email: m.email,
        phone: m.phone,
        status: m.status,
        contract_started_at: m.contract_started_at,
      },
      company: { id: m.company_id, name: m.company_name, slug: m.company_slug },
      properties: properties ?? [],
    };
  });

export const acceptPartnerBrokerInvite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: rErr } = await supabaseAdmin
      .from("realestate_partner_brokers")
      .select("id,status")
      .eq("portal_token", data.token)
      .maybeSingle();
    if (rErr || !row) throw new Error("Token inválido");
    if (row.status === "active") return { ok: true, already: true };
    const { error } = await supabaseAdmin
      .from("realestate_partner_brokers")
      .update({ status: "active", contract_started_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true, already: false };
  });

export const submitPartnerInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      token: z.string().uuid(),
      property_id: z.string().uuid(),
      contact_name: z.string().min(1).max(200),
      contact_email: z.string().email().max(255).optional().nullable(),
      contact_phone: z.string().max(40).optional().nullable(),
      message: z.string().max(2000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: partner, error: pErr } = await supabaseAdmin
      .from("realestate_partner_brokers")
      .select("id,company_id,status,broker_name")
      .eq("portal_token", data.token)
      .maybeSingle();
    if (pErr || !partner) throw new Error("Token inválido");
    if (partner.status !== "active") throw new Error("Parceria ainda não aceita");

    const { error } = await supabaseAdmin.from("realestate_interests").insert({
      company_id: partner.company_id,
      property_id: data.property_id,
      kind: "lead",
      status: "novo",
      contact_name: data.contact_name,
      contact_email: data.contact_email ?? null,
      contact_phone: data.contact_phone ?? null,
      contact_whatsapp: data.contact_phone ?? null,
      message: data.message ?? `Indicado por ${partner.broker_name} (parceiro)`,
      source: "partner_broker",
      utm: { partner_id: partner.id, partner_name: partner.broker_name } as any,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
