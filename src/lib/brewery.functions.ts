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
        "id,brand_id,pdv_name,pdv_city,pdv_state,contact_name,contact_phone,contract_status,contract_started_at,contract_ended_at,notes,created_at,portal_token",
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
    const patch: { contract_status: "pending" | "active" | "paused" | "ended"; contract_started_at?: string; contract_ended_at?: string } = { contract_status: data.contractStatus };
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

/* ============ Catálogo de rótulos ============ */

const ListProductsInput = z.object({ brandId: z.string().uuid(), includeInactive: z.boolean().default(false) });
export const listBreweryProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListProductsInput.parse(d))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("brewery_products")
      .select("id,brand_id,name,style,abv,ibu,volume_ml,package_type,sku,is_active,is_seasonal,photo_url,description,created_at")
      .eq("brand_id", data.brandId)
      .order("name", { ascending: true });
    if (!data.includeInactive) q = q.eq("is_active", true);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

const UpsertProductInput = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  name: z.string().min(1).max(120),
  style: z.string().min(1).max(60),
  sku: z.string().max(40).optional().nullable(),
  abv: z.number().min(0).max(20).optional().nullable(),
  ibu: z.number().int().min(0).max(200).optional().nullable(),
  volumeMl: z.number().int().min(0).max(10000).optional().nullable(),
  packageType: z.string().max(40).optional().nullable(),
  description: z.string().max(600).optional().nullable(),
  photoUrl: z.string().url().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  isSeasonal: z.boolean().default(false),
});
export const upsertBreweryProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertProductInput.parse(d))
  .handler(async ({ context, data }) => {
    const payload = {
      brand_id: data.brandId,
      name: data.name,
      style: data.style,
      sku: data.sku ?? null,
      abv: data.abv ?? null,
      ibu: data.ibu ?? null,
      volume_ml: data.volumeMl ?? null,
      package_type: data.packageType ?? null,
      description: data.description ?? null,
      photo_url: data.photoUrl ?? null,
      is_active: data.isActive,
      is_seasonal: data.isSeasonal,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("brewery_products").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("brewery_products").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

const ToggleProductInput = z.object({ id: z.string().uuid(), isActive: z.boolean() });
export const toggleBreweryProductActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ToggleProductInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("brewery_products").update({ is_active: data.isActive }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ============ Campanhas coordenadas ============ */

const ListCampaignsInput = z.object({ brandId: z.string().uuid().optional() });
export const listBreweryCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListCampaignsInput.parse(d))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("brewery_campaigns")
      .select("id,brand_id,name,goal,status,starts_at,ends_at,kpi_target_units,kpi_target_leads,target_pdv_ids,voucher_code,created_at")
      .order("starts_at", { ascending: false });
    if (data.brandId) q = q.eq("brand_id", data.brandId);
    const { data: campaigns, error } = await q;
    if (error) throw error;

    // Progresso: somar units (sellouts) e leads no intervalo, restritos aos PDVs alvo
    const result = [] as any[];
    for (const c of campaigns ?? []) {
      const targetIds: string[] = c.target_pdv_ids ?? [];
      const [sellRes, leadRes] = await Promise.all([
        context.supabase
          .from("brewery_sellouts")
          .select("units,gross_revenue_cents,pdv_link_id")
          .eq("brand_id", c.brand_id)
          .gte("period_start", c.starts_at.slice(0, 10))
          .lte("period_end", c.ends_at.slice(0, 10)),
        context.supabase
          .from("brewery_lead_preferences")
          .select("id")
          .eq("brand_id", c.brand_id)
          .gte("created_at", c.starts_at)
          .lte("created_at", c.ends_at),
      ]);
      const sells = (sellRes.data ?? []).filter(
        (s) => targetIds.length === 0 || (s.pdv_link_id && targetIds.includes(s.pdv_link_id)),
      );
      const units = sells.reduce((s, r) => s + (r.units ?? 0), 0);
      const revenue = sells.reduce((s, r) => s + Number(r.gross_revenue_cents ?? 0), 0);
      const leads = (leadRes.data ?? []).length;
      result.push({
        ...c,
        progress: {
          units,
          revenueCents: revenue,
          leads,
          unitsPct: c.kpi_target_units ? Math.min(100, Math.round((units / c.kpi_target_units) * 100)) : null,
          leadsPct: c.kpi_target_leads ? Math.min(100, Math.round((leads / c.kpi_target_leads) * 100)) : null,
        },
      });
    }
    return result;
  });

const UpsertCampaignInput = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  name: z.string().min(2).max(120),
  goal: z.string().max(280).optional().nullable(),
  status: z.enum(["draft", "scheduled", "running", "completed", "cancelled"]).default("draft"),
  startsAt: z.string(),
  endsAt: z.string(),
  kpiTargetUnits: z.number().int().min(0).optional().nullable(),
  kpiTargetLeads: z.number().int().min(0).optional().nullable(),
  targetPdvIds: z.array(z.string().uuid()).default([]),
  voucherCode: z.string().max(40).optional().nullable(),
});
export const upsertBreweryCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertCampaignInput.parse(d))
  .handler(async ({ context, data }) => {
    const payload = {
      brand_id: data.brandId,
      name: data.name,
      goal: data.goal ?? null,
      status: data.status,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      kpi_target_units: data.kpiTargetUnits ?? null,
      kpi_target_leads: data.kpiTargetLeads ?? null,
      target_pdv_ids: data.targetPdvIds,
      voucher_code: data.voucherCode ?? null,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("brewery_campaigns").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("brewery_campaigns").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

/* ============ Degustações ============ */

const ListTastingsInput = z.object({ brandId: z.string().uuid(), sinceDays: z.number().int().min(1).max(365).default(180) });
export const listBreweryTastings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListTastingsInput.parse(d))
  .handler(async ({ context, data }) => {
    const sinceIso = new Date(Date.now() - data.sinceDays * 86400_000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("brewery_tastings")
      .select("id,brand_id,pdv_link_id,event_at,duration_minutes,participants,leads_captured,units_sold,products_showcased,notes,created_at")
      .eq("brand_id", data.brandId)
      .gte("event_at", sinceIso)
      .order("event_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

const UpsertTastingInput = z.object({
  id: z.string().uuid().optional(),
  brandId: z.string().uuid(),
  pdvLinkId: z.string().uuid().optional().nullable(),
  eventAt: z.string(),
  durationMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  participants: z.number().int().min(0).default(0),
  leadsCaptured: z.number().int().min(0).default(0),
  unitsSold: z.number().int().min(0).default(0),
  productsShowcased: z.array(z.string().uuid()).default([]),
  notes: z.string().max(500).optional().nullable(),
});
export const upsertBreweryTasting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertTastingInput.parse(d))
  .handler(async ({ context, data }) => {
    const payload = {
      brand_id: data.brandId,
      pdv_link_id: data.pdvLinkId ?? null,
      event_at: data.eventAt,
      duration_minutes: data.durationMinutes ?? null,
      participants: data.participants,
      leads_captured: data.leadsCaptured,
      units_sold: data.unitsSold,
      products_showcased: data.productsShowcased,
      notes: data.notes ?? null,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("brewery_tastings").update(payload).eq("id", data.id).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("brewery_tastings").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

/* ============ Leads (consumidores capturados) ============ */

// Mascara nome (primeiro nome + iniciais) e whatsapp (mantém DDD e 4 últimos)
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 4) + "***";
  return parts[0] + " " + parts.slice(1).map((p) => p[0]?.toUpperCase() + ".").join(" ");
}
function maskPhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
}

const CaptureLeadInput = z.object({
  brandId: z.string().uuid(),
  name: z.string().min(2).max(120),
  whatsapp: z.string().min(8).max(20),
  favoriteStyles: z.array(z.string()).max(8).default([]),
  frequency: z.enum(["weekly", "biweekly", "monthly", "rarely"]).optional().nullable(),
  interests: z.array(z.string()).max(8).default([]),
  consentMarketing: z.boolean().default(false),
  source: z.string().max(60).default("tasting"),
});
export const captureBreweryLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CaptureLeadInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("brewery_lead_preferences")
      .insert({
        brand_id: data.brandId,
        consumer_user_id: null,
        masked_name: maskName(data.name),
        masked_whatsapp: maskPhone(data.whatsapp),
        favorite_styles: data.favoriteStyles,
        favorite_brand_ids: [],
        frequency: data.frequency ?? null,
        interests: data.interests,
        consent_marketing: data.consentMarketing,
        consent_at: data.consentMarketing ? new Date().toISOString() : null,
        source: data.source,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

const ListLeadsInput = z.object({
  brandId: z.string().uuid(),
  style: z.string().optional(),
  interest: z.string().optional(),
  consentOnly: z.boolean().default(false),
  sinceDays: z.number().int().min(1).max(720).default(180),
});
export const listBreweryLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListLeadsInput.parse(d))
  .handler(async ({ context, data }) => {
    const sinceIso = new Date(Date.now() - data.sinceDays * 86400_000).toISOString();
    let q = context.supabase
      .from("brewery_lead_preferences")
      .select("id,brand_id,masked_name,masked_whatsapp,favorite_styles,frequency,interests,consent_marketing,consent_at,source,created_at")
      .eq("brand_id", data.brandId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false });
    if (data.consentOnly) q = q.eq("consent_marketing", true);
    if (data.style) q = q.contains("favorite_styles", [data.style]);
    if (data.interest) q = q.contains("interests", [data.interest]);
    const { data: rows, error } = await q;
    if (error) throw error;

    // Estatísticas de segmentação
    const byStyle = new Map<string, number>();
    const byInterest = new Map<string, number>();
    const byFreq = new Map<string, number>();
    for (const r of rows ?? []) {
      for (const s of r.favorite_styles ?? []) byStyle.set(s, (byStyle.get(s) ?? 0) + 1);
      for (const i of r.interests ?? []) byInterest.set(i, (byInterest.get(i) ?? 0) + 1);
      if (r.frequency) byFreq.set(r.frequency, (byFreq.get(r.frequency) ?? 0) + 1);
    }
    return {
      leads: rows ?? [],
      total: rows?.length ?? 0,
      consented: (rows ?? []).filter((r) => r.consent_marketing).length,
      stats: {
        styles: Array.from(byStyle.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count),
        interests: Array.from(byInterest.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count),
        frequency: Array.from(byFreq.entries()).map(([k, v]) => ({ key: k, count: v })),
      },
    };
  });

/* ============ Disparo segmentado (preview de blast) ============ */

const PreviewBlastInput = z.object({
  brandId: z.string().uuid(),
  styles: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  campaignId: z.string().uuid().optional(),
});
export const previewBreweryBlast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PreviewBlastInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("brewery_lead_preferences")
      .select("id,favorite_styles,interests,consent_marketing,masked_whatsapp")
      .eq("brand_id", data.brandId)
      .eq("consent_marketing", true);
    if (error) throw error;
    const matches = (rows ?? []).filter((r) => {
      const okStyle = data.styles.length === 0 || data.styles.some((s) => r.favorite_styles?.includes(s));
      const okInt = data.interests.length === 0 || data.interests.some((i) => r.interests?.includes(i));
      return okStyle && okInt;
    });
    return {
      eligible: matches.length,
      totalConsented: rows?.length ?? 0,
      sample: matches.slice(0, 5).map((m) => m.masked_whatsapp),
      campaignId: data.campaignId ?? null,
    };
  });

/* ============ Fase 6 — Disparo real (message_outbox) ============ */

const DispatchBlastInput = z.object({
  brandId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  channel: z.enum(["whatsapp", "email"]),
  styles: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  voucherCode: z.string().max(40).optional(),
  subject: z.string().max(140).optional(),
  body: z.string().min(5).max(1000),
});

export const dispatchBreweryBlast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DispatchBlastInput.parse(d))
  .handler(async ({ context, data }) => {
    // RLS valida acesso via insert em brewery_blasts (has_brewery_access).
    const { data: blast, error: bErr } = await (context.supabase as any)
      .from("brewery_blasts")
      .insert({
        brand_id: data.brandId,
        campaign_id: data.campaignId ?? null,
        channel: data.channel,
        audience_filter: { styles: data.styles, interests: data.interests },
        voucher_code: data.voucherCode ?? null,
        subject: data.subject ?? null,
        body: data.body,
        status: "queued",
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (bErr || !blast) throw bErr ?? new Error("Falha ao registrar disparo");

    // Carrega leads elegíveis (escopo já restrito por RLS à marca acessível).
    const { data: leads, error: lErr } = await context.supabase
      .from("brewery_lead_preferences")
      .select("id,masked_whatsapp,masked_name,favorite_styles,interests,consent_marketing")
      .eq("brand_id", data.brandId)
      .eq("consent_marketing", true);
    if (lErr) throw lErr;

    const matches = (leads ?? []).filter((l: any) => {
      const okS = data.styles.length === 0 || data.styles.some((s) => l.favorite_styles?.includes(s));
      const okI = data.interests.length === 0 || data.interests.some((i) => l.interests?.includes(i));
      return okS && okI;
    });

    // Enfileira na outbox via service role (company_id=null, referenciando o blast).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = matches.slice(0, 500).map((l: any) => ({
      channel: data.channel,
      event_code: "brewery.blast",
      company_id: null,
      reference_type: "brewery_blast",
      reference_id: blast.id,
      recipient_phone: data.channel === "whatsapp" ? l.masked_whatsapp : null,
      recipient_email: null,
      recipient_name: l.masked_name,
      subject: data.subject ?? null,
      body: data.body,
      status: "queued",
      payload: { brand_id: data.brandId, campaign_id: data.campaignId ?? null, voucher_code: data.voucherCode ?? null, lead_id: l.id },
    }));

    let enqueued = 0;
    if (rows.length > 0) {
      const { error: oErr, count } = await supabaseAdmin
        .from("message_outbox")
        .insert(rows, { count: "exact" });
      if (oErr) {
        await (context.supabase as any).from("brewery_blasts")
          .update({ status: "failed", last_error: oErr.message, audience_count: matches.length })
          .eq("id", blast.id);
        throw oErr;
      }
      enqueued = count ?? rows.length;
    }

    await (context.supabase as any).from("brewery_blasts")
      .update({
        audience_count: matches.length,
        enqueued_count: enqueued,
        status: enqueued === matches.length && enqueued > 0 ? "sent" : (enqueued > 0 ? "partial" : "queued"),
        sent_at: enqueued > 0 ? new Date().toISOString() : null,
      })
      .eq("id", blast.id);

    return { blastId: blast.id, eligible: matches.length, enqueued };
  });

export const listBreweryBlasts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ brandId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await (context.supabase as any)
      .from("brewery_blasts")
      .select("id,channel,audience_count,enqueued_count,voucher_code,subject,body,status,sent_at,created_at,campaign_id,audience_filter,last_error")
      .eq("brand_id", data.brandId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return rows ?? [];
  });

