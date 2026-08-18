import { useEffect, useMemo, useState } from 'react';
import { TicketPercent, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function digits(value: string) { return value.replace(/\D/g, '').slice(0, 11); }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function validCPF(value: string) {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calculate = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (length + 1 - i);
    const digit = (sum * 10) % 11;
    return digit === 10 ? 0 : digit;
  };
  return calculate(9) === Number(cpf[9]) && calculate(10) === Number(cpf[10]);
}

export function ChrismedCouponCheckoutBridge() {
  const [active, setActive] = useState(false);
  const [closed, setClosed] = useState(false);
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [complete, setComplete] = useState(false);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAgenda = () => ['/agendar', '/chrismed/agendar'].includes(window.location.pathname);
    const sync = () => {
      if (!isAgenda()) { setActive(false); return; }
      const doc = document.querySelector<HTMLInputElement>('#doc');
      const mail = document.querySelector<HTMLInputElement>('#em, input[type="email"]');
      const first = document.querySelector<HTMLInputElement>('#fn, #first_name, #first-name, input[name="first_name"]');
      const last = document.querySelector<HTMLInputElement>('#ln, #last_name, #last-name, input[name="last_name"]');
      const phone = document.querySelector<HTMLInputElement>('#ph, #phone, input[type="tel"]');
      const currentCpf = digits(doc?.value ?? '');
      const currentEmail = (mail?.value ?? '').trim().toLowerCase();
      const cpfOk = validCPF(currentCpf);
      const formComplete = Boolean(doc && cpfOk && validEmail(currentEmail) && (first?.value ?? '').trim() && (last?.value ?? '').trim() && digits(phone?.value ?? '').length >= 10);
      setCpf(currentCpf);
      setEmail(currentEmail);
      setActive(Boolean(doc));
      setComplete(formComplete);

      if (doc) {
        doc.setAttribute('aria-invalid', currentCpf.length > 0 && !cpfOk ? 'true' : 'false');
        const parent = doc.parentElement;
        let warning = parent?.querySelector<HTMLElement>('[data-cpf-warning="chrismed"]') ?? null;
        if (currentCpf.length > 0 && !cpfOk) {
          if (!warning && parent) {
            warning = document.createElement('p');
            warning.dataset.cpfWarning = 'chrismed';
            warning.className = 'mt-1 text-xs text-red-600';
            warning.textContent = 'CPF inválido. Confira os números informados.';
            parent.appendChild(warning);
          }
        } else if (warning) warning.remove();
      }

      const continueButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => button.textContent?.trim() === 'Continuar para confirmação');
      if (continueButton) {
        const baseValid = Boolean((first?.value ?? '').trim() && validEmail(currentEmail) && cpfOk);
        continueButton.disabled = !baseValid;
        continueButton.setAttribute('aria-disabled', baseValid ? 'false' : 'true');
        if (!baseValid) continueButton.title = currentCpf.length > 0 && !cpfOk ? 'Informe um CPF válido para continuar.' : 'Preencha corretamente os dados obrigatórios para continuar.';
        else continueButton.removeAttribute('title');
      }
    };
    sync();
    const onInput = () => sync();
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(sync, 500);
    return () => { document.removeEventListener('input', onInput, true); document.removeEventListener('change', onInput, true); observer.disconnect(); window.clearInterval(timer); };
  }, []);

  const normalizedCode = useMemo(() => code.trim().toUpperCase().replace(/[^A-Z0-9_%.-]/g, ''), [code]);

  async function applyCoupon() {
    if (!complete) return toast.error('Preencha todos os seus dados antes de tentar usar o cupom.');
    if (!validCPF(cpf)) return toast.error('Informe um CPF válido antes de tentar usar o cupom.');
    if (!normalizedCode) return toast.error('Digite o código do cupom.');
    setBusy(true);
    const { data, error } = await (supabase as any).rpc('chrismed_apply_coupon_checkout_v2', { p_cpf: cpf, p_code: normalizedCode, p_email: email });
    setBusy(false);
    if (error) return toast.error('Não foi possível validar o cupom agora. Tente novamente em alguns instantes.');
    const result = data as { ok?: boolean; reason?: string; code?: string; name?: string };
    if (!result?.ok) {
      const labels: Record<string, string> = {
        coupon_not_found: 'Cupom não encontrado. Confira o código informado.',
        coupon_inactive: 'Este cupom está inativo.',
        coupon_not_started: 'Este cupom ainda não está vigente.',
        coupon_expired: 'Este cupom expirou.',
        valid_cpf_required: 'O CPF informado não é válido. Confira os números e tente novamente.',
        coupon_required: 'Digite o código do cupom.',
        email_required_for_coupon: 'Preencha seu e-mail antes de tentar usar o cupom.',
        email_not_eligible_for_coupon: 'Este cupom não está disponível para o e-mail informado.',
      };
      setApplied(null);
      return toast.error(labels[result?.reason ?? ''] ?? 'Este cupom não está disponível para este cadastro.');
    }
    setApplied(result.code ?? normalizedCode);
    toast.success(`Cupom ${result.code ?? normalizedCode} registrado para este cadastro.`);
  }

  if (!active || closed) return null;

  return (
    <aside className="fixed bottom-4 left-1/2 z-[72] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-[#cdbb8a] bg-[#fffdf8] p-4 shadow-[0_18px_60px_rgba(7,28,24,0.22)] sm:bottom-5" aria-label="Cupom CHRISMED">
      <button type="button" onClick={() => setClosed(true)} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d8cfb8] bg-white text-[#071c18] hover:bg-[#f5f1e7]" aria-label="Fechar cupom"><X className="h-4 w-4" /></button>
      <div className="flex items-start gap-3 pr-8">
        <div className="mt-0.5 rounded-xl bg-[#0b2a24] p-2.5 text-[#e8cd80]"><TicketPercent className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#071c18]">Tem um cupom?</strong>{applied && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />{applied} aplicado</span>}</div>
          <p className="mt-1 text-xs leading-5 text-[#596660]">Preencha primeiro todos os seus dados. Depois, informe o cupom. A validade, as regras de uso e o desconto são conferidos novamente no momento da reserva.</p>
          <div className="mt-3 flex gap-2"><Input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setApplied(null); }} placeholder="Código do cupom" className="bg-white" /><Button type="button" disabled={busy || !normalizedCode} onClick={() => void applyCoupon()} className="shrink-0 bg-[#071c18] text-white hover:bg-[#0b2a24]">{busy ? 'Validando…' : 'Aplicar'}</Button></div>
        </div>
      </div>
    </aside>
  );
}
