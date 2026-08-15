import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { diagnoseAcoustics, type WmpAcousticInput } from "@/lib/wmp/acoustic-rules";
import { dispatchN8nByEvent } from "@/lib/n8n-dispatch-by-event.server";

const db:any=supabaseAdmin;
const WMP_COMPANY_ID = "ff2a9570-1168-4f9c-a852-1e042d9f32ed";
const clean=(v:unknown,max=500)=>typeof v==="string"&&v.trim()?v.trim().slice(0,max):undefined;
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_CODE_ALIASES:Record<string,string>={outro:"outro_curado"};
const normalizeEventCode=(value:string)=>EVENT_CODE_ALIASES[value]??value;

async function getWmpTenantId(){
  const {data,error}=await db.from("communication_tenants").select("id").eq("slug","wmp").eq("active",true).single();
  if(error||!data?.id)throw new Error(error?.message??"Tenant WMP não encontrado.");
  return data.id as string;
}

async function assertReference(setKey:string,code:string,label:string){
  const {data:set,error:setError}=await db.from("reference_option_sets").select("id").eq("key",setKey).eq("active",true).single();
  if(setError||!set?.id)throw new Error(`Catálogo ${label} indisponível.`);
  const {data:option,error}=await db.from("reference_options").select("code,label").eq("set_id",set.id).eq("code",code).eq("active",true).maybeSingle();
  if(error)throw new Error(error.message);
  if(!option)throw new Error(`${label} inválido. Selecione uma opção da lista.`);
  return option;
}

async function assertMunicipality(input:{uf:string;cidade:string;ibge:string}){
  if(!/^\d{7}$/.test(input.ibge))throw new Error("Código IBGE do município inválido.");
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${input.uf}/municipios?orderBy=nome`,{signal:controller.signal,headers:{accept:"application/json"}});
    if(!response.ok)throw new Error("Não foi possível validar o município selecionado.");
    const rows=await response.json() as Array<{id?:number;nome?:string}>;
    const match=rows.some(row=>String(row.id)===input.ibge&&String(row.nome??"").trim()===input.cidade);
    if(!match)throw new Error("Município e UF não correspondem à lista oficial. Selecione novamente.");
  }finally{clearTimeout(timer);}
}

async function assertCepLocation(input:{cep:string;uf:string;cidade:string;ibge:string}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4500);
  try{
    const response=await fetch(`https://viacep.com.br/ws/${input.cep}/json/`,{signal:controller.signal,headers:{accept:"application/json"}});
    if(!response.ok)throw new Error("Não foi possível validar o CEP informado.");
    const data=await response.json() as Record<string,unknown>;
    if(data.erro===true||data.erro==="true")throw new Error("CEP não encontrado.");
    const uf=String(data.uf??"").toUpperCase();
    const cidade=String(data.localidade??"").trim();
    const ibge=String(data.ibge??"").trim();
    if(uf!==input.uf.toUpperCase()||cidade!==input.cidade||ibge!==input.ibge){
      throw new Error("CEP, município e UF não correspondem. Consulte o CEP novamente e escolha os dados preenchidos pelo sistema.");
    }
  }finally{clearTimeout(timer);}
}

