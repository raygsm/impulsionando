import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { generateText, type ModelMessage } from "ai";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from "@/lib/agents/omnichannel.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function verifySignature(raw:string,header:string|null){
  const secret=process.env.COLORS_META_APP_SECRET??"";
  if(!secret||!header?.startsWith("sha256="))return false;
  const expected=createHmac("sha256",secret).update(raw).digest("hex");
  const supplied=header.slice(7);
  if(expected.length!==supplied.length)return false;
  return timingSafeEqual(Buffer.from(expected,"hex"),Buffer.from(supplied,"hex"));
}

function historyToMessages(history:Awaited<ReturnType<typeof listConversationHistory>>):ModelMessage[]{return history.flatMap((m):ModelMessage[]=>{const t=(m.body_text??"").trim();if(!t)return[];if(m.direction==="INBOUND"||m.author_type==="CONTACT")return[{role:"user",content:t}];if(m.direction==="OUTBOUND"&&m.author_type==="AGENT")return[{role:"assistant",content:t}];return[];});}

function supportIntent(text:string){return /(pedido|rastreio|entrega|não chegou|nao chegou|cancelar|cancelamento|reembolso|devolu|troca|cobrança|cobranca|pagamento|cart[aã]o|pix|fraude|reclama|problema|erro|suporte)/i.test(text);}
function angryIntent(text:string){return /(absurdo|péssim|pessim|engan|processo|procon|reclame aqui|fraude|golpe|irritad|revoltad)/i.test(text);}

async function irisSystem(){const {data:company}=await(supabaseAdmin as any).from("companies").select("id").eq("document","58.255.587/0001-60").maybeSingle();const {data:articles}=company?.id?await(supabaseAdmin as any).from("knowledge_articles").select("title,summary,body_markdown").eq("company_id",company.id).eq("status","published").eq("audience","staff").order("updated_at",{ascending:false}).limit(20):{data:[]};return `Você é Íris, assistente oficial da Colors Saúde, subordinada ao Impulsionito central. Responda em português do Brasil com simpatia, precisão, objetividade e foco em resolver. Não invente preço, desconto, estoque, prazo, composição, política ou estado de pedido. Nunca diagnostique ou prescreva. Para dúvida clínica individual, explique o limite e oriente avaliação profissional independente quando necessário. Para compra, priorize canais oficiais Colors. Para reclamação ou suporte, acolha sem prometer solução que o sistema não confirmou.\n\nBASE COLORS:\n${(articles??[]).map((a:any)=>`## ${a.title}\n${a.summary??""}\n${a.body_markdown??""}`).join("\n\n")}`;}

async function ensureSupportTicket(ledger:any,text:string,channel:string){
  if(!supportIntent(text))return null;
  const {data:tenant}=await(supabaseAdmin as any).from("communication_tenants").select("company_id").eq("id",ledger.tenant_id).maybeSingle();
  if(!tenant?.company_id)return null;
  const {data:open}=await(supabaseAdmin as any).from("support_tickets").select("id,ticket_code").eq("company_id",tenant.company_id).eq("contact_id",ledger.contact_id).in("status",["open","waiting_customer","waiting_internal","reopened"]).contains("metadata",{brand:"colors_saude"}).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(open?.id)return open;
  const priority=angryIntent(text)?"high":"normal";
  const category=/rastreio|entrega|não chegou|nao chegou/i.test(text)?"rastreio":/pagamento|cobrança|cobranca|cart[aã]o|pix/i.test(text)?"pagamento":/cancel|reembolso|devolu|troca/i.test(text)?"troca_devolucao":"outro";
  const {data:created,error}=await(supabaseAdmin as any).from("support_tickets").insert({company_id:tenant.company_id,contact_id:ledger.contact_id,category,priority,status:"open",subject:"Atendimento iniciado pela Íris",description:text.slice(0,4000),source_channel:channel,first_response_due_at:new Date(Date.now()+60*60*1000).toISOString(),resolution_due_at:new Date(Date.now()+24*60*60*1000).toISOString(),metadata:{brand:"colors_saude",agent:"iris",conversation_id:ledger.conversation_id,source:"meta_omnichannel",auto_opened:true}}).select("id,ticket_code").single();
  if(error)throw new Error(error.message);return created;
}

async function sendWhatsapp(to:string,text:string,phoneNumberId?:string|null){const token=process.env.COLORS_META_WHATSAPP_TOKEN??"";const phone=phoneNumberId||process.env.COLORS_META_PHONE_NUMBER_ID||"";if(!token||!phone)throw new Error("whatsapp_credentials_missing");const version=process.env.COLORS_META_GRAPH_VERSION||"v23.0";const r=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phone)}/messages`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",to,type:"text",text:{body:text.slice(0,4096)}})});if(!r.ok)throw new Error(`whatsapp_send_${r.status}`);return await r.json();}
async function sendFacebook(to:string,text:string){const token=process.env.COLORS_META_PAGE_TOKEN??"";if(!token)throw new Error("facebook_credentials_missing");const version=process.env.COLORS_META_GRAPH_VERSION||"v23.0";const r=await fetch(`https://graph.facebook.com/${version}/me/messages?access_token=${encodeURIComponent(token)}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({recipient:{id:to},messaging_type:"RESPONSE",message:{text:text.slice(0,2000)}})});if(!r.ok)throw new Error(`facebook_send_${r.status}`);return await r.json();}
async function sendInstagram(to:string,text:string){const token=process.env.COLORS_META_PAGE_TOKEN??"";const ig=process.env.COLORS_META_IG_ACCOUNT_ID??"";if(!token||!ig)throw new Error("instagram_credentials_missing");const version=process.env.COLORS_META_GRAPH_VERSION||"v23.0";const r=await fetch(`https://graph.instagram.com/${version}/${encodeURIComponent(ig)}/messages`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({recipient:{id:to},message:{text:text.slice(0,2000)}})});if(!r.ok)throw new Error(`instagram_send_${r.status}`);return await r.json();}

