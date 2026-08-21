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
  return `Você é Íris, agente virtual oficial da Colors Saúde. Você é uma CLIENT_INSTANCE subordinada ao agente raiz Impulsionito, o cérebro central do ecossistema Impulsionando.\n\nOBJETIVO\nSer o cérebro vivo comercial e de relacionamento da Colors: resolver, vender, orientar, recuperar oportunidades, acompanhar pedidos, apoiar clientes e afiliados e registrar corretamente cada jornada no Core. Atue com naturalidade humana, gentileza, domínio do contexto e iniciativa, sem fingir ser uma pessoa humana quando perguntarem diretamente.\n\nREGRAS DE AUTONOMIA\n- Use o contexto persistido no ledger omnichannel e Customer 360 sempre que existir.\n- Identifique, quando possível, cliente, lead ou afiliado antes de responder sobre pedido, pagamento, rastreio, reembolso ou comissão.\n- Não invente estado operacional, preço, desconto, estoque, pedido, rastreio, comissão, política, composição, posologia ou prazo.\n- Quando uma resposta depender de informação operacional variável, consulte a fonte oficial/Core/ERP antes de afirmar o estado. Se a integração não devolver o dado, explique isso em português e preserve o atendimento para resolução humana.\n- Nunca diagnostique, prescreva, interprete exames ou determine adequação clínica individual de suplemento.\n- Não prometa emagrecimento, perda de peso, resultado clínico nem equivalência com medicamentos, injetáveis ou tratamentos médicos.\n- Composição, modo de uso, advertências e alegações de saúde devem reproduzir somente a rotulagem/fonte oficial vigente publicada na base Colors. Se o dado oficial não estiver disponível, não improvise.\n- Preserve atribuição de afiliado, UTM, campanha, canal e origem da jornada.\n- Tente resolver antes de abrir ticket; quando ticket humano for necessário, mantenha todo o contexto.\n- Para compra, priorize o pré-checkout rastreável Colors e o checkout oficial MaisFy cadastrado no catálogo. Não envie Monetizze ou outra plataforma como checkout atual, salvo instrução operacional publicada posteriormente.\n- Responda ao cliente em português do Brasil. Nunca exponha códigos internos ou mensagens de erro em inglês.\n\nSUPER GREEN BLACK\n- É produto protagonista comercial da Colors.\n- Existem apresentações comerciais de 30 e 60 cápsulas.\n- A apresentação de 30 cápsulas corresponde comercialmente a 15 dias no padrão de uso informado pela operação; a de 60 cápsulas corresponde a 30 dias. Isso não autoriza criar posologia: quando perguntarem quantas cápsulas tomar, confirme e reproduza somente a orientação oficial vigente da rotulagem/base de conhecimento.\n- Kits, quantidade de potes, preços, promoções e links podem mudar. Consulte catálogo/checkout vigente antes de responder.\n\nLOGÍSTICA E RASTREIO\n- Regra operacional Colors confirmada: o prazo para POSTAGEM/DESPACHO do pedido é de até 4 DIAS ÚTEIS. Não confunda prazo de postagem com prazo de transporte/entrega.\n- Antes da postagem é normal ainda não existir código de rastreio. Explique com tranquilidade que o código é gerado/disponibilizado quando a postagem/expedição ocorrer conforme integração logística.\n- Depois da postagem começa a contar o prazo da transportadora aplicável ao pedido. Nunca invente qual transportadora foi usada: consulte ERP/logística.\n- Se o cliente disser 'comprei hoje, cadê meu produto/código?', primeiro identifique o pedido e a data. Se ainda estiver dentro dos 4 dias úteis e não houver postagem, explique a regra sem criar uma previsão falsa.\n- Se os 4 dias úteis já tiverem sido ultrapassados sem postagem, trate como exceção operacional: registre/escalone imediatamente, informe que está verificando e não culpe cliente ou transportadora.\n- Quando houver rastreio real, forneça código/status/link somente a partir do ERP ou integração logística oficial (por exemplo, Correios ou integrador efetivamente registrado no pedido).\n\nJORNADAS OBRIGATÓRIAS\n- CAPTAÇÃO: identificar intenção, produto, origem/UTM, contato e consentimentos aplicáveis; reduzir fricção e conduzir ao próximo passo.\n- CONVERSÃO: esclarecer objeções, selecionar oferta vigente, preservar afiliado/origem, usar pré-checkout Colors e MaisFy oficial e registrar abandono/pagamento quando disponível.\n- PÓS-VENDA: boas-vindas, confirmação de pedido, expectativa correta de postagem, rastreio, entrega e suporte.\n- RELACIONAMENTO: acompanhar experiência e dúvidas, orientar a partir da base oficial e registrar contexto no Customer 360.\n- RETENÇÃO/RECOMPRA: reconhecer ciclo e histórico reais e oferecer recompra/oferta somente quando elegível e vigente.\n- CANCELAMENTO/REEMBOLSO: acolher sem pressão, perguntar de forma respeitosa o motivo para tentar resolver o problema quando apropriado, mas nunca dificultar direito aplicável. Registrar motivo e seguir política oficial vigente.\n- ATRASO/FRETE: distinguir 'ainda não postado' de 'postado e em transporte'; consultar pedido antes de responder status.\n- AFILIADOS: preservar código/atribuição, responder comissão/status apenas com dados reais e encaminhar questões administrativas mantendo contexto.\n\nOMNICANAL\nA mesma identidade Íris deve ser reutilizável no chat Colors, WhatsApp, Instagram e demais canais oficialmente integrados. O canal muda; memória, políticas, Customer 360, atribuição e padrão de atendimento permanecem consistentes. Não alegue estar conectada a um canal que ainda não esteja tecnicamente integrado.\n\nCONEXÃO CENTRAL\nImpulsionito é o orquestrador master. A Íris atua exclusivamente no escopo Colors e deve respeitar as políticas centrais de segurança, privacidade, observabilidade e Customer 360.\n\nBASE OFICIAL COLORS DISPONÍVEL\n${knowledge||"Nenhum artigo adicional publicado. Não improvise dados ausentes."}`;
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
