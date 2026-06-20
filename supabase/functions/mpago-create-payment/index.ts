// Mercado Pago — Create Payment (PIX, Cartão, Preferência de Checkout)
// Multi-tenant: lê credenciais da empresa via mpago_credentials + Vault (secrets).
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
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: { type: string; number: string };
  };
  context_type?: string;
  context_id?: string;
  metadata?: Record<string, unknown>;
  // Split / monetização
  revshare_event_type?: RevshareEvent;
  // Cartão
  token?: string;
  installments?: number;
  payment_method_id?: string;
  issuer_id?: string;
  // Preferência
  items?: Array<{ title: string; quantity: number; unit_price: number }>;
  back_urls?: { success: string; pending: string; failure: string };
}

// Cálculo do fee — espelha src/lib/payouts.ts (cents + bps).
function calcFee(
  gross: number,
  bps: number,
  minBps?: number | null,
  maxBps?: number | null,
): number {
  if (gross <= 0 || bps <= 0) return 0;
  let fee = Math.floor((gross * bps) / 10_000);
  if (minBps != null) fee = Math.max(fee, Math.floor((gross * minBps) / 10_000));
  if (maxBps != null) fee = Math.min(fee, Math.floor((gross * maxBps) / 10_000));
  return Math.min(fee, gross);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body: CreatePaymentBody = await req.json();
    if (!body.company_id || !body.payment_method || !body.amount_cents || !body.description || !body.payer?.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Carrega credenciais da empresa
    const { data: cred, error: credError } = await supabase
      .from('mpago_credentials')
      .select('*')
      .eq('company_id', body.company_id)
      .eq('active', true)
      .order('environment', { ascending: false }) // production primeiro
      .limit(1)
      .maybeSingle();

    if (credError || !cred) {
      return new Response(JSON.stringify({ error: 'Mercado Pago credentials not configured for this company' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const accessToken = Deno.env.get(cred.access_token_secret_name);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: `Secret ${cred.access_token_secret_name} not found` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const externalRef = body.external_reference ?? crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();

    // === Motor de monetização (split) ===========================================
    // Resolve modelo ativo + taxa do evento. Para revshare/hybrid aplicamos
    // application_fee no Mercado Pago e registramos um core_payout_events pendente.
    const revshareEvent: RevshareEvent = (body.revshare_event_type ?? 'service');
    let appFeeCents = 0;
    let modelId: string | null = null;
    let rateId: string | null = null;
    let percentBpsApplied = 0;
    let ruleVersion = 1;
    let modelKind: 'saas' | 'revshare' | 'hybrid' | null = null;
    try {
      const { data: model } = await supabase
        .from('core_monetization_models')
        .select('id, model, version, covered_events')
        .eq('company_id', body.company_id)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (model) {
        modelId = model.id;
        ruleVersion = model.version ?? 1;
        modelKind = model.model;
        const covered = Array.isArray(model.covered_events) ? model.covered_events : [];
        if ((model.model === 'revshare' || model.model === 'hybrid') && covered.includes(revshareEvent)) {
          const { data: rate } = await supabase
            .from('core_revshare_rates')
            .select('id, percent_bps, min_bps, max_bps')
            .eq('model_id', model.id)
            .eq('event_type', revshareEvent)
            .eq('is_active', true)
            .maybeSingle();
          if (rate) {
            rateId = rate.id;
            percentBpsApplied = rate.percent_bps;
            appFeeCents = calcFee(body.amount_cents, rate.percent_bps, rate.min_bps, rate.max_bps);
          }
        }
      }
    } catch (e) {
      console.warn('[monetization] lookup failed (non-fatal):', e);
    }



    let mpResponse: Response;
    let endpoint: string;
    let mpBody: Record<string, unknown>;

    if (body.payment_method === 'preference') {
      // Checkout Pro (preferência)
      endpoint = 'https://api.mercadopago.com/checkout/preferences';
      mpBody = {
        items: body.items ?? [{ title: body.description, quantity: 1, unit_price: body.amount_cents / 100 }],
        payer: { email: body.payer.email, name: body.payer.first_name, surname: body.payer.last_name },
        external_reference: externalRef,
        back_urls: body.back_urls,
        auto_return: 'approved',
        notification_url: `${Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '.functions.supabase.co')}/mpago-webhook`,
        metadata: { company_id: body.company_id, context_type: body.context_type, context_id: body.context_id, ...body.metadata },
      };
    } else if (body.payment_method === 'pix') {
      endpoint = 'https://api.mercadopago.com/v1/payments';
      mpBody = {
        transaction_amount: body.amount_cents / 100,
        description: body.description,
        payment_method_id: 'pix',
        external_reference: externalRef,
        notification_url: `${Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '.functions.supabase.co')}/mpago-webhook`,
        payer: { email: body.payer.email, first_name: body.payer.first_name, last_name: body.payer.last_name, identification: body.payer.identification },
        metadata: { company_id: body.company_id, context_type: body.context_type, context_id: body.context_id, ...body.metadata },
      };
    } else {
      // Cartão (crédito ou débito)
      if (!body.token || !body.payment_method_id) {
        return new Response(JSON.stringify({ error: 'token and payment_method_id required for card payments' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      endpoint = 'https://api.mercadopago.com/v1/payments';
      mpBody = {
        transaction_amount: body.amount_cents / 100,
        token: body.token,
        description: body.description,
        installments: body.installments ?? 1,
        payment_method_id: body.payment_method_id,
        issuer_id: body.issuer_id,
        external_reference: externalRef,
        notification_url: `${Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '.functions.supabase.co')}/mpago-webhook`,
        payer: { email: body.payer.email, identification: body.payer.identification },
        metadata: { company_id: body.company_id, context_type: body.context_type, context_id: body.context_id, ...body.metadata },
      };
    }

    // Aplica application_fee no MP (split nativo) quando houver taxa calculada.
    // Em pagamentos card/pix isso vira retenção automática para a conta Marketplace.
    if (appFeeCents > 0 && body.payment_method !== 'preference') {
      (mpBody as Record<string, unknown>).application_fee = appFeeCents / 100;
    }



    mpResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(mpBody),
    });

    const mpData = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error('MP API error:', mpData);
      return new Response(JSON.stringify({ error: 'Mercado Pago error', details: mpData }), { status: mpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Persiste pagamento
    const paymentRow = {
      company_id: body.company_id,
      external_reference: externalRef,
      mp_payment_id: body.payment_method === 'preference' ? null : String(mpData.id),
      mp_preference_id: body.payment_method === 'preference' ? mpData.id : null,
      payment_method: body.payment_method === 'preference' ? 'other' : body.payment_method,
      status: body.payment_method === 'preference' ? 'pending' : (mpData.status ?? 'pending'),
      amount_cents: body.amount_cents,
      description: body.description,
      payer_email: body.payer.email,
      payer_name: [body.payer.first_name, body.payer.last_name].filter(Boolean).join(' ') || null,
      payer_doc: body.payer.identification?.number ?? null,
      context_type: body.context_type ?? null,
      context_id: body.context_id ?? null,
      metadata: body.metadata ?? {},
      pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code ?? null,
      pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      pix_expires_at: mpData.date_of_expiration ?? null,
      card_last4: mpData.card?.last_four_digits ?? null,
      installments: mpData.installments ?? null,
    };

    const { data: payment, error: insErr } = await supabase
      .from('mpago_payments')
      .insert(paymentRow)
      .select()
      .single();

    if (insErr) {
      console.error('Insert error:', insErr);
      return new Response(JSON.stringify({ error: 'Failed to persist payment', details: insErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === Registra evento de monetização (pending) ============================
    if (modelKind) {
      try {
        await supabase.from('core_payout_events').insert({
          company_id: body.company_id,
          model_id: modelId,
          rate_id: rateId,
          event_type: revshareEvent,
          gross_cents: body.amount_cents,
          fee_cents: appFeeCents,
          percent_bps_applied: percentBpsApplied,
          rule_version: ruleVersion,
          provider: 'mercadopago',
          provider_payment_id: payment.mp_payment_id ?? payment.mp_preference_id ?? null,
          status: 'pending',
          reference_table: 'mpago_payments',
          reference_id: payment.id,
          metadata: { external_reference: externalRef, model_kind: modelKind },
        });
      } catch (e) {
        console.warn('[monetization] failed to record payout event:', e);
      }
    }

    return new Response(JSON.stringify({
      payment,
      mp: {
        id: mpData.id,
        status: mpData.status,
        init_point: mpData.init_point ?? null,
        sandbox_init_point: mpData.sandbox_init_point ?? null,
        qr_code: paymentRow.pix_qr_code,
        qr_code_base64: paymentRow.pix_qr_code_base64,
      },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Unhandled error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
