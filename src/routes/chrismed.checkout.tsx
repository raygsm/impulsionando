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
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container py-8 sm:py-14 max-w-5xl">
          <Badge className="bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] border border-[var(--chrismed-sand)] mb-4 uppercase tracking-[0.18em] text-[10px]">Checkout</Badge>
          <h1 className="chrismed-serif text-3xl sm:text-4xl md:text-5xl text-[var(--chrismed-ink)] leading-[1.05]">Pagamento seguro</h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--chrismed-graphite)] max-w-2xl">Concluído em segundos. Você recebe a confirmação no e-mail e no WhatsApp.</p>
        </div>
      </section>

      <section className="container py-8 sm:py-12 max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 sm:gap-8">
        {/* Coluna esquerda: método */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MethodButton active={method === 'pix'} onClick={() => setMethod('pix')} icon={<QrCode className="h-5 w-5" />} title="PIX" hint="Aprovação imediata" />
            <MethodButton active={method === 'card'} onClick={() => setMethod('card')} icon={<CreditCard className="h-5 w-5" />} title="Cartão" hint="Em breve · Codex" />
          </div>

          {method === 'pix' ? (
            <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-7 space-y-4">
              <div className="flex items-start gap-2 text-sm text-[var(--chrismed-graphite)]">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-[var(--chrismed-ink)]" />
                <p>QR Code e código copia-e-cola gerados via Mercado Pago no fluxo de agendamento. Este checkout é um ponto de retorno direto quando o paciente já possui um agendamento pendente.</p>
              </div>
              <div className="rounded-xl border border-dashed border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-6 text-center">
                <div className="mx-auto h-40 w-40 rounded-lg bg-[var(--chrismed-bone)] grid place-items-center">
                  <QrCode className="h-16 w-16 text-[var(--chrismed-mist)]" />
                </div>
                <p className="mt-3 text-xs text-[var(--chrismed-mist)]">QR Code aparece após iniciar o pagamento no fluxo /chrismed/agendar.</p>
              </div>
              <Link to="/chrismed/agendar" className="block">
                <Button className="w-full bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)] gap-1.5">
                  Iniciar agendamento com PIX <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-7 space-y-4 opacity-90">
              <div className="flex items-start gap-2 text-sm text-[var(--chrismed-graphite)]">
                <Info className="h-4 w-4 mt-0.5" />
                <p>Captura de cartão será liberada após conclusão da configuração do provedor (Codex). Interface abaixo é somente visual.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label>Nome no cartão</Label><Input disabled placeholder="COMO IMPRESSO NO CARTÃO" /></div>
                <div className="sm:col-span-2"><Label>Número do cartão</Label><Input disabled placeholder="•••• •••• •••• ••••" /></div>
                <div><Label>Validade</Label><Input disabled placeholder="MM/AA" /></div>
                <div><Label>CVV</Label><Input disabled placeholder="•••" /></div>
              </div>
              <Button disabled className="w-full bg-[var(--chrismed-mist)] text-[var(--chrismed-ivory)] gap-1.5 cursor-not-allowed">
                <Lock className="h-4 w-4" /> Pagamento com cartão — pendente Codex
              </Button>
            </div>
          )}
        </div>

        {/* Resumo */}
        <aside className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6 h-fit sticky top-24 space-y-3">
          <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)]">Resumo</h3>
          <div className="text-sm text-[var(--chrismed-graphite)] space-y-1.5">
            <Row label="Consulta" value="—" />
            <Row label="Modalidade" value="—" />
            <Row label="Unidade" value="—" />
            <Row label="Data / horário" value="—" />
          </div>
          <div className="border-t border-[var(--chrismed-sand)] pt-3 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-[var(--chrismed-mist)]">Total</span>
            <span className="chrismed-serif text-2xl text-[var(--chrismed-ink)]">R$ —</span>
          </div>
          <p className="text-[11px] text-[var(--chrismed-ink)]/55 flex items-start gap-1.5">
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
      <span className="text-[var(--chrismed-mist)]">{label}</span>
      <span className="text-[var(--chrismed-ink)]">{value}</span>
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
          ? 'bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] border-[var(--chrismed-ink)]'
          : 'bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)] border-[var(--chrismed-sand)] hover:bg-[var(--chrismed-bone)]')
      }
    >
      <div className={active ? 'text-[var(--chrismed-ivory)]' : 'text-[var(--chrismed-ink)]'}>{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className={'text-[11px] ' + (active ? 'text-[var(--chrismed-ivory)]/80' : 'text-[var(--chrismed-mist)]')}>{hint}</p>
      </div>
    </button>
  );
}
