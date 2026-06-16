import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Site público da Impulsionando Brasil — leitura de páginas publicadas em
 * generated_pages para a empresa subdomain='impulsionando-brasil'.
 *
 * Usa o cliente publishable (anon) — leitura só permitida pela política
 * "Public read impulsionando brasil pages" criada na migração.
 */

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const fetchImpulsionandoBrasilPages = createServerFn({ method: "GET" }).handler(
  async () => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("generated_pages")
      .select("slug,name,content,status")
      .eq("status", "published");
    if (error) throw new Error(error.message);
    return { pages: (data ?? []) as Array<{ slug: string; name: string; content: Record<string, unknown>; status: string }> };
  },
);

const LeadInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  serviceSlug: z.string().min(1).max(60),
  serviceTag: z.string().min(1).max(60),
  pageUrl: z.string().max(500).optional(),
});

export const submitImpulsionandoBrasilLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LeadInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("marketing_leads").insert({
      source: "contato",
      status: "new",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      company: data.company ?? null,
      message: data.message ?? null,
      page_url: data.pageUrl ?? null,
      notes: `[Impulsionando Brasil] ${data.serviceTag} · serviço: ${data.serviceSlug}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
