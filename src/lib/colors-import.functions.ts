/**
 * Colors — Importador de vendas (Fase 2).
 * Recebe um array de linhas normalizadas (do CSV/XLSX parseado no cliente),
 * reconcilia cada uma via `reconcileColorsSale`, retorna sumário.
 *
 * Autorização: admin master (has_role='admin'). Usa auth-middleware; o client
 * chama via useServerFn (bearer anexado automaticamente).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rowSchema = z.object({
  external_sale_id: z.string().min(1),
  external_order_id: z.string().optional(),
  colors_checkout_id: z.string().optional(),
  status: z.string().default("approved"),
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
  customer_whatsapp: z.string().optional(),
  customer_cpf: z.string().optional(),
  product_slug: z.string().optional(),
  product_name: z.string().optional(),
  quantity: z.number().optional(),
  kit_size: z.number().optional(),
  unit_price_cents: z.number().optional(),
  total_price_cents: z.number().optional(),
  coupon: z.string().optional(),
  affiliate_code: z.string().optional(),
  affiliate_external_id: z.string().optional(),
  affiliate_name: z.string().optional(),
  approved_at: z.string().optional(),
});

const schema = z.object({
  platform: z.string().default("maisfy"),
  dryRun: z.boolean().default(false),
  rows: z.array(rowSchema).min(1).max(5000),
});

export const importColorsSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => schema.parse(raw))
  .handler(async ({ data, context }) => {
    // admin check
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { reconcileColorsSale } = await import("@/lib/colors-reconcile.server");

    let created = 0, updated = 0, failed = 0;
    const errors: Array<{ external_sale_id: string; error: string }> = [];

    for (const row of data.rows) {
      if (data.dryRun) { updated++; continue; }
      try {
        const result = await reconcileColorsSale(supabaseAdmin as any, {
          platform: data.platform,
          external_sale_id: row.external_sale_id,
          external_order_id: row.external_order_id,
          colors_checkout_id: row.colors_checkout_id,
          external_status: row.status,
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_whatsapp: row.customer_whatsapp,
          customer_cpf: row.customer_cpf,
          product_slug: row.product_slug,
          product_name: row.product_name,
          quantity: row.quantity,
          kit_size: row.kit_size,
          unit_price_cents: row.unit_price_cents,
          total_price_cents: row.total_price_cents,
          coupon: row.coupon,
          affiliate_code: row.affiliate_code,
          affiliate_external_id: row.affiliate_external_id,
          affiliate_name: row.affiliate_name,
          approved_at: row.approved_at,
          raw: row as unknown as Record<string, unknown>,
          source: "import",
        });
        if (result.created_opportunity) created++; else updated++;
      } catch (err) {
        failed++;
        errors.push({
          external_sale_id: row.external_sale_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      total: data.rows.length,
      created,
      updated,
      failed,
      errors: errors.slice(0, 100),
      dryRun: data.dryRun,
    };
  });
