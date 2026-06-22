import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Ecosystem Marketplace Cockpit — Fase 80.
 * Listings, requests, quotes, engagements (GMV + Taxa de Intermediação Digital),
 * referrals, reviews e documentos legais do marketplace B2B do ecossistema.
 */
export const getEcosystemMarketplaceHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) => ({ days: Math.max(7, Math.min(180, d?.days ?? 30)) }))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const sinceIso = new Date(Date.now() - data.days * 86400000).toISOString();

    const [lstRes, reqRes, qtRes, engRes, refRes, revRes, ecoRevRes, docRes, accRes] = await Promise.all([
      supabaseAdmin.from("eco_marketplace_listings").select("id, company_id, niche, audience, pricing_model, min_price_cents, max_price_cents, status, visibility, created_at").limit(50000),
      supabaseAdmin.from("eco_marketplace_requests").select("id, requester_company_id, target_niche, budget_cents, nda_required, contract_required, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_marketplace_quotes").select("id, request_id, provider_company_id, amount_cents, delivery_days, status, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_marketplace_engagements").select("id, requester_company_id, provider_company_id, status, gmv_cents, intermediation_fee_cents, intermediation_fee_bps, started_at, completed_at, created_at").gte("created_at", sinceIso).limit(50000),
      supabaseAdmin.from("eco_marketplace_referrals").select("id, referrer_company_id, status, reward_cents, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("eco_marketplace_reviews").select("id, rating, rating_quality, rating_deadline, rating_communication, rating_price, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("ecosystem_reviews").select("id, stars, created_at").gte("created_at", sinceIso).limit(20000),
      supabaseAdmin.from("eco_legal_documents").select("id, kind, niche, audience, version, is_current").limit(2000),
      supabaseAdmin.from("eco_legal_acceptances").select("id, document_kind, document_version, accepted_at").gte("accepted_at", sinceIso).limit(50000),
    ]);

    const err = lstRes.error || reqRes.error || qtRes.error || engRes.error || refRes.error || revRes.error || ecoRevRes.error || docRes.error || accRes.error;
    if (err) throw new Error(err.message);

    const listings = lstRes.data ?? [];
    const requests = reqRes.data ?? [];
    const quotes = qtRes.data ?? [];
    const engagements = engRes.data ?? [];
    const referrals = refRes.data ?? [];
    const reviews = revRes.data ?? [];
    const ecoReviews = ecoRevRes.data ?? [];
    const docs = docRes.data ?? [];
    const acceptances = accRes.data ?? [];

    const cents = (n: number) => Number(n || 0) / 100;

    // Listings
    const lstActive = listings.filter((l) => l.status === "active" || l.status === "ativo").length;
    const lstPublic = listings.filter((l) => l.visibility === "public" || l.visibility === "publico").length;
    const lstNicheMap = new Map<string, number>();
    for (const l of listings) { const k = l.niche || "—"; lstNicheMap.set(k, (lstNicheMap.get(k) ?? 0) + 1); }
    const listingsByNiche = Array.from(lstNicheMap, ([niche, count]) => ({ niche, count })).sort((a, b) => b.count - a.count).slice(0, 12);
    const pricingMap = new Map<string, number>();
    for (const l of listings) { const k = l.pricing_model || "—"; pricingMap.set(k, (pricingMap.get(k) ?? 0) + 1); }
    const pricingModels = Array.from(pricingMap, ([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count);

    // Requests
    const reqStatusMap = new Map<string, number>();
    for (const r of requests) { const k = r.status || "—"; reqStatusMap.set(k, (reqStatusMap.get(k) ?? 0) + 1); }
    const reqStatuses = Array.from(reqStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const reqBudget = requests.reduce((s, r) => s + Number(r.budget_cents || 0), 0);
    const reqNda = requests.filter((r) => r.nda_required).length;
    const reqContract = requests.filter((r) => r.contract_required).length;

    // Quotes
    const qtStatusMap = new Map<string, number>();
    for (const q of quotes) { const k = q.status || "—"; qtStatusMap.set(k, (qtStatusMap.get(k) ?? 0) + 1); }
    const qtStatuses = Array.from(qtStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    const qtTotal = quotes.reduce((s, q) => s + Number(q.amount_cents || 0), 0);
    const qtAvgDelivery = quotes.length ? quotes.reduce((s, q) => s + Number(q.delivery_days || 0), 0) / quotes.length : 0;
    const qtByRequest = new Map<string, number>();
    for (const q of quotes) { const k = q.request_id || "—"; qtByRequest.set(k, (qtByRequest.get(k) ?? 0) + 1); }
    const avgQuotesPerRequest = qtByRequest.size ? Array.from(qtByRequest.values()).reduce((s, n) => s + n, 0) / qtByRequest.size : 0;

    // Engagements (GMV + Taxa de Intermediação Digital)
    const engCompleted = engagements.filter((e) => e.status === "completed" || e.completed_at).length;
    const engInProgress = engagements.filter((e) => e.status === "in_progress" || (e.started_at && !e.completed_at)).length;
    const gmv = engagements.reduce((s, e) => s + Number(e.gmv_cents || 0), 0);
    const feeTotal = engagements.reduce((s, e) => s + Number(e.intermediation_fee_cents || 0), 0);
    const avgFeeBps = engagements.length ? engagements.reduce((s, e) => s + Number(e.intermediation_fee_bps || 0), 0) / engagements.length : 0;
    const completedGmv = engagements.filter((e) => e.completed_at).reduce((s, e) => s + Number(e.gmv_cents || 0), 0);
    const engStatusMap = new Map<string, number>();
    for (const e of engagements) { const k = e.status || "—"; engStatusMap.set(k, (engStatusMap.get(k) ?? 0) + 1); }
    const engStatuses = Array.from(engStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    // Referrals
    const refConverted = referrals.filter((r) => r.status === "converted" || r.status === "completed").length;
    const refReward = referrals.reduce((s, r) => s + Number(r.reward_cents || 0), 0);
    const refStatusMap = new Map<string, number>();
    for (const r of referrals) { const k = r.status || "—"; refStatusMap.set(k, (refStatusMap.get(k) ?? 0) + 1); }
    const refStatuses = Array.from(refStatusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    // Reviews (marketplace)
    const ratingAvg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0;
    const qualityAvg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating_quality || 0), 0) / reviews.length : 0;
    const deadlineAvg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating_deadline || 0), 0) / reviews.length : 0;
    const commAvg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating_communication || 0), 0) / reviews.length : 0;
    const priceAvg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating_price || 0), 0) / reviews.length : 0;
    const ecoStarsAvg = ecoReviews.length ? ecoReviews.reduce((s, r) => s + Number(r.stars || 0), 0) / ecoReviews.length : 0;

    // Legal
    const docsCurrent = docs.filter((d) => d.is_current).length;
    const docKindMap = new Map<string, number>();
    for (const d of docs) { const k = d.kind || "—"; docKindMap.set(k, (docKindMap.get(k) ?? 0) + 1); }
    const docKinds = Array.from(docKindMap, ([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);
    const accKindMap = new Map<string, number>();
    for (const a of acceptances) { const k = a.document_kind || "—"; accKindMap.set(k, (accKindMap.get(k) ?? 0) + 1); }
    const accKinds = Array.from(accKindMap, ([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);

    return {
      window: { days: data.days },
      listings: {
        total: listings.length,
        active: lstActive,
        publicCount: lstPublic,
        byNiche: listingsByNiche,
        pricingModels,
      },
      requests: {
        total: requests.length,
        budget: cents(reqBudget),
        ndaRequired: reqNda,
        contractRequired: reqContract,
        statuses: reqStatuses,
      },
      quotes: {
        total: quotes.length,
        amount: cents(qtTotal),
        avgDeliveryDays: qtAvgDelivery,
        avgPerRequest: avgQuotesPerRequest,
        statuses: qtStatuses,
      },
      engagements: {
        total: engagements.length,
        completed: engCompleted,
        inProgress: engInProgress,
        gmv: cents(gmv),
        completedGmv: cents(completedGmv),
        intermediationFee: cents(feeTotal),
        avgFeeBps,
        statuses: engStatuses,
      },
      referrals: {
        total: referrals.length,
        converted: refConverted,
        reward: cents(refReward),
        statuses: refStatuses,
      },
      reviews: {
        total: reviews.length,
        ratingAvg,
        qualityAvg,
        deadlineAvg,
        communicationAvg: commAvg,
        priceAvg,
        ecoReviews: ecoReviews.length,
        ecoStarsAvg,
      },
      legal: {
        documents: docs.length,
        current: docsCurrent,
        kinds: docKinds,
        acceptances: acceptances.length,
        acceptancesByKind: accKinds,
      },
      generatedAt: new Date().toISOString(),
    };
  });


