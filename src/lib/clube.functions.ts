import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LEVELS = [
  { code: "explorador", label: "Explorador", min: 0, next: 5 },
  { code: "frequentador", label: "Frequentador", min: 5, next: 20 },
  { code: "entusiasta", label: "Entusiasta", min: 20, next: 50 },
  { code: "embaixador", label: "Embaixador", min: 50, next: 100 },
  { code: "lenda", label: "Lenda do Clube", min: 100, next: null },
] as const;

function levelFromVisits(total: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) if (total >= level.min) current = level;
  return current;
}

async function requireAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Acesso restrito");
}

async function companyNames(sb: any, ids: string[]) {
  if (!ids.length) return new Map<string, any>();
  const { data } = await sb.from("companies_vitrine_public").select("id,name,trade_name,logo_url,public_slug,segment,address_city,address_state").in("id", [...new Set(ids)]);
  return new Map((data ?? []).map((row: any) => [row.id, row]));
}

export const getMyClubeOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const uid = context.userId;
    const [profile, membership, visits, balance, alerts, refs, polls] = await Promise.all([
      sb.from("clube_profiles").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("clube_memberships").select("id,status,billing_cycle,started_at,current_period_end,plan:clube_plans(code,name,monthly_price_cents,points_multiplier)").eq("user_id", uid).in("status", ["trial","active","paused"]).maybeSingle(),
      sb.from("clube_visits").select("id,company_id,created_at,rating,source").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
      sb.from("clube_points_balance").select("balance,lifetime_earned,lifetime_spent").eq("user_id", uid).maybeSingle(),
      sb.from("clube_alerts").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("active", true),
      sb.from("clube_referrals").select("id", { count: "exact", head: true }).eq("referrer_user_id", uid),
      sb.from("clube_polls").select("id,question,options,kind,closes_at").eq("active", true).order("created_at", { ascending: false }).limit(3),
    ]);
    const visitRows = visits.data ?? [];
    const names = await companyNames(sb, visitRows.map((v: any) => v.company_id).filter(Boolean));
    const totalVisits = visitRows.length || Number(profile.data?.total_visits ?? 0);
    const level = levelFromVisits(totalVisits);
    const plan = Array.isArray(membership.data?.plan) ? membership.data.plan[0] : membership.data?.plan;
    const isPremium = membership.data?.status === "active" && ["premium","black"].includes(plan?.code);
    return {
      profile: profile.data ?? null,
      membership: membership.data ? { ...membership.data, plan: plan?.code ?? "free", plan_name: plan?.name, amount_cents: plan?.monthly_price_cents ?? 0 } : null,
      isPremium,
      stats: {
        totalVisits,
        pointsBalance: Number(balance.data?.balance ?? 0),
        cashbackCents: 0,
        savingsCents: Number(profile.data?.total_savings_cents ?? 0),
        alertsActive: alerts.count ?? 0,
        referrals: refs.count ?? 0,
      },
      gamification: {
        level: level.code,
        levelLabel: level.label,
        nextLevelAt: level.next,
        visitsToNext: level.next ? Math.max(0, level.next - totalVisits) : 0,
        progressPct: level.next ? Math.min(100, Math.round((totalVisits / level.next) * 100)) : 100,
      },
      recentVisits: visitRows.slice(0, 8).map((v: any) => ({ id: v.id, when: v.created_at, rating: v.rating, source: v.source, company: v.company_id ? { name: names.get(v.company_id)?.trade_name || names.get(v.company_id)?.name || "Parceiro", logo: names.get(v.company_id)?.logo_url ?? null, slug: names.get(v.company_id)?.public_slug ?? null } : null })),
      polls: polls.data ?? [],
    };
  });

export const updateClubeLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ cep:z.string().max(12).optional(), neighborhood:z.string().max(120).optional(), city:z.string().max(120).optional(), state:z.string().max(2).optional(), lat:z.number().min(-90).max(90).optional(), lng:z.number().min(-180).max(180).optional(), default_radius_km:z.number().int().min(1).max(200).optional() }).parse(d))
  .handler(async ({ data, context }) => { const { error } = await (context.supabase as any).from("clube_profiles").upsert({ user_id:context.userId, ...data, updated_at:new Date().toISOString() }, { onConflict:"user_id" }); if(error) throw new Error(error.message); return { ok:true }; });

