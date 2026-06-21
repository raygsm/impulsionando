/**
 * Cobrança PIX da conta da mesa (cliente final, anônimo via QR).
 *
 * O cliente que está no /mesa/$token aperta "Pagar conta agora". Geramos
 * (ou recuperamos) uma cobrança em `restaurant_table_invoices` via RPC
 * pública. A URL de pagamento PIX (`pix_url`) é fornecida pela própria RPC
 * quando o gateway estiver configurado (Mercado Pago). A confirmação real
 * do pagamento chega depois pelo webhook (que fecha a sessão e libera a
 * mesa de forma idempotente).
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const CreateInput = z.object({ token: z.string().min(8).max(120) });
const StatusInput = z.object({
  token: z.string().min(8).max(120),
  invoice_id: z.string().uuid(),
});

function publicSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("supabase_env_missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}


export const createTableInvoice = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicSupabase();
    const { data: res, error } = await (supabase as any).rpc("restaurant_create_table_invoice", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    const r = res as {
      ok: boolean;
      error?: string;
      invoice_id?: string;
      order_nsu?: string;
      amount_cents?: number;
      status?: string;
      attempt_number?: number;
      expires_at?: string | null;
      pix_url?: string | null;
    };
    if (!r?.ok) throw new Error(r?.error ?? "fail");

    let pixUrl = r.pix_url ?? null;
    let configured = !!pixUrl;
    if (!pixUrl && r.order_nsu && typeof r.amount_cents === "number") {
      const built = buildPixUrl(r.order_nsu, r.amount_cents);
      pixUrl = built.pix_url;
      configured = built.configured;
    }
    return {
      ok: true,
      invoice_id: r.invoice_id!,
      amount_cents: r.amount_cents!,
      status: r.status!,
      order_nsu: r.order_nsu!,
      attempt_number: r.attempt_number ?? 1,
      expires_at: r.expires_at ?? null,
      pix_url: pixUrl,
      pix_configured: configured,
    };
  });

/** Força nova cobrança PIX (usado quando a anterior expirou ou falhou). */
export const forceNewTableInvoice = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicSupabase();
    const { data: res, error } = await (supabase as any).rpc(
      "restaurant_force_new_table_invoice",
      { _token: data.token },
    );
    if (error) throw new Error(error.message);
    const r = res as any;
    if (!r?.ok) throw new Error(r?.error ?? "fail");
    let pixUrl = r.pix_url ?? null;
    let configured = !!pixUrl;
    if (!pixUrl && r.order_nsu && typeof r.amount_cents === "number") {
      const built = buildPixUrl(r.order_nsu, r.amount_cents);
      pixUrl = built.pix_url;
      configured = built.configured;
    }
    return {
      ok: true,
      invoice_id: r.invoice_id,
      amount_cents: r.amount_cents,
      status: r.status,
      order_nsu: r.order_nsu,
      attempt_number: r.attempt_number ?? 1,
      expires_at: r.expires_at ?? null,
      pix_url: pixUrl,
      pix_configured: configured,
    };
  });

export const getTableInvoiceStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => StatusInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicSupabase();
    const { data: res, error } = await (supabase as any).rpc("restaurant_get_table_invoice", {
      _token: data.token,
      _invoice_id: data.invoice_id,
    });
    if (error) throw new Error(error.message);
    const r = res as {
      ok: boolean;
      error?: string;
      status?: string;
      amount_cents?: number;
      paid_at?: string | null;
    };
    if (!r?.ok) throw new Error(r?.error ?? "fail");
    return {
      ok: true,
      status: r.status!,
      amount_cents: r.amount_cents!,
      paid_at: r.paid_at ?? null,
    };
  });

/** Lista todo histórico de cobranças da sessão atual da mesa. */
export const listTableInvoices = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicSupabase();
    const { data: res, error } = await (supabase as any).rpc(
      "restaurant_list_table_invoices",
      { _token: data.token },
    );
    if (error) throw new Error(error.message);
    const r = res as { ok: boolean; error?: string; invoices?: any[] };
    if (!r?.ok) throw new Error(r?.error ?? "fail");
    return { ok: true, invoices: r.invoices ?? [] };
  });

