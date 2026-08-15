import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function resolveCompanyId(supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from("communication_tenants")
    .select("company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core.");
  return data.company_id as string;
}

async function nextCampaignCode(supabase: any, companyId: string): Promise<string> {
  const y = new Date().getFullYear();
  const { count, error } = await supabase
    .from("riomed_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("created_at", `${y}-01-01T00:00:00.000Z`);
  if (error) throw new Error(error.message);
  return `CAMP-${y}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export const getRiomedMarketingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const [campaigns, broadcasts, showcase, rules] = await Promise.all([
      supabase.from("riomed_campaigns").select("id,code,name,status,channel,goal,sent_at,metrics,created_at")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      supabase.from("riomed_whatsapp_broadcasts").select("id,status")
        .eq("company_id", companyId).limit(1000),
      supabase.from("riomed_showcase").select("id,slug,title,is_published")
        .eq("company_id", companyId),
      supabase.from("riomed_stale_stock_rules").select("*")
        .eq("company_id", companyId).order("days_threshold"),
    ]);
    for (const r of [campaigns, broadcasts, showcase, rules]) if (r.error) throw new Error(r.error.message);
    const cs = campaigns.data ?? [];
    const bs = broadcasts.data ?? [];
    return {
      campaigns: cs,
      counters: {
        total: cs.length,
        draft: cs.filter((c: any) => c.status === "draft").length,
        running: cs.filter((c: any) => c.status === "running").length,
        completed: cs.filter((c: any) => c.status === "completed").length,
        whatsappQueued: bs.filter((b: any) => b.status === "queued").length,
        whatsappSent: bs.filter((b: any) => ["sent", "delivered", "read"].includes(b.status)).length,
      },
      showcase: showcase.data ?? [],
      rules: rules.data ?? [],
    };
  });

export const detectRiomedStaleStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    days: z.number().int().min(1).max(720).default(90),
    minQty: z.number().min(0).default(1),
    limit: z.number().int().min(1).max(200).default(50),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const { data: rows, error } = await supabase.rpc("riomed_detect_stale_stock", {
      _company_id: companyId,
      _days_threshold: data.days,
      _min_qty: data.minQty,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const createRiomedCampaignFromStale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    name: z.string().min(2).max(120),
    goal: z.enum(["destock", "launch", "seasonal", "reactivation", "b2b", "custom"]).default("destock"),
    channel: z.enum(["whatsapp", "showcase", "email", "b2b", "multi"]).default("whatsapp"),
    audience: z.enum(["all", "public", "b2b", "hospital", "rental", "customer_segment"]).default("all"),
    discountPct: z.number().min(0).max(90).default(15),
    days: z.number().int().min(1).max(720).default(90),
    minQty: z.number().min(0).default(1),
    maxItems: z.number().int().min(1).max(50).default(15),
    tone: z.string().max(120).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const { data: stale, error: e1 } = await supabase.rpc("riomed_detect_stale_stock", {
      _company_id: companyId,
      _days_threshold: data.days,
      _min_qty: data.minQty,
      _limit: data.maxItems,
    });
    if (e1) throw new Error(e1.message);
    const items = (stale ?? []) as Array<any>;
    if (!items.length) throw new Error("Nenhum item elegível foi encontrado com os critérios informados.");

    const code = await nextCampaignCode(supabase, companyId);
    const headline = data.name;
    const body = `Seleção Rio Med com até ${data.discountPct}% de condição promocional nos itens elegíveis. Consulte disponibilidade, condições comerciais e entrega com nossa equipe.`;
    const cta = "Solicite sua cotação";

    const { data: camp, error: e2 } = await supabase.from("riomed_campaigns").insert({
      company_id: companyId,
      code,
      name: data.name,
      goal: data.goal,
      channel: data.channel,
      audience: data.audience,
      status: "ready",
      created_by: userId,
      target_filter: { source: "stale_stock", days: data.days, minQty: data.minQty, tone: data.tone ?? null },
      copy_headline: headline,
      copy_body: body,
      copy_cta: cta,
    }).select("id").single();
    if (e2) throw new Error(e2.message);

    const itemRows = items.map((it, i) => {
      const original = Number(it.unit_price ?? 0);
      const promo = +(original * (1 - data.discountPct / 100)).toFixed(2);
      return {
        company_id: companyId,
        campaign_id: camp.id,
        product_id: it.product_id,
        variant_id: it.variant_id,
        original_price: original,
        discount_pct: data.discountPct,
        promo_price: promo,
        stock_qty: Number(it.qty ?? 0),
        position: i,
      };
    });
    const { error: itemsError } = await supabase.from("riomed_campaign_items").insert(itemRows);
    if (itemsError) throw new Error(itemsError.message);

    const estValue = itemRows.reduce((sum, row) => sum + Number(row.promo_price) * Number(row.stock_qty), 0);
    const { error: metricsError } = await supabase.from("riomed_campaigns")
      .update({ metrics: { items_count: items.length, est_value: estValue, copy_source: "core_template" } })
      .eq("id", camp.id).eq("company_id", companyId);
    if (metricsError) throw new Error(metricsError.message);

    return { campaignId: camp.id, code, itemsCount: items.length, headline, body, cta, copySource: "core_template" };
  });

export const updateRiomedCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    campaignId: z.string().uuid(),
    status: z.enum(["draft", "ready", "scheduled", "running", "completed", "cancelled"]),
    scheduledAt: z.string().datetime().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const patch: any = { status: data.status };
    if (data.status === "scheduled" && data.scheduledAt) patch.scheduled_at = data.scheduledAt;
    if (data.status === "running") patch.sent_at = new Date().toISOString();
    if (data.status === "completed") patch.sent_at = new Date().toISOString();
    const { data: row, error } = await supabase.from("riomed_campaigns")
      .update(patch).eq("id", data.campaignId).eq("company_id", companyId).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Campanha não encontrada.");
    return { ok: true };
  });

export const enqueueWhatsappBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    campaignId: z.string().uuid(),
    recipients: z.array(z.object({
      phone: z.string().min(8),
      name: z.string().optional(),
      customerId: z.string().uuid().optional(),
    })).min(1).max(500),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const { data: camp, error: campaignError } = await supabase
      .from("riomed_campaigns").select("copy_headline,copy_body,copy_cta")
      .eq("id", data.campaignId).eq("company_id", companyId).maybeSingle();
    if (campaignError) throw new Error(campaignError.message);
    if (!camp) throw new Error("Campanha não encontrada.");

    const baseMsg = [camp.copy_headline, camp.copy_body, camp.copy_cta].filter(Boolean).join("\n\n");
    const rows = data.recipients.map((r) => ({
      company_id: companyId,
      campaign_id: data.campaignId,
      recipient_phone: r.phone,
      recipient_name: r.name ?? null,
      customer_id: r.customerId ?? null,
      message: r.name ? `Olá ${r.name},\n\n${baseMsg}` : baseMsg,
      status: "queued",
    }));
    const { error } = await supabase.from("riomed_whatsapp_broadcasts").insert(rows);
    if (error) throw new Error(error.message);
    await supabase.from("riomed_campaigns").update({ status: "running" })
      .eq("id", data.campaignId).eq("company_id", companyId);
    return { queued: rows.length, delivery: "pending_worker" };
  });

export const listCampaignBroadcasts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ campaignId: z.string().uuid(), limit: z.number().int().max(500).default(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const { data: rows, error } = await supabase.from("riomed_whatsapp_broadcasts").select("*")
      .eq("company_id", companyId).eq("campaign_id", data.campaignId)
      .order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const toggleShowcasePublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ showcaseId: z.string().uuid(), isPublished: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const companyId = await resolveCompanyId(supabase);
    const { data: row, error } = await supabase.from("riomed_showcase")
      .update({ is_published: data.isPublished }).eq("id", data.showcaseId).eq("company_id", companyId)
      .select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Vitrine não encontrada.");
    return { ok: true };
  });