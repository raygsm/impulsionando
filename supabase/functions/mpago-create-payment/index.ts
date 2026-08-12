import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type RevshareEvent = 'sale' | 'rent' | 'recurring' | 'service' | 'subscription' | 'event' | 'product';
interface CreatePaymentBody {
  company_id: string;
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'preference';
  amount_cents: number;
  description: string;
  external_reference?: string;
  payer: { email: string; first_name?: string; last_name?: string; identification?: { type: string; number: string } };
  context_type?: string;
  context_id?: string;
  metadata?: Record<string, unknown>;
  revshare_event_type?: RevshareEvent;
  token?: string;
  installments?: number;
  payment_method_id?: string;
  issuer_id?: string;
  items?: Array<{ title: string; quantity: number; unit_price: number }>;
  back_urls?: { success: string; pending: string; failure: string };
  hold_token?: string;
}

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';
function mercadoPagoWebhookUrl(companyId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) throw new Error('SUPABASE_URL is not configured');
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/mpago-webhook?company_id=${encodeURIComponent(companyId)}`;
}
function calcFee(gross: number,bps: number,minBps?: number|null,maxBps?: number|null) {
  if (gross<=0 || bps<=0) return 0;
  let fee=Math.floor((gross*bps)/10000);
  if(minBps!=null) fee=Math.max(fee,Math.floor((gross*minBps)/10000));
  if(maxBps!=null) fee=Math.min(fee,Math.floor((gross*maxBps)/10000));
  return Math.min(fee,gross);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.toLowerCase().startsWith('bearer ')) return new Response(JSON.stringify({ error: 'authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userResult, error: userError } = await authClient.auth.getUser();
    if (userError || !userResult.user) return new Response(JSON.stringify({ error: 'invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(supabaseUrl, serviceKey);
    const body: CreatePaymentBody = await req.json();
    if (!body.company_id || !body.payment_method || !body.payer?.email) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let chrismedAppointment: Record<string, any> | null = null;
    if (body.company_id === CHRISMED_COMPANY_ID) {
      if (!body.hold_token) return new Response(JSON.stringify({ error: 'A valid CHRISMED booking hold is required' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { data: appointment, error: appointmentError } = await supabase.from('chrismed_appointments').select('id,offering_id,patient_user_id,patient_name,patient_email,patient_phone,starts_at,ends_at,status,hold_expires_at,payment_id').eq('company_id',CHRISMED_COMPANY_ID).eq('hold_token',body.hold_token).maybeSingle();
      if (appointmentError || !appointment || !['held','pending_payment'].includes(appointment.status) || new Date(appointment.hold_expires_at)<=new Date()) return new Response(JSON.stringify({ error: 'CHRISMED booking hold is invalid or expired' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (appointment.patient_user_id && appointment.patient_user_id !== userResult.user.id) return new Response(JSON.stringify({ error: 'booking does not belong to authenticated patient' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (appointment.payment_id) {
        const { data: existingPayment } = await supabase.from('mpago_payments').select('*').eq('id',appointment.payment_id).maybeSingle();
        if (existingPayment) return new Response(JSON.stringify({ payment: existingPayment, mp: { id: existingPayment.mp_payment_id, status: existingPayment.status, qr_code: existingPayment.pix_qr_code, qr_code_base64: existingPayment.pix_qr_code_base64 } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: offering } = await supabase.from('chrismed_service_offerings').select('id,name,slug,modality,price_cents,active').eq('id',appointment.offering_id).eq('company_id',CHRISMED_COMPANY_ID).eq('active',true).maybeSingle();
      if (!offering || offering.price_cents<=0) return new Response(JSON.stringify({ error: 'CHRISMED offering is unavailable for payment' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      chrismedAppointment=appointment;
      body.amount_cents = offering.price_cents;
      body.description=`CHRISMED - ${offering.name}`;
      body.external_reference=`chrismed:${appointment.id}`;
      body.context_type='chrismed_appointment';
      body.context_id=appointment.id;
      body.payer.email=appointment.patient_email;
      body.payer.first_name=appointment.patient_name.split(' ')[0];
      body.payer.last_name=appointment.patient_name.split(' ').slice(1).join(' ')||undefined;
      body.metadata={appointment_id:appointment.id,offering_slug:offering.slug,modality:offering.modality};
    }
    if (!body.amount_cents || !body.description) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: cred, error: credError } = await supabase.from('mpago_credentials').select('*').eq('company_id',body.company_id).eq('active',true).order('environment',{ascending:false}).limit(1).maybeSingle();
    if (credError || !cred) return new Response(JSON.stringify({ error: 'Mercado Pago credentials not configured for this company' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: revealedAccessToken } = await supabase.rpc('reveal_secret_value',{p_name:cred.access_token_secret_name});
    const accessToken=(revealedAccessToken as string|null)??Deno.env.get(cred.access_token_secret_name)??null;
    if(!accessToken) return new Response(JSON.stringify({error:'Mercado Pago access token secret not found'}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});

    const externalRef=body.external_reference??crypto.randomUUID();
    const idempotencyKey=chrismedAppointment?`chrismed-${chrismedAppointment.id}`:crypto.randomUUID();
    const revshareEvent:RevshareEvent=body.revshare_event_type??'service';
    let appFeeCents=0, modelId:string|null=null, rateId:string|null=null, percentBpsApplied=0, ruleVersion=1;
    let modelKind:'saas'|'revshare'|'hybrid'|null=null;
    try {
      const {data:model}=await supabase.from('core_monetization_models').select('id,model,version,covered_events').eq('company_id',body.company_id).eq('is_active',true).order('version',{ascending:false}).limit(1).maybeSingle();
      if(model){modelId=model.id;ruleVersion=model.version??1;modelKind=model.model;const covered=Array.isArray(model.covered_events)?model.covered_events:[];if((model.model==='revshare'||model.model==='hybrid')&&covered.includes(revshareEvent)){const{data:rate}=await supabase.from('core_revshare_rates').select('id,percent_bps,min_bps,max_bps').eq('model_id',model.id).eq('event_type',revshareEvent).eq('is_active',true).maybeSingle();if(rate){rateId=rate.id;percentBpsApplied=rate.percent_bps;appFeeCents=calcFee(body.amount_cents,rate.percent_bps,rate.min_bps,rate.max_bps);}}}
    } catch(e){console.warn('[monetization] lookup failed (non-fatal):',e);}

    let endpoint:string; let mpBody:Record<string,unknown>;
    if(body.payment_method==='preference'){
      endpoint='https://api.mercadopago.com/checkout/preferences';
      mpBody={items:body.items??[{title:body.description,quantity:1,unit_price:body.amount_cents/100}],payer:{email:body.payer.email,name:body.payer.first_name,surname:body.payer.last_name},external_reference:externalRef,back_urls:body.back_urls,auto_return:'approved',notification_url:mercadoPagoWebhookUrl(body.company_id),metadata:{company_id:body.company_id,context_type:body.context_type,context_id:body.context_id,...body.metadata}};
    }else if(body.payment_method==='pix'){
      endpoint='https://api.mercadopago.com/v1/payments';
      mpBody={transaction_amount:body.amount_cents/100,description:body.description,payment_method_id:'pix',external_reference:externalRef,notification_url:mercadoPagoWebhookUrl(body.company_id),payer:{email:body.payer.email,first_name:body.payer.first_name,last_name:body.payer.last_name,identification:body.payer.identification},metadata:{company_id:body.company_id,context_type:body.context_type,context_id:body.context_id,...body.metadata}};
    }else{
      if(!body.token||!body.payment_method_id) return new Response(JSON.stringify({error:'token and payment_method_id required for card payments'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      endpoint='https://api.mercadopago.com/v1/payments';
      mpBody={transaction_amount:body.amount_cents/100,token:body.token,description:body.description,installments:body.installments??1,payment_method_id:body.payment_method_id,issuer_id:body.issuer_id,external_reference:externalRef,notification_url:mercadoPagoWebhookUrl(body.company_id),payer:{email:body.payer.email,identification:body.payer.identification},metadata:{company_id:body.company_id,context_type:body.context_type,context_id:body.context_id,...body.metadata}};
    }
    if(appFeeCents>0&&body.payment_method!=='preference') mpBody.application_fee=appFeeCents/100;
    const mpResponse=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json','X-Idempotency-Key':idempotencyKey},body:JSON.stringify(mpBody)});
    const mpData=await mpResponse.json();
    if(!mpResponse.ok) return new Response(JSON.stringify({error:'Mercado Pago error',details:mpData}),{status:mpResponse.status,headers:{...corsHeaders,'Content-Type':'application/json'}});

    const paymentRow={company_id:body.company_id,external_reference:externalRef,mp_payment_id:body.payment_method==='preference'?null:String(mpData.id),mp_preference_id:body.payment_method==='preference'?mpData.id:null,payment_method:body.payment_method==='preference'?'other':body.payment_method,status:body.payment_method==='preference'?'pending':(mpData.status??'pending'),amount_cents:body.amount_cents,description:body.description,payer_email:body.payer.email,payer_name:[body.payer.first_name,body.payer.last_name].filter(Boolean).join(' ')||null,payer_doc:body.payer.identification?.number??null,context_type:body.context_type??null,context_id:body.context_id??null,metadata:body.metadata??{},pix_qr_code:mpData.point_of_interaction?.transaction_data?.qr_code??null,pix_qr_code_base64:mpData.point_of_interaction?.transaction_data?.qr_code_base64??null,pix_expires_at:mpData.date_of_expiration??null,card_last4:mpData.card?.last_four_digits??null,installments:mpData.installments??null};
    const {data:payment,error:insErr}=await supabase.from('mpago_payments').insert(paymentRow).select().single();
    if(insErr) return new Response(JSON.stringify({error:'Failed to persist payment',details:insErr.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});
    if(chrismedAppointment){const{error:appointmentUpdateError}=await supabase.from('chrismed_appointments').update({payment_id:payment.id,status:'pending_payment',updated_at:new Date().toISOString()}).eq('id',chrismedAppointment.id).eq('hold_token',body.hold_token).in('status',['held','pending_payment']);if(appointmentUpdateError)return new Response(JSON.stringify({error:'Payment created but booking linkage requires reconciliation'}),{status:503,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    if(modelKind){try{await supabase.from('core_payout_events').insert({company_id:body.company_id,model_id:modelId,rate_id:rateId,event_type:revshareEvent,gross_cents:body.amount_cents,fee_cents:appFeeCents,percent_bps_applied:percentBpsApplied,rule_version:ruleVersion,provider:'mercadopago',provider_payment_id:payment.mp_payment_id??payment.mp_preference_id??null,status:'pending',reference_table:'mpago_payments',reference_id:payment.id,metadata:{external_reference:externalRef,model_kind:modelKind}});}catch(e){console.warn('[monetization] failed to record payout event:',e);}}
    return new Response(JSON.stringify({payment,mp:{id:mpData.id,status:mpData.status,init_point:mpData.init_point??null,sandbox_init_point:mpData.sandbox_init_point??null,qr_code:paymentRow.pix_qr_code,qr_code_base64:paymentRow.pix_qr_code_base64}}),{status:200,headers:{...corsHeaders,'Content-Type':'application/json'}});
  }catch(e){console.error('Unhandled error:',e);return new Response(JSON.stringify({error:String(e)}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
});
