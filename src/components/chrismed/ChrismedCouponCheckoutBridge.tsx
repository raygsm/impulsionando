import { useEffect, useMemo, useState } from 'react';
import { TicketPercent, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function digits(value: string) { return value.replace(/\D/g, '').slice(0, 11); }

export function ChrismedCouponCheckoutBridge() {
  const [active, setActive] = useState(false);
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAgenda = () => {
      const p = window.location.pathname;
      return p === '/agendar' || p === '/chrismed/agendar';
    };
    const sync = () => {
      if (!isAgenda()) { setActive(false); return; }
      const input = document.querySelector<HTMLInputElement>('#doc');
      const current = digits(input?.value ?? '');
      setCpf(current);
      setActive(current.length === 11 && Boolean(input));
    };
    sync();
    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.id === 'doc') sync();
    };
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(sync, 750);
    return () => {
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onInput, true);
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const normalizedCode = useMemo(() => code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''), [code]);

  async function applyCoupon() {
    if (cpf.length !== 11) return toast.error('Informe um CPF válido antes de aplicar o cupom.');
    if (!normalizedCode) return toast.error('Digite o código do cupom.');
    setBusy(true);
    const { data, error } = await (supabase as any).rpc('chrismed_set_coupon_checkout_intent', { p_cpf: cpf, p_code: normalizedCode });
    setBusy(false);
    if (error) return toast.error('Não foi possível validar o cupom agora.');
    const result = data as { ok?: boolean; reason?: string; code?: string; name?: string };
    if (!result?.ok) {
      const labels: Record<string, string> = {
        coupon_not_found: 'Cupom não encontrado.', coupon_inactive: 'Este cupom está inativo.',
        coupon_not_started: 'Este cupom ainda não está vigente.', coupon_expired: 'Este cupom expirou.',
        valid_cpf_required: 'Informe um CPF válido.', coupon_required: 'Digite o código do cupom.',
      };
      setApplied(null);
      return toast.error(labels[result?.reason ?? ''] ?? 'Cupom indisponível.');
    }
    setApplied(result.code ?? normalizedCode);
    toast.success(`Cupom ${result.code ?? normalizedCode} registrado para este CPF.`);
  }

  if (!active) return null;

  return (
    <aside className="fixed bottom-4 left-1/2 z-[72] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-[#cdbb8a] bg-[#fffdf8] p-4 shadow-[0_18px_60px_rgba(7,28,24,0.22)] sm:bottom-5" aria-label="Cupom CHRISMED">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-[#0b2a24] p-2.5 text-[#e8cd80]"><TicketPercent className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#071c18]">Tem um cupom?</strong>{applied && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />{applied} aplicado</span>}</div>
          <p className="mt-1 text-xs leading-5 text-[#596660]">O cupom fica vinculado ao CPF informado. Validade, serviço, limite por CPF e desconto final são conferidos novamente no momento da reserva.</p>
          <div className="mt-3 flex gap-2"><Input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setApplied(null); }} placeholder="Código do cupom" className="bg-white" /><Button type="button" disabled={busy || !normalizedCode} onClick={() => void applyCoupon()} className="shrink-0 bg-[#071c18] text-white hover:bg-[#0b2a24]">{busy ? 'Validando…' : 'Aplicar'}</Button></div>
        </div>
      </div>
    </aside>
  );
}
