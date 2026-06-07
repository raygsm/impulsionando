import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const IdentitySchema = z.object({
  companyId: z.string().uuid(),
  patch: z.object({
    name: z.string().min(1).max(200).optional(),
    trade_name: z.string().max(200).nullable().optional(),
    legal_name: z.string().max(200).nullable().optional(),
    document: z.string().max(50).nullable().optional(),
    company_type: z.string().max(80).nullable().optional(),
    segment: z.string().max(120).nullable().optional(),
    logo_url: z.string().max(1000).nullable().optional(),
    primary_color: z.string().max(20).nullable().optional(),
    secondary_color: z.string().max(20).nullable().optional(),
    email: z.string().email().nullable().optional().or(z.literal("")),
    phone: z.string().max(40).nullable().optional(),
    whatsapp: z.string().max(40).nullable().optional(),
    financial_email: z.string().email().nullable().optional().or(z.literal("")),
    support_email: z.string().email().nullable().optional().or(z.literal("")),
    commercial_email: z.string().email().nullable().optional().or(z.literal("")),
    domain: z.string().max(200).nullable().optional(),
    subdomain: z.string().max(120).nullable().optional(),
    website: z.string().max(300).nullable().optional(),
    instagram: z.string().max(200).nullable().optional(),
    facebook: z.string().max(200).nullable().optional(),
    address_line: z.string().max(300).nullable().optional(),
    address_city: z.string().max(120).nullable().optional(),
    address_state: z.string().max(60).nullable().optional(),
    address_zip: z.string().max(20).nullable().optional(),
    owner_name: z.string().max(200).nullable().optional(),
  }),
});

export const getCompanyIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) =>
    z.object({ companyId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", data.companyId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const { data: identity } = await supabase.rpc("company_identity_payload", {
      _company_id: data.companyId,
    });

    const { data: lastMessages } = await supabase
      .from("message_outbox")
      .select("id, event_code, channel, recipient_email, recipient_phone, status, created_at, sent_at")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false })
      .limit(10);

    return { company, identity, lastMessages: lastMessages ?? [] };
  });

export const updateCompanyIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdentitySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Normaliza strings vazias para null (e-mails)
    const clean: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(data.patch)) {
      clean[k] = v === "" || v === undefined ? null : (v as string | null);
    }
    const { data: updated, error } = await supabase
      .from("companies")
      .update(clean as never)
      .eq("id", data.companyId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { company: updated };
  });
