import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const IMPULSIONANDO_MERCHANT_COMPANY_ID = "bda711e0-cbfa-4899-a068-0c75f96d4e59";

/**
 * Configuração pública necessária ao MercadoPago.js.
 * Somente a public key pode sair do servidor; access token e demais segredos
 * permanecem exclusivamente no Vault/Edge Function.
 */
export const getBillingPaymentPublicConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("mpago_credentials")
      .select("public_key,environment,active")
      .eq("company_id", IMPULSIONANDO_MERCHANT_COMPANY_ID)
      .eq("active", true)
      .eq("environment", "production")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data?.public_key) throw new Error("Mercado Pago da Impulsionando não está configurado.");

    return {
      publicKey: data.public_key as string,
      environment: "production" as const,
      merchantCompanyId: IMPULSIONANDO_MERCHANT_COMPANY_ID,
    };
  });
