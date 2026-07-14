/**
 * Onda C — Credenciais próprias de Mercado Pago por cliente.
 * Admin do tenant grava; leitura mascarada para membros.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SaveInput = z.object({
  company_id: z.string().uuid(),
  environment: z.enum(["sandbox", "production"]),
  access_token: z.string().min(10).max(300),
  public_key: z.string().min(10).max(200),
  webhook_secret: z.string().max(300).optional().nullable(),
  user_id_mp: z.string().max(80).optional().nullable(),
});

export const saveMpagoCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SaveInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await (context.supabase as any).rpc("save_mpago_credentials", {
      p_company_id: data.company_id,
      p_environment: data.environment,
      p_access_token: data.access_token,
      p_public_key: data.public_key,
      p_webhook_secret: data.webhook_secret ?? null,
      p_user_id_mp: data.user_id_mp ?? null,
    });
    if (error) throw new Error(error.message);
    return { id: id as string };
  });

export const getMpagoCredentialsMasked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ company_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase as any).rpc("get_mpago_credentials_masked", {
      p_company_id: data.company_id,
    });
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Array<{
      environment: string; public_key_masked: string | null;
      access_token_configured: boolean; webhook_configured: boolean;
      user_id_mp: string | null; active: boolean; updated_at: string;
    }> };
  });
