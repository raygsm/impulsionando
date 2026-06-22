import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Data Quality & Dedupe Health — Fase 37.
 * Detecta duplicidades (e-mail/telefone/documento), registros sem origem/nicho,
 * falta de opt-in, contatos órfãos e saúde do mecanismo de dedupe.
 */
export const getDataQuality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(365, d?.days ?? 90)) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [mLeadsRes, crmLeadsRes, customersRes, consumerRes, dedupeEvRes, dedupeThRes] = await Promise.all([
      supabaseAdmin
        .from("marketing_leads")
        .select("id, email, phone, source, utm_source, status, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("crm_leads")
        .select("id, company_id, email, phone, document, source, status, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("customers")
        .select("id, company_id, email, phone, document, is_active, created_at, anonymized_at")
        .limit(10000),
      supabaseAdmin
        .from("consumer_profiles")
        .select("id, user_id, full_name, phone, whatsapp, marketing_optin, created_at")
        .limit(10000),
      supabaseAdmin
        .from("dedupe_threshold_events")
        .select("id, user_id, dedupe_pct, state, prev_state, samples, created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("admin_dedupe_thresholds")
        .select("user_id, min_pct, max_pct, updated_at")
        .limit(50),
    ]);

    const mLeads = mLeadsRes.data ?? [];
    const crmLeads = crmLeadsRes.data ?? [];
    const customers = customersRes.data ?? [];
    const consumers = consumerRes.data ?? [];
    const dedupeEvents = dedupeEvRes.data ?? [];
    const dedupeThresholds = dedupeThRes.data ?? [];

    const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
    const digits = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

    // ---- Duplicidade marketing_leads (e-mail) ----
    const mlByEmail = new Map<string, number>();
    for (const l of mLeads) {
      const e = norm(l.email);
      if (!e) continue;
      mlByEmail.set(e, (mlByEmail.get(e) ?? 0) + 1);
    }
    const mlDupEmail = Array.from(mlByEmail.entries()).filter(([, c]) => c > 1);

    // ---- Duplicidade crm_leads (por company + email/phone/document) ----
    const crmKey = (l: any, field: "email" | "phone" | "document") => {
      const v = field === "email" ? norm(l.email) : digits(l[field]);
      return v ? `${l.company_id ?? "-"}|${field}|${v}` : "";
    };
    const crmDupBy = (field: "email" | "phone" | "document") => {
      const map = new Map<string, number>();
      for (const l of crmLeads) {
        const k = crmKey(l, field);
        if (!k) continue;
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return Array.from(map.entries()).filter(([, c]) => c > 1);
    };
    const crmDupEmail = crmDupBy("email");
    const crmDupPhone = crmDupBy("phone");
    const crmDupDoc = crmDupBy("document");

    // ---- Duplicidade customers ----
    const custKey = (c: any, field: "email" | "phone" | "document") => {
      const v = field === "email" ? norm(c.email) : digits(c[field]);
      return v ? `${c.company_id ?? "-"}|${field}|${v}` : "";
    };
    const custDupBy = (field: "email" | "phone" | "document") => {
      const map = new Map<string, number>();
      for (const c of customers) {
        if (c.anonymized_at) continue;
        const k = custKey(c, field);
        if (!k) continue;
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return Array.from(map.entries()).filter(([, c]) => c > 1);
    };
    const custDupEmail = custDupBy("email");
    const custDupPhone = custDupBy("phone");
    const custDupDoc = custDupBy("document");

    // ---- Integridade ----
    const mlNoSource = mLeads.filter((l) => !l.source && !l.utm_source).length;
    const mlNoContact = mLeads.filter((l) => !l.email && !l.phone).length;
    const crmNoSource = crmLeads.filter((l) => !l.source).length;
    const crmNoContact = crmLeads.filter((l) => !l.email && !l.phone && !l.document).length;
    const custInactive = customers.filter((c) => c.is_active === false && !c.anonymized_at).length;
    const custOrphan = customers.filter((c) => !c.email && !c.phone && !c.document).length;
    const consumerNoOptin = consumers.filter((c) => c.marketing_optin === false || c.marketing_optin === null).length;
    const consumerNoPhone = consumers.filter((c) => !c.phone && !c.whatsapp).length;

    const sumDup = (arr: Array<[string, number]>) => arr.reduce((s, [, c]) => s + (c - 1), 0);
    const totalDupRecords =
      sumDup(crmDupEmail) + sumDup(crmDupPhone) + sumDup(crmDupDoc) +
      sumDup(custDupEmail) + sumDup(custDupPhone) + sumDup(custDupDoc) +
      sumDup(mlDupEmail);

    const totalRecords = mLeads.length + crmLeads.length + customers.length + consumers.length;
    const dupRate = totalRecords ? (totalDupRecords / totalRecords) * 100 : 0;

    // ---- Health do dedupe engine ----
    const lastEv = dedupeEvents[0] ?? null;
    const stateCount = dedupeEvents.reduce<Record<string, number>>((acc, e) => {
      const s = e.state ?? "unknown";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});

    const topDuplicates = [
      ...crmDupEmail.map(([k, c]) => ({ scope: "CRM leads", field: "email", key: k, count: c })),
      ...crmDupPhone.map(([k, c]) => ({ scope: "CRM leads", field: "telefone", key: k, count: c })),
      ...crmDupDoc.map(([k, c]) => ({ scope: "CRM leads", field: "documento", key: k, count: c })),
      ...custDupEmail.map(([k, c]) => ({ scope: "Customers", field: "email", key: k, count: c })),
      ...custDupPhone.map(([k, c]) => ({ scope: "Customers", field: "telefone", key: k, count: c })),
      ...custDupDoc.map(([k, c]) => ({ scope: "Customers", field: "documento", key: k, count: c })),
      ...mlDupEmail.map(([k, c]) => ({ scope: "Marketing leads", field: "email", key: k, count: c })),
    ]
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return {
      windowDays: data.days,
      counts: {
        marketingLeads: mLeads.length,
        crmLeads: crmLeads.length,
        customers: customers.length,
        consumers: consumers.length,
      },
      duplicates: {
        totalDupRecords,
        dupRate,
        mlDupEmail: mlDupEmail.length,
        crmDupEmail: crmDupEmail.length,
        crmDupPhone: crmDupPhone.length,
        crmDupDoc: crmDupDoc.length,
        custDupEmail: custDupEmail.length,
        custDupPhone: custDupPhone.length,
        custDupDoc: custDupDoc.length,
      },
      integrity: {
        mlNoSource,
        mlNoContact,
        crmNoSource,
        crmNoContact,
        custInactive,
        custOrphan,
        consumerNoOptin,
        consumerNoPhone,
      },
      dedupeEngine: {
        thresholds: dedupeThresholds,
        recentEvents: dedupeEvents.slice(0, 20),
        stateCount,
        lastEvent: lastEv,
      },
      topDuplicates,
    };
  });
