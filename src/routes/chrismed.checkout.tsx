import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, QrCode, ShieldCheck, Info, ArrowRight, Lock } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/chrismed/checkout')({
  head: () => ({
    meta: [
      { title: 'Checkout — CrisMed' },
      { name: 'description', content: 'Pagamento seguro CrisMed via PIX ou cartão.' },
      { property: 'og:title', content: 'Checkout · CrisMed' },
      { property: 'og:description', content: 'Pagamento seguro para consultas CrisMed.' },
    ],
  }),
  component: CheckoutPage,
});

type Method = 'pix' | 'card';

function CheckoutPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>('pix');

  return (
    <ChrismedShell variant="minimal">
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-14 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-4 uppercase tracking-[0.18em] text-[10px]">Checkout</Badge>
          <h1 className="font-serif text-4xl md:text-5xl text-emerald-950 leading-[1.05]">Pagamento seguro</h1>
          <p className="mt-4 text-emerald-900/75 max-w-2xl">Concluído em segundos. Você recebe a confirmação no e-mail e no WhatsApp.</p>
        </div>
      </section>

      <section className="container py-12 max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Coluna esquerda: método */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MethodButton active={method === 'pix'} onClick={() => setMethod('pix')} icon={<QrCode className="h-5 w-5" />} title="PIX" hint="Aprovação imediata" />
            <MethodButton active={method === 'card'} onClick={() => setMethod('card')} icon={<CreditCard className="h-5 w-5" />} title="Cartão" hint="Em breve · Codex" />
          </div>

          {method === 'pix' ? (
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-7 space-y-4">
              <div className="flex items-start gap-2 text-sm text-emerald-900/80">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-800" />
                <p>QR Code e código copia-e-cola gerados via Mercado Pago no fluxo de agendamento. Este checkout é um ponto de retorno direto quando o paciente já possui um agendamento pendente.</p>
              </div>
              <div className="rounded-xl border border-dashed border-emerald-900/15 bg-[#fbf9f4]/50 p-6 text-center">
                <div className="mx-auto h-40 w-40 rounded-lg bg-emerald-900/5 grid place-items-center">
                  <QrCode className="h-16 w-16 text-emerald-900/40" />
                </div>
                <p className="mt-3 text-xs text-emerald-900/60">QR Code aparece após iniciar o pagamento no fluxo /chrismed/agendar.</p>
              </div>
              <Link to="/chrismed/agendar" className="block">
                <Button className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-50 gap-1.5">
                  Iniciar agendamento com PIX <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-7 space-y-4 opacity-90">
              <div className="flex items-start gap-2 text-sm text-emerald-900/80">
                <Info className="h-4 w-4 mt-0.5" />
                <p>Captura de cartão será liberada após conclusão da configuração do provedor (Codex). Interface abaixo é somente visual.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label>Nome no cartão</Label><Input disabled placeholder="COMO IMPRESSO NO CARTÃO" /></div>
                <div className="sm:col-span-2"><Label>Número do cartão</Label><Input disabled placeholder="•••• •••• •••• ••••" /></div>
                <div><Label>Validade</Label><Input disabled placeholder="MM/AA" /></div>
                <div><Label>CVV</Label><Input disabled placeholder="•••" /></div>
              </div>
              <Button disabled className="w-full bg-emerald-900/60 text-amber-50 gap-1.5 cursor-not-allowed">
                <Lock className="h-4 w-4" /> Pagamento com cartão — pendente Codex
              </Button>
            </div>
          )}
        </div>

        {/* Resumo */}
        <aside className="rounded-2xl border border-emerald-900/10 bg-white p-6 h-fit sticky top-24 space-y-3">
          <h3 className="font-serif text-lg text-emerald-950">Resumo</h3>
          <div className="text-sm text-emerald-900/80 space-y-1.5">
            <Row label="Consulta" value="—" />
            <Row label="Modalidade" value="—" />
            <Row label="Unidade" value="—" />
            <Row label="Data / horário" value="—" />
          </div>
          <div className="border-t border-emerald-900/10 pt-3 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-emerald-900/60">Total</span>
            <span className="font-serif text-2xl text-emerald-950">R$ —</span>
          </div>
          <p className="text-[11px] text-emerald-900/55 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Valores exibidos no fluxo /chrismed/agendar após seleção de especialidade e modalidade.
          </p>
          <Button variant="outline" onClick={() => navigate({ to: '/chrismed/minha-conta' })} className="w-full">
            Ver minhas consultas
          </Button>
        </aside>
      </section>
    </ChrismedShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-emerald-900/60">{label}</span>
      <span className="text-emerald-950">{value}</span>
    </div>
  );
}

function MethodButton({ active, onClick, icon, title, hint }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <button
      type="button" onClick={onClick}
      className={
        'flex items-center gap-3 rounded-xl border p-4 text-left transition ' +
        (active
          ? 'bg-emerald-900 text-amber-50 border-emerald-900'
          : 'bg-white text-emerald-900 border-emerald-900/15 hover:bg-emerald-900/5')
      }
    >
      <div className={active ? 'text-amber-50' : 'text-emerald-900'}>{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className={'text-[11px] ' + (active ? 'text-amber-50/80' : 'text-emerald-900/60')}>{hint}</p>
      </div>
    </button>
  );
}
