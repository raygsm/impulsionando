import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const LeadSchema = z.object({
  name: z.string().min(1).max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().min(3).max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  interest: z.string().max(200).optional().nullable(),
  page_url: z.string().max(500).optional().nullable(),
});

export const submitMarketingLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LeadSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const hasContact = [data.name, data.email, data.phone].some((v) => v && v.trim() !== "");
    if (!hasContact) throw new Error("Informe ao menos nome, email ou telefone.");

    const { error } = await supabase.from("marketing_leads").insert({
      source: "contato",
      status: "new",
      name: data.name ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      company: data.company ?? null,
      message: data.message ?? null,
      notes: data.interest ? `Interesse: ${data.interest}` : null,
      page_url: data.page_url ?? null,
      utm_source: "impulsionando-brasil",
      utm_campaign: "marketing-page",
    } as never);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
