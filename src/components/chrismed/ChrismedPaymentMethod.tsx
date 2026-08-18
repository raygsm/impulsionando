import { useEffect, useState } from 'react';
import { CreditCard, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window { MercadoPago?: any }
}

type PixIntent = { method: 'pix' };
export type ChrismedCardIntent = {
  method: 'credit_card';
  token: string;
  paymentMethodId: string;
  installments: number;
};
export type ChrismedPaymentIntent = PixIntent | ChrismedCardIntent;

let currentIntent: ChrismedPaymentIntent = { method: 'pix' };
let mpSdkPromise: Promise<void> | null = null;

export function getChrismedPaymentIntent(): ChrismedPaymentIntent { return currentIntent; }
export function resetChrismedPaymentIntent() { currentIntent = { method: 'pix' }; }

function loadMercadoPagoSdk() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (mpSdkPromise) return mpSdkPromise;
  mpSdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]');
    const script = existing ?? document.createElement('script');
    const timeout = window.setTimeout(() => reject(new Error('Tempo esgotado ao carregar o Mercado Pago.')), 12000);
    const done = () => { window.clearTimeout(timeout); if (window.MercadoPago) resolve(); else reject(new Error('Mercado Pago temporariamente indisponível.')); };
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', () => { window.clearTimeout(timeout); mpSdkPromise = null; reject(new Error('Não foi possível carregar o Mercado Pago.')); }, { once: true });
    if (!existing) { script.src = 'https://sdk.mercadopago.com/js/v2'; script.async = true; document.head.appendChild(script); }
    else {
      const timer = window.setInterval(() => { if (window.MercadoPago) { window.clearInterval(timer); done(); } }, 150);
      window.setTimeout(() => window.clearInterval(timer), 12500);
    }
  });
  return mpSdkPromise;
}

