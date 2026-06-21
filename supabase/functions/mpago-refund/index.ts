// Mercado Pago — Refund (estorno)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const { payment_id, amount_cents, reason } = await req.json();
    if (!payment_id) return new Response(JSON.stringify({ error: 'payment_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: payment, error: pErr } = await supabase
      .from('mpago_payments').select('*').eq('id', payment_id).single();
    if (pErr || !payment) return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (payment.status !== 'approved') return new Response(JSON.stringify({ error: 'Only approved payments can be refunded' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: cred } = await supabase
      .from('mpago_credentials').select('access_token_secret_name').eq('company_id', payment.company_id).eq('active', true).maybeSingle();
    if (!cred) return new Response(JSON.stringify({ error: 'MP credentials not configured' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const accessToken = Deno.env.get(cred.access_token_secret_name);
    if (!accessToken) return new Response(JSON.stringify({ error: 'Access token not found' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const refundAmount = amount_cents ?? payment.amount_cents;
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${payment.mp_payment_id}/refunds`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ amount: refundAmount / 100 }),
    });
    const mpData = await mpResp.json();
    if (!mpResp.ok) return new Response(JSON.stringify({ error: 'MP refund failed', details: mpData }), { status: mpResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: refund } = await supabase.from('mpago_refunds').insert({
      payment_id: payment.id,
      company_id: payment.company_id,
      mp_refund_id: String(mpData.id),
      amount_cents: refundAmount,
      reason: reason ?? null,
      status: 'approved',
      requested_by: user.id,
    }).select().single();

    await supabase.from('mpago_payments').update({
      status: refundAmount >= payment.amount_cents ? 'refunded' : 'approved',
      refunded_at: refundAmount >= payment.amount_cents ? new Date().toISOString() : null,
    }).eq('id', payment.id);

    return new Response(JSON.stringify({ refund, mp: mpData }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Refund error:', e);
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await supabase.from('runtime_events').insert({
        scope: 'mpago.refund',
        level: 'error',
        message: String(e?.message ?? e),
        context: { stack: String(e?.stack ?? '').slice(0, 4000) },
      });
    } catch (_) { /* best-effort */ }
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

