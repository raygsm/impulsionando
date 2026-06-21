import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fase 6 — Snapshot operacional consolidando entregas das Fases 1-5:
 *  - Receita de intermediação (core_revenue_calculations)
 *  - Repasses (core_payout_ledger / core_payout_events)
 *  - Compliance gates (core_compliance_requirements)
 *  - Identidade de tenant (core_tenant_identity / core_tenant_email_aliases)
 *  - Roteamento WhatsApp (v_company_whatsapp_status)
 *  - Notas fiscais (core_fiscal_invoices / v_fiscal_invoices_summary)
 *
 * Scopes:
 *  - super_admin: visão global Impulsionando
 *  - empresa:    visão do tenant ativo (companyId)
 *  - contador:   fila fiscal por status + RPS
 *  - coprodutor: ledger de repasses do participante (auth.uid)
 *  - afiliado:   ledger de repasses do afiliado (auth.uid)
 */

const Input = z.object({
  scope: z.enum(["super_admin", "empresa", "contador", "coprodutor", "afiliado"]),
  companyId: z.string().uuid().optional(),
});

type Counts = Record<string, number>;

function tally<T extends Record<string, unknown>>(rows: T[] | null | undefined, key: keyof T): Counts {
  const out: Counts = {};
  for (const r of rows ?? []) {
    const k = String(r[key] ?? "unknown");
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function sumBy<T extends Record<string, unknown>>(rows: T[] | null | undefined, key: keyof T): number {
  let s = 0;
  for (const r of rows ?? []) {
    const v = Number(r[key] ?? 0);
    if (Number.isFinite(v)) s += v;
  }
  return s;
}

export const fetchOperationsSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const scope = data.scope;
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();

    if (scope === "super_admin") {
      const [calcs, payouts, compliance, whats, invoices, identity] = await Promise.all([
        supabase.from("core_revenue_calculations").select("status, impulsionando_fee_amount, gross_amount, created_at").gte("created_at", since),
        supabase.from("core_payout_ledger").select("status, amount, participant_role").gte("created_at", since),
        supabase.from("core_compliance_requirements").select("status, severity"),
        supabase.from("v_company_whatsapp_status").select("routing_mode"),
        supabase.from("core_fiscal_invoices").select("status, total_amount, created_at").gte("created_at", since),
        supabase.from("core_tenant_identity").select("dns_status, ssl_status"),
      ]);

      return {
        scope,
        revenue: {
          totalGross: sumBy(calcs.data, "gross_amount"),
          totalFee: sumBy(calcs.data, "impulsionando_fee_amount"),
          byStatus: tally(calcs.data, "status"),
          count: calcs.data?.length ?? 0,
        },
        payouts: {
          totalAmount: sumBy(payouts.data, "amount"),
          byStatus: tally(payouts.data, "status"),
          byRole: tally(payouts.data, "participant_role"),
        },
        compliance: {
          byStatus: tally(compliance.data, "status"),
          bySeverity: tally(compliance.data, "severity"),
        },
        whatsapp: {
          byMode: tally(whats.data, "routing_mode"),
        },
        fiscal: {
          totalAmount: sumBy(invoices.data, "total_amount"),
          byStatus: tally(invoices.data, "status"),
          count: invoices.data?.length ?? 0,
        },
        identity: {
          byDns: tally(identity.data, "dns_status"),
          bySsl: tally(identity.data, "ssl_status"),
        },
      };
    }

    if (scope === "empresa") {
      if (!data.companyId) throw new Error("companyId obrigatório");
      const cid = data.companyId;
      const [calcs, payouts, compliance, whats, invoices] = await Promise.all([
        supabase.from("core_revenue_calculations").select("status, impulsionando_fee_amount, gross_amount, created_at").eq("company_id", cid).gte("created_at", since),
        supabase.from("core_payout_ledger").select("status, amount, participant_role").eq("company_id", cid).gte("created_at", since),
        supabase.from("core_compliance_requirements").select("status, severity, requirement_code").eq("company_id", cid),
        supabase.from("v_company_whatsapp_status").select("routing_mode").eq("company_id", cid).maybeSingle(),
        supabase.from("core_fiscal_invoices").select("status, total_amount, rps_number, created_at").eq("company_id", cid).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
      ]);
      return {
        scope,
        revenue: {
          totalGross: sumBy(calcs.data, "gross_amount"),
          totalFee: sumBy(calcs.data, "impulsionando_fee_amount"),
          byStatus: tally(calcs.data, "status"),
        },
        payouts: { totalAmount: sumBy(payouts.data, "amount"), byStatus: tally(payouts.data, "status"), byRole: tally(payouts.data, "participant_role") },
        compliance: {
          byStatus: tally(compliance.data, "status"),
          pending: (compliance.data ?? []).filter((c: any) => c.status !== "ok").map((c: any) => ({ code: c.requirement_code, severity: c.severity, status: c.status })),
        },
        whatsapp: { mode: (whats.data as any)?.routing_mode ?? "not_configured" },
        fiscal: { recent: invoices.data ?? [], byStatus: tally(invoices.data, "status") },
      };
    }

    if (scope === "contador") {
      const [queue, issuer, events] = await Promise.all([
        supabase.from("v_fiscal_invoices_summary").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("core_fiscal_issuer_config").select("legal_name, cnpj, environment, provider, current_rps_number, rps_serie").eq("is_active", true).maybeSingle(),
        supabase.from("core_fiscal_invoice_events").select("event_type, occurred_at, invoice_id").order("occurred_at", { ascending: false }).limit(30),
      ]);
      return {
        scope,
        queue: queue.data ?? [],
        byStatus: tally(queue.data, "status"),
        issuer: issuer.data,
        events: events.data ?? [],
      };
    }

    if (scope === "coprodutor" || scope === "afiliado") {
      const role = scope === "coprodutor" ? "coproducer" : "affiliate";
      const ledger = await supabase
        .from("core_payout_ledger")
        .select("amount, status, created_at, calculation_id, payout_method, scheduled_at, paid_at")
        .eq("participant_user_id", userId)
        .eq("participant_role", role)
        .order("created_at", { ascending: false })
        .limit(50);
      return {
        scope,
        ledger: ledger.data ?? [],
        totalPaid: sumBy((ledger.data ?? []).filter((r: any) => r.status === "paid"), "amount"),
        totalPending: sumBy((ledger.data ?? []).filter((r: any) => r.status !== "paid"), "amount"),
        byStatus: tally(ledger.data, "status"),
      };
    }

    return { scope };
  });
