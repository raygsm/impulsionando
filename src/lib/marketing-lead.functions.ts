import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { validateMarketingLead, normalizePhone } from "./marketing-lead.schema";

export const submitMarketingLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => validateMarketingLead(d))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const normalizedPhone = normalizePhone(data.phone);

    const { error } = await supabase.from("marketing_leads").insert({
      source: "contato",
      status: "new",
      name: data.name ?? null,
      email: data.email ?? null,
      phone: normalizedPhone,
      company: data.company ?? null,
      message: data.message ?? null,
      notes: data.interest ? `Interesse: ${data.interest}` : null,
      page_url: data.page_url ?? null,
      utm_source: "impulsionando-brasil",
      utm_campaign: "marketing-page",
    } as never);

    if (error) throw new Error(error.message);

    // Analytics: log conversion event (best-effort, não bloqueia)
    try {
      await supabase.from("catalog_events").insert({
        event_name: "marketing_lead_submitted",
        metadata: {
          interest: data.interest ?? null,
          page_url: data.page_url ?? null,
          has_email: Boolean(data.email),
          has_phone: Boolean(normalizedPhone),
          has_company: Boolean(data.company),
        },
      } as never);
    } catch {
      // ignore analytics failures
    }

    return { ok: true };
  });
