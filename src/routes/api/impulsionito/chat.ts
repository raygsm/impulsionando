/**
 * /api/impulsionito/chat — endpoint server-authoritative do Impulsionito.
 * Browser nunca tem autoridade sobre tenant, agent key, cérebro ou situação financeira.
 */
import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "crypto";
import { streamText, type ModelMessage } from "ai";
import { assemblePrompt } from "@/lib/impulsionito/context-engine.server";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import { loadAuthenticatedFinancialContext } from "@/lib/impulsionito/financial-context.server";
import type { BrainSnapshot, ImpulsionitoChatRequestBody, ImpulsionitoRequestContext, ImpulsionitoWireMessage } from "@/lib/impulsionito/types";
import { listConversationHistory, recordInboundMessage, recordOutboundMessage, type InboundLedger, type OmnichannelAgentKey } from "@/lib/agents/omnichannel.server";

type PublicAgentRoute = { agentKey:OmnichannelAgentKey; tenant:string; audience:string; endpointAddress:string; source:string; brain?:BrainSnapshot };

const CORE_MASTER_BRAIN: BrainSnapshot = {
  promptMaster: [
    "Você é o Impulsionito, cérebro central e orquestrador do Ecossistema Impulsionando Tecnologia.",
    "Atue em português do Brasil, de forma direta, inteligente, segura e orientada a resultado.",
    "O Core universal é a fonte de verdade para clientes, planos, módulos, cobrança, relacionamento, canais e estado de acesso.",
    "Toda empresa comercial ativa é cliente do Core; contas master, demo e fixtures técnicos não são clientes faturáveis.",
    "A recorrência canônica vence no dia 5. Primeira contratação usa setup integral e pró-rata até o próximo dia 5; mudança de plano segue a política de pró-rata registrada no Core.",
    "Nunca declare pagamento identificado, contrato ativo, fatura paga, inadimplência, suspensão ou reativação sem contexto autenticado do servidor.",
    "Quando uma empresa estiver suspensa por inadimplência, somente a área financeira/regularização permanece operável; o dashboard pode ficar apenas visível com marca-d'água e sem interação.",
    "A reativação ocorre somente após confirmação real do pagamento pelo Core.",
    "Nunca invente preço, plano, prazo, módulo, pagamento, integração ou estado de cliente.",
  ].join("\n"),
  promptVersion: 2,
  rules: [
    { title:"Segurança financeira", body:"Dados financeiros específicos de uma empresa só podem ser usados quando vierem do contexto autenticado resolvido server-side.", tags:["financeiro","seguranca"] },
    { title:"Próximo passo", body:"Quando houver bloqueio financeiro, orientar somente para Financeiro/Minha Assinatura ou ativação de plano, conforme o estado fornecido pelo Core.", tags:["financeiro","jornada"] },
  ],
  services:[], plans:[], modules:[], niches:[], faq:[], knowledge:[], approvedLearnings:[],
};

const MAROCAS_BRAIN: BrainSnapshot = {
  promptMaster:[
    "Você é o Maruquito, agente virtual oficial da Marocas e instância especializada do Impulsionito.",
    "Ajude anfitriões, proprietários e gestores a operar imóveis entre hospedagens, com limpeza, preparação, reposição, evidências e manutenção.",
    "Nunca invente preços, disponibilidade, reservas, horários, profissionais, pagamentos, estoque, status de limpeza ou códigos de acesso.",
    "Dados operacionais dinâmicos só podem ser afirmados quando vierem de contexto confiável do servidor.",
  ].join("\n"),
  promptVersion:2,rules:[],services:[],plans:[],modules:[],niches:[],faq:[],knowledge:[],approvedLearnings:[],
};

