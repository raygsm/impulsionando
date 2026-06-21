import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fase 6 — Snapshot operacional consolidando Fases 1-5.
 * Scopes: super_admin (global), empresa (tenant), contador (fila fiscal).
 */

const Input = z.object({
  scope: z.enum(["super_admin", "empresa", "contador"]),
  companyId: z.string().uuid().optional(),
});

type Row = Record<string, any>;

function tally(rows: Row[] | null | undefined, key: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows ?? []) {
    const k = String(r?.[key] ?? "unknown");
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function sumBy(rows: Row[] | null | undefined, key: string): number {
  let s = 0;
  for (const r of rows ?? []) {
    const v = Number(r?.[key] ?? 0);
    if (Number.isFinite(v)) s += v;
  }
  return s;
}

export const fetchOperationsSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const supa = supabase as any;
    const scope = data.scope;
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();

    if (scope === "super_admin") {
      const [calcs, payouts, compliance, whats, invoices, identity] = await Promise.all([
        supa.from("core_revenue_calculations").select("status, impulsionando_fee_cents, gross_cents, created_at").gte("created_at", since),
        supa.from("core_payout_ledger").select("status, net_cents, gross_cents").gte("created_at", since),
        supa.from("core_compliance_requirements").select("blocking, active, scope"),
        supa.from("v_company_whatsapp_status").select("routing_mode"),
        supa.from("core_fiscal_invoices").select("status, service_amount, net_amount, created_at").gte("created_at", since),
        supa.from("core_tenant_identity").select("dns_status, ssl_status"),
      ]);

      return {
        scope,
        revenue: {
          totalGross: sumBy(calcs.data, "gross_cents") / 100,
          totalFee: sumBy(calcs.data, "impulsionando_fee_cents") / 100,
          byStatus: tally(calcs.data, "status"),
          count: calcs.data?.length ?? 0,
        },
        payouts: {
          totalNet: sumBy(payouts.data, "net_cents") / 100,
          totalGross: sumBy(payouts.data, "gross_cents") / 100,
          byStatus: tally(payouts.data, "status"),
        },
        compliance: {
          total: compliance.data?.length ?? 0,
          blocking: (compliance.data ?? []).filter((c: any) => c.blocking).length,
          byScope: tally(compliance.data, "scope"),
        },
        whatsapp: { byMode: tally(whats.data, "routing_mode") },
        fiscal: {
          totalService: sumBy(invoices.data, "service_amount"),
          totalNet: sumBy(invoices.data, "net_amount"),
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
      const [calcs, payouts, whats, invoices] = await Promise.all([
        supa.from("core_revenue_calculations").select("status, impulsionando_fee_cents, gross_cents, created_at").eq("company_id", cid).gte("created_at", since),
        supa.from("core_payout_ledger").select("status, net_cents, gross_cents, period_start, period_end, paid_at").eq("company_id", cid).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
        supa.from("v_company_whatsapp_status").select("routing_mode").eq("company_id", cid).maybeSingle(),
        supa.from("core_fiscal_invoices").select("status, service_amount, rps_number, nf_number, created_at").eq("beneficiary_company_id", cid).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
      ]);
      return {
        scope,
        revenue: {
          totalGross: sumBy(calcs.data, "gross_cents") / 100,
          totalFee: sumBy(calcs.data, "impulsionando_fee_cents") / 100,
          byStatus: tally(calcs.data, "status"),
        },
        payouts: {
          totalNet: sumBy(payouts.data, "net_cents") / 100,
          byStatus: tally(payouts.data, "status"),
          recent: payouts.data ?? [],
        },
        whatsapp: { mode: (whats.data as any)?.routing_mode ?? "not_configured" },
        fiscal: { recent: invoices.data ?? [], byStatus: tally(invoices.data, "status") },
      };
    }

    // contador
    const [queue, issuer, events] = await Promise.all([
      supa.from("core_fiscal_invoices").select("id, status, service_amount, iss_amount, rps_serie, rps_number, nf_number, beneficiary_legal_name, created_at, issued_at").order("created_at", { ascending: false }).limit(50),
      supa.from("core_fiscal_issuer_config").select("legal_name, cnpj, environment, provider, rps_serie, next_rps_number").maybeSingle(),
      supa.from("core_fiscal_invoice_events").select("event_type, created_at, invoice_id").order("created_at", { ascending: false }).limit(30),
    ]);
    return {
      scope,
      queue: queue.data ?? [],
      byStatus: tally(queue.data, "status"),
      issuer: issuer.data,
      events: events.data ?? [],
    };
  });
