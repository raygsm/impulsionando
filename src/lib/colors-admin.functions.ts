import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getColorsCockpit=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const sb:any=context.supabase;const{data:tenant}=await sb.from("communication_tenants").select("id,company_id,settings").eq("slug","colors-saude").maybeSingle();if(!tenant?.id||!tenant?.company_id)throw new Error("Colors tenant missing");
 const since30=new Date(Date.now()-30*86400000).toISOString();const today=new Date();today.setHours(0,0,0,0);const todayIso=today.toISOString();
 const [contacts,opps,tickets,orders,appointments,events,affiliates,channels,workflows,health,queue,iris]=await Promise.all([
  sb.from("colors_contacts").select("id,lifecycle_stage,lead_score,next_best_action",{count:"exact"}),
  sb.from("colors_opportunities").select("id,stage,total_price_cents,utm_source,external_platform,created_at").gte("created_at",since30),
  sb.from("support_tickets").select("id,status,priority,created_at").eq("company_id",tenant.company_id),
  sb.from("sales_orders").select("id,status,total,created_at").eq("company_id",tenant.company_id).gte("created_at",since30),
  sb.from("colors_appointments").select("id,status,starts_at,appointment_type").gte("starts_at",todayIso),
  sb.from("colors_events").select("id,status,starts_at,title").gte("starts_at",todayIso),
  sb.from("colors_affiliates").select("id,status",{count:"exact"}),
  sb.from("communication_channel_endpoints").select("channel,provider,status,last_healthcheck_at,last_error").eq("tenant_id",tenant.id),
  sb.from("n8n_workflow_registry").select("workflow_slug,status,n8n_workflow_id").like("workflow_slug","colors-saude.%"),
  sb.from("imp_monitoring_targets").select("id,label,target,is_active").eq("company_id",tenant.company_id),
  sb.from("colors_event_bus").select("id,status,event_type",{count:"exact"}).in("status",["pending","failed","dead_letter"]),
  sb.from("communication_agent_runtime").select("agent_key,root_agent_id,active,config,capabilities,communication_agents!inner(tenant_id)").eq("agent_key","colors-iris").maybeSingle(),
 ]);
 const opportunities=opps.data??[], orderRows=orders.data??[], ticketRows=tickets.data??[];
 const revenue30=orderRows.filter((o:any)=>["confirmed","processing","fulfilled"].includes(o.status)).reduce((s:number,o:any)=>s+Number(o.total||0),0);
 const stageCounts=opportunities.reduce((a:any,o:any)=>(a[o.stage]=(a[o.stage]||0)+1,a),{});
 const sourceCounts=opportunities.reduce((a:any,o:any)=>(a[o.utm_source||"direto"]=(a[o.utm_source||"direto"]||0)+1,a),{});
 return{generatedAt:new Date().toISOString(),plan:tenant.settings?.plan??"full",contacts:{total:contacts.count??0},funnel:stageCounts,sources:sourceCounts,revenue30,orders:{total30:orderRows.length,status:orderRows.reduce((a:any,o:any)=>(a[o.status]=(a[o.status]||0)+1,a),{})},tickets:{open:ticketRows.filter((t:any)=>!["resolved","closed"].includes(t.status)).length,critical:ticketRows.filter((t:any)=>t.priority==="critical"&&!["resolved","closed"].includes(t.status)).length},appointments:{upcoming:(appointments.data??[]).length,today:(appointments.data??[]).filter((a:any)=>new Date(a.starts_at).toDateString()===new Date().toDateString()).length},events:{upcoming:(events.data??[]).filter((e:any)=>e.status==="published").length},affiliates:{total:affiliates.count??0},channels:channels.data??[],workflows:workflows.data??[],monitoring:health.data??[],eventQueue:{count:queue.count??0,items:queue.data??[]},iris:iris.data??null};
});
