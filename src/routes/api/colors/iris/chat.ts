import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "crypto";
import { streamText, type ModelMessage } from "ai";
import { resolveProvider } from "@/lib/impulsionito/providers.server";
import {
  listConversationHistory,
  recordInboundMessage,
  recordOutboundMessage,
  type InboundLedger,
} from "@/lib/agents/omnichannel.server";

function safeSessionId(request: Request): string {
  const supplied = request.headers.get("x-impulsionando-session")?.trim() ?? "";
  if (/^web:[A-Za-z0-9:_-]{8,200}$/.test(supplied)) return supplied;
  return `web:colors:${randomUUID()}`;
}

function historyToMessages(history: Awaited<ReturnType<typeof listConversationHistory>>): ModelMessage[] {
  return history.flatMap((m): ModelMessage[] => {
    const text=(m.body_text??"").trim(); if(!text)return [];
    if(m.direction==="INBOUND"||m.author_type==="CONTACT")return [{role:"user",content:text}];
    if(m.direction==="OUTBOUND"&&m.author_type==="AGENT")return [{role:"assistant",content:text}];
    return [];
  });
}

async function buildIrisSystemPrompt() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sb:any=supabaseAdmin;
  const {data:company}=await sb.from("companies").select("id").eq("document","58.255.587/0001-60").maybeSingle();
  const {data:articles}=company?.id
    ? await sb.from("knowledge_articles").select("title,summary,body_markdown,version,updated_at").eq("company_id",company.id).eq("status","published").eq("audience","staff").order("updated_at",{ascending:false}).limit(24)
    : {data:[]};
  const knowledge=(articles??[]).map((a:any)=>`## ${a.title} (v${a.version})\n${a.summary??""}\n${a.body_markdown}`).join("\n\n");
  return `Você é Íris, agente virtual oficial da Colors Saúde. Você é uma CLIENT_INSTANCE subordinada ao agente raiz Impulsionito, o cérebro central do ecossistema Impulsionando.\n\nOBJETIVO\nResolver, vender, orientar, recuperar oportunidades, apoiar clientes e afiliados e registrar corretamente a jornada Colors usando o Core.\n\nREGRAS DE AUTONOMIA\n- Use o contexto persistido no ledger omnichannel e Customer 360 sempre que existir.\n- Não invente estado operacional, preço, desconto, estoque, pedido, rastreio, comissão, política, composição ou prazo.\n- Quando uma resposta depender de informação operacional variável, diga apenas o que estiver disponível na fonte oficial ou no Core.\n- Nunca diagnostique, prescreva, interprete exames ou determine adequação clínica individual de suplemento.\n- Não prometa resultados clínicos nem equivalência com medicamentos, injetáveis ou tratamentos médicos.\n- Preserve atribuição de afiliado e origem da jornada.\n- Tente resolver antes de abrir ticket; quando ticket humano for necessário, mantenha o contexto.\n- Para compra, priorize os canais oficiais Colors e o pré-checkout rastreável.\n- Responda em português do Brasil, com linguagem humana, objetiva, gentil, comercial e inteligente.\n\nCONEXÃO CENTRAL\nImpulsionito é o orquestrador master. A Íris atua no escopo Colors e deve respeitar as políticas centrais de segurança, privacidade, observabilidade e Customer 360.\n\nBASE OFICIAL COLORS DISPONÍVEL\n${knowledge||"Nenhum artigo adicional publicado. Não improvise dados ausentes."}`;
}

function trackedTextStream(source:ReadableStream<string>,onComplete:(text:string)=>Promise<void>){
  const encoder=new TextEncoder();
  return new ReadableStream<Uint8Array>({async start(controller){const reader=source.getReader();let full="";try{while(true){const {value,done}=await reader.read();if(done)break;if(!value)continue;full+=value;controller.enqueue(encoder.encode(value));}if(full.trim())await onComplete(full);controller.close();}catch(error){controller.error(error);}finally{try{reader.releaseLock();}catch{}}}});
}

export const Route=createFileRoute("/api/colors/iris/chat")({server:{handlers:{POST:async({request})=>{
  let body:any; try{body=await request.json();}catch{return Response.json({error:"invalid_json"},{status:400});}
  const messages=Array.isArray(body?.messages)?body.messages:[];
  const last=[...messages].reverse().find((m:any)=>m?.role==="user"&&typeof m?.text==="string");
  const text=(last?.text??"").trim(); if(!text)return Response.json({error:"empty_message"},{status:400}); if(text.length>12000)return Response.json({error:"message_too_large"},{status:413});
  let ledger:InboundLedger;
  try{ledger=await recordInboundMessage({agentKey:"colors-iris",channel:"web_chat",provider:"colors_front",externalUserId:safeSessionId(request),bodyText:text,endpointAddress:"https://colorssaude.impulsionando.com.br",metadata:{source:"iris_colors_web",pathname:typeof body?.pathname==="string"?body.pathname.slice(0,300):"/"}});}catch(error){console.error("[colors/iris] inbound ledger failed",error);return Response.json({error:"conversation_ledger_unavailable"},{status:503});}
  let modelMessages:ModelMessage[]=[]; try{modelMessages=historyToMessages(await listConversationHistory(ledger.conversation_id,30));}catch(error){console.error("[colors/iris] history failed",error);modelMessages=[{role:"user",content:text}];}
  const system=await buildIrisSystemPrompt();
  const persist=async(output:string,status="SENT",metadata:Record<string,unknown>={})=>recordOutboundMessage({conversationId:ledger.conversation_id,bodyText:output,channel:"web_chat",provider:"colors_front",endpointId:ledger.endpoint_id,status,metadata});
  let resolved; try{resolved=resolveProvider({llm:{provider:"openai"},allowFallback:false});}catch{return Response.json({error:"provider_unavailable"},{status:503});}
  try{const result=streamText({model:resolved.model,system,messages:modelMessages.slice(-30),temperature:0.35,maxOutputTokens:1200});const stream=trackedTextStream(result.textStream as ReadableStream<string>,(output)=>persist(output,"SENT",{provider:resolved.provider,model:resolved.modelId,agent_key:"colors-iris",root_agent_key:"impulsionito-core",prompt_source:"colors_knowledge_core"}));return new Response(stream,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Agent-Key":"colors-iris","X-Root-Agent-Key":"impulsionito-core","X-Conversation-Id":ledger.conversation_id}});}catch(error){console.error("[colors/iris] stream failed",error);return Response.json({error:"upstream_error"},{status:502});}
}}}});
