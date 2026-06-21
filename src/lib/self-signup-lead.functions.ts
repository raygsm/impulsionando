/**
 * Captura self-signup como lead do funil Impulsionando.
 * Princípio nº 1 de `docs/CORE_GROWTH_GOVERNANCE.md` — todo cadastro é lead.
 * Endpoint público (sem auth): usado logo após `supabase.auth.signUp` no /auth.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

interface Input {
  email: string;
  name?: string | null;
}

function validate(d: unknown): Input {
  if (!d || typeof d !== "object") throw new Error("invalid input");
  const o = d as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("email inválido");
  if (email.length > 254) throw new Error("email muito longo");
  const name = typeof o.name === "string" ? o.name.trim().slice(0, 120) : null;
  return { email, name };
}

export const captureSelfSignupLead = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    try {
      await supabase.from("marketing_leads").insert({
        source: "self_signup",
        status: "new",
        name: data.name ?? data.email.split("@")[0],
        email: data.email,
        origin: "self_signup",
        utm_source: "impulsionando-core",
        utm_campaign: "tenant-self_signup",
        notes: "Self-signup via /auth",
      } as never);
    } catch (e) {
      console.warn("[self-signup-lead] insert falhou", e);
    }

    try {
      await supabase.from("catalog_events").insert({
        event_name: "self_signup",
        metadata: { has_name: Boolean(data.name) },
      } as never);
    } catch {
      // ignore
    }

    return { ok: true };
  });