/* ============ Fase 6 — Relatório de retorno (PDV / Cupom) ============ */

const ReturnReportInput = z.object({
  brandId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  sinceDays: z.number().int().min(1).max(365).default(90),
});

export const fetchBreweryReturnReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReturnReportInput.parse(d))
  .handler(async ({ context, data }) => {
    const since = new Date(Date.now() - data.sinceDays * 86400_000).toISOString().slice(0, 10);

    let soQ = (context.supabase as any)
      .from("brewery_sellouts")
      .select("pdv_link_id,units,gross_revenue_cents,coupon_redemptions,voucher_code,campaign_id,period_end")
      .eq("brand_id", data.brandId)
      .gte("period_end", since);
    if (data.campaignId) soQ = soQ.eq("campaign_id", data.campaignId);
    const { data: sellouts, error: sErr } = await soQ;
    if (sErr) throw sErr;

    const { data: pdvs } = await context.supabase
      .from("brewery_pdv_links").select("id,pdv_name,pdv_city,pdv_state").eq("brand_id", data.brandId);
    const pdvMap = new Map((pdvs ?? []).map((p: any) => [p.id, p]));

    const byPdv = new Map<string, { pdv_link_id: string; pdv_name: string; pdv_city: string | null; units: number; revenue_cents: number; redemptions: number }>();
    const byVoucher = new Map<string, { voucher_code: string; units: number; revenue_cents: number; redemptions: number }>();
    let totalUnits = 0, totalRevenue = 0, totalRedemptions = 0;

    for (const s of (sellouts ?? []) as any[]) {
      totalUnits += s.units ?? 0;
      totalRevenue += Number(s.gross_revenue_cents ?? 0);
      totalRedemptions += s.coupon_redemptions ?? 0;
      if (s.pdv_link_id) {
        const p: any = pdvMap.get(s.pdv_link_id);
        const cur = byPdv.get(s.pdv_link_id) ?? {
          pdv_link_id: s.pdv_link_id,
          pdv_name: p?.pdv_name ?? "PDV",
          pdv_city: p?.pdv_city ?? null,
          units: 0, revenue_cents: 0, redemptions: 0,
        };
        cur.units += s.units ?? 0;
        cur.revenue_cents += Number(s.gross_revenue_cents ?? 0);
        cur.redemptions += s.coupon_redemptions ?? 0;
        byPdv.set(s.pdv_link_id, cur);
      }
      if (s.voucher_code) {
        const cur = byVoucher.get(s.voucher_code) ?? { voucher_code: s.voucher_code, units: 0, revenue_cents: 0, redemptions: 0 };
        cur.units += s.units ?? 0;
        cur.revenue_cents += Number(s.gross_revenue_cents ?? 0);
        cur.redemptions += s.coupon_redemptions ?? 0;
        byVoucher.set(s.voucher_code, cur);
      }
    }

    // Blasts no período (para cruzar audiência x retorno)
    const { data: blasts } = await (context.supabase as any)
      .from("brewery_blasts")
      .select("id,channel,enqueued_count,voucher_code,sent_at,campaign_id")
      .eq("brand_id", data.brandId)
      .gte("created_at", since);

    const totalEnqueued = (blasts ?? []).reduce((a: number, b: any) => a + (b.enqueued_count ?? 0), 0);
    const conversion = totalEnqueued > 0 ? Math.round((totalRedemptions / totalEnqueued) * 1000) / 10 : null;

    return {
      kpis: {
        units: totalUnits,
        revenue_cents: totalRevenue,
        redemptions: totalRedemptions,
        enqueued: totalEnqueued,
        conversionPct: conversion,
      },
      byPdv: Array.from(byPdv.values()).sort((a, b) => b.revenue_cents - a.revenue_cents),
      byVoucher: Array.from(byVoucher.values()).sort((a, b) => b.redemptions - a.redemptions),
      blasts: blasts ?? [],
    };
  });

