import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type TenantContext = {
  id: string;
  name: string;
  subdomain: string | null;
  domain: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  is_active: boolean;
};

/**
 * Resolve um tenant (company) a partir do hostname acessado.
 * Bate em `public.resolve_tenant_by_host` (SECURITY DEFINER) que devolve
 * apenas colunas seguras — nada de CNPJ, e-mails ou endereço.
 */
export const resolveTenantByHost = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ host: z.string().min(1).max(253) }).parse(input),
  )
  .handler(async ({ data }): Promise<TenantContext | null> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: rows, error } = await supabase.rpc(
      "resolve_tenant_by_host",
      { _host: data.host },
    );

    if (error) {
      console.error("[resolveTenantByHost] rpc error", error);
      return null;
    }

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      subdomain: row.subdomain ?? null,
      domain: row.domain ?? null,
      primary_color: row.primary_color ?? null,
      secondary_color: row.secondary_color ?? null,
      logo_url: row.logo_url ?? null,
      is_active: row.is_active ?? true,
    };
  });
