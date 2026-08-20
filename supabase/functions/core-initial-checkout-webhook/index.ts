import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

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
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const url = new URL(req.url);
    const merchantCompanyId = url.searchParams.get('company_id');
    if (!merchantCompanyId) return json({ error: 'company_id_required' }, 400);
    const payload = JSON.parse(await req.text() || '{}');
    const eventType = String(payload.type ?? payload.topic ?? 'unknown');
    const resourceId = String(payload.data?.id ?? payload.resource ?? payload.id ?? '');
    const requestId = req.headers.get('x-request-id') ?? '';
    const signature = req.headers.get('x-signature') ?? '';
    if (eventType !== 'payment' || !resourceId || !requestId || !signature) return json({ error: 'invalid_webhook' }, 401);

    const { data: masterId } = await service.rpc('master_company_id');
    if (!masterId || String(masterId) !== merchantCompanyId) return json({ error: 'invalid_merchant' }, 403);
    const { data: cred } = await service.from('mpago_credentials').select('access_token_secret_name,webhook_secret_name').eq('company_id', merchantCompanyId).eq('active', true).limit(1).maybeSingle();
    if (!cred?.webhook_secret_name || !cred?.access_token_secret_name) return json({ error: 'credentials_unavailable' }, 503);
    const [{ data: webhookSecret }, { data: accessToken }] = await Promise.all([
      service.rpc('reveal_secret_value', { p_name: cred.webhook_secret_name }),
      service.rpc('reveal_secret_value', { p_name: cred.access_token_secret_name }),
    ]);
    if (!webhookSecret || !accessToken) return json({ error: 'secrets_unavailable' }, 503);
    if (!(await verifySignature(String(webhookSecret), resourceId, requestId, signature))) return json({ error: 'invalid_signature' }, 401);

    const { data: previous } = await service.from('mpago_webhook_events').select('id,processed').eq('mp_event_id', requestId).eq('event_type', 'initial_checkout_payment').maybeSingle();
    if (previous?.processed) return json({ ok: true, duplicate: true });
    const { data: event, error: eventError } = await service.from('mpago_webhook_events').upsert({
      company_id: merchantCompanyId,
      event_type: 'initial_checkout_payment',
      mp_event_id: requestId,
      mp_resource_id: resourceId,
      action: payload.action ?? null,
      raw_payload: payload,
      signature_valid: true,
      processed: false,
    }, { onConflict: 'mp_event_id,event_type' }).select('id').single();
    if (eventError || !event) throw eventError ?? new Error('event_persistence_failed');

    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(resourceId)}`, { headers: { Authorization: `Bearer ${String(accessToken)}` } });
    if (!mpResp.ok) return json({ error: 'payment_lookup_failed' }, 502);
    const mpData = await mpResp.json();
    const status = String(mpData.status ?? 'pending');
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'approved') patch.approved_at = new Date().toISOString();
    if (status === 'rejected') patch.rejected_at = new Date().toISOString();
    if (status === 'refunded') patch.refunded_at = new Date().toISOString();

    const { data: payment, error: paymentError } = await service.from('mpago_payments').update(patch)
      .eq('company_id', merchantCompanyId).eq('mp_payment_id', resourceId)
      .eq('context_type', 'billing_initial_checkout').select('id,context_id,status').maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment?.context_id) return json({ error: 'initial_checkout_payment_not_found' }, 404);

    if (status === 'approved') {
      const { error: finalError } = await service.rpc('billing_finalize_initial_checkout', { p_checkout_session_id: payment.context_id });
      if (finalError) throw finalError;
    }

    await service.from('mpago_webhook_events').update({ processed: true, processed_at: new Date().toISOString(), processing_error: null }).eq('id', event.id);
    return json({ ok: true, status });
  } catch (error) {
    console.error('[core-initial-checkout-webhook]', error);
    return json({ error: 'webhook_processing_failed' }, 500);
  }
});
