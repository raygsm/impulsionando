import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'node:crypto';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
if (!url || !key || !email || !password) throw new Error('missing_e2e_environment');

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const login = await supabase.auth.signInWithPassword({ email, password });
if (login.error || !login.data.user || !login.data.session) throw new Error(`e2e_auth_failed:${login.error?.message ?? 'unknown'}`);
const user = login.data.user;

const companyRes = await supabase.rpc('current_user_company_id');
if (companyRes.error || !companyRes.data) throw new Error(`e2e_company_missing:${companyRes.error?.message ?? 'no_company'}`);
const companyId = String(companyRes.data);

const planRes = await supabase.from('billing_plans')
  .select('id,code,name,legal_text,is_active,allow_direct_checkout')
  .eq('code', 'ESSENCIAL').eq('is_active', true).single();
if (planRes.error || !planRes.data) throw new Error(`e2e_plan_missing:${planRes.error?.message ?? 'no_plan'}`);
const plan = planRes.data;
if (!plan.allow_direct_checkout) throw new Error('e2e_direct_checkout_disabled');
if (!String(plan.legal_text ?? '').trim()) throw new Error('e2e_terms_missing');

const termsVersion = `billing-${String(plan.code).toLowerCase()}-2026-08`;
const termsHash = createHash('sha256').update(String(plan.legal_text).trim(), 'utf8').digest('hex');
const idempotency = `e2e-core-pix:${companyId}:${plan.id}:${randomUUID()}`;
const sessionRes = await supabase.rpc('billing_create_initial_checkout_session', {
  p_company_id: companyId,
  p_plan_id: plan.id,
  p_contact_name: 'E2E Core Billing',
  p_contact_email: email,
  p_contact_phone: null,
  p_contact_doc: null,
  p_terms_version: termsVersion,
  p_terms_hash: termsHash,
  p_idempotency_key: idempotency,
  p_accepted_ip: null,
});
if (sessionRes.error) throw new Error(`e2e_session_failed:${sessionRes.error.message}`);
const sessionId = String(sessionRes.data?.session_id ?? '');
if (!sessionId) throw new Error('e2e_session_id_missing');

const edge = await supabase.functions.invoke('core-initial-checkout-payment', {
  body: { checkout_session_id: sessionId },
});
if (edge.error) throw new Error(`e2e_edge_failed:${edge.error.message}`);
if (!edge.data?.ok || !edge.data?.payment) throw new Error(`e2e_payment_failed:${edge.data?.error ?? 'unknown'}`);
const payment = edge.data.payment;
if (!String(payment.mp_payment_id ?? '')) throw new Error('e2e_mp_payment_id_missing');
if (!String(payment.pix_qr_code ?? '')) throw new Error('e2e_pix_qr_missing');
if (!(Number(payment.amount_cents) > 0)) throw new Error('e2e_amount_invalid');
if (!['pending','in_process','approved'].includes(String(payment.status))) throw new Error(`e2e_unexpected_status:${payment.status}`);

const sessionCheck = await supabase.from('billing_checkout_sessions')
  .select('id,status,mpago_payment_id,customer_company_id')
  .eq('id', sessionId).single();
if (sessionCheck.error || !sessionCheck.data) throw new Error(`e2e_session_verify_failed:${sessionCheck.error?.message ?? 'missing'}`);
if (String(sessionCheck.data.customer_company_id) !== companyId) throw new Error('e2e_company_isolation_failed');
if (!sessionCheck.data.mpago_payment_id) throw new Error('e2e_payment_link_missing');

const reuse = await supabase.functions.invoke('core-initial-checkout-payment', { body: { checkout_session_id: sessionId } });
if (reuse.error || !reuse.data?.ok || !reuse.data?.reused) throw new Error(`e2e_idempotency_failed:${reuse.error?.message ?? reuse.data?.error ?? 'not_reused'}`);
if (String(reuse.data.payment?.mp_payment_id ?? '') !== String(payment.mp_payment_id)) throw new Error('e2e_duplicate_payment_detected');

console.log(JSON.stringify({
  ok: true,
  checkout_session_id: sessionId,
  payment_status: payment.status,
  amount_cents: payment.amount_cents,
  merchant_payment_created: true,
  pix_qr_present: true,
  idempotency_reused: true,
  user_id: user.id,
  company_id: companyId,
}));