export const updateClubeInterests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ interests_tags:z.array(z.string().min(1).max(60)).max(60) }).parse(d))
  .handler(async ({ data, context }) => { const { error } = await (context.supabase as any).from("clube_profiles").upsert({ user_id:context.userId, interests_tags:data.interests_tags, updated_at:new Date().toISOString() }, { onConflict:"user_id" }); if(error) throw new Error(error.message); return { ok:true }; });

export const listMyClubeAlerts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => { const { data,error }=await (context.supabase as any).from("clube_alerts").select("*").eq("user_id",context.userId).order("created_at",{ascending:false}); if(error) throw new Error(error.message); return data??[]; });
export const upsertClubeAlert = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({ kind:z.enum(["food","drink","event","ambience","music","promo"]), tag:z.string().min(1).max(80), channels:z.array(z.enum(["email","whatsapp","push"])).default(["email"]), city:z.string().max(120).optional(), radius_km:z.number().int().min(1).max(200).default(25), active:z.boolean().default(true) }).parse(d)).handler(async({data,context})=>{const {error}=await (context.supabase as any).from("clube_alerts").upsert({user_id:context.userId,...data,updated_at:new Date().toISOString()},{onConflict:"user_id,kind,tag"});if(error)throw new Error(error.message);return{ok:true};});
export const deleteClubeAlert = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({id:z.string().uuid()}).parse(d)).handler(async({data,context})=>{const {error}=await (context.supabase as any).from("clube_alerts").delete().eq("id",data.id).eq("user_id",context.userId);if(error)throw new Error(error.message);return{ok:true};});

export const createClubeVisit = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({company_id:z.string().uuid().optional(),event_id:z.string().uuid().optional(),source:z.enum(["self_checkin","partner_scan","order","reservation"]).default("self_checkin"),rating:z.number().int().min(1).max(5).optional(),notes:z.string().max(500).optional()}).parse(d)).handler(async({data,context})=>{const sb=context.supabase as any;const {data:visit,error}=await sb.from("clube_visits").insert({user_id:context.userId,...data}).select("id").single();if(error)throw new Error(error.message);try{const {supabaseAdmin}=await import("@/integrations/supabase/client.server");await (supabaseAdmin as any).rpc("clube_credit_points",{p_user_id:context.userId,p_company_id:data.company_id??null,p_points:10,p_reason:"Check-in registrado",p_ref_type:"visit",p_ref_id:visit.id,p_kind:"earn",p_metadata:{source:data.source}});}catch{/* visita permanece válida mesmo se bônus falhar */}return{ok:true,pointsAwarded:10};});

export const listMyClubeConsumption = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{const sb=context.supabase as any;const {data,error}=await sb.from("clube_consumption").select("*").eq("user_id",context.userId).order("consumed_at",{ascending:false}).limit(100);if(error)throw new Error(error.message);const names=await companyNames(sb,(data??[]).map((r:any)=>r.company_id).filter(Boolean));return(data??[]).map((r:any)=>({...r,companies:r.company_id?names.get(r.company_id)??null:null}));});
export const recordClubeConsumption = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({company_id:z.string().uuid().optional(),consumed_at:z.string().optional(),total_cents:z.number().int().min(0),payment_method:z.string().max(40).optional(),receipt_url:z.string().url().optional(),items:z.array(z.object({name:z.string().min(1).max(120),qty:z.number().int().min(1).default(1),unit_cents:z.number().int().min(0).default(0)})).default([])}).parse(d)).handler(async({data,context})=>{const {error}=await(context.supabase as any).from("clube_consumption").insert({user_id:context.userId,...data});if(error)throw new Error(error.message);return{ok:true};});

export const getMyReferralInfo = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{const sb=context.supabase as any;const [profile,refs]=await Promise.all([sb.from("clube_profiles").select("referral_code").eq("user_id",context.userId).maybeSingle(),sb.from("clube_referrals").select("*").eq("referrer_user_id",context.userId).order("created_at",{ascending:false}).limit(50)]);if(!profile.data){await sb.from("clube_profiles").insert({user_id:context.userId});const retry=await sb.from("clube_profiles").select("referral_code").eq("user_id",context.userId).single();return{code:retry.data?.referral_code??null,referrals:refs.data??[]};}return{code:profile.data.referral_code??null,referrals:refs.data??[]};});
export const inviteReferral = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({email:z.string().email().optional(),source:z.string().max(60).optional()}).parse(d)).handler(async({data,context})=>{const{error}=await(context.supabase as any).from("clube_referrals").insert({referrer_user_id:context.userId,referred_email:data.email??null,source:data.source??"manual",reward_points:50});if(error)throw new Error(error.message);return{ok:true};});