function mergeBrain(base:BrainSnapshot|undefined, extra:Awaited<ReturnType<typeof loadAuthenticatedFinancialContext>>):BrainSnapshot {
  const source=base ?? CORE_MASTER_BRAIN;
  return { ...source, knowledge:[...(source.knowledge??[]),...extra.knowledge] };
}
function toModelMessages(msgs:ImpulsionitoWireMessage[]):ModelMessage[]{ return msgs.flatMap(m=>{const content=(m.text??"").toString().trim();if(!content)return[];if(m.role==="assistant")return[{role:"assistant",content}];if(m.role==="user")return[{role:"user",content}];return[];}); }
function ledgerToModelMessages(history:Awaited<ReturnType<typeof listConversationHistory>>):ModelMessage[]{ return history.flatMap(m=>{const content=(m.body_text??"").trim();if(!content)return[];if(m.direction==="INBOUND"||m.author_type==="CONTACT")return[{role:"user",content}];if(m.direction==="OUTBOUND"&&m.author_type==="AGENT")return[{role:"assistant",content}];return[];}); }
function safeSessionId(request:Request):string{const supplied=request.headers.get("x-impulsionando-session")?.trim()??"";return /^web:[A-Za-z0-9:_-]{8,200}$/.test(supplied)?supplied:`web:ephemeral:${randomUUID()}`;}
function sanitizePath(body:ImpulsionitoChatRequestBody):string{const raw=body.context?.pathname?.trim()??"/";return /^\/[A-Za-z0-9_./?=&%+~-]{0,299}$/.test(raw)?raw:"/";}
function resolvePublicAgent(pathname:string):PublicAgentRoute{
  if(pathname==="/marocas"||pathname.startsWith("/marocas/"))return{agentKey:"marocas-maruquito",tenant:"marocas",audience:pathname.startsWith("/marocas/app/")?"marocas_app_web":"marocas_public_web",endpointAddress:"https://marocas.impulsionando.com.br",source:"maruquito_web_chat",brain:MAROCAS_BRAIN};
  return{agentKey:"impulsionito-core",tenant:"impulsionando",audience:"public_web",endpointAddress:"https://impulsionando.com.br",source:"impulsionito_web_chat",brain:CORE_MASTER_BRAIN};
}
function safeContext(pathname:string,route:PublicAgentRoute,financial:Awaited<ReturnType<typeof loadAuthenticatedFinancialContext>>):ImpulsionitoRequestContext{return{pathname,channel:"web",tenant:route.tenant,audience:financial.authenticated?(financial.isStaff?"authenticated_staff":"authenticated_client"):route.audience,userProfile:financial.isStaff?"impulsionando_staff":financial.authenticated?"client_user":undefined};}
function trackedTextStream(source:ReadableStream<string>,onComplete:(text:string)=>Promise<void>):ReadableStream<Uint8Array>{const encoder=new TextEncoder();return new ReadableStream({async start(controller){const reader=source.getReader();let full="";try{while(true){const{value,done}=await reader.read();if(done)break;if(!value)continue;full+=value;controller.enqueue(encoder.encode(value));}if(full.trim())try{await onComplete(full);}catch(e){console.error("[impulsionito/chat] outbound ledger failed",e);}controller.close();}catch(e){controller.error(e);}finally{try{reader.releaseLock();}catch{}}}});}

