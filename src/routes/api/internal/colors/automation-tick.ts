import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dispatchN8nByEvent } from "@/lib/n8n-dispatch-by-event.server";

function safeEqual(a:string,b:string){try{const aa=Buffer.from(a);const bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}catch{return false;}}
function authorized(request:Request){const expected=process.env.IMPULSIONANDO_WEBHOOK_SECRET??"";const supplied=request.headers.get("x-core-secret")??"";return !!expected&&!!supplied&&safeEqual(expected,supplied);}
async function emit(eventId:string,eventType:string,aggregateType:string,aggregateId:string,payload:Record<string,unknown>){await(supabaseAdmin as any).from("colors_event_bus").upsert({event_id:eventId,event_type:eventType,aggregate_type:aggregateType,aggregate_id:aggregateId,payload,status:"pending",next_retry_at:null},{onConflict:"event_id",ignoreDuplicates:true});}

async function markCheckoutAbandonment(){
  const cutoff=new Date(Date.now()-30*60*1000).toISOString();
  const {data:rows}=await(supabaseAdmin as any).from("colors_opportunities").select("id,colors_checkout_id,contact_id,affiliate_id,product_slug,external_platform,created_at").eq("stage","checkout_iniciado").lt("created_at",cutoff).limit(100);
  let changed=0;
  for(const row of rows??[]){const now=new Date().toISOString();const {data:updated,error}=await(supabaseAdmin as any).from("colors_opportunities").update({stage:"checkout_abandonado",abandonment_reason:"timeout_without_conversion_signal",next_best_action:"RECOVER_CHECKOUT",recovery_next_at:new Date(Date.now()+15*60*1000).toISOString(),updated_at:now}).eq("id",row.id).eq("stage","checkout_iniciado").select("id").maybeSingle();if(error||!updated?.id)continue;changed++;await emit(`checkout-abandoned:${row.id}`,"CHECKOUT_ABANDONED","opportunity",row.id,{opportunity_id:row.id,colors_checkout_id:row.colors_checkout_id,contact_id:row.contact_id,affiliate_id:row.affiliate_id,product_slug:row.product_slug,platform:row.external_platform,abandoned_at:now});}
  return changed;
}

async function appointmentReminders(){
  const now=Date.now();const horizon=new Date(now+25*60*60*1000).toISOString();const {data:rows}=await(supabaseAdmin as any).from("colors_appointments").select("id,contact_id,starts_at,status,appointment_type,metadata").in("status",["requested","scheduled","confirmed"]).gte("starts_at",new Date(now).toISOString()).lte("starts_at",horizon).limit(200);let emitted=0;
  for(const row of rows??[]){const delta=new Date(row.starts_at).getTime()-now;if(delta>23*60*60*1000&&delta<=25*60*60*1000){await emit(`appointment-reminder-24h:${row.id}:${String(row.starts_at).slice(0,16)}`,"APPOINTMENT_REMINDER_24H","appointment",row.id,{appointment_id:row.id,contact_id:row.contact_id,starts_at:row.starts_at,appointment_type:row.appointment_type,protocol:row.metadata?.protocol??null});emitted++;}if(delta>30*60*1000&&delta<=70*60*1000){await emit(`appointment-reminder-1h:${row.id}:${String(row.starts_at).slice(0,16)}`,"APPOINTMENT_REMINDER_1H","appointment",row.id,{appointment_id:row.id,contact_id:row.contact_id,starts_at:row.starts_at,appointment_type:row.appointment_type,protocol:row.metadata?.protocol??null});emitted++;}}
  return emitted;
}

async function eventReminders(){
  const now=Date.now();const horizon=new Date(now+25*60*60*1000).toISOString();const {data:events}=await(supabaseAdmin as any).from("colors_events").select("id,title,starts_at,venue_name,city,state").eq("status","published").gte("starts_at",new Date(now).toISOString()).lte("starts_at",horizon).limit(50);let emitted=0;
  for(const ev of events??[]){const delta=new Date(ev.starts_at).getTime()-now;const {data:regs}=await(supabaseAdmin as any).from("colors_event_registrations").select("id,contact_id,status,email,whatsapp").eq("event_id",ev.id).in("status",["registered","confirmed"]).limit(1000);for(const reg of regs??[]){if(delta>23*60*60*1000&&delta<=25*60*60*1000){await emit(`event-reminder-24h:${reg.id}:${String(ev.starts_at).slice(0,16)}`,"EVENT_REMINDER_24H","event_registration",reg.id,{registration_id:reg.id,event_id:ev.id,event_name:ev.title,contact_id:reg.contact_id,starts_at:ev.starts_at,location:[ev.venue_name,ev.city,ev.state].filter(Boolean).join(" · ")});emitted++;}if(delta>90*60*1000&&delta<=150*60*1000){await emit(`event-reminder-2h:${reg.id}:${String(ev.starts_at).slice(0,16)}`,"EVENT_REMINDER_2H","event_registration",reg.id,{registration_id:reg.id,event_id:ev.id,event_name:ev.title,contact_id:reg.contact_id,starts_at:ev.starts_at,location:[ev.venue_name,ev.city,ev.state].filter(Boolean).join(" · ")});emitted++;}}}
  return emitted;
}

async function dispatchPending(){
  const due=new Date().toISOString();const {data:rows}=await(supabaseAdmin as any).from("colors_event_bus").select("id,event_id,event_type,aggregate_type,aggregate_id,payload,status,attempts").in("status",["pending","failed"]).or(`next_retry_at.is.null,next_retry_at.lte.${due}`).order("created_at",{ascending:true}).limit(40);let processed=0,waiting=0,failed=0;
  for(const row of rows??[]){await(supabaseAdmin as any).from("colors_event_bus").update({status:"processing"}).eq("id",row.id).in("status",["pending","failed"]);const result=await dispatchN8nByEvent(row.event_type,{...row.payload,event_id:row.event_id,aggregate_type:row.aggregate_type,aggregate_id:row.aggregate_id},null,"colors-saude").catch((e:any)=>({ok:false,error:e?.message??"dispatch_exception"}));
    if(result.ok&&!result.skipped){await(supabaseAdmin as any).from("colors_event_bus").update({status:"processed",processed_at:new Date().toISOString(),last_error:null}).eq("id",row.id);processed++;continue;}
    if(result.skipped&&(result.error==="inactive"||result.error==="no_webhook_verified")){await(supabaseAdmin as any).from("colors_event_bus").update({status:"pending",next_retry_at:new Date(Date.now()+60*60*1000).toISOString(),last_error:result.error}).eq("id",row.id);waiting++;continue;}
    const attempts=(row.attempts??0)+1;const dead=attempts>=8;await(supabaseAdmin as any).from("colors_event_bus").update({status:dead?"dead_letter":"failed",attempts,last_error:result.error??"dispatch_failed",next_retry_at:dead?null:new Date(Date.now()+Math.min(3600,Math.pow(2,attempts)*60)*1000).toISOString()}).eq("id",row.id);failed++;
  }
  return{processed,waiting,failed};
}

export const Route=createFileRoute("/api/internal/colors/automation-tick")({server:{handlers:{POST:async({request})=>{if(!authorized(request))return new Response("unauthorized",{status:401});const checkout=await markCheckoutAbandonment();const appointments=await appointmentReminders();const events=await eventReminders();const dispatch=await dispatchPending();return Response.json({ok:true,checkout_abandoned:checkout,appointment_reminders:appointments,event_reminders:events,dispatch});}}}});
