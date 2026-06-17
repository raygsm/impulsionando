/**
 * Faturas em aberto (consumidor premium + contratos ERP) para o painel master.
 * Apenas master/manager/support enxergam.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["master", "manager", "support", "admin"]);
  if (!data || data.length === 0) throw new Error("forbidden");
}

export const listOpenInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [consumer, erp] = await Promise.all([
      supabaseAdmin
        .from("consumer_membership_invoices")
        .select("id, user_id, amount_cents, status, due_date, pix_copy_paste, created_at")
        .in("status", ["open", "overdue"])
        .order("due_date", { ascending: true })
        .limit(50),
      supabaseAdmin
        .from("billing_invoices")
        .select("id, company_id, amount, status, due_date, created_at")
        .in("status", ["open", "overdue", "pending"])
        .order("due_date", { ascending: true })
        .limit(50),
    ]);

    return {
      consumer: consumer.data ?? [],
      erp: erp.data ?? [],
    };
  });
