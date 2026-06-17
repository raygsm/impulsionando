import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PREMIUM_NICHES = [
  "clinicas",
  "bares",
  "microcervejarias",
  "servicos",
  "ecommerce",
] as const;

const inputSchema = z.object({
  companyId: z.string().uuid(),
  nicheSlug: z.enum(PREMIUM_NICHES),
});

/**
 * Aplica template do nicho (módulos recomendados) a uma empresa existente.
 * Autorização: requireSupabaseAuth + RLS da função apply_niche_template
 * (que valida is_impulsionando_staff() OU user_belongs_to_company()).
 */
export const applyNicheOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("apply_niche_template", {
      p_company_id: data.companyId,
      p_niche_slug: data.nicheSlug,
    });
    if (error) {
      throw new Error(error.message ?? "Falha ao aplicar template do nicho");
    }
    return {
      ok: true as const,
      nicheSlug: data.nicheSlug,
      installedCount: Number((result as { installed?: number } | null)?.installed ?? 0),
    };
  });
