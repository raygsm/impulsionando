import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function resolveCompanyId(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("user_profiles").select("company_id").eq("user_id", userId).maybeSingle();
  if (profile?.company_id) return profile.company_id;
  const { data: tenant } = await supabase
    .from("core_tenant_identity").select("company_id").eq("subdomain", "riomed").maybeSingle();
  if (!tenant?.company_id) throw new Error("Empresa não identificada.");
  return tenant.company_id;
}

async function nextCampaignCode(supabase: any, companyId: string): Promise<string> {
  const y = new Date().getFullYear();
  const { count } = await supabase
    .from("riomed_campaigns").select("id", { count: "exact", head: true })
    .eq("company_id", companyId).gte("created_at", `${y}-01-01`);
  return `CAMP-${y}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

// ============== Overview ==============
export const getRiomedMarketingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const companyId = await resolveCompanyId(supabase, userId);
    const [campaigns, broadcasts, showcase, rules] = await Promise.all([
      supabase.from("riomed_campaigns").select("id,status,channel,goal,sent_at,metrics")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      supabase.from("riomed_whatsapp_broadcasts").select("id,status")
        .eq("company_id", companyId).limit(1000),
      supabase.from("riomed_showcase").select("id,slug,title,is_published")
        .eq("company_id", companyId),
      supabase.from("riomed_stale_stock_rules").select("*")
        .eq("company_id", companyId).order("days_threshold"),
    ]);
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
        whatsappSent: bs.filter((b: any) => ["sent","delivered","read"].includes(b.status)).length,
      },
      showcase: showcase.data ?? [],
      rules: rules.data ?? [],
    };
  });

// ============== Detectar estoque parado ==============
export const detectRiomedStaleStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    days: z.number().int().min(1).max(720).default(90),
    minQty: z.number().min(0).default(1),
    limit: z.number().int().min(1).max(200).default(50),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const companyId = await resolveCompanyId(supabase, userId);
    const { data: rows, error } = await supabase.rpc("riomed_detect_stale_stock", {
      _company_id: companyId,
      _days_threshold: data.days,
      _min_qty: data.minQty,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

// ============== Gerar campanha com IA a partir de estoque parado ==============
export const createRiomedCampaignFromStale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    name: z.string().min(2).max(120),
    goal: z.enum(["destock","launch","seasonal","reactivation","b2b","custom"]).default("destock"),
    channel: z.enum(["whatsapp","showcase","email","b2b","multi"]).default("whatsapp"),
    audience: z.enum(["all","public","b2b","hospital","rental","customer_segment"]).default("all"),
    discountPct: z.number().min(0).max(90).default(15),
    days: z.number().int().min(1).max(720).default(90),
    minQty: z.number().min(0).default(1),
    maxItems: z.number().int().min(1).max(50).default(15),
    tone: z.string().max(120).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const companyId = await resolveCompanyId(supabase, userId);

    // 1. Detect stale
    const { data: stale, error: e1 } = await supabase.rpc("riomed_detect_stale_stock", {
      _company_id: companyId, _days_threshold: data.days, _min_qty: data.minQty, _limit: data.maxItems,
    });
    if (e1) throw new Error(e1.message);
    const items = (stale ?? []) as Array<any>;
    if (!items.length) throw new Error("Nenhum produto parado encontrado com os critérios informados.");

    // 2. Create campaign
    const code = await nextCampaignCode(supabase, companyId);
    const { data: camp, error: e2 } = await supabase.from("riomed_campaigns").insert({
      company_id: companyId, code, name: data.name, goal: data.goal,
      channel: data.channel, audience: data.audience, status: "generating",
      created_by: userId,
      target_filter: { source: "stale_stock", days: data.days, minQty: data.minQty },
    }).select("id").single();
    if (e2) throw new Error(e2.message);
    const campaignId = camp.id;

    // 3. Insert items
    const itemRows = items.map((it, i) => {
      const original = Number(it.unit_price ?? 0);
      const promo = +(original * (1 - data.discountPct / 100)).toFixed(2);
      return {
        company_id: companyId, campaign_id: campaignId,
        product_id: it.product_id, variant_id: it.variant_id,
        original_price: original, discount_pct: data.discountPct, promo_price: promo,
        stock_qty: Number(it.qty ?? 0), position: i,
      };
    });
    await supabase.from("riomed_campaign_items").insert(itemRows);

    // 4. Generate copy with Gemini
    const apiKey = process.env.LOVABLE_API_KEY;
    let headline = data.name;
    let body = `Aproveite descontos especiais de até ${data.discountPct}% em equipamentos médicos selecionados.`;
    let cta = "Solicite seu orçamento agora!";

    if (apiKey) {
      try {
        const productList = items.slice(0, 10)
          .map((it) => `- ${it.product_name} (SKU ${it.sku}, estoque ${it.qty})`).join("\n");
        const prompt = `Crie uma campanha de marketing em português (Brasil) para a Rio Med, distribuidora de equipamentos médicos.
Objetivo: ${data.goal === "destock" ? "Desovar estoque parado" : data.goal}
Canal: ${data.channel}
Público: ${data.audience}
Tom: ${data.tone ?? "profissional, confiável, com senso de urgência sutil"}
Desconto oferecido: ${data.discountPct}%
Produtos em destaque:
${productList}

Responda APENAS um JSON válido no formato exato:
{"headline":"título curto e impactante (até 60 chars)","body":"corpo de mensagem WhatsApp (até 400 chars, usando emojis com moderação)","cta":"call-to-action curto"}`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Você é um copywriter de marketing B2B na área da saúde. Responda sempre JSON válido." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const j = await aiRes.json();
          const content = j?.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content);
          headline = String(parsed.headline ?? headline).slice(0, 200);
          body = String(parsed.body ?? body).slice(0, 1000);
          cta = String(parsed.cta ?? cta).slice(0, 100);
        }
      } catch (e) {
        // fallback to defaults silently
      }
    }

    await supabase.from("riomed_campaigns").update({
      status: "ready",
      copy_headline: headline, copy_body: body, copy_cta: cta,
      metrics: { items_count: items.length, est_value: itemRows.reduce((s, r) => s + Number(r.promo_price) * Number(r.stock_qty), 0) },
    }).eq("id", campaignId);

    return { campaignId, code, itemsCount: items.length, headline, body, cta };
  });

// ============== Atualizar status / agendar campanha ==============
export const updateRiomedCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    campaignId: z.string().uuid(),
    status: z.enum(["draft","ready","scheduled","running","completed","cancelled"]),
    scheduledAt: z.string().datetime().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const patch: any = { status: data.status };
    if (data.status === "scheduled" && data.scheduledAt) patch.scheduled_at = data.scheduledAt;
    if (data.status === "running") patch.sent_at = new Date().toISOString();
    if (data.status === "completed") patch.sent_at = patch.sent_at ?? new Date().toISOString();
    const { error } = await supabase.from("riomed_campaigns").update(patch).eq("id", data.campaignId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============== Enfileirar broadcasts WhatsApp ==============
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
    const { supabase, userId } = context as any;
    const companyId = await resolveCompanyId(supabase, userId);
    const { data: camp } = await supabase
      .from("riomed_campaigns").select("copy_headline,copy_body,copy_cta")
      .eq("id", data.campaignId).maybeSingle();
    if (!camp) throw new Error("Campanha não encontrada.");
    const baseMsg = [camp.copy_headline, camp.copy_body, camp.copy_cta].filter(Boolean).join("\n\n");
    const rows = data.recipients.map((r) => ({
      company_id: companyId, campaign_id: data.campaignId,
      recipient_phone: r.phone, recipient_name: r.name ?? null,
      customer_id: r.customerId ?? null,
      message: r.name ? `Olá ${r.name},\n\n${baseMsg}` : baseMsg,
      status: "queued",
    }));
    const { error } = await supabase.from("riomed_whatsapp_broadcasts").insert(rows);
    if (error) throw new Error(error.message);
    await supabase.from("riomed_campaigns").update({ status: "running" }).eq("id", data.campaignId);
    return { queued: rows.length };
  });

// ============== Listar broadcasts de uma campanha ==============
export const listCampaignBroadcasts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    campaignId: z.string().uuid(), limit: z.number().int().max(500).default(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: rows } = await supabase
      .from("riomed_whatsapp_broadcasts").select("*")
      .eq("campaign_id", data.campaignId)
      .order("created_at", { ascending: false }).limit(data.limit);
    return { rows: rows ?? [] };
  });

// ============== Toggle showcase publish ==============
export const toggleShowcasePublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    showcaseId: z.string().uuid(), isPublished: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("riomed_showcase")
      .update({ is_published: data.isPublished }).eq("id", data.showcaseId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
