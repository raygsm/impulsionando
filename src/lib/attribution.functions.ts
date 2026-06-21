import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Revenue Attribution 360 — atribuição multi-touch da origem do lead até o MRR.
 *
 * Cruza marketing_leads → demo_leads → quotes → customers → billing_contracts,
 * agregando por origem/UTM/nicho. Output:
 *   - funnel por origem (leads → demos → quotes → won → MRR)
 *   - CAC implícito (não usado aqui; placeholder)
 *   - taxa de conversão de cada estágio
 *   - MRR ativo atribuído a cada origem
 *
 * Diferencial: nenhum SaaS BR mostra atribuição estágio-a-estágio e MRR vivo
 * por origem/UTM num único dashboard nativo.
 */
export const getRevenueAttribution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const since = new Date(Date.now() - 180 * 86400000).toISOString();

    const [leads, demos, quotes, companies, contracts] = await Promise.all([
      supabaseAdmin.from("marketing_leads").select("id, email, origin, niche, utm_source, utm_medium, utm_campaign, created_at").gte("created_at", since).limit(10000),
      supabaseAdmin.from("demo_leads").select("id, email, created_at").gte("created_at", since).limit(5000),
      supabaseAdmin.from("quotes").select("id, customer_email, status, created_at").gte("created_at", since).limit(5000),
      supabaseAdmin.from("companies").select("id, name, email, niche_code, is_active, created_at").limit(2000),
      supabaseAdmin.from("billing_contracts").select("company_id, recurring_amount, status"),
    ]);

    type Bucket = {
      key: string;
      origin: string;
      utm_source: string | null;
      utm_campaign: string | null;
      leads: number;
      demos: number;
      quotes: number;
      won: number;
      active_tenants: number;
      mrr: number;
    };
    const buckets = new Map<string, Bucket>();
    const bucketOf = (l: any) => {
      const key = `${l.origin ?? "_direct"}|${l.utm_source ?? "-"}|${l.utm_campaign ?? "-"}`;
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          origin: l.origin ?? "_direct",
          utm_source: l.utm_source ?? null,
          utm_campaign: l.utm_campaign ?? null,
          leads: 0, demos: 0, quotes: 0, won: 0, active_tenants: 0, mrr: 0,
        });
      }
      return buckets.get(key)!;
    };

    // Email → bucket key (first-touch attribution)
    const emailToKey = new Map<string, string>();
    for (const l of (leads.data as any[]) ?? []) {
      const b = bucketOf(l);
      b.leads++;
      if (l.email && !emailToKey.has(l.email.toLowerCase())) emailToKey.set(l.email.toLowerCase(), b.key);
    }

    for (const d of (demos.data as any[]) ?? []) {
      const k = d.email ? emailToKey.get(d.email.toLowerCase()) : null;
      if (k && buckets.has(k)) buckets.get(k)!.demos++;
    }
    for (const q of (quotes.data as any[]) ?? []) {
      const k = q.customer_email ? emailToKey.get(q.customer_email.toLowerCase()) : null;
      if (k && buckets.has(k)) {
        const b = buckets.get(k)!;
        b.quotes++;
        if (["won", "accepted", "approved", "paid"].includes((q.status ?? "").toLowerCase())) b.won++;
      }
    }

    // MRR por company → bucket via email
    const mrrByCompany = new Map<string, number>();
    const activeByCompany = new Map<string, boolean>();
    for (const c of (contracts.data as any[]) ?? []) {
      if (c.status !== "active") continue;
      mrrByCompany.set(c.company_id, (mrrByCompany.get(c.company_id) ?? 0) + Number(c.recurring_amount ?? 0));
      activeByCompany.set(c.company_id, true);
    }
    for (const co of (companies.data as any[]) ?? []) {
      const k = co.email ? emailToKey.get(co.email.toLowerCase()) : null;
      if (!k || !buckets.has(k)) continue;
      if (activeByCompany.get(co.id)) {
        const b = buckets.get(k)!;
        b.active_tenants++;
        b.mrr += mrrByCompany.get(co.id) ?? 0;
      }
    }

    const rows = [...buckets.values()]
      .map((b) => ({
        ...b,
        cvr_lead_demo: b.leads ? Math.round((b.demos / b.leads) * 1000) / 10 : 0,
        cvr_demo_quote: b.demos ? Math.round((b.quotes / b.demos) * 1000) / 10 : 0,
        cvr_quote_won: b.quotes ? Math.round((b.won / b.quotes) * 1000) / 10 : 0,
        cvr_lead_win: b.leads ? Math.round((b.won / b.leads) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.mrr - a.mrr || b.leads - a.leads);

    const summary = {
      leads: rows.reduce((s, r) => s + r.leads, 0),
      demos: rows.reduce((s, r) => s + r.demos, 0),
      quotes: rows.reduce((s, r) => s + r.quotes, 0),
      won: rows.reduce((s, r) => s + r.won, 0),
      active_tenants: rows.reduce((s, r) => s + r.active_tenants, 0),
      mrr: rows.reduce((s, r) => s + r.mrr, 0),
      sources: rows.length,
    };

    return { summary, rows: rows.slice(0, 200) };
  });
