/**
 * Baixa manual de fatura pelo painel administrativo (master/manager/support).
 * Chama a RPC `admin_mark_invoice_paid`, que valida o papel do usuário.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  kind: z.enum(["consumer", "erp"]),
  invoice_id: z.string().uuid(),
});

export const adminMarkInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("admin_mark_invoice_paid", {
      _kind: data.kind,
      _invoice_id: data.invoice_id,
    });
    if (error) throw new Error(error.message);
    const r = res as { ok: boolean; error?: string };
    if (!r?.ok) throw new Error(r?.error ?? "fail");
    return r;
  });
