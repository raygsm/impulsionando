import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const IMPULSIONANDO_COMPANY_ID = 'bda711e0-cbfa-4899-a068-0c75f96d4e59';
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://impulsionando.com.br',
  'Access-Control-Allow-Headers': 'content-type,x-signature,x-request-id',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

async function verifySignature(secret: string, dataId: string, requestId: string, signature: string) {
  const ts = signature.match(/(?:^|,)ts=([^,]+)/)?.[1] ?? '';
  const v1 = signature.match(/(?:^|,)v1=([^,]+)/)?.[1] ?? '';
  if (!ts || !v1 || !dataId || !requestId) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return json({ error: 'server_not_configured' }, 503);
  const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const raw = await req.text();
    const payload = JSON.parse(raw || '{}');
    const eventType = String(payload.type ?? payload.topic ?? 'unknown');
    const resourceId = String(payload.data?.id ?? payload.resource ?? payload.id ?? '');
    const requestId = req.headers.get('x-request-id') ?? '';
    const signature = req.headers.get('x-signature') ?? '';
    if (!resourceId || !requestId || !signature) return json({ error: 'invalid_webhook_headers' }, 401);

    const { data: cred } = await service.from('mpago_credentials')
      .select('access_token_secret_name,webhook_secret_name,active,environment')
      .eq('company_id', IMPULSIONANDO_COMPANY_ID)
      .eq('active', true)
      .eq('environment', 'production')
      .limit(1)
      .maybeSingle();
    if (!cred?.webhook_secret_name || !cred?.access_token_secret_name) return json({ error: 'mercado_pago_credentials_not_configured' }, 503);

    const [{ data: webhookSecret }, { data: accessToken }] = await Promise.all([
      service.rpc('reveal_secret_value', { p_name: cred.webhook_secret_name }),
      service.rpc('reveal_secret_value', { p_name: cred.access_token_secret_name }),
    ]);
    if (!webhookSecret || !accessToken) return json({ error: 'mercado_pago_secrets_not_available' }, 503);
    if (!await verifySignature(String(webhookSecret), resourceId, requestId, signature)) return json({ error: 'invalid_webhook_signature' }, 401);

    const eventKey = `impulsionando:${eventType}:${requestId}`;
    const { data: existing } = await service.from('mpago_webhook_events')
      .select('id,processed')
      .eq('company_id', IMPULSIONANDO_COMPANY_ID)
      .eq('mp_event_id', eventKey)
      .eq('event_type', eventType)
      .maybeSingle();
    if (existing?.processed) return json({ ok: true, duplicate: true });

    const { data: event, error: eventError } = await service.from('mpago_webhook_events').upsert({
      company_id: IMPULSIONANDO_COMPANY_ID,
      event_type: eventType,
      mp_event_id: eventKey,
      mp_resource_id: resourceId,
      action: payload.action ?? null,
      raw_payload: payload,
      signature_valid: true,
      processed: false,
    }, { onConflict: 'mp_event_id,event_type' }).select('id,processed').single();
    if (eventError || !event) throw eventError ?? new Error('event_persist_failed');

    if (eventType === 'payment') {
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(resourceId)}`, {
        headers: { Authorization: `Bearer ${String(accessToken)}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!mpResp.ok) return json({ error: 'mercado_pago_payment_lookup_failed' }, 502);
      const mpData = await mpResp.json();
      const status = String(mpData.status ?? 'pending').toLowerCase();
      const externalReference = String(mpData.external_reference ?? '');
      if (!externalReference.startsWith('impulsionando:billing_checkout:')) return json({ ok: true, ignored: 'not_impulsionando_billing_checkout' });
      const checkoutSessionId = externalReference.slice('impulsionando:billing_checkout:'.length);

      const { data: payment, error: paymentError } = await service.from('mpago_payments')
        .update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null, rejected_at: status === 'rejected' ? new Date().toISOString() : null, refunded_at: status === 'refunded' ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
        .eq('company_id', IMPULSIONANDO_COMPANY_ID)
        .eq('mp_payment_id', resourceId)
        .eq('context_type', 'billing_checkout_session')
        .eq('context_id', checkoutSessionId)
        .select('id,context_id,status')
        .maybeSingle();
      if (paymentError || !payment) return json({ error: 'internal_payment_not_found' }, 409);

      if (status === 'approved') {
        const { error: finalizeError } = await service.rpc('core_finalize_impulsionando_checkout', {
          p_checkout_session_id: checkoutSessionId,
          p_payment_id: payment.id,
          p_mp_payment_id: resourceId,
        });
        if (finalizeError) throw finalizeError;
      } else {
        const sessionStatus = ['rejected','cancelled','refunded','charged_back'].includes(status) ? 'failed' : 'payment_pending';
        await service.from('billing_checkout_sessions').update({ status: sessionStatus, updated_at: new Date().toISOString() }).eq('id', checkoutSessionId);
      }
    }

    await service.from('mpago_webhook_events').update({ processed: true, processed_at: new Date().toISOString(), processing_error: null }).eq('id', event.id);
    return json({ ok: true });
  } catch (error) {
    console.error('[impulsionando-billing-webhook]', error);
    return json({ error: 'webhook_processing_failed' }, 500);
  }
});