export const votePoll = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({poll_id:z.string().uuid(),option_id:z.string().min(1).max(80)}).parse(d)).handler(async({data,context})=>{const{error}=await(context.supabase as any).from("clube_poll_votes").upsert({poll_id:data.poll_id,user_id:context.userId,option_id:data.option_id},{onConflict:"poll_id,user_id"});if(error)throw new Error(error.message);return{ok:true};});

export const listClubePartners = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({city:z.string().optional(),segment:z.string().optional(),search:z.string().optional(),limit:z.number().int().min(1).max(120).default(60)}).parse(d??{})).handler(async({data,context})=>{let q=(context.supabase as any).from("companies_vitrine_public").select("id,name,trade_name,segment,logo_url,public_slug,address_city,address_state,website").limit(data.limit);if(data.city)q=q.ilike("address_city",`%${data.city}%`);if(data.segment)q=q.eq("segment",data.segment);if(data.search)q=q.or(`name.ilike.%${data.search}%,trade_name.ilike.%${data.search}%`);const{data:rows,error}=await q;if(error)throw new Error(error.message);return rows??[];});

export const listMyClubeReceipts = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({kind:z.enum(["pix","consumption","manual","all"]).default("all"),status:z.enum(["available","pending_upload","all"]).default("all"),from:z.string().optional(),to:z.string().optional(),search:z.string().max(120).optional()}).parse(d??{})).handler(async({data,context})=>{let q=(context.supabase as any).from("clube_receipts").select("*").eq("user_id",context.userId).order("issued_at",{ascending:false}).limit(200);if(data.kind!=="all")q=q.eq("kind",data.kind);if(data.status!=="all")q=q.eq("status",data.status);if(data.from)q=q.gte("issued_at",data.from);if(data.to)q=q.lte("issued_at",data.to);if(data.search)q=q.ilike("title",`%${data.search}%`);const{data:rows,error}=await q;if(error)throw new Error(error.message);return rows??[];});

export const getClubeRecommendations = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{const sb=context.supabase as any;const{data:profile}=await sb.from("clube_profiles").select("interests_tags,city,state").eq("user_id",context.userId).maybeSingle();const tags:string[]=profile?.interests_tags??[];let q=sb.from("companies_vitrine_public").select("id,name,trade_name,segment,logo_url,public_slug,address_city,address_state,website").limit(60);if(profile?.city)q=q.ilike("address_city",`%${profile.city}%`);const{data:rows,error}=await q;if(error)throw new Error(error.message);const scored=(rows??[]).map((c:any)=>{const hay=`${c.segment??""} ${c.trade_name??""} ${c.name??""}`.toLowerCase();return{...c,score:tags.reduce((acc,t)=>hay.includes(t.toLowerCase())?acc+1:acc,0)}}).sort((a:any,b:any)=>b.score-a.score);return{interests:tags,items:scored.slice(0,12)};});

export const getAdminClubeOverview = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{await requireAdmin(context);const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const sb=supabaseAdmin as any;const since=new Date(Date.now()-30*86400_000).toISOString();const[members,memberships,visits,refs,alerts,recent,plans]=await Promise.all([sb.from("clube_profiles").select("user_id",{count:"exact",head:true}),sb.from("clube_memberships").select("user_id,plan_id,status").eq("status","active"),sb.from("clube_visits").select("company_id").gte("created_at",since),sb.from("clube_referrals").select("id",{count:"exact",head:true}),sb.from("clube_alerts").select("id",{count:"exact",head:true}).eq("active",true),sb.from("clube_profiles").select("user_id,full_name,city,state,current_level,created_at").order("created_at",{ascending:false}).limit(8),sb.from("clube_plans").select("id,code,monthly_price_cents")]);const planMap=new Map((plans.data??[]).map((p:any)=>[p.id,p]));let premiumActive=0,mrrCents=0;for(const m of memberships.data??[]){const p:any=planMap.get(m.plan_id);if(p&&["premium","black"].includes(p.code)){premiumActive++;mrrCents+=Number(p.monthly_price_cents??0)}}const ids=(visits.data??[]).map((v:any)=>v.company_id).filter(Boolean);const names=await companyNames(sb,ids);const counts=new Map<string,{name:string,total:number}>();for(const v of visits.data??[]){if(!v.company_id)continue;const cur=counts.get(v.company_id)??{name:names.get(v.company_id)?.trade_name||names.get(v.company_id)?.name||"Parceiro",total:0};cur.total++;counts.set(v.company_id,cur)}return{kpis:{totalMembers:members.count??0,premiumActive,visits30d:(visits.data??[]).length,referrals:refs.count??0,activeAlerts:alerts.count??0,mrrCents},topPartners:[...counts.values()].sort((a,b)=>b.total-a.total).slice(0,8),recentSignups:recent.data??[]};});

