import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CHRISMED_COMPANY_ID='642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const CHRISMED_CNPJ='42625058000170';

function focusBase(environment:string){return environment==='production'?'https://api.focusnfe.com.br':'https://homologacao.focusnfe.com.br';}

async function secret(name:string){
  const {data,error}=await (supabaseAdmin as any).rpc('reveal_secret_value',{p_name:name});
  if(error||!data)throw new Error('focus_secret_unavailable');
  return String(data);
}

export async function validateChrismedFocusCredential(actorUserId:string){
  const {data:cfg,error}=await (supabaseAdmin as any).from('chrismed_fiscal_issuer_config')
    .select('id,company_id,environment,provider_secret_ref,readiness')
    .eq('company_id',CHRISMED_COMPANY_ID).maybeSingle();
  if(error||!cfg)throw new Error('fiscal_config_unavailable');
  if(!cfg.provider_secret_ref)throw new Error('focus_token_not_configured');
  const token=await secret(String(cfg.provider_secret_ref));
  const auth=Buffer.from(`${token}:`,'utf8').toString('base64');
  const url=`${focusBase(String(cfg.environment))}/v2/empresas?cnpj=${CHRISMED_CNPJ}`;
  const response=await fetch(url,{method:'GET',headers:{accept:'application/json',authorization:`Basic ${auth}`},signal:AbortSignal.timeout(15000)});
  const payload=await response.json().catch(()=>null) as unknown;
  const authorized=response.status!==401&&response.status!==403;
  const rows=Array.isArray(payload)?payload:(payload&&typeof payload==='object'&&Array.isArray((payload as any).empresas)?(payload as any).empresas:[]);
  const companyRegistered=authorized&&rows.some((row:any)=>String(row?.cnpj??'').replace(/\D/g,'')===CHRISMED_CNPJ);
  const now=new Date().toISOString();
  const readiness={...(cfg.readiness??{}),provider_token_validated:authorized,focus_company_registered:companyRegistered,focus_validation_http_status:response.status,focus_validated_at:now};
  await (supabaseAdmin as any).from('chrismed_fiscal_issuer_config').update({readiness,enabled:false,updated_at:now}).eq('id',cfg.id);
  await (supabaseAdmin as any).from('communication_audit_logs').insert({
    tenant_id:'94bf647c-c851-41ab-8700-1e062263e54d',actor_id:actorUserId,actor_type:'USER',action:'CHRISMED_FOCUS_NFSE_VALIDATED',entity_type:'chrismed_fiscal_issuer_config',entity_id:String(cfg.id),after_data:{environment:cfg.environment,authorized,company_registered:companyRegistered,http_status:response.status,emission_enabled:false},
  });
  if(!authorized)throw new Error('focus_credential_rejected');
  return{authorized:true,companyRegistered,httpStatus:response.status,environment:cfg.environment};
}
