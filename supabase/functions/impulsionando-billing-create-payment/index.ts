import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const IMPULSIONANDO_COMPANY_ID = 'bda711e0-cbfa-4899-a068-0c75f96d4e59';
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://impulsionando.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
type Body = { checkout_session_id: string; payment_method: 'pix' | 'credit_card'; token?: string; installments?: number; payment_method_id?: string; issuer_id?: string; };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
    if (!supabaseUrl || !serviceKey || !publishableKey) return json({ error: 'server_not_configured' }, 503);
    const authorization = req.headers.get('authorization') ?? '';
    if (!authorization.toLowerCase().startsWith('bearer ')) return json({ error: 'authentication_required' }, 401);
    const authClient = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: 'authentication_required' }, 401);
    const user = authData.user;
    const body = await req.json() as Body;
    if (!body.checkout_session_id || !['pix', 'credit_card'].includes(body.payment_method)) return json({ error: 'invalid_request' }, 400);
    const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: session } = await service.from('billing_checkout_sessions').select('*').eq('id', body.checkout_session_id).maybeSingle();
    if (!session) return json({ error: 'checkout_session_not_found' }, 404);
    if (!session.accepted_at || session.accepted_user_id !== user.id) return json({ error: 'checkout_not_accepted_by_current_user' }, 403);
    if (session.expires_at && new Date(session.expires_at) <= new Date()) return json({ error: 'checkout_session_expired' }, 409);
    if (String(session.contact_email ?? '').trim().toLowerCase() !== String(user.email ?? '').trim().toLowerCase()) return json({ error: 'checkout_identity_mismatch' }, 403);
    if (session.mpago_payment_id) {
      const { data: existing } = await service.from('mpago_payments').select('*').eq('id', session.mpago_payment_id).maybeSingle();
      if (existing) return json({ payment: existing, reused: true });
    }
    const { data: plan } = await service.from('billing_plans').select('*').eq('id', session.plan_id).eq('is_active', true).maybeSingle();
    if (!plan) return json({ error: 'plan_not_available' }, 409);
    if (!plan.show_in_checkout || !plan.allow_direct_checkout) return json({ error: 'direct_checkout_not_enabled_for_plan' }, 409);
    const setupCents = Math.round(Number(session.setup_amount ?? plan.setup_fee ?? 0) * 100);
    const recurringCents = Math.round(Number(session.recurring_amount ?? plan.recurring_amount ?? 0) * 100);
    const amountCents = setupCents + recurringCents;
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return json({ error: 'invalid_checkout_amount' }, 409);
    const { data: cred } = await service.from('mpago_credentials').select('access_token_secret_name,active,environment').eq('company_id', IMPULSIONANDO_COMPANY_ID).eq('active', true).eq('environment', 'production').limit(1).maybeSingle();
    if (!cred?.access_token_secret_name) return json({ error: 'payment_provider_not_configured' }, 503);
    const { data: revealedAccessToken } = await service.rpc('reveal_secret_value', { p_name: cred.access_token_secret_name });
    const accessToken = String(revealedAccessToken ?? '');
    if (!accessToken) return json({ error: 'payment_provider_secret_unavailable' }, 503);
    const externalReference = `impulsionando:billing_checkout:${session.id}`;
    const idempotencyKey = session.idempotency_key || `impulsionando-billing-${session.id}`;
    const notificationUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/impulsionando-billing-webhook`;
    const description = `Impulsionando Tecnologia - ${plan.name}`;
    let mpBody: Record<string, unknown>;
    if (body.payment_method === 'pix') {
      mpBody = { transaction_amount: amountCents / 100, description, payment_method_id: 'pix', external_reference: externalReference, notification_url: notificationUrl, payer: { email: session.contact_email, first_name: String(session.contact_name ?? '').trim().split(' ')[0] || undefined, last_name: String(session.contact_name ?? '').trim().split(' ').slice(1).join(' ') || undefined, identification: session.contact_doc ? { type: 'CNPJ', number: String(session.contact_doc).replace(/\D/g, '') } : undefined }, metadata: { checkout_session_id: session.id, plan_id: plan.id, plan_code: plan.code } };
    } else {
      if (!body.token || !body.payment_method_id) return json({ error: 'card_token_required' }, 400);
      mpBody = { transaction_amount: amountCents / 100, token: body.token, description, installments: Math.max(1, Math.min(Number(body.installments ?? 1), 12)), payment_method_id: body.payment_method_id, issuer_id: body.issuer_id, external_reference: externalReference, notification_url: notificationUrl, payer: { email: session.contact_email, identification: session.contact_doc ? { type: 'CNPJ', number: String(session.contact_doc).replace(/\D/g, '') } : undefined }, metadata: { checkout_session_id: session.id, plan_id: plan.id, plan_code: plan.code } };
    }
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey }, body: JSON.stringify(mpBody), signal: AbortSignal.timeout(15000) });
    const mpData = await mpResponse.json();
    if (!mpResponse.ok) return json({ error: 'payment_provider_rejected', provider_status: mpResponse.status }, 502);
    const paymentRow = { company_id: IMPULSIONANDO_COMPANY_ID, external_reference: externalReference, mp_payment_id: String(mpData.id), payment_method: body.payment_method, status: String(mpData.status ?? 'pending'), amount_cents: amountCents, description, payer_email: session.contact_email, payer_name: session.contact_name, payer_doc: session.contact_doc, context_type: 'billing_checkout_session', context_id: session.id, metadata: { plan_id: plan.id, plan_code: plan.code, setup_cents: setupCents, recurring_cents: recurringCents }, pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code ?? null, pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 ?? null, pix_expires_at: mpData.date_of_expiration ?? null, card_last4: mpData.card?.last_four_digits ?? null, installments: mpData.installments ?? null };
    const { data: payment, error: paymentError } = await service.from('mpago_payments').insert(paymentRow).select().single();
    if (paymentError || !payment) return json({ error: 'payment_persist_failed' }, 503);
    const nextStatus = payment.status === 'approved' ? 'paid' : 'payment_pending';
    const { error: sessionUpdateError } = await service.from('billing_checkout_sessions').update({ mpago_payment_id: payment.id, status: nextStatus, updated_at: new Date().toISOString() }).eq('id', session.id).eq('accepted_user_id', user.id);
    if (sessionUpdateError) return json({ error: 'payment_created_reconciliation_required', payment_id: payment.id }, 503);
    if (payment.status === 'approved') {
      const { error: finalizeError } = await service.rpc('core_finalize_impulsionando_checkout', { p_checkout_session_id: session.id, p_payment_id: payment.id, p_mp_payment_id: String(mpData.id) });
      if (finalizeError) return json({ error: 'payment_approved_provisioning_required', payment_id: payment.id }, 503);
    }
    return json({ payment: { id: payment.id, status: payment.status, amount_cents: payment.amount_cents, payment_method: payment.payment_method, pix_qr_code: payment.pix_qr_code, pix_qr_code_base64: payment.pix_qr_code_base64, pix_expires_at: payment.pix_expires_at }, checkout_session_id: session.id });
  } catch (error) {
    console.error('[impulsionando-billing-create-payment]', error);
    return json({ error: 'payment_creation_failed' }, 500);
  }
});
