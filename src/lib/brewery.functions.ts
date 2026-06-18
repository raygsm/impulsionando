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

/**
 * Lista PDVs vinculados às marcas do usuário (com filtro opcional por marca/status).
 */
const ListPdvsInput = z.object({
  brandId: z.string().uuid().optional(),
  status: z.enum(["all", "active", "pending", "paused", "ended"]).default("all"),
});

export const listBreweryPdvs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListPdvsInput.parse(d))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("brewery_pdv_links")
      .select(
        "id,brand_id,pdv_name,pdv_city,pdv_state,contact_name,contact_phone,contract_status,contract_started_at,contract_ended_at,notes,created_at",
      )
      .order("created_at", { ascending: false });
    if (data.brandId) q = q.eq("brand_id", data.brandId);
    if (data.status !== "all") q = q.eq("contract_status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;

    // Sell-out agregado por PDV nos últimos 90 dias
    const sinceIso = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
    const ids = (rows ?? []).map((r) => r.id);
    let sellByPdv = new Map<string, { units: number; revenueCents: number; lastPeriod: string | null }>();
    if (ids.length > 0) {
      const { data: sells, error: sErr } = await context.supabase
        .from("brewery_sellouts")
        .select("pdv_link_id,units,gross_revenue_cents,period_end")
        .in("pdv_link_id", ids)
        .gte("period_start", sinceIso);
      if (sErr) throw sErr;
      for (const s of sells ?? []) {
        if (!s.pdv_link_id) continue;
        const cur = sellByPdv.get(s.pdv_link_id) ?? { units: 0, revenueCents: 0, lastPeriod: null };
        cur.units += s.units ?? 0;
        cur.revenueCents += Number(s.gross_revenue_cents ?? 0);
        if (!cur.lastPeriod || (s.period_end && s.period_end > cur.lastPeriod)) {
          cur.lastPeriod = s.period_end ?? cur.lastPeriod;
        }
        sellByPdv.set(s.pdv_link_id, cur);
      }
    }

    return (rows ?? []).map((r) => ({
      ...r,
      sellout90d: sellByPdv.get(r.id) ?? { units: 0, revenueCents: 0, lastPeriod: null },
    }));
  });

/**
 * Cadastro manual de PDV (bar/restaurante parceiro).
 */
const CreatePdvInput = z.object({
  brandId: z.string().uuid(),
  pdvName: z.string().min(2).max(140),
  pdvCity: z.string().max(80).optional().nullable(),
  pdvState: z.string().max(2).optional().nullable(),
  contactName: z.string().max(120).optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  contractStatus: z.enum(["pending", "active", "paused", "ended"]).default("pending"),
  notes: z.string().max(500).optional().nullable(),
});

export const createBreweryPdv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreatePdvInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("brewery_pdv_links")
      .insert({
        brand_id: data.brandId,
        pdv_name: data.pdvName,
        pdv_city: data.pdvCity ?? null,
        pdv_state: data.pdvState ?? null,
        contact_name: data.contactName ?? null,
        contact_phone: data.contactPhone ?? null,
        contract_status: data.contractStatus,
        contract_started_at: data.contractStatus === "active" ? new Date().toISOString() : null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

/**
 * Atualiza status de contrato de um PDV.
 */
const UpdatePdvStatusInput = z.object({
  pdvLinkId: z.string().uuid(),
  contractStatus: z.enum(["pending", "active", "paused", "ended"]),
});

export const updateBreweryPdvStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdatePdvStatusInput.parse(d))
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = { contract_status: data.contractStatus };
    if (data.contractStatus === "active") patch.contract_started_at = new Date().toISOString();
    if (data.contractStatus === "ended") patch.contract_ended_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("brewery_pdv_links")
      .update(patch)
      .eq("id", data.pdvLinkId);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Gera link de convite (URL pública) para o PDV se vincular à marca.
 * Por enquanto é determinístico baseado no slug + id da marca; não persiste token.
 */
const InviteLinkInput = z.object({ brandId: z.string().uuid() });

export const generateBreweryInviteLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteLinkInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: brand, error } = await context.supabase
      .from("brewery_brands")
      .select("id,name,slug")
      .eq("id", data.brandId)
      .single();
    if (error) throw error;
    const origin = process.env.PUBLIC_SITE_URL ?? "https://impulsionando.com.br";
    const url = `${origin}/parceiro-cervejaria/${brand.slug}?ref=${brand.id.slice(0, 8)}`;
    return { url, qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(url)}`, brand };
  });

/**
 * Import em lote de sell-out (linhas vindas de CSV parseado no client).
 * Cada linha precisa de product_id (ou SKU), pdv_link_id, period_start, period_end, units, gross_revenue_cents.
 */
const SelloutRow = z.object({
  productId: z.string().uuid().optional(),
  sku: z.string().optional(),
  pdvLinkId: z.string().uuid(),
  periodStart: z.string(), // YYYY-MM-DD
  periodEnd: z.string(),
  units: z.number().int().min(0),
  grossRevenueCents: z.number().int().min(0),
  notes: z.string().max(240).optional().nullable(),
});
const ImportSelloutsInput = z.object({
  brandId: z.string().uuid(),
  rows: z.array(SelloutRow).min(1).max(2000),
});

export const importBrewerySellouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportSelloutsInput.parse(d))
  .handler(async ({ context, data }) => {
    // Resolver SKUs para product_id se necessário
    const skus = Array.from(new Set(data.rows.filter((r) => !r.productId && r.sku).map((r) => r.sku!)));
    const skuToId = new Map<string, string>();
    if (skus.length > 0) {
      const { data: prods, error: pErr } = await context.supabase
        .from("brewery_products")
        .select("id,sku")
        .eq("brand_id", data.brandId)
        .in("sku", skus);
      if (pErr) throw pErr;
      for (const p of prods ?? []) if (p.sku) skuToId.set(p.sku, p.id);
    }

    const payload: any[] = [];
    const errors: { row: number; message: string }[] = [];
    data.rows.forEach((r, idx) => {
      const productId = r.productId ?? (r.sku ? skuToId.get(r.sku) : undefined);
      if (!productId) {
        errors.push({ row: idx + 1, message: `Produto não encontrado (SKU "${r.sku ?? "—"}")` });
        return;
      }
      payload.push({
        brand_id: data.brandId,
        product_id: productId,
        pdv_link_id: r.pdvLinkId,
        period_start: r.periodStart,
        period_end: r.periodEnd,
        units: r.units,
        gross_revenue_cents: r.grossRevenueCents,
        avg_ticket_cents: r.units > 0 ? Math.round(r.grossRevenueCents / r.units) : null,
        source: "csv_import",
        notes: r.notes ?? null,
      });
    });

    let inserted = 0;
    if (payload.length > 0) {
      const { error: iErr, count } = await context.supabase
        .from("brewery_sellouts")
        .insert(payload, { count: "exact" });
      if (iErr) throw iErr;
      inserted = count ?? payload.length;
    }
    return { inserted, skipped: errors.length, errors };
  });