/* ============ Fase 7 — Portal público do PDV parceiro (sem auth) ============ */

const PortalTokenInput = z.object({ token: z.string().uuid() });

export const fetchPartnerPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PortalTokenInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: resolved, error } = await (supabaseAdmin as any)
      .rpc("resolve_brewery_portal_token", { _token: data.token })
      .maybeSingle();
    if (error) throw error;
    if (!resolved) return { ok: false as const };

    const today = new Date().toISOString().slice(0, 10);
    const [{ data: campaigns }, { data: sellouts }] = await Promise.all([
      (supabaseAdmin as any)
        .from("brewery_campaigns")
        .select("id,name,goal,voucher_code,starts_at,ends_at,kpi_target_units,status,target_pdv_ids")
        .eq("brand_id", resolved.brand_id)
        .in("status", ["running", "scheduled"])
        .gte("ends_at", today)
        .order("starts_at", { ascending: true }),
      (supabaseAdmin as any)
        .from("brewery_sellouts")
        .select("id,period_start,period_end,units,gross_revenue_cents,voucher_code,coupon_redemptions")
        .eq("pdv_link_id", resolved.pdv_link_id)
        .order("period_end", { ascending: false })
        .limit(12),
    ]);

    const targeted = (campaigns ?? []).filter((c: any) =>
      !c.target_pdv_ids || c.target_pdv_ids.length === 0 || c.target_pdv_ids.includes(resolved.pdv_link_id),
    );

    return {
      ok: true as const,
      pdv: {
        id: resolved.pdv_link_id,
        name: resolved.pdv_name,
        city: resolved.pdv_city,
        state: resolved.pdv_state,
        contactName: resolved.contact_name,
        contractStatus: resolved.contract_status,
      },
      brand: {
        id: resolved.brand_id,
        name: resolved.brand_name,
        slug: resolved.brand_slug,
        logoUrl: resolved.brand_logo_url,
      },
      campaigns: targeted,
      recentSellouts: sellouts ?? [],
    };
  });

