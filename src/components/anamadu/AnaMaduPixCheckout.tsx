import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, CreditCard, Loader2, QrCode, ShieldCheck } from 'lucide-react';

type PixConfig = {
  pixConfigured: boolean;
  pix: null | { key: string; keyType?: string | null; beneficiary?: string | null };
  mercadoPago: { enabled: boolean; label: string };
};

type OrderResponse = {
  ok: boolean;
  error?: string;
  order?: { id: string; number: string; amount: number; status: string };
  pix?: { key: string; keyType?: string | null; beneficiary?: string | null };
};

function readAttribution() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('anamadu.attribution.v1') || '{}');
  } catch {
    return {};
  }
}

export function AnaMaduPixCheckout() {
  const [config, setConfig] = useState<PixConfig | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderResponse['order']>();
  const [pix, setPix] = useState<OrderResponse['pix']>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/anamadu/pix-order')
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig({ pixConfigured: false, pix: null, mercadoPago: { enabled: false, label: 'Em breve, Mercado Pago' } }));
  }, []);

  const ready = useMemo(() => Boolean(name.trim() && email.trim() && phone.trim() && config?.pixConfigured), [name, email, phone, config]);

  async function createPixOrder() {
    if (!ready || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/anamadu/pix-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          productName: 'Teste de integração Ana Madú',
          amount: 1,
          attribution: readAttribution(),
        }),
      });
      const data: OrderResponse = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Não foi possível gerar o pedido PIX.');
      setOrder(data.order);
      setPix(data.pix);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível gerar o pedido PIX.');
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!pix?.key) return;
    await navigator.clipboard.writeText(pix.key);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section id="checkout-teste" className="border-y border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-stone-500">Homologação da jornada</div>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Produto teste · R$ 1,00</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600">
            Este produto existe para validar a experiência completa da Ana Madú: pedido, PIX, CRM, automações, Anita e réguas de relacionamento.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <QrCode className="size-6" />
              <strong className="mt-4 block">PIX</strong>
              <span className="mt-1 block text-sm text-stone-600">Método disponível para a homologação real.</span>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 opacity-70">
              <CreditCard className="size-6" />
              <strong className="mt-4 block">Em breve, Mercado Pago</strong>
              <span className="mt-1 block text-sm text-stone-600">Cartão e demais meios serão conectados na próxima etapa.</span>
            </div>
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-2xl bg-stone-950 p-4 text-sm text-stone-200">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-300" />
            <span>O pedido só é criado depois da identificação do comprador. O pagamento permanece como aguardando confirmação até a conciliação do PIX.</span>
          </div>
        </div>

        <div className="rounded-[32px] border border-stone-200 bg-[#f8f4ec] p-6 shadow-sm sm:p-8">
          {!order ? (
            <>
              <h3 className="text-2xl font-black">Finalizar por PIX</h3>
              <p className="mt-2 text-sm text-stone-600">Preencha os três dados obrigatórios para gerar o pedido de teste.</p>
              <div className="mt-6 space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" autoComplete="name" className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none focus:border-stone-950" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" autoComplete="email" className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none focus:border-stone-950" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp com DDD" inputMode="tel" autoComplete="tel" className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 outline-none focus:border-stone-950" />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-stone-300 pt-5">
                <span className="text-sm text-stone-600">Total</span>
                <strong className="text-2xl">R$ 1,00</strong>
              </div>

              {!config?.pixConfigured && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  PIX em configuração. Assim que a chave oficial for cadastrada, este botão será liberado automaticamente.
                </div>
              )}
              {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

              <button type="button" disabled={!ready || loading} onClick={createPixOrder} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
                Gerar pedido PIX
              </button>
              <div className="mt-3 text-center text-xs text-stone-500">Em breve, Mercado Pago</div>
            </>
          ) : (
            <div>
              <CheckCircle2 className="size-10 text-emerald-600" />
              <h3 className="mt-4 text-2xl font-black">Pedido criado</h3>
              <p className="mt-2 text-sm text-stone-600">Pedido <strong>{order.number}</strong> · R$ 1,00</p>
              <div className="mt-6 rounded-3xl border border-stone-300 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Chave PIX</div>
                <div className="mt-3 break-all text-base font-semibold">{pix?.key}</div>
                {pix?.beneficiary && <div className="mt-2 text-sm text-stone-500">Beneficiário: {pix.beneficiary}</div>}
                <button type="button" onClick={copyPix} className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white">
                  {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Chave copiada' : 'Copiar chave PIX'}
                </button>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-stone-600">Depois do pagamento, a confirmação será associada a este pedido e seguirá para CRM, atendimento e jornada pós-compra.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