export const listJourneySteps = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{await requireAdmin(context);const{data,error}=await(context.supabase as any).from("clube_journey_steps").select("*").order("day_offset",{ascending:true});if(error)throw new Error(error.message);return data??[];});
export const upsertJourneyStep = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({id:z.string().uuid().optional(),day_offset:z.number().int().min(0).max(60),channel:z.enum(["email","whatsapp","in_app"]),audience:z.enum(["free","premium","black","all"]),event_code:z.string().min(2).max(80),subject:z.string().max(200).nullable().optional(),body:z.string().min(2).max(2000),active:z.boolean().default(true)}).parse(d)).handler(async({data,context})=>{await requireAdmin(context);const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const{error}=await(supabaseAdmin as any).from("clube_journey_steps").upsert({...data,updated_at:new Date().toISOString()});if(error)throw new Error(error.message);return{ok:true};});
export const deleteJourneyStep = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({id:z.string().uuid()}).parse(d)).handler(async({data,context})=>{await requireAdmin(context);const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const{error}=await(supabaseAdmin as any).from("clube_journey_steps").delete().eq("id",data.id);if(error)throw new Error(error.message);return{ok:true};});

export const listAdminPolls = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{await requireAdmin(context);const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const sb=supabaseAdmin as any;const{data,error}=await sb.from("clube_polls").select("*").order("created_at",{ascending:false});if(error)throw new Error(error.message);const names=await companyNames(sb,(data??[]).map((p:any)=>p.company_id).filter(Boolean));return(data??[]).map((p:any)=>({...p,companies:p.company_id?names.get(p.company_id)??null:null}));});
export const setPollActive = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({id:z.string().uuid(),active:z.boolean()}).parse(d)).handler(async({data,context})=>{await requireAdmin(context);const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const{error}=await(supabaseAdmin as any).from("clube_polls").update({active:data.active}).eq("id",data.id);if(error)throw new Error(error.message);return{ok:true};});

export const listClubeCronRuns = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{await requireAdmin(context);const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const{data,error}=await(supabaseAdmin as any).from("clube_cron_runs").select("*").order("started_at",{ascending:false}).limit(100);if(error)throw new Error(error.message);return data??[];});
export const getJourneyLogAudit = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({step_id:z.string().uuid().optional(),channel:z.enum(["all","email","whatsapp","in_app"]).default("all"),audience:z.enum(["all","free","premium","black"]).default("all"),active:z.enum(["all","on","off"]).default("all"),from:z.string().optional(),to:z.string().optional(),search:z.string().optional()}).parse(d??{})).handler(async({data,context})=>{await requireAdmin(context);const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const sb=supabaseAdmin as any;let q=sb.from("clube_journey_steps").select("*").order("day_offset",{ascending:true});if(data.channel!=="all")q=q.eq("channel",data.channel);if(data.audience!=="all")q=q.eq("audience",data.audience);if(data.active==="on")q=q.eq("active",true);if(data.active==="off")q=q.eq("active",false);if(data.step_id)q=q.eq("id",data.step_id);const{data:steps,error}=await q;if(error)throw new Error(error.message);const stepIds=(steps??[]).map((s:any)=>s.id);let logs:any[]=[];if(stepIds.length){let lq=sb.from("clube_journey_log").select("step_id,user_id,status,enqueued_at,dedupe_key").in("step_id",stepIds);if(data.from)lq=lq.gte("enqueued_at",data.from);if(data.to)lq=lq.lte("enqueued_at",data.to);const lr=await lq;logs=lr.data??[]}const perStep=(steps??[]).map((s:any)=>{const ls=logs.filter((l:any)=>l.step_id===s.id);return{...s,total:ls.length,unique_users:new Set(ls.map((l:any)=>l.user_id).filter(Boolean)).size,duplicates_blocked:0,last_enqueued_at:ls.map((l:any)=>l.enqueued_at).sort().at(-1)??null}});return{totalQueued:logs.length,uniqueUsers:new Set(logs.map((l:any)=>l.user_id).filter(Boolean)).size,duplicatesBlocked:0,perStep};});