async function processMessage(input:{channel:"whatsapp"|"instagram"|"facebook";externalUserId:string;text:string;providerMessageId?:string|null;endpointAddress?:string|null;phoneNumberId?:string|null;metadata?:Record<string,unknown>}){
  const provider=input.channel==="whatsapp"?"meta_cloud":"meta_graph";
  const ledger=await recordInboundMessage({agentKey:"colors-iris",channel:input.channel,provider,externalUserId:input.externalUserId,bodyText:input.text,providerMessageId:input.providerMessageId??null,endpointAddress:input.endpointAddress??null,metadata:{...(input.metadata??{}),source:"meta_colors",root_agent_key:"impulsionito-core"}});
  const ticket=await ensureSupportTicket(ledger,input.text,input.channel).catch(e=>{console.error("[meta-colors] ticket",e);return null;});
  const history=historyToMessages(await listConversationHistory(ledger.conversation_id,30));
  const resolved=resolveProvider({});
  const {text:answer}=await generateText({model:resolved.model,system:await irisSystem(),messages:history.slice(-30),temperature:0.35,maxOutputTokens:900});
  let external:any=null;
  try{if(input.channel==="whatsapp")external=await sendWhatsapp(input.externalUserId,answer,input.phoneNumberId);else if(input.channel==="facebook")external=await sendFacebook(input.externalUserId,answer);else external=await sendInstagram(input.externalUserId,answer);
    await recordOutboundMessage({conversationId:ledger.conversation_id,bodyText:answer,channel:input.channel,provider,endpointId:ledger.endpoint_id,status:"SENT",providerMessageId:String(external?.messages?.[0]?.id??external?.message_id??external?.messageId??"")||null,metadata:{agent_key:"colors-iris",root_agent_key:"impulsionito-core",ticket_code:ticket?.ticket_code??null}});
  }catch(error){console.error("[meta-colors] outbound failed",error);await recordOutboundMessage({conversationId:ledger.conversation_id,bodyText:answer,channel:input.channel,provider,endpointId:ledger.endpoint_id,status:"FAILED",metadata:{agent_key:"colors-iris",root_agent_key:"impulsionito-core",delivery_error:error instanceof Error?error.message:"unknown",ticket_code:ticket?.ticket_code??null}});}
}

function extract(body:any){const out:Array<any>=[];if(body?.object==="whatsapp_business_account"){for(const entry of body.entry??[])for(const change of entry.changes??[]){const v=change.value??{};for(const m of v.messages??[]){const text=m?.text?.body;if(text)out.push({channel:"whatsapp",externalUserId:String(m.from),text:String(text),providerMessageId:m.id??null,phoneNumberId:v?.metadata?.phone_number_id??null,endpointAddress:v?.metadata?.display_phone_number??null,metadata:{message_type:m.type,timestamp:m.timestamp}});}}return out;}
  const channel=body?.object==="instagram"?"instagram":"facebook";for(const entry of body?.entry??[])for(const ev of entry?.messaging??[]){const text=ev?.message?.text;if(text&&!ev?.message?.is_echo)out.push({channel,externalUserId:String(ev.sender?.id??""),text:String(text),providerMessageId:ev.message?.mid??null,endpointAddress:String(ev.recipient?.id??""),metadata:{timestamp:ev.timestamp}});}return out;}

export const Route=createFileRoute("/api/public/hooks/meta-colors")({server:{handlers:{
  GET:async({request})=>{const u=new URL(request.url);const mode=u.searchParams.get("hub.mode");const token=u.searchParams.get("hub.verify_token");const challenge=u.searchParams.get("hub.challenge");if(mode==="subscribe"&&token&&token===process.env.COLORS_META_VERIFY_TOKEN&&challenge)return new Response(challenge,{status:200});return new Response("forbidden",{status:403});},
  POST:async({request})=>{const raw=await request.text();if(!verifySignature(raw,request.headers.get("x-hub-signature-256")))return new Response("invalid signature",{status:401});let body:any;try{body=JSON.parse(raw);}catch{return new Response("invalid json",{status:400});}const messages=extract(body).filter((m:any)=>m.externalUserId&&m.text);for(const m of messages){try{await processMessage(m);}catch(error){console.error("[meta-colors] message processing failed",error);}}return new Response("EVENT_RECEIVED",{status:200});}
}}});