export function ChrismedPaymentMethod({ patientDocument }: { patientDocument: string }) {
  const [method, setMethod] = useState<'pix' | 'credit_card'>('pix');
  const [publicKey, setPublicKey] = useState('');
  const [cardEnabled, setCardEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [form, setForm] = useState({ number: '', name: '', month: '', year: '', cvv: '', installments: 1 });

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data, error } = await supabase.rpc('chrismed_get_public_payment_config' as never);
      const cfg = data as unknown as { public_key?: string; card_enabled?: boolean } | null;
      if (!alive || error || !cfg?.public_key) return;
      setPublicKey(cfg.public_key); setCardEnabled(cfg.card_enabled !== false);
    })();
    return () => { alive = false; };
  }, []);

  function choose(next: 'pix' | 'credit_card') {
    setMethod(next); setPrepared(false);
    currentIntent = next === 'pix' ? { method: 'pix' } : { method: 'credit_card', token: '', paymentMethodId: '', installments: 1 };
  }

  function invalidateCard() {
    setPrepared(false);
    currentIntent = method === 'credit_card' ? { method: 'credit_card', token: '', paymentMethodId: '', installments: 1 } : { method: 'pix' };
  }

  async function prepareCard() {
    const doc = patientDocument.replace(/\D/g, '');
    const number = form.number.replace(/\D/g, '');
    if (!cardEnabled || !publicKey) return toast.error('Pagamento por cartão está temporariamente indisponível.');
    if (number.length < 13 || !form.name.trim() || !/^\d{1,2}$/.test(form.month) || !/^\d{2,4}$/.test(form.year) || !/^\d{3,4}$/.test(form.cvv) || doc.length !== 11) return toast.error('Revise os dados do cartão e o CPF antes de continuar.');
    setBusy(true);
    try {
      await loadMercadoPagoSdk();
      const mp = new window.MercadoPago(publicKey);
      const token = await mp.createCardToken({ cardNumber: number, cardholderName: form.name.trim(), cardExpirationMonth: form.month.padStart(2, '0'), cardExpirationYear: form.year.length === 2 ? `20${form.year}` : form.year, securityCode: form.cvv, identificationType: 'CPF', identificationNumber: doc });
      if (!token?.id) throw new Error('Não foi possível validar o cartão. Confira os dados e tente novamente.');
      const methods = await mp.getPaymentMethods({ bin: number.slice(0, 6) });
      const paymentMethodId = methods?.results?.[0]?.id;
      if (!paymentMethodId) throw new Error('Não foi possível identificar a bandeira do cartão.');
      currentIntent = { method: 'credit_card', token: String(token.id), paymentMethodId: String(paymentMethodId), installments: Math.min(Math.max(Number(form.installments) || 1, 1), 12) };
      setPrepared(true); toast.success('Cartão validado com segurança pelo Mercado Pago.');
    } catch (error) {
      currentIntent = { method: 'credit_card', token: '', paymentMethodId: '', installments: 1 };
      setPrepared(false); toast.error(error instanceof Error ? error.message : 'Não foi possível preparar o cartão.');
    } finally { setBusy(false); }
  }

  return <div className="rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-4">
    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--chrismed-mist)]">Forma de pagamento</div>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => choose('pix')} className={`rounded-lg border p-3 text-left ${method === 'pix' ? 'border-[var(--chrismed-ink)] bg-[var(--chrismed-ivory)]' : 'border-[var(--chrismed-sand)]'}`}><QrCode className="mb-1 h-4 w-4" /><strong className="text-sm">PIX</strong><div className="text-[11px] text-[var(--chrismed-mist)]">Confirmação automática</div></button>
      <button type="button" disabled={!cardEnabled} onClick={() => choose('credit_card')} className={`rounded-lg border p-3 text-left disabled:opacity-50 ${method === 'credit_card' ? 'border-[var(--chrismed-ink)] bg-[var(--chrismed-ivory)]' : 'border-[var(--chrismed-sand)]'}`}><CreditCard className="mb-1 h-4 w-4" /><strong className="text-sm">Cartão</strong><div className="text-[11px] text-[var(--chrismed-mist)]">Tokenização Mercado Pago</div></button>
    </div>
    {method === 'credit_card' && <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="col-span-2"><Label>Número do cartão</Label><Input autoComplete="cc-number" inputMode="numeric" value={form.number} onChange={(e) => { invalidateCard(); setForm({...form,number:e.target.value}); }} placeholder="0000 0000 0000 0000" /></div>
      <div className="col-span-2"><Label>Nome no cartão</Label><Input autoComplete="cc-name" value={form.name} onChange={(e) => { invalidateCard(); setForm({...form,name:e.target.value}); }} /></div>
      <div><Label>Mês</Label><Input autoComplete="cc-exp-month" inputMode="numeric" maxLength={2} value={form.month} onChange={(e) => { invalidateCard(); setForm({...form,month:e.target.value.replace(/\D/g,'').slice(0,2)}); }} placeholder="MM" /></div>
      <div><Label>Ano</Label><Input autoComplete="cc-exp-year" inputMode="numeric" maxLength={4} value={form.year} onChange={(e) => { invalidateCard(); setForm({...form,year:e.target.value.replace(/\D/g,'').slice(0,4)}); }} placeholder="AAAA" /></div>
      <div><Label>CVV</Label><Input autoComplete="cc-csc" inputMode="numeric" maxLength={4} type="password" value={form.cvv} onChange={(e) => { invalidateCard(); setForm({...form,cvv:e.target.value.replace(/\D/g,'').slice(0,4)}); }} /></div>
      <div><Label>Parcelas</Label><Input type="number" min={1} max={12} value={form.installments} onChange={(e) => { invalidateCard(); setForm({...form,installments:Number(e.target.value)}); }} /></div>
      <div className="col-span-2"><Button type="button" variant="outline" disabled={busy || prepared} onClick={() => void prepareCard()} className="w-full border-[var(--chrismed-ink)]">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validando cartão…</> : prepared ? <><ShieldCheck className="mr-2 h-4 w-4" />Cartão pronto</> : <><ShieldCheck className="mr-2 h-4 w-4" />Validar cartão com Mercado Pago</>}</Button><p className="mt-2 text-[10px] leading-4 text-[var(--chrismed-mist)]">Número e CVV não são armazenados pela CHRISMED. O navegador envia esses dados diretamente ao Mercado Pago e a CHRISMED recebe apenas um token temporário.</p></div>
    </div>}
  </div>;
}
