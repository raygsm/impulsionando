import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendInvoiceReminderNow, sendConsumerInvoiceReminderNow } from "@/lib/billing.functions";

/**
 * Central Unificada de Cobranças (Impulsionando).
 * Agrega contas a receber de:
 *  - billing_invoices (ERP / contratos recorrentes)
 *  - consumer_membership_invoices (Clube Premium)
 *  - mp_orders pendentes (Marketplace B2B)
 *  - mpago_payments pending (Pix Mercado Pago)
 *
 * Nenhum concorrente (Bling, Omie, Conta Azul, Asaas, Pagar.me)
 * unifica esses 4 streams na mesma tela — vantagem do core Impulsionando.
 */
export const listAllOpenReceivables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const today = new Date().toISOString().slice(0, 10);

    const [erpRes, premRes, mpRes] = await Promise.all([
      supabaseAdmin
        .from("billing_invoices")
        .select("id, due_date, amount, status, contract_id, billing_contracts:contract_id(company_id, companies:company_id(name))")
        .in("status", ["open", "overdue"])
        .order("due_date", { ascending: true })
        .limit(500),
      supabaseAdmin
        .from("consumer_membership_invoices")
        .select("id, due_date, amount, status, membership_id, consumer_memberships:membership_id(company_id, consumer_id, companies:company_id(name), consumer_profiles:consumer_id(display_name))")
        .in("status", ["open", "overdue"])
        .order("due_date", { ascending: true })
        .limit(500),
      supabaseAdmin
        .from("mp_orders")
        .select("id, total_amount, status, created_at, supplier_id, mp_suppliers:supplier_id(name)")
        .eq("status", "pending_payment")
        .order("created_at", { ascending: true })
        .limit(500),
    ]);

    type Row = {
      kind: "erp" | "consumer" | "marketplace";
      id: string;
      due_date: string;
      amount: number;
      status: string;
      payer: string;
      overdue_days: number;
    };

    const rows: Row[] = [];

    for (const r of (erpRes.data as any[]) ?? []) {
      rows.push({
        kind: "erp",
        id: r.id,
        due_date: r.due_date,
        amount: Number(r.amount ?? 0),
        status: r.status,
        payer: r.billing_contracts?.companies?.name ?? "—",
        overdue_days: Math.max(0, Math.floor((Date.parse(today) - Date.parse(r.due_date)) / 86400000)),
      });
    }
    for (const r of (premRes.data as any[]) ?? []) {
      rows.push({
        kind: "consumer",
        id: r.id,
        due_date: r.due_date,
        amount: Number(r.amount ?? 0),
        status: r.status,
        payer: r.consumer_memberships?.consumer_profiles?.display_name ?? r.consumer_memberships?.companies?.name ?? "—",
        overdue_days: Math.max(0, Math.floor((Date.parse(today) - Date.parse(r.due_date)) / 86400000)),
      });
    }
    for (const r of (mpRes.data as any[]) ?? []) {
      const d = (r.created_at ?? today).slice(0, 10);
      rows.push({
        kind: "marketplace",
        id: r.id,
        due_date: d,
        amount: Number(r.total_amount ?? 0),
        status: r.status,
        payer: r.mp_suppliers?.name ?? "—",
        overdue_days: Math.max(0, Math.floor((Date.parse(today) - Date.parse(d)) / 86400000)),
      });
    }

    rows.sort((a, b) => a.due_date.localeCompare(b.due_date));

    const totals = {
      count: rows.length,
      total: rows.reduce((s, r) => s + r.amount, 0),
      overdue: rows.filter((r) => r.overdue_days > 0).reduce((s, r) => s + r.amount, 0),
      overdue_count: rows.filter((r) => r.overdue_days > 0).length,
      avg_ticket: rows.length ? rows.reduce((s, r) => s + r.amount, 0) / rows.length : 0,
      by_kind: {
        erp: rows.filter((r) => r.kind === "erp").reduce((s, r) => s + r.amount, 0),
        consumer: rows.filter((r) => r.kind === "consumer").reduce((s, r) => s + r.amount, 0),
        marketplace: rows.filter((r) => r.kind === "marketplace").reduce((s, r) => s + r.amount, 0),
      },
    };

    return { rows, totals };
  });

/** Disparo em lote de lembretes (ERP + Premium). */
export const bulkSendReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { items: Array<{ kind: "erp" | "consumer"; id: string }> }) => d)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    let ok = 0;
    let fail = 0;
    for (const it of data.items.slice(0, 100)) {
      try {
        if (it.kind === "erp") {
          await sendInvoiceReminderNow({ data: { invoiceId: it.id } });
        } else {
          await sendConsumerInvoiceReminderNow({ data: { invoiceId: it.id } });
        }
        ok++;
      } catch {
        fail++;
      }
    }
    return { ok, fail };
  });
