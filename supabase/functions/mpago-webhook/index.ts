import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type,x-signature,x-request-id',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

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
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get('company_id');
    if (!companyId) return json({ error: 'company_id_required' }, 400);

    const raw = await req.text();
    const payload = JSON.parse(raw || '{}');
    const eventType = String(payload.type ?? payload.topic ?? 'unknown');
    const resourceId = String(payload.data?.id ?? payload.resource ?? payload.id ?? '');
    const requestId = req.headers.get('x-request-id') ?? '';
    const signature = req.headers.get('x-signature') ?? '';
    if (!resourceId || !requestId || !signature) return json({ error: 'invalid_webhook_headers' }, 401);

    const { data: cred, error: credError } = await service.from('mpago_credentials')
      .select('access_token_secret_name,webhook_secret_name,active')
      .eq('company_id', companyId).eq('active', true).limit(1).maybeSingle();
    if (credError || !cred?.webhook_secret_name || !cred?.access_token_secret_name) return json({ error: 'mercado_pago_credentials_not_configured' }, 503);

    const [{ data: webhookSecret }, { data: accessToken }] = await Promise.all([
      service.rpc('reveal_secret_value', { p_name: cred.webhook_secret_name }),
      service.rpc('reveal_secret_value', { p_name: cred.access_token_secret_name }),
    ]);
    if (!webhookSecret || !accessToken) return json({ error: 'mercado_pago_secrets_not_available' }, 503);
    if (!(await verifySignature(String(webhookSecret), resourceId, requestId, signature))) return json({ error: 'invalid_webhook_signature' }, 401);

    const { data: event, error: eventError } = await service.from('mpago_webhook_events').upsert({
      company_id: companyId,
      event_type: eventType,
      mp_event_id: requestId,
      mp_resource_id: resourceId,
      action: payload.action ?? null,
      raw_payload: payload,
      signature_valid: true,
      processed: false,
    }, { onConflict: 'mp_event_id,event_type' }).select('id,processed').single();
    if (eventError) throw eventError;
    if (event?.processed) return json({ ok: true, duplicate: true });

    if (eventType === 'payment' && resourceId) {
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(resourceId)}`, { headers: { Authorization: `Bearer ${String(accessToken)}` } });
      if (!mpResp.ok) return json({ error: 'mercado_pago_payment_lookup_failed' }, 502);
      const mpData = await mpResp.json();
      const status = String(mpData.status ?? 'pending');
      const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === 'approved') patch.approved_at = new Date().toISOString();
      if (status === 'rejected') patch.rejected_at = new Date().toISOString();
      if (status === 'refunded') patch.refunded_at = new Date().toISOString();

      const { data: payment, error: paymentError } = await service.from('mpago_payments').update(patch)
        .eq('company_id', companyId).eq('mp_payment_id', resourceId).select('*').maybeSingle();
      if (paymentError) throw paymentError;

      // Billing da Impulsionando: a fatura e o valor são definidos no servidor.
      // Quando o Mercado Pago confirma a cobrança vinculada a billing_invoice,
      // delegamos a baixa/reativação para a função canônica do Core.
      if (payment?.context_type === 'billing_invoice' && payment.context_id && status === 'approved') {
        const { error: billingError } = await service.rpc('billing_mark_paid', { _invoice_id: payment.context_id });
        if (billingError) throw billingError;
      }

      if (payment?.context_type === 'chrismed_appointment' && payment.context_id && companyId === CHRISMED_COMPANY_ID) {
        const nextAppointmentStatus = status === 'approved' ? 'confirmed' : ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(status) ? 'cancelled' : 'pending_payment';
        const { data: appointment, error: appointmentError } = await service.from('chrismed_appointments')
          .update({ status: nextAppointmentStatus, updated_at: new Date().toISOString() })
          .eq('id', payment.context_id).eq('company_id', CHRISMED_COMPANY_ID).eq('payment_id', payment.id)
          .select('id,patient_name,patient_email,starts_at,ends_at').maybeSingle();
        if (appointmentError) throw appointmentError;

        if (status === 'approved') {
          await service.from('chrismed_coupon_redemptions').update({ status: 'redeemed', redeemed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('appointment_id', payment.context_id).eq('payment_id', payment.id).eq('status', 'reserved');
        } else if (['rejected', 'cancelled', 'charged_back'].includes(status)) {
          await service.from('chrismed_coupon_redemptions').update({ status: 'released', released_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('appointment_id', payment.context_id).eq('payment_id', payment.id).eq('status', 'reserved');
        } else if (status === 'refunded') {
          await service.from('chrismed_coupon_redemptions').update({ status: 'cancelled', released_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('appointment_id', payment.context_id).eq('payment_id', payment.id).in('status', ['reserved', 'redeemed']);
        }

        if (appointment && nextAppointmentStatus === 'confirmed') {
          const { data: contactEmails, error: contactEmailsError } = await service.rpc('get_chrismed_contact_emails');
          if (contactEmailsError) throw contactEmailsError;
          const contacts = Array.isArray(contactEmails) ? contactEmails[0] : contactEmails;
          const patientChannelEmail = contacts?.patient_email || 'sac@chrismed.com.br';
          const managementEmail = patientChannelEmail;
          const basePayload = { appointment_id: appointment.id, first_name: appointment.patient_name.split(' ')[0] || 'cliente', starts_at: appointment.starts_at, ends_at: appointment.ends_at };
          const jobs = [
            ['appointment_confirmed', appointment.patient_email, new Date().toISOString(), `appointment:${appointment.id}:confirmed:email`],
            ['appointment_reminder_24h', appointment.patient_email, new Date(Math.max(Date.now(), new Date(appointment.starts_at).getTime() - 86400000)).toISOString(), `appointment:${appointment.id}:reminder-24h:email`],
            ['appointment_reminder_2h', appointment.patient_email, new Date(Math.max(Date.now(), new Date(appointment.starts_at).getTime() - 7200000)).toISOString(), `appointment:${appointment.id}:reminder-2h:email`],
            ['appointment_confirmed_management', managementEmail, new Date().toISOString(), `appointment:${appointment.id}:management:email`],
          ];
          for (const [eventCode, recipient, availableAt, idempotencyKey] of jobs) {
            await service.from('chrismed_communication_outbox').upsert({ company_id: CHRISMED_COMPANY_ID, event_code: eventCode, channel: 'email', recipient, payload: basePayload, idempotency_key: idempotencyKey, status: 'pending', attempts: 0, available_at: availableAt, from_email: patientChannelEmail, reply_to_email: patientChannelEmail }, { onConflict: 'idempotency_key', ignoreDuplicates: true });
          }
        }
      }
    }

    await service.from('mpago_webhook_events').update({ processed: true, processed_at: new Date().toISOString(), processing_error: null }).eq('id', event.id);
    return json({ ok: true });
  } catch (error) {
    console.error('[mpago-webhook]', error);
    return json({ error: 'webhook_processing_failed' }, 500);
  }
});