export const acceptPartnerInvite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PortalTokenInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: resolved } = await (supabaseAdmin as any)
      .rpc("resolve_brewery_portal_token", { _token: data.token })
      .maybeSingle();
    if (!resolved) throw new Error("Convite inválido ou expirado");

    const { error } = await (supabaseAdmin as any)
      .from("brewery_pdv_links")
      .update({
        contract_status: "active",
        contract_started_at: new Date().toISOString().slice(0, 10),
      })
      .eq("id", resolved.pdv_link_id)
      .in("contract_status", ["pending", "paused"]);
    if (error) throw error;
    return { ok: true };
  });

const SubmitSelloutInput = z.object({
  token: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  units: z.number().int().min(0).max(100000),
  grossRevenueCents: z.number().int().min(0).max(1_000_000_00),
  voucherCode: z.string().max(40).optional(),
  couponRedemptions: z.number().int().min(0).max(100000).default(0),
  campaignId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const submitPartnerSellout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitSelloutInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: resolved } = await (supabaseAdmin as any)
      .rpc("resolve_brewery_portal_token", { _token: data.token })
      .maybeSingle();
    if (!resolved) throw new Error("Link inválido");
    if (resolved.contract_status !== "active") throw new Error("Contrato precisa estar ativo para enviar sell-out");

    const avg = data.units > 0 ? Math.round(data.grossRevenueCents / data.units) : 0;
    const { error } = await (supabaseAdmin as any)
      .from("brewery_sellouts")
      .insert({
        brand_id: resolved.brand_id,
        pdv_link_id: resolved.pdv_link_id,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        units: data.units,
        gross_revenue_cents: data.grossRevenueCents,
        avg_ticket_cents: avg,
        voucher_code: data.voucherCode ?? null,
        coupon_redemptions: data.couponRedemptions,
        campaign_id: data.campaignId ?? null,
        source: "partner_portal",
        notes: data.notes ?? null,
      });
    if (error) throw error;
    return { ok: true };
  });