export const Route=createFileRoute("/api/impulsionito/chat")({server:{handlers:{POST:async({request})=>{
  let body:ImpulsionitoChatRequestBody;try{body=await request.json() as ImpulsionitoChatRequestBody;}catch{return Response.json({error:"invalid_json"},{status:400});}
  const clientMessages=Array.isArray(body.messages)?body.messages:[];const clientModelMessages=toModelMessages(clientMessages);const lastUser=[...clientModelMessages].reverse().find(m=>m.role==="user");const lastUserText=typeof lastUser?.content==="string"?lastUser.content.trim():"";
  if(!lastUserText)return Response.json({error:"empty_messages"},{status:400});if(lastUserText.length>12000)return Response.json({error:"message_too_large"},{status:413});
  const pathname=sanitizePath(body);const agentRoute=resolvePublicAgent(pathname);
  let financial;try{financial=await loadAuthenticatedFinancialContext(request);}catch(e){console.error("[impulsionito/chat] authenticated context failed",e);financial={authenticated:false,isStaff:false,knowledge:[]};}
  const publicContext=safeContext(pathname,agentRoute,financial);const effectiveBrain=mergeBrain(agentRoute.brain,financial);
  let ledger:InboundLedger;try{ledger=await recordInboundMessage({agentKey:agentRoute.agentKey,channel:"web_chat",provider:"impulsionando_front",externalUserId:safeSessionId(request),bodyText:lastUserText,endpointAddress:agentRoute.endpointAddress,metadata:{pathname,tenant:agentRoute.tenant,agent_key:agentRoute.agentKey,source:agentRoute.source,authenticated:financial.authenticated,is_staff:financial.isStaff,company_id:financial.companyId??null}});}catch(e){console.error("[impulsionito/chat] inbound ledger failed",e);return Response.json({error:"conversation_ledger_unavailable"},{status:503});}
  let modelMessages=clientModelMessages;try{const persisted=ledgerToModelMessages(await listConversationHistory(ledger.conversation_id,30));if(persisted.length)modelMessages=persisted;}catch(e){console.error("[impulsionito/chat] history read failed",e);}if(modelMessages.length>30)modelMessages=modelMessages.slice(-30);
  const assembled=assemblePrompt(effectiveBrain,publicContext);
  const persistOutbound=async(text:string,status="SENT",metadata:Record<string,unknown>={})=>recordOutboundMessage({conversationId:ledger.conversation_id,bodyText:text,channel:"web_chat",provider:"impulsionando_front",endpointId:ledger.endpoint_id,status,metadata:{tenant:agentRoute.tenant,agent_key:agentRoute.agentKey,authenticated:financial.authenticated,company_id:financial.companyId??null,...metadata}});
  function mockStream(reason:string):Response{const fallbackText=agentRoute.agentKey==="marocas-maruquito"?"Estou temporariamente sem acesso ao motor principal. Não vou inventar informações operacionais. Posso preservar seu contexto até o serviço normalizar.":"Estou em modo de contingência. Posso continuar orientando pelo Core, mas não vou inventar estado financeiro, pagamento, plano ou integração.";const chunks=fallbackText.match(/.{1,90}(?:\s|$)/g)??[fallbackText];const encoder=new TextEncoder();const stream=new ReadableStream<Uint8Array>({async start(controller){let full="";for(const chunk of chunks){full+=chunk;controller.enqueue(encoder.encode(chunk));await new Promise(r=>setTimeout(r,25));}try{await persistOutbound(full,"SENT",{fallback:true,fallback_reason:reason});}catch{}controller.close();}});return new Response(stream,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Impulsionito-Agent":agentRoute.agentKey,"X-Impulsionito-Tenant":agentRoute.tenant,"X-Impulsionito-Provider":"mock","X-Impulsionito-Model":"mock-1","X-Impulsionito-Brain":"server","X-Impulsionito-Auth":financial.authenticated?"authenticated":"anonymous","X-Conversation-Id":ledger.conversation_id}});}
  let resolved;try{resolved=resolveProvider({});}catch{return mockStream("no_provider_available");}
  try{const result=streamText({model:resolved.model,system:assembled.system,messages:modelMessages,temperature:agentRoute.agentKey==="marocas-maruquito"?0.25:0.35,maxOutputTokens:1024});const stream=trackedTextStream(result.textStream as ReadableStream<string>,text=>persistOutbound(text,"SENT",{provider:resolved.provider,model:resolved.modelId,prompt_source:"server_authoritative",financial_context:financial.knowledge.length>0}));return new Response(stream,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Impulsionito-Agent":agentRoute.agentKey,"X-Impulsionito-Tenant":agentRoute.tenant,"X-Impulsionito-Provider":resolved.provider,"X-Impulsionito-Model":resolved.modelId,"X-Impulsionito-Brain":"server-authoritative","X-Impulsionito-Auth":financial.authenticated?"authenticated":"anonymous","X-Conversation-Id":ledger.conversation_id}});}catch(e){console.error("[impulsionito/chat] stream failed",e);return mockStream(e instanceof Error?e.message.slice(0,120):"upstream_error");}
}}}});
