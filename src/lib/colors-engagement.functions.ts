import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const touchSchema = z.object({
  sourceChannel: z.string().max(60).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(160).optional(),
  utmContent: z.string().max(160).optional(),
  utmTerm: z.string().max(160).optional(),
});
const appointmentSchema = touchSchema.extend({
  fullName:z.string().trim().min(2).max(120), email:z.string().trim().email().max(255), whatsapp:z.string().trim().min(8).max(30),
  audience:z.enum(["customer","lead","affiliate","affiliate_candidate","partner","other"]),
  appointmentType:z.enum(["customer_call","sales_call","affiliate_manager_call","support_call","partnership_call","other"]),
  startsAt:z.string().datetime(), endsAt:z.string().datetime(), notes:z.string().max(1200).optional(), consentLgpd:z.literal(true),
});
const eventRegistrationSchema = touchSchema.extend({
  eventId:z.string().uuid(), fullName:z.string().trim().min(2).max(120), email:z.string().trim().email().max(255), whatsapp:z.string().trim().min(8).max(30),
  affiliateCode:z.string().trim().max(80).optional(), consentLgpd:z.literal(true), consentMarketing:z.boolean().default(false),
});
const supportSchema = touchSchema.extend({
  fullName:z.string().trim().min(2).max(120), email:z.string().trim().email().max(255).optional(), whatsapp:z.string().trim().min(8).max(30),
  category:z.enum(["pedido","rastreio","pagamento","produto","troca_devolucao","afiliado","evento","outro"]),
  subject:z.string().trim().min(3).max(160), description:z.string().trim().min(10).max(4000), consentLgpd:z.literal(true),
});

function normEmail(v?:string){return v?v.trim().toLowerCase():null;}
function normPhone(v?:string){return v?v.replace(/\D/g,""):null;}
function protocol(prefix="COL"){const id=globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;return `${prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${id.slice(0,8).toUpperCase()}`;}
async function identity(sb:any){
  const {data,error}=await sb.from("communication_tenants").select("id,company_id").eq("slug","colors-saude").maybeSingle();
  if(error||!data?.id||!data?.company_id)throw new Error("Colors tenant/company not configured");
  return {tenantId:data.id as string,companyId:data.company_id as string};
}

async function ensureContact(sb:any,data:{fullName:string;email?:string;whatsapp:string;consentLgpd:boolean;touch?:any}){
  const emailN=normEmail(data.email), phoneN=normPhone(data.whatsapp), ids=await identity(sb);
  let local:any=null;
  if(emailN)({data:local}=await sb.from("colors_contacts").select("id,communication_contact_id").eq("email_normalized",emailN).maybeSingle());
  if(!local&&phoneN)({data:local}=await sb.from("colors_contacts").select("id,communication_contact_id").eq("whatsapp_normalized",phoneN).maybeSingle());

  let coreId=local?.communication_contact_id??null;
  if(!coreId){
    let core:any=null;
    if(emailN)({data:core}=await sb.from("communication_contacts").select("id").eq("tenant_id",ids.tenantId).eq("attributes->>email_normalized",emailN).is("merged_into_contact_id",null).maybeSingle());
    if(!core&&phoneN)({data:core}=await sb.from("communication_contacts").select("id").eq("tenant_id",ids.tenantId).eq("attributes->>whatsapp_normalized",phoneN).is("merged_into_contact_id",null).maybeSingle());
    if(core?.id) coreId=core.id;
    else {
      const {data:created,error}=await sb.from("communication_contacts").insert({tenant_id:ids.tenantId,display_name:data.fullName,locale:"pt-BR",timezone:"America/Sao_Paulo",attributes:{email:data.email??null,email_normalized:emailN,whatsapp:data.whatsapp,whatsapp_normalized:phoneN,brand:"colors_saude",source:data.touch?.source_channel??data.touch?.sourceChannel??"colors_site"}}).select("id").single();
      if(error)throw new Error(`communication contact: ${error.message}`); coreId=created.id;
    }
  }

  const payload={full_name:data.fullName,email:data.email??null,whatsapp:data.whatsapp,consent_lgpd:data.consentLgpd,consent_timestamp:new Date().toISOString(),consent_source:data.touch?.source_channel??data.touch?.sourceChannel??"colors_site",last_touch:data.touch??{},last_seen_at:new Date().toISOString(),communication_contact_id:coreId};
  let localId=local?.id??null;
  if(localId){const {error}=await sb.from("colors_contacts").update(payload).eq("id",localId);if(error)throw new Error(error.message);}
  else {const {data:inserted,error}=await sb.from("colors_contacts").insert(payload).select("id").single();if(error)throw new Error(error.message);localId=inserted.id;}
  return {localId:localId as string,coreId:coreId as string,companyId:ids.companyId,tenantId:ids.tenantId};
}

