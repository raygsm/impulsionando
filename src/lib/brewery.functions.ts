import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DashboardInput = z.object({
  brandId: z.string().uuid().optional(),
  sinceDays: z.number().int().min(1).max(365).default(30),
});

/**
 * Lista marcas que o usuário pode administrar (dono ou admin via RLS).
 */
export const listMyBreweryBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("brewery_brands")
      .select("id,name,slug,city,state,logo_url,is_active,is_demo")
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

/**
 * KPIs e agregações do painel da microcervejaria no período selecionado.
 * RLS já restringe aos dados da marca acessível pelo usuário.
 */
export const fetchBreweryDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DashboardInput.parse(d))
  .handler(async ({ context, data }) => {
    const sinceIso = new Date(Date.now() - data.sinceDays * 86400_000)
      .toISOString()
      .slice(0, 10);

    // Escopo de marca (uma específica ou todas as acessíveis)
    const brandsQ = context.supabase
      .from("brewery_brands")
      .select("id,name,slug");
    if (data.brandId) brandsQ.eq("id", data.brandId);
    const { data: brands, error: bErr } = await brandsQ;
    if (bErr) throw bErr;
    const brandIds = (brands ?? []).map((b) => b.id);

    if (brandIds.length === 0) {
      return {
        brands: [],
        kpis: { pdvAtivos: 0, sellOutUnidades: 0, sellOutReceita: 0, ticketMedio: 0, leadsClube: 0, degustacoes: 0 },
        topProducts: [],
        topStyles: [],
        topPdvs: [],
        funnel: { degustacoes: 0, participantes: 0, leadsCapturados: 0, leadsConsentimento: 0 },
        sinceDays: data.sinceDays,
      };
    }

    const [pdvsRes, sellRes, tastingsRes, leadsRes, productsRes] = await Promise.all([
      context.supabase
        .from("brewery_pdv_links")
        .select("id,brand_id,pdv_name,pdv_city,pdv_state,contract_status")
        .in("brand_id", brandIds),
      context.supabase
        .from("brewery_sellouts")
        .select("brand_id,product_id,pdv_link_id,units,gross_revenue_cents,period_start")
        .in("brand_id", brandIds)
        .gte("period_start", sinceIso),
      context.supabase
        .from("brewery_tastings")
        .select("brand_id,event_at,participants,leads_captured,units_sold")
        .in("brand_id", brandIds)
        .gte("event_at", sinceIso),
      context.supabase
        .from("brewery_lead_preferences")
        .select("brand_id,consent_marketing,created_at,favorite_styles")
        .in("brand_id", brandIds)
        .gte("created_at", sinceIso),
      context.supabase
        .from("brewery_products")
        .select("id,brand_id,name,style")
        .in("brand_id", brandIds),
    ]);
    for (const r of [pdvsRes, sellRes, tastingsRes, leadsRes, productsRes]) {
      if (r.error) throw r.error;
    }
    const pdvs = pdvsRes.data ?? [];
    const sells = sellRes.data ?? [];
    const tastings = tastingsRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const products = productsRes.data ?? [];

    const productMap = new Map(products.map((p) => [p.id, p]));
    const pdvMap = new Map(pdvs.map((p) => [p.id, p]));

    // KPIs
    const pdvAtivos = pdvs.filter((p) => p.contract_status === "active").length;
    const totalUnits = sells.reduce((s, r) => s + (r.units ?? 0), 0);
    const totalRevenue = sells.reduce((s, r) => s + Number(r.gross_revenue_cents ?? 0), 0);
    const ticketMedio = totalUnits > 0 ? Math.round(totalRevenue / totalUnits) : 0;
    const leadsClube = leads.length;
    const degustacoes = tastings.length;

    // Top rótulos (por unidades) e estilos
    const byProduct = new Map<string, { units: number; revenue: number }>();
    const byStyle = new Map<string, { units: number; revenue: number }>();
    for (const s of sells) {
      const cur = byProduct.get(s.product_id) ?? { units: 0, revenue: 0 };
      cur.units += s.units ?? 0;
      cur.revenue += Number(s.gross_revenue_cents ?? 0);
      byProduct.set(s.product_id, cur);

      const style = productMap.get(s.product_id)?.style ?? "—";
      const sc = byStyle.get(style) ?? { units: 0, revenue: 0 };
      sc.units += s.units ?? 0;
      sc.revenue += Number(s.gross_revenue_cents ?? 0);
      byStyle.set(style, sc);
    }
    const topProducts = Array.from(byProduct.entries())
      .map(([id, v]) => ({
        productId: id,
        name: productMap.get(id)?.name ?? "—",
        style: productMap.get(id)?.style ?? "—",
        units: v.units,
        revenueCents: v.revenue,
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 8);
    const topStyles = Array.from(byStyle.entries())
      .map(([style, v]) => ({ style, units: v.units, revenueCents: v.revenue }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);

    // Top PDVs por unidades
    const byPdv = new Map<string, { units: number; revenue: number }>();
    for (const s of sells) {
      if (!s.pdv_link_id) continue;
      const cur = byPdv.get(s.pdv_link_id) ?? { units: 0, revenue: 0 };
      cur.units += s.units ?? 0;
      cur.revenue += Number(s.gross_revenue_cents ?? 0);
      byPdv.set(s.pdv_link_id, cur);
    }
    const topPdvs = Array.from(byPdv.entries())
      .map(([id, v]) => {
        const pdv = pdvMap.get(id);
        return {
          pdvLinkId: id,
          name: pdv?.pdv_name ?? "—",
          city: pdv?.pdv_city ?? null,
          state: pdv?.pdv_state ?? null,
          units: v.units,
          revenueCents: v.revenue,
        };
      })
      .sort((a, b) => b.units - a.units)
      .slice(0, 8);

    // Funil: degustação → participantes → leads capturados → consentimento
    const participantes = tastings.reduce((s, t) => s + (t.participants ?? 0), 0);
    const leadsCapturados = tastings.reduce((s, t) => s + (t.leads_captured ?? 0), 0);
    const leadsConsentimento = leads.filter((l) => l.consent_marketing).length;

    return {
      brands: brands ?? [],
      kpis: {
        pdvAtivos,
        sellOutUnidades: totalUnits,
        sellOutReceita: totalRevenue,
        ticketMedio,
        leadsClube,
        degustacoes,
      },
      topProducts,
      topStyles,
      topPdvs,
      funnel: { degustacoes, participantes, leadsCapturados, leadsConsentimento },
      sinceDays: data.sinceDays,
    };
  });