export const submitWmpBriefing=createServerFn({method:"POST"}).inputValidator((d:any)=>{
  if(!d||typeof d!=="object")throw new Error("Payload inválido");
  const nome=clean(d.contratante_nome,120),email=clean(d.contratante_email,200),telefone=clean(d.contratante_telefone,40),eventoTipoRaw=clean(d.evento_tipo,80);
  if(!nome||!email||!telefone||!eventoTipoRaw)throw new Error("Campos obrigatórios faltando.");
  if(!EMAIL_RE.test(email))throw new Error("E-mail inválido.");
  const eventoTipo=normalizeEventCode(eventoTipoRaw);
  const cep=(clean(d.evento_cep,12)??"").replace(/\D/g,"");
  if(cep.length!==8)throw new Error("CEP inválido.");
  const uf=(clean(d.evento_estado,2)??"").toUpperCase();
  const cidade=clean(d.evento_cidade,120);
  const ibge=clean(d.evento_municipio_ibge,12);
  if(!uf||!cidade||!ibge||!/^\d{7}$/.test(ibge))throw new Error("Município/UF inválidos. Selecione o endereço a partir do CEP.");
  return{contratante_nome:nome,contratante_email:email.toLowerCase(),contratante_telefone:telefone,contratante_empresa:clean(d.contratante_empresa,160),evento_tipo:eventoTipo,evento_data:clean(d.evento_data,20),evento_horario_inicio:clean(d.evento_horario_inicio,8),evento_horario_fim:clean(d.evento_horario_fim,8),evento_publico_estimado:Number.isFinite(Number(d.evento_publico_estimado))?Number(d.evento_publico_estimado):null,evento_perfil_publico:clean(d.evento_perfil_publico,200),evento_cep:cep,evento_bairro:clean(d.evento_bairro,120),evento_endereco:clean(d.evento_endereco,240),evento_cidade:cidade,evento_estado:uf,evento_municipio_ibge:ibge,ambiente:d.ambiente&&typeof d.ambiente==="object"?d.ambiente:{},medidas:d.medidas&&typeof d.medidas==="object"?d.medidas:{},acustica:d.acustica&&typeof d.acustica==="object"?d.acustica:{},utm:d.utm&&typeof d.utm==="object"?d.utm:null,user_agent:clean(d.user_agent,300),origem:clean(d.origem,40)??"site"};
}).handler(async({data})=>{
  await Promise.all([
    assertReference("wmp_event_types",data.evento_tipo,"Tipo de evento"),
    assertReference("br_states",data.evento_estado,"Estado"),
    assertCepLocation({cep:data.evento_cep,uf:data.evento_estado,cidade:data.evento_cidade,ibge:data.evento_municipio_ibge}),
  ]);
  const tenant_id=await getWmpTenantId();
  const input:WmpAcousticInput={ambiente:data.ambiente,medidas:data.medidas,evento:{publico_estimado:data.evento_publico_estimado??undefined,horario_fim:data.evento_horario_fim,tipo:data.evento_tipo},acustica:data.acustica};
  const pre_diagnostico=diagnoseAcoustics(input);
  const{data:row,error}=await db.from("wmp_briefings").insert({...data,tenant_id,consent_at:new Date().toISOString(),pre_diagnostico}).select("id, created_at").single();
  if(error)throw new Error(error.message);
  const automation=await dispatchN8nByEvent("wmp.lead.received",{lead_type:"briefing",briefing_id:row.id,email:data.contratante_email,phone:data.contratante_telefone,event_type:data.evento_tipo},WMP_COMPANY_ID,"wmp");
  return{id:row.id,created_at:row.created_at,pre_diagnostico,automation};
});

export const submitWmpParceiro=createServerFn({method:"POST"}).inputValidator((d:any)=>{
  const nome=clean(d?.nome,120),email=clean(d?.email,200),telefone=clean(d?.telefone,40),categoria=clean(d?.categoria,40);
  const estado=(clean(d.estado,2)??"").toUpperCase();
  const cidade=clean(d.cidade,120);
  const municipioIbge=clean(d.municipio_ibge,12);
  if(!nome||!email||!telefone||!categoria||!estado||!cidade||!municipioIbge)throw new Error("Campos obrigatórios faltando.");
  if(!EMAIL_RE.test(email)||!/^\d{7}$/.test(municipioIbge))throw new Error("Dados inválidos.");
  return{nome,nome_artistico:clean(d.nome_artistico,120),email:email.toLowerCase(),telefone,categoria,cidade,estado,municipio_ibge:municipioIbge,experiencia_anos:Number.isFinite(Number(d.experiencia_anos))?Number(d.experiencia_anos):null,bio:clean(d.bio,1500),portfolio_links:Array.isArray(d.portfolio_links)?d.portfolio_links.map((x:unknown)=>clean(x,300)).filter(Boolean):[],utm:d.utm&&typeof d.utm==="object"?d.utm:null,user_agent:clean(d.user_agent,300),origem:clean(d.origem,40)??"site"};
}).handler(async({data})=>{
  await Promise.all([
    assertReference("wmp_partner_categories",data.categoria,"Categoria de parceiro"),
    assertReference("br_states",data.estado,"Estado"),
    assertMunicipality({uf:data.estado,cidade:data.cidade,ibge:data.municipio_ibge}),
  ]);
  const tenant_id=await getWmpTenantId();
  const{data:row,error}=await db.from("wmp_parceiros").insert({...data,tenant_id,consent_at:new Date().toISOString()}).select("id, created_at").single();
  if(error)throw new Error(error.message);
  const automation=await dispatchN8nByEvent("wmp.partner.received",{lead_type:"partner",partner_id:row.id,category:data.categoria,email:data.email,phone:data.telefone},WMP_COMPANY_ID,"wmp");
  return{id:row.id,created_at:row.created_at,automation};
});
