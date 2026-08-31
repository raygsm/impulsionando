import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getPublicVitrine = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ segment:z.string().optional(), q:z.string().optional(), sort:z.enum(["recent","name","rating"]).default("name"), limit:z.number().int().min(1).max(200).default(120) }).parse(d ?? {}))
  .handler(async ({ data }) => {
    try {
      const { loadActiveVitrineTeasers } = await import("@/lib/vitrine-active-tenants.server");
      const { filterVitrineTeasers } = await import("@/lib/vitrine-active-tenants");
      const teasers = filterVitrineTeasers(await loadActiveVitrineTeasers(), {
        segment: data.segment,
        q: data.q,
        limit: data.limit,
      });
      if (data.sort === "rating") {
        teasers.sort((a, b) => Number(b.rating_avg ?? 0) - Number(a.rating_avg ?? 0) || (a.trade_name || a.name).localeCompare(b.trade_name || b.name, "pt-BR"));
      }
      return { companies: teasers };
    } catch (error) {
      const sb = publicClient();
      let query = sb.from("companies_vitrine_teaser_public").select("id,name,trade_name,segment,tagline,description,public_slug").limit(data.limit);
      if (data.segment) query = query.eq("segment", data.segment);
      if (data.q) { const term=`%${data.q}%`; query=query.or(`name.ilike.${term},trade_name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`); }
      query=query.order("name",{ascending:true});
      const { data: rows, error: viewError }=await query;
      if(viewError) return {companies:[],error:viewError.message};
      return {companies:rows??[], error: error instanceof Error ? error.message : undefined};
    }
  });

export const getClubCompanyBySlug = createServerFn({ method:"GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d:unknown)=>z.object({slug:z.string().min(1)}).parse(d))
  .handler(async({data,context})=>{
    const sb=context.supabase as any;
    const {data:row,error}=await sb.from("companies_vitrine_public").select("*").eq("public_slug",data.slug).maybeSingle();
    if(error)throw new Error(error.message);
    if(row) {
      const {data:reviews}=await sb.from("ecosystem_reviews").select("id,stars,comment,created_at").eq("company_id",row.id).order("created_at",{ascending:false}).limit(20);
      return{company:row,reviews:reviews??[]};
    }
    try {
      const { loadActiveVitrineTeasers } = await import("@/lib/vitrine-active-tenants.server");
      const teaser = (await loadActiveVitrineTeasers()).find((item) => item.public_slug === data.slug || item.subdomain === data.slug);
      if (!teaser) throw new Error("Empresa não encontrada");
      const {data:reviews}=await sb.from("ecosystem_reviews").select("id,stars,comment,created_at").eq("company_id",teaser.id).order("created_at",{ascending:false}).limit(20);
      return { company: teaser, reviews: reviews ?? [] };
    } catch (fallbackError) {
      if (fallbackError instanceof Error && fallbackError.message === "Empresa não encontrada") throw fallbackError;
      throw new Error("Empresa não encontrada");
    }
  });

export const submitCompanyReview = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({company_id:z.string().uuid(),stars:z.number().int().min(1).max(5),comment:z.string().max(1000).optional()}).parse(d)).handler(async({data,context})=>{const{error}=await(context.supabase as any).from("ecosystem_reviews").upsert({company_id:data.company_id,user_id:context.userId,stars:data.stars,comment:data.comment??null},{onConflict:"company_id,user_id"});if(error)throw new Error(error.message);return{ok:true};});
export const getMyReviewForCompany = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({company_id:z.string().uuid()}).parse(d)).handler(async({data,context})=>{const{data:row}=await(context.supabase as any).from("ecosystem_reviews").select("id,stars,comment,created_at,updated_at").eq("company_id",data.company_id).eq("user_id",context.userId).maybeSingle();return{review:row??null};});
export const deleteCompanyReview = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({company_id:z.string().uuid()}).parse(d)).handler(async({data,context})=>{const{error}=await(context.supabase as any).from("ecosystem_reviews").delete().eq("company_id",data.company_id).eq("user_id",context.userId);if(error)throw new Error(error.message);return{ok:true};});

export const getMyConsumerArea = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const sb=context.supabase as any;const uid=context.userId;
  const[profile,membership,invoices,favorites]=await Promise.all([
    sb.from("clube_profiles").select("*").eq("user_id",uid).maybeSingle(),
    sb.from("clube_memberships").select("id,status,billing_cycle,started_at,current_period_end,canceled_at,plan:clube_plans(code,name,monthly_price_cents)").eq("user_id",uid).in("status",["trial","active","paused"]).maybeSingle(),
    sb.from("clube_membership_invoices").select("*").eq("user_id",uid).order("due_date",{ascending:false}).limit(12),
    sb.from("clube_favorites").select("company_id").eq("user_id",uid),
  ]);
  const plan=Array.isArray(membership.data?.plan)?membership.data.plan[0]:membership.data?.plan;
  const ids=(favorites.data??[]).map((r:any)=>r.company_id);let favoriteCompanies:any[]=[];
  if(ids.length){const res=await sb.from("companies_vitrine_public").select("id,name,trade_name,logo_url,segment,public_slug,website").in("id",ids);favoriteCompanies=res.data??[];}
  return{profile:profile.data??null,membership:membership.data?{...membership.data,plan:plan?.code??"free",plan_name:plan?.name,amount_cents:plan?.monthly_price_cents??0}:null,invoices:invoices.data??[],favorites:favoriteCompanies};
});

