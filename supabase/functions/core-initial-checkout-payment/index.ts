import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const IMPULSIONANDO_COMPANY_ID = 'bda711e0-cbfa-4899-a068-0c75f96d4e59';
const EXPECTED_ACCESS_SECRET = `mpago:${IMPULSIONANDO_COMPANY_ID}:production:access_token`;
const EXPECTED_WEBHOOK_SECRET = `mpago:${IMPULSIONANDO_COMPANY_ID}:production:webhook_secret`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.toLowerCase().startsWith('bearer ')) return json({ error: 'authentication_required' }, 401);

    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    const user = userData.user;
    if (userError || !user) return json({ error: 'invalid_session' }, 401);

    const service = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.checkout_session_id ?? '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return json({ error: 'invalid_checkout_session' }, 400);

    const { data: session, error: sessionError } = await service.from('billing_checkout_sessions')
      .select('id,plan_id,customer_company_id,contact_name,contact_email,terms_version,terms_hash,accepted_at,accepted_user_id,status,mpago_payment_id,expires_at')
      .eq('id', sessionId).maybeSingle();
    if (sessionError || !session) return json({ error: 'checkout_session_not_found' }, 404);
    if (!session.customer_company_id || session.accepted_user_id !== user.id) return json({ error: 'forbidden' }, 403);
    if (new Date(session.expires_at) <= new Date()) return json({ error: 'checkout_session_expired' }, 409);
    if (!session.accepted_at || !session.terms_version || !session.terms_hash) return json({ error: 'terms_acceptance_required' }, 409);

    const { data: belongs } = await service.rpc('user_belongs_to_company', { _user: user.id, _company: session.customer_company_id });
    if (!belongs) return json({ error: 'forbidden' }, 403);

    if (session.mpago_payment_id) {
      const { data: existing } = await service.from('mpago_payments').select('id,mp_payment_id,status,amount_cents,pix_qr_code,pix_qr_code_base64,pix_expires_at').eq('id', session.mpago_payment_id).maybeSingle();
      if (existing) return json({ ok: true, checkout_session_id: session.id, payment: existing, reused: true });
    }

    const effectiveDate = new Date(session.accepted_at).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const { data: quote, error: quoteError } = await service.rpc('billing_initial_contract_quote', { p_plan_id: session.plan_id, p_effective_date: effectiveDate });
    if (quoteError || !quote) return json({ error: 'quote_unavailable' }, 409);
    const amountCents = Math.round(Number(quote.initial_total) * 100);
    if (!Number.isInteger(amountCents) || amountCents <= 0) return json({ error: 'invalid_checkout_amount' }, 409);

    const { data: masterCompanyId, error: masterError } = await service.rpc('master_company_id');
    if (masterError || String(masterCompanyId) !== IMPULSIONANDO_COMPANY_ID) {
      console.error('[core-initial-checkout-payment] merchant identity mismatch', { masterCompanyId });
      return json({ error: 'impulsionando_merchant_identity_mismatch' }, 503);
    }
    const { data: credential, error: credentialError } = await service.from('mpago_credentials')
      .select('access_token_secret_name,webhook_secret_name,environment,company_id').eq('company_id', IMPULSIONANDO_COMPANY_ID).eq('active', true)
      .eq('environment', 'production').limit(1).maybeSingle();
    if (credentialError || !credential) return json({ error: 'impulsionando_merchant_not_configured' }, 503);
    if (credential.company_id !== IMPULSIONANDO_COMPANY_ID || credential.access_token_secret_name !== EXPECTED_ACCESS_SECRET || credential.webhook_secret_name !== EXPECTED_WEBHOOK_SECRET) {
      console.error('[core-initial-checkout-payment] merchant credential isolation violation');
      return json({ error: 'impulsionando_merchant_credential_isolation_violation' }, 503);
    }
    if (String(credential.access_token_secret_name).startsWith('chrismed_') || String(credential.webhook_secret_name).startsWith('chrismed_')) {
      console.error('[core-initial-checkout-payment] CHRISMED credential rejected');
      return json({ error: 'cross_merchant_credential_rejected' }, 503);
    }
    const { data: token } = await service.rpc('reveal_secret_value', { p_name: EXPECTED_ACCESS_SECRET });
    if (!token) return json({ error: 'impulsionando_merchant_secret_unavailable' }, 503);

    const notificationUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/core-initial-checkout-webhook?company_id=${encodeURIComponent(IMPULSIONANDO_COMPANY_ID)}`;
    const externalReference = `billing_initial_checkout:${session.id}`;
    const metadata = {
      merchant_company_id: IMPULSIONANDO_COMPANY_ID,
      context_type: 'billing_initial_checkout',
      checkout_session_id: session.id,
      billed_customer_company_id: session.customer_company_id,
      authenticated_user_id: user.id,
      terms_version: session.terms_version,
      terms_hash: session.terms_hash,
    };
    const mpPayload = {
      transaction_amount: amountCents / 100,
      description: 'Impulsionando Tecnologia - contratacao inicial',
      payment_method_id: 'pix',
      external_reference: externalReference,
      notification_url: notificationUrl,
      payer: { email: session.contact_email, first_name: String(session.contact_name ?? '').split(' ')[0] || undefined },
      metadata,
    };
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${String(token)}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': `initial-${session.id}` },
      body: JSON.stringify(mpPayload),
    });
    const mpData = await mpResponse.json();
    if (!mpResponse.ok) return json({ error: 'mercado_pago_error', details: mpData }, mpResponse.status);

    const { data: payment, error: persistError } = await service.from('mpago_payments').insert({
      company_id: IMPULSIONANDO_COMPANY_ID,
      external_reference: externalReference,
      mp_payment_id: String(mpData.id),
      payment_method: 'pix',
      status: mpData.status ?? 'pending',
      amount_cents: amountCents,
      description: 'Impulsionando Tecnologia - contratacao inicial',
      payer_email: session.contact_email,
      payer_name: session.contact_name,
      context_type: 'billing_initial_checkout',
      context_id: session.id,
      metadata,
      pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code ?? null,
      pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      pix_expires_at: mpData.date_of_expiration ?? null,
    }).select('id,mp_payment_id,status,amount_cents,pix_qr_code,pix_qr_code_base64,pix_expires_at').single();
    if (persistError || !payment) return json({ error: 'payment_persistence_failed', details: persistError?.message }, 500);

    const { error: linkError } = await service.from('billing_checkout_sessions').update({ mpago_payment_id: payment.id, status: 'payment_pending', updated_at: new Date().toISOString(), metadata: { payment_provider: 'mercado_pago', merchant_company_id: IMPULSIONANDO_COMPANY_ID, quote } }).eq('id', session.id);
    if (linkError) return json({ error: 'checkout_payment_link_failed' }, 500);

    if (payment.status === 'approved') {
      const { error: finalError } = await service.rpc('billing_finalize_initial_checkout', { p_checkout_session_id: session.id });
      if (finalError) return json({ error: 'payment_approved_but_finalize_failed', details: finalError.message }, 503);
    }

    return json({ ok: true, checkout_session_id: session.id, payment, quote, reused: false });
  } catch (error) {
    console.error('[core-initial-checkout-payment]', error);
    return json({ error: 'initial_checkout_payment_failed' }, 500);
  }
});