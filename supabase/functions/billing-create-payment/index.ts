import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const IMPULSIONANDO_MERCHANT_COMPANY_ID = 'bda711e0-cbfa-4899-a068-0c75f96d4e59';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

type Body = {
  invoice_id: string;
  invoice_kind?: 'business' | 'club';
  payment_method: 'pix' | 'credit_card';
  token?: string;
  payment_method_id?: string;
  installments?: number;
  issuer_id?: string;
  identification?: { type: string; number: string };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const service = createClient(supabaseUrl, serviceKey);
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) return json({ error: 'authentication_required' }, 401);
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userResult, error: userError } = await authClient.auth.getUser();
    const user = userResult.user;
    if (userError || !user) return json({ error: 'invalid_session' }, 401);

    const body = await req.json() as Body;
    if (!body.invoice_id || !['pix','credit_card'].includes(body.payment_method)) return json({ error: 'invalid_request' }, 400);
    const kind = body.invoice_kind ?? 'business';

    let amountCents = 0;
    let contextType = '';
    let description = '';
    let billedCompanyId: string | null = null;
    let updateTable = '';

    if (kind === 'club') {
      const { data: invoice, error } = await service.from('clube_membership_invoices').select('id,user_id,amount_cents,status,due_date,membership_id').eq('id', body.invoice_id).maybeSingle();
      if (error || !invoice) return json({ error: 'invoice_not_found' }, 404);
      if (invoice.user_id !== user.id) return json({ error: 'forbidden' }, 403);
      if (!['open','overdue'].includes(invoice.status)) return json({ error: 'invoice_not_payable', status: invoice.status }, 409);
      amountCents = Number(invoice.amount_cents);
      contextType = 'clube_membership_invoice';
      description = 'Clube Impulsionando - mensalidade';
      updateTable = 'clube_membership_invoices';
    } else {
      const { data: invoice, error } = await service.from('billing_invoices').select('id,company_id,contract_id,amount,status,due_date').eq('id', body.invoice_id).maybeSingle();
      if (error || !invoice) return json({ error: 'invoice_not_found' }, 404);
      if (!['open','overdue'].includes(invoice.status)) return json({ error: 'invoice_not_payable', status: invoice.status }, 409);
      const { data: tenant } = await service.from('communication_tenants').select('id').eq('company_id', invoice.company_id).eq('active', true).is('deleted_at', null).maybeSingle();
      const { data: membership } = tenant ? await service.from('communication_tenant_members').select('role').eq('tenant_id', tenant.id).eq('user_id', user.id).maybeSingle() : { data: null };
      const { data: superAdmin } = await service.rpc('is_super_admin', { _user: user.id });
      if (!membership && !superAdmin) return json({ error: 'forbidden' }, 403);
      amountCents = Math.round(Number(invoice.amount) * 100);
      billedCompanyId = invoice.company_id;
      contextType = 'billing_invoice';
      description = 'Impulsionando - mensalidade do Core';
      updateTable = 'billing_invoices';
    }

    if (!Number.isInteger(amountCents) || amountCents <= 0) return json({ error: 'invalid_invoice_amount' }, 409);
    if (body.payment_method === 'credit_card' && (!body.token || !body.payment_method_id)) return json({ error: 'card_token_and_payment_method_required' }, 400);

    const { data: credential, error: credentialError } = await service.from('mpago_credentials').select('access_token_secret_name,environment').eq('company_id', IMPULSIONANDO_MERCHANT_COMPANY_ID).eq('active', true).order('environment', { ascending: false }).limit(1).maybeSingle();
    if (credentialError || !credential) return json({ error: 'merchant_not_configured' }, 503);
    const { data: revealed } = await service.rpc('reveal_secret_value', { p_name: credential.access_token_secret_name });
    const accessToken = (revealed as string | null) ?? Deno.env.get(credential.access_token_secret_name) ?? null;
    if (!accessToken) return json({ error: 'merchant_secret_unavailable' }, 503);

    const notificationUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/mpago-webhook?company_id=${IMPULSIONANDO_MERCHANT_COMPANY_ID}`;
    const externalReference = `${contextType}:${body.invoice_id}`;
    const idempotencyKey = `${contextType}-${body.invoice_id}-${body.payment_method}`;
    const metadata = { context_type: contextType, context_id: body.invoice_id, billed_customer_company_id: billedCompanyId, authenticated_user_id: user.id };
    const payer = { email: user.email!, identification: body.identification };
    const mpPayload: Record<string, unknown> = body.payment_method === 'pix'
      ? { transaction_amount: amountCents / 100, description, payment_method_id: 'pix', external_reference: externalReference, notification_url: notificationUrl, payer, metadata }
      : { transaction_amount: amountCents / 100, description, token: body.token, installments: Math.max(1, Math.min(12, body.installments ?? 1)), payment_method_id: body.payment_method_id, issuer_id: body.issuer_id, external_reference: externalReference, notification_url: notificationUrl, payer, metadata };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(mpPayload),
    });
    const mpData = await mpResponse.json();
    if (!mpResponse.ok) return json({ error: 'mercado_pago_error', details: mpData }, mpResponse.status);

    const paymentRow = {
      company_id: IMPULSIONANDO_MERCHANT_COMPANY_ID,
      external_reference: externalReference,
      mp_payment_id: String(mpData.id),
      payment_method: body.payment_method,
      status: mpData.status ?? 'pending',
      amount_cents: amountCents,
      description,
      payer_email: user.email,
      context_type: contextType,
      context_id: body.invoice_id,
      metadata,
      pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code ?? null,
      pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      pix_expires_at: mpData.date_of_expiration ?? null,
      card_last4: mpData.card?.last_four_digits ?? null,
      installments: mpData.installments ?? null,
    };
    const { data: payment, error: persistError } = await service.from('mpago_payments').insert(paymentRow).select().single();
    if (persistError) return json({ error: 'payment_persistence_failed' }, 500);

    if (updateTable === 'billing_invoices') {
      await service.from(updateTable).update({ mp_payment_id: String(mpData.id), pix_copy_paste: paymentRow.pix_qr_code, metadata: { payment_id: payment.id, payment_context: contextType }, updated_at: new Date().toISOString() }).eq('id', body.invoice_id);
    } else {
      await service.from(updateTable).update({ payment_reference: String(mpData.id), payment_provider: 'mercado_pago', updated_at: new Date().toISOString() }).eq('id', body.invoice_id);
    }

    if (mpData.status === 'approved') {
      if (contextType === 'billing_invoice') await service.rpc('billing_mark_paid', { _invoice_id: body.invoice_id });
      if (contextType === 'clube_membership_invoice') await service.rpc('clube_mark_invoice_paid', { p_invoice_id: body.invoice_id });
    }

    return json({ payment_id: payment.id, status: mpData.status, amount_cents: amountCents, qr_code: paymentRow.pix_qr_code, qr_code_base64: paymentRow.pix_qr_code_base64, card_last4: paymentRow.card_last4, installments: paymentRow.installments });
  } catch (error) {
    console.error('[billing-create-payment]', error);
    return json({ error: 'billing_payment_creation_failed' }, 500);
  }
});