export const upsertConsumerProfile = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({full_name:z.string().min(2).max(120),phone:z.string().optional(),whatsapp:z.string().optional(),city:z.string().optional(),state:z.string().optional(),birthdate:z.string().optional(),marketing_optin:z.boolean().optional()}).parse(d)).handler(async({data,context})=>{const{error}=await(context.supabase as any).from("clube_profiles").upsert({user_id:context.userId,...data,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(error)throw new Error(error.message);return{ok:true};});

function nextDueDay5(now=new Date()){
  const y=now.getUTCFullYear();const m=now.getUTCMonth();
  const current=new Date(Date.UTC(y,m,5,3,0,0));
  const target=now<current?current:new Date(Date.UTC(y,m+1,5,3,0,0));
  return target.toISOString().slice(0,10);
}

export const upgradeToPremium = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const sb=context.supabase as any;const uid=context.userId;
  const{data:plan,error:planErr}=await sb.from("clube_plans").select("id,code,monthly_price_cents").eq("code","premium").eq("is_active",true).single();if(planErr||!plan)throw new Error("Plano Premium indisponível");
  const now=new Date();const end=new Date(now);end.setUTCMonth(end.getUTCMonth()+1);
  const existing=await sb.from("clube_memberships").select("id").eq("user_id",uid).in("status",["trial","active","paused"]).maybeSingle();
  let membershipId=existing.data?.id;
  if(membershipId){const{error}=await sb.from("clube_memberships").update({plan_id:plan.id,status:"paused",billing_cycle:"monthly",current_period_end:end.toISOString(),metadata:{payment_pending:true},updated_at:now.toISOString()}).eq("id",membershipId);if(error)throw new Error(error.message);}else{const ins=await sb.from("clube_memberships").insert({user_id:uid,plan_id:plan.id,status:"paused",billing_cycle:"monthly",source:"self",started_at:now.toISOString(),current_period_end:end.toISOString(),metadata:{payment_pending:true}}).select("id").single();if(ins.error)throw new Error(ins.error.message);membershipId=ins.data.id;}
  const due=nextDueDay5(now);const inv=await sb.from("clube_membership_invoices").insert({membership_id:membershipId,user_id:uid,period_start:now.toISOString().slice(0,10),period_end:end.toISOString().slice(0,10),due_date:due,amount_cents:plan.monthly_price_cents,status:"open",payment_provider:"mercado_pago"}).select("id,amount_cents").single();if(inv.error)throw new Error(inv.error.message);
  return{membership_id:membershipId,invoice_id:inv.data.id,amount_cents:inv.data.amount_cents};
});

export const cancelPremium = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async({context})=>{const{error}=await(context.supabase as any).from("clube_memberships").update({status:"canceled",canceled_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("user_id",context.userId).in("status",["trial","active","paused"]);if(error)throw new Error(error.message);return{ok:true};});

export const toggleFavorite = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({company_id:z.string().uuid()}).parse(d)).handler(async({data,context})=>{const sb=context.supabase as any;const existing=await sb.from("clube_favorites").select("id").eq("user_id",context.userId).eq("company_id",data.company_id).maybeSingle();if(existing.data){await sb.from("clube_favorites").delete().eq("id",existing.data.id);return{favored:false};}const{error}=await sb.from("clube_favorites").insert({user_id:context.userId,company_id:data.company_id});if(error)throw new Error(error.message);return{favored:true};});

export const getConsumerPremiumOverview = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{const{data:isAdmin}=await(context.supabase as any).rpc("has_role",{_user_id:context.userId,_role:"admin"});if(!isAdmin)throw new Error("Acesso restrito");const{supabaseAdmin}=await import("@/integrations/supabase/client.server");const sb=supabaseAdmin as any;const[profiles,memberships,invoices,plans]=await Promise.all([sb.from("clube_profiles").select("user_id",{count:"exact",head:true}),sb.from("clube_memberships").select("plan_id,status"),sb.from("clube_membership_invoices").select("amount_cents,status,paid_at"),sb.from("clube_plans").select("id,code,monthly_price_cents")]);const map=new Map((plans.data??[]).map((p:any)=>[p.id,p]));let premiumActive=0,premiumPending=0,mrr=0;for(const m of memberships.data??[]){const p:any=map.get(m.plan_id);if(!p||!["premium","black"].includes(p.code))continue;if(m.status==="active"){premiumActive++;mrr+=p.monthly_price_cents}else if(m.status==="paused")premiumPending++;}const inv=invoices.data??[];const cutoff=Date.now()-30*86400_000;return{total_consumers:profiles.count??0,premium_active:premiumActive,premium_pending:premiumPending,premium_past_due:0,mrr_cents:mrr,invoices_open:inv.filter((i:any)=>i.status==="open").length,invoices_paid_30d:inv.filter((i:any)=>i.status==="paid"&&i.paid_at&&new Date(i.paid_at).getTime()>=cutoff).length,revenue_30d_cents:inv.filter((i:any)=>i.status==="paid"&&i.paid_at&&new Date(i.paid_at).getTime()>=cutoff).reduce((s:number,i:any)=>s+Number(i.amount_cents??0),0)};});
