// Mercado Pago — Webhook (público, valida assinatura HMAC se configurada)
// Recebe notificações de payment, merchant_order, plan, subscription
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
};

async function verifySignature(secret: string, dataId: string, requestId: string, ts: string, v1: string): Promise<boolean> {
  try {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === v1;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const eventType = payload.type ?? payload.topic ?? 'unknown';
    const resourceId = String(payload.data?.id ?? payload.resource ?? payload.id ?? '');
    const action = payload.action ?? null;
    const mpEventId = req.headers.get('x-request-id') ?? `${eventType}-${resourceId}-${Date.now()}`;

    // 1. Identifica company (via metadata do recurso ou ?company_id query)
    const url = new URL(req.url);
    let companyId: string | null = url.searchParams.get('company_id');

    // 2. Valida assinatura (se configurada)
    let signatureValid: boolean | null = null;
    if (companyId) {
      const { data: cred } = await supabase
        .from('mpago_credentials').select('webhook_secret_name').eq('company_id', companyId).maybeSingle();
      if (cred?.webhook_secret_name) {
        const sigHeader = req.headers.get('x-signature') ?? '';
        const tsMatch = sigHeader.match(/ts=([^,]+)/);
        const v1Match = sigHeader.match(/v1=([^,]+)/);
        const secret = Deno.env.get(cred.webhook_secret_name);
        if (secret && tsMatch && v1Match) {
          signatureValid = await verifySignature(secret, resourceId, mpEventId, tsMatch[1], v1Match[1]);
        } else {
          signatureValid = false;
        }
      }
    }

    // 3. Persiste evento (idempotente)
    const { data: evt, error: evtErr } = await supabase
      .from('mpago_webhook_events')
      .upsert({
        company_id: companyId,
        event_type: eventType,
        mp_event_id: mpEventId,
        mp_resource_id: resourceId,
        action,
        raw_payload: payload,
        signature_valid: signatureValid,
      }, { onConflict: 'mp_event_id,event_type', ignoreDuplicates: false })
      .select()
      .single();

    if (evtErr) console.error('Webhook log error:', evtErr);

    // 4. Processa por tipo de evento
    if (eventType === 'payment' && resourceId) {
      // Busca dados completos do pagamento na API do MP
      let accessToken: string | null = null;
      if (companyId) {
        const { data: cred } = await supabase
          .from('mpago_credentials').select('access_token_secret_name').eq('company_id', companyId).eq('active', true).maybeSingle();
        if (cred) accessToken = Deno.env.get(cred.access_token_secret_name) ?? null;
      }
      // Fallback: tenta achar a credencial via mp_payments existente
      if (!accessToken) {
        const { data: existing } = await supabase
          .from('mpago_payments').select('company_id').eq('mp_payment_id', resourceId).maybeSingle();
        if (existing?.company_id) {
          companyId = existing.company_id;
          const { data: cred } = await supabase
            .from('mpago_credentials').select('access_token_secret_name').eq('company_id', companyId).eq('active', true).maybeSingle();
          if (cred) accessToken = Deno.env.get(cred.access_token_secret_name) ?? null;
        }
      }

      if (accessToken) {
        const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (mpResp.ok) {
          const mpData = await mpResp.json();
          const update: Record<string, unknown> = {
            status: mpData.status,
            updated_at: new Date().toISOString(),
          };
          if (mpData.status === 'approved') update.approved_at = new Date().toISOString();
          if (mpData.status === 'rejected') update.rejected_at = new Date().toISOString();
          if (mpData.status === 'refunded') update.refunded_at = new Date().toISOString();

          await supabase
            .from('mpago_payments')
            .update(update)
            .eq('mp_payment_id', resourceId);
        }
      }
    }

    // 5. Marca evento como processado
    if (evt?.id) {
      await supabase.from('mpago_webhook_events').update({
        processed: true, processed_at: new Date().toISOString(),
      }).eq('id', evt.id);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    // 200 para MP não reenviar infinitamente
  }
});