export const createColorsAppointment=createServerFn({method:"POST"}).inputValidator((raw:unknown)=>appointmentSchema.parse(raw)).handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const sb:any=supabaseAdmin;
  const start=new Date(data.startsAt),end=new Date(data.endsAt);if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start)throw new Error("Invalid appointment interval");
  if(start.getTime()<Date.now())throw new Error("Appointment must be in the future");
  const touch={source_channel:data.sourceChannel,utm_source:data.utmSource,utm_medium:data.utmMedium,utm_campaign:data.utmCampaign,utm_content:data.utmContent,utm_term:data.utmTerm};
  const contact=await ensureContact(sb,{fullName:data.fullName,email:data.email,whatsapp:data.whatsapp,consentLgpd:true,touch});
  const {count}=await sb.from("colors_appointments").select("id",{count:"exact",head:true}).in("status",["requested","scheduled","confirmed"]).lt("starts_at",end.toISOString()).gt("ends_at",start.toISOString());
  if((count??0)>0)throw new Error("Selected slot unavailable");
  const code=protocol("COL-CALL");
  const {data:row,error}=await sb.from("colors_appointments").insert({contact_id:contact.localId,audience:data.audience,appointment_type:data.appointmentType,status:"requested",starts_at:data.startsAt,ends_at:data.endsAt,source_channel:data.sourceChannel??"site",utm_source:data.utmSource,utm_medium:data.utmMedium,utm_campaign:data.utmCampaign,utm_content:data.utmContent,utm_term:data.utmTerm,notes:data.notes??null,metadata:{protocol:code,communication_contact_id:contact.coreId}}).select("id").single();
  if(error)throw new Error(error.message);
  await sb.from("colors_event_bus").insert({event_id:`appointment:${row.id}`,event_type:"APPOINTMENT_REQUESTED",aggregate_type:"appointment",aggregate_id:row.id,payload:{appointment_id:row.id,contact_id:contact.localId,communication_contact_id:contact.coreId,protocol:code}});
  return {ok:true,appointmentId:row.id,protocol:code};
});

export const listPublishedColorsEvents=createServerFn({method:"GET"}).handler(async()=>{const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const {data,error}=await(supabaseAdmin as any).from("colors_events").select("id,slug,title,description,starts_at,ends_at,venue_name,city,state,is_free,capacity,hero_image_url,seo_title,seo_description,registration_opens_at,registration_closes_at").eq("status","published").gte("starts_at",new Date(Date.now()-86400000).toISOString()).order("starts_at");if(error)throw new Error(error.message);return data??[];});

export const registerColorsEvent=createServerFn({method:"POST"}).inputValidator((raw:unknown)=>eventRegistrationSchema.parse(raw)).handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const sb:any=supabaseAdmin;const now=new Date();
  const {data:event,error:eventErr}=await sb.from("colors_events").select("id,status,capacity,registration_opens_at,registration_closes_at").eq("id",data.eventId).maybeSingle();
  if(eventErr||!event||event.status!=="published")throw new Error("Event unavailable");
  if(event.registration_opens_at&&now<new Date(event.registration_opens_at))throw new Error("Registration not open");
  if(event.registration_closes_at&&now>new Date(event.registration_closes_at))throw new Error("Registration closed");
  const emailN=normEmail(data.email);
  const {data:dup}=await sb.from("colors_event_registrations").select("id,status").eq("event_id",data.eventId).ilike("email",emailN).maybeSingle();
  if(dup?.id&&dup.status!=="canceled")return {ok:true,registrationId:dup.id,existing:true};
  let status="registered";
  if(event.capacity){const {count}=await sb.from("colors_event_registrations").select("id",{count:"exact",head:true}).eq("event_id",data.eventId).in("status",["registered","confirmed","checked_in"]);if((count??0)>=event.capacity)status="waitlist";}
  const touch={source_channel:data.sourceChannel,utm_source:data.utmSource,utm_medium:data.utmMedium,utm_campaign:data.utmCampaign,utm_content:data.utmContent,utm_term:data.utmTerm};
  const contact=await ensureContact(sb,{fullName:data.fullName,email:data.email,whatsapp:data.whatsapp,consentLgpd:true,touch});
  const {data:row,error}=await sb.from("colors_event_registrations").insert({event_id:data.eventId,contact_id:contact.localId,full_name:data.fullName,email:data.email,whatsapp:data.whatsapp,affiliate_code:data.affiliateCode??null,consent_lgpd:true,consent_marketing:data.consentMarketing,status,...touch,metadata:{communication_contact_id:contact.coreId,protocol:protocol("COL-EVT")}}).select("id,status,metadata").single();
  if(error)throw new Error(error.message);
  await sb.from("colors_event_bus").insert({event_id:`event-registration:${row.id}`,event_type:"EVENT_REGISTRATION_CREATED",aggregate_type:"event_registration",aggregate_id:row.id,payload:{registration_id:row.id,event_id:data.eventId,contact_id:contact.localId,communication_contact_id:contact.coreId,status:row.status}});
  return {ok:true,registrationId:row.id,status:row.status,protocol:row.metadata?.protocol};
});

export const createColorsSupportTicket=createServerFn({method:"POST"}).inputValidator((raw:unknown)=>supportSchema.parse(raw)).handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const sb:any=supabaseAdmin;
  const touch={source_channel:data.sourceChannel,utm_source:data.utmSource,utm_medium:data.utmMedium,utm_campaign:data.utmCampaign,utm_content:data.utmContent,utm_term:data.utmTerm};
  const contact=await ensureContact(sb,{fullName:data.fullName,email:data.email,whatsapp:data.whatsapp,consentLgpd:true,touch});
  const ticketCode=protocol();
  const {data:row,error}=await sb.from("support_tickets").insert({company_id:contact.companyId,contact_id:contact.coreId,category:data.category,priority:"normal",status:"open",subject:data.subject,description:data.description,source_channel:data.sourceChannel??"colors_site",ticket_code:ticketCode,metadata:{brand:"colors_saude",iris:true,colors_contact_id:contact.localId,...touch}}).select("id,ticket_code").single();
  if(error)throw new Error(error.message);
  await sb.from("colors_event_bus").insert({event_id:`support:${row.id}`,event_type:"SUPPORT_TICKET_CREATED",aggregate_type:"support_ticket",aggregate_id:row.id,payload:{ticket_id:row.id,ticket_code:row.ticket_code,contact_id:contact.localId,communication_contact_id:contact.coreId}});
  return {ok:true,ticketId:row.id,protocol:row.ticket_code};
});