/* ============ Fase 8 — Demo seed da microcervejaria ============ */

export const seedBreweryDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const slug = `demo-${userId.slice(0, 6)}-${Date.now().toString(36).slice(-4)}`;

    const { data: brand, error: bErr } = await context.supabase
      .from("brewery_brands")
      .insert({
        owner_user_id: userId,
        name: "Cervejaria Demo (Lúpulo & Cia)",
        slug,
        city: "Florianópolis",
        state: "SC",
        founded_year: 2018,
        brewer_name: "Mestre Cervejeiro Demo",
        bio: "Marca de demonstração para experimentar todos os fluxos do módulo de microcervejarias.",
        is_active: true,
        is_demo: true,
      })
      .select("id")
      .single();
    if (bErr || !brand) throw bErr ?? new Error("Falha ao criar marca demo");
    const brandId = brand.id;

    // Produtos demo
    const products = [
      { sku: "DEMO-IPA-473", name: "Lúpulo IPA", style: "IPA", abv: 6.2, ibu: 55, volume_ml: 473 },
      { sku: "DEMO-PIL-355", name: "Sol Pilsen", style: "Pilsen", abv: 4.6, ibu: 18, volume_ml: 355 },
      { sku: "DEMO-STO-473", name: "Noite Stout", style: "Stout", abv: 7.0, ibu: 35, volume_ml: 473 },
    ];
    const { data: insertedProducts } = await context.supabase
      .from("brewery_products")
      .insert(products.map((p) => ({ ...p, brand_id: brandId, is_active: true })))
      .select("id,sku");

    // PDVs demo
    const pdvSeed = [
      { pdv_name: "Bar do Centro Demo", pdv_city: "Florianópolis", pdv_state: "SC", contact_name: "João Demo", contact_phone: "(48) 99999-1111", contract_status: "active" },
      { pdv_name: "Bistrô Praia Demo", pdv_city: "Itajaí", pdv_state: "SC", contact_name: "Maria Demo", contact_phone: "(47) 99999-2222", contract_status: "active" },
      { pdv_name: "Pub Universitário Demo", pdv_city: "Joinville", pdv_state: "SC", contact_name: "Pedro Demo", contact_phone: "(47) 99999-3333", contract_status: "pending" },
    ];
    const { data: insertedPdvs } = await context.supabase
      .from("brewery_pdv_links")
      .insert(pdvSeed.map((p) => ({ ...p, brand_id: brandId, contract_started_at: p.contract_status === "active" ? new Date().toISOString().slice(0, 10) : null })))
      .select("id,pdv_name");

    // Sell-outs últimos 60 dias (3 períodos quinzenais x PDVs ativos x produtos)
    const activePdvs = (insertedPdvs ?? []).filter((p: any) => p.pdv_name !== "Pub Universitário Demo");
    const periods = [60, 45, 30, 15, 0].map((daysAgo, i, arr) => {
      const end = new Date(Date.now() - daysAgo * 86400_000);
      const start = i > 0 ? new Date(Date.now() - arr[i - 1] * 86400_000 + 86400_000) : new Date(Date.now() - (daysAgo + 14) * 86400_000);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    });
    const sellouts: any[] = [];
    for (const pdv of activePdvs) {
      for (const prod of insertedProducts ?? []) {
        for (const per of periods) {
          const units = 20 + Math.floor(Math.random() * 60);
          const unit_price = 18 + Math.floor(Math.random() * 8);
          sellouts.push({
            brand_id: brandId,
            product_id: prod.id,
            pdv_link_id: pdv.id,
            period_start: per.start,
            period_end: per.end,
            units,
            gross_revenue_cents: units * unit_price * 100,
            avg_ticket_cents: unit_price * 100,
            source: "demo_seed",
          });
        }
      }
    }
    if (sellouts.length > 0) {
      await context.supabase.from("brewery_sellouts").insert(sellouts);
    }

    // Campanha demo
    const today = new Date().toISOString().slice(0, 10);
    const ends = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
    await context.supabase.from("brewery_campaigns").insert({
      brand_id: brandId,
      name: "Lançamento IPA Verão (Demo)",
      goal: "Aumentar giro da IPA nos bares parceiros",
      voucher_code: "IPA20",
      starts_at: today,
      ends_at: ends,
      kpi_target_units: 500,
      kpi_target_leads: 100,
      status: "running",
      target_pdv_ids: (insertedPdvs ?? []).map((p: any) => p.id),
    });

    // Leads demo
    const leadsSeed = [
      { masked_name: "Lucas M.", masked_whatsapp: "(48) ****-1234", favorite_styles: ["IPA", "Stout"], interests: ["Lançamentos", "Cupons"], frequency: "weekly", consent_marketing: true, source: "demo_seed" },
      { masked_name: "Ana C.", masked_whatsapp: "(48) ****-5678", favorite_styles: ["Pilsen", "Weiss"], interests: ["Eventos/Degustações"], frequency: "biweekly", consent_marketing: true, source: "demo_seed" },
      { masked_name: "Bruno S.", masked_whatsapp: "(48) ****-9012", favorite_styles: ["IPA"], interests: ["Receitas/Harmonização"], frequency: "monthly", consent_marketing: true, source: "demo_seed" },
      { masked_name: "Clara R.", masked_whatsapp: "(48) ****-3456", favorite_styles: ["Stout", "Porter"], interests: ["Visita à fábrica"], frequency: "rarely", consent_marketing: false, source: "demo_seed" },
    ];
    await context.supabase.from("brewery_lead_preferences").insert(leadsSeed.map((l) => ({ ...l, brand_id: brandId })));

    return { brandId, slug };
  });

export const removeBreweryDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ brandId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("brewery_brands")
      .delete()
      .eq("id", data.brandId)
      .eq("is_demo", true);
    if (error) throw error;
    return { ok: true };
  });
