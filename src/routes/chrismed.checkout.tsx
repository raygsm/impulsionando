import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Info,
  ArrowRight,
  Copy,
  CheckCircle2,
  FileText,
  Stethoscope,
  User,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  buildPixPayload,
  pixQrUrl,
  PIX_KEY,
  PIX_KEY_PLAIN,
  PIX_RECEBEDOR,
  PIX_RECEBEDOR_SHORT,
  PIX_CIDADE,
} from '@/lib/pix';

export const Route = createFileRoute('/chrismed/checkout')({
  head: () => ({
    meta: [
      { title: 'Checkout — CHRISMED' },
      {
        name: 'description',
        content:
          'Pagamento seguro CHRISMED via PIX (QR Code) ou cartão de crédito (Mercado Pago). Consulta presencial, teleconsulta e domiciliar.',
      },
      { property: 'og:title', content: 'Checkout · CHRISMED' },
      {
        property: 'og:description',
        content: 'PIX com QR Code oficial ou cartão de crédito via Mercado Pago.',
      },
    ],
  }),
  component: CheckoutPage,
});

type ModalityKey = 'presencial' | 'teleconsulta' | 'domiciliar';
type Method = 'pix' | 'card';

interface Modality {
  key: ModalityKey;
  label: string;
  sublabel: string;
  price: number; // reais
  mpUrl: string;
  icon: React.ReactNode;
}

const MODALITIES: Modality[] = [
  {
    key: 'presencial',
    label: 'Consulta Presencial',
    sublabel: 'Consultório · Copacabana',
    price: 1200,
    mpUrl: 'https://mpago.la/2ExMhiD',
    icon: <Stethoscope className="h-4 w-4" />,
  },
  {
    key: 'teleconsulta',
    label: 'Teleconsulta',
    sublabel: 'Vídeo · PT · EN · ES',
    price: 600,
    mpUrl: 'https://mpago.la/1zaHNZx',
    icon: <User className="h-4 w-4" />,
  },
  {
    key: 'domiciliar',
    label: 'Consulta Domiciliar',
    sublabel: 'Onde você estiver',
    price: 2400,
    mpUrl: 'https://mpago.la/1zaHNZx',
    icon: <FileText className="h-4 w-4" />,
  },
];

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [modalityKey, setModalityKey] = useState<ModalityKey>('presencial');
  const [method, setMethod] = useState<Method>('pix');
  const modality = MODALITIES.find((m) => m.key === modalityKey)!;

  // TXID curto/único por sessão (não persiste no backend — reconciliação manual).
  const txid = useMemo(
    () =>
      `CHRISMED${Date.now().toString(36).toUpperCase()}${Math.random()
        .toString(36)
        .slice(2, 5)
        .toUpperCase()}`.slice(0, 25),
    [modalityKey],
  );

  const pixPayload = useMemo(
    () =>
      buildPixPayload({
        pixKey: PIX_KEY_PLAIN,
        amount: modality.price,
        merchantName: PIX_RECEBEDOR_SHORT,
        merchantCity: PIX_CIDADE,
        txid,
        description: `CHRISMED ${modality.label}`,
      }),
    [modality, txid],
  );
  const qrUrl = pixQrUrl(pixPayload, 260);

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${what} copiado.`);
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.');
    }
  }

  return (
    <ChrismedShell variant="minimal">
      {/* HERO */}
      <section className="chrismed-bleed border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <Badge className="mb-4 border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] text-[10px] uppercase tracking-[0.22em] text-[var(--chrismed-ink)]">
            Checkout · Pagamento seguro
          </Badge>
          <h1 className="chrismed-serif text-3xl leading-[1.05] text-[var(--chrismed-ink)] sm:text-4xl md:text-5xl">
            Escolha a modalidade e finalize seu agendamento.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-[var(--chrismed-graphite)] sm:text-base">
            Aceitamos <strong>PIX</strong> (com QR Code oficial e chave CNPJ) e{' '}
            <strong>Cartão de Crédito</strong> via Mercado Pago. A confirmação chega por
            e-mail e WhatsApp em segundos.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:gap-8 sm:py-12 lg:grid-cols-[1fr_360px]">
        {/* Coluna esquerda */}
        <div className="space-y-6">
          {/* 1 · Modalidade */}
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-white p-5 sm:p-6">
            <h2 className="chrismed-serif text-lg text-[var(--chrismed-ink)]">
              1 · Selecione a modalidade
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {MODALITIES.map((m) => {
                const active = m.key === modalityKey;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModalityKey(m.key)}
                    className={
                      'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition ' +
                      (active
                        ? 'border-[var(--chrismed-ink)] bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] shadow-sm'
                        : 'border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-bone)]')
                    }
                  >
                    <span
                      className={
                        'inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] ' +
                        (active ? 'text-[var(--chrismed-amber)]' : 'text-[var(--chrismed-mist)]')
                      }
                    >
                      {m.icon} {m.sublabel}
                    </span>
                    <span className="chrismed-serif text-base leading-tight">{m.label}</span>
                    <span
                      className={
                        'text-lg font-medium ' +
                        (active ? 'text-[var(--chrismed-ivory)]' : 'text-[var(--chrismed-ink)]')
                      }
                    >
                      {brl(m.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 · Método */}
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-white p-5 sm:p-6">
            <h2 className="chrismed-serif text-lg text-[var(--chrismed-ink)]">
              2 · Forma de pagamento
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MethodButton
                active={method === 'pix'}
                onClick={() => setMethod('pix')}
                icon={<QrCode className="h-5 w-5" />}
                title="PIX"
                hint="QR Code · Aprovação imediata"
              />
              <MethodButton
                active={method === 'card'}
                onClick={() => setMethod('card')}
                icon={<CreditCard className="h-5 w-5" />}
                title="Cartão de crédito"
                hint="Via Mercado Pago"
              />
            </div>

            {method === 'pix' ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-3 text-xs text-[var(--chrismed-graphite)] sm:text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-ink)]" />
                  <p>
                    QR Code oficial (BR Code · Bacen) com chave CNPJ da CHRISMED. Escaneie no
                    app do seu banco ou use o código copia-e-cola.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-start">
                  <div className="rounded-xl border border-[var(--chrismed-sand)] bg-white p-3">
                    <img
                      src={qrUrl}
                      alt={`QR Code PIX de ${brl(modality.price)}`}
                      width={260}
                      height={260}
                      className="mx-auto h-auto w-full max-w-[240px]"
                    />
                    <p className="mt-2 text-center text-[11px] uppercase tracking-[0.14em] text-[var(--chrismed-mist)]">
                      QR Code · {brl(modality.price)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <PixField
                      label="Chave PIX (CNPJ)"
                      value={PIX_KEY}
                      onCopy={() => copy(PIX_KEY_PLAIN, 'CNPJ')}
                    />
                    <PixField
                      label="Beneficiário"
                      value={PIX_RECEBEDOR}
                      readOnly
                    />
                    <PixField
                      label="Valor"
                      value={brl(modality.price)}
                      readOnly
                    />
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-[var(--chrismed-mist)]">
                        Copia-e-cola (BR Code)
                      </label>
                      <div className="mt-1 flex items-stretch gap-2">
                        <textarea
                          readOnly
                          value={pixPayload}
                          rows={3}
                          className="flex-1 resize-none rounded-lg border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-2 font-mono text-[11px] leading-snug text-[var(--chrismed-ink)]"
                          onFocus={(e) => e.currentTarget.select()}
                        />
                        <Button
                          type="button"
                          onClick={() => copy(pixPayload, 'Código PIX')}
                          className="shrink-0 bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] hover:bg-[var(--chrismed-champagne-deep)]"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="flex items-start gap-1.5 text-[11px] text-[var(--chrismed-mist)]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Após pagar, envie o comprovante para a recepção no WhatsApp
                      (21) 97255-4500 informando o TXID{' '}
                      <span className="font-mono text-[var(--chrismed-ink)]">{txid}</span>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-3 text-xs text-[var(--chrismed-graphite)] sm:text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-ink)]" />
                  <p>
                    Você será redirecionado ao ambiente seguro do Mercado Pago para concluir o
                    pagamento no cartão de crédito. Ao voltar, envie o comprovante à recepção.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--chrismed-mist)]">
                        {modality.sublabel}
                      </p>
                      <p className="chrismed-serif text-lg text-[var(--chrismed-ink)]">
                        {modality.label}
                      </p>
                    </div>
                    <p className="chrismed-serif text-2xl text-[var(--chrismed-ink)]">
                      {brl(modality.price)}
                    </p>
                  </div>
                  <a
                    href={modality.mpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--chrismed-ink)] px-4 py-3 text-sm font-medium text-[var(--chrismed-ivory)] transition hover:bg-[var(--chrismed-champagne-deep)]"
                  >
                    Pagar com cartão no Mercado Pago
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <p className="mt-2 text-center text-[11px] text-[var(--chrismed-mist)]">
                    Link oficial: {modality.mpUrl}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Área exclusiva do paciente */}
          <div className="chrismed-bleed chrismed-page-forest rounded-2xl p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--chrismed-amber)]/20 text-[var(--chrismed-amber)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--chrismed-amber)]">
                  Área exclusiva do paciente
                </p>
                <h3 className="chrismed-serif mt-1 text-xl leading-tight text-[var(--chrismed-ivory)]">
                  Todo paciente CHRISMED tem acesso a um portal privado.
                </h3>
                <ul className="mt-4 grid gap-2 text-sm text-[var(--chrismed-ivory)]/85 sm:grid-cols-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-amber)]" />
                    Histórico completo de atendimentos
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-amber)]" />
                    Notas Fiscais emitidas
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-amber)]" />
                    Prontuário eletrônico
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-amber)]" />
                    Orientações e receitas específicas
                  </li>
                </ul>
                <Link to="/chrismed/minha-conta" className="mt-4 inline-block">
                  <Button className="bg-[var(--chrismed-amber)] text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-amber)]/90">
                    Acessar minha conta <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <aside className="h-fit space-y-4 rounded-2xl border border-[var(--chrismed-sand)] bg-white p-6 lg:sticky lg:top-24">
          <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)]">Resumo</h3>
          <div className="space-y-1.5 text-sm text-[var(--chrismed-graphite)]">
            <Row label="Modalidade" value={modality.label} />
            <Row label="Detalhe" value={modality.sublabel} />
            <Row label="Método" value={method === 'pix' ? 'PIX (QR Code)' : 'Cartão de crédito'} />
            <Row label="TXID" value={txid} mono />
          </div>
          <div className="flex items-baseline justify-between border-t border-[var(--chrismed-sand)] pt-3">
            <span className="text-xs uppercase tracking-wider text-[var(--chrismed-mist)]">
              Total
            </span>
            <span className="chrismed-serif text-2xl text-[var(--chrismed-ink)]">
              {brl(modality.price)}
            </span>
          </div>
          <p className="flex items-start gap-1.5 text-[11px] text-[var(--chrismed-ink)]/60">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Reserva confirmada após compensação do pagamento (PIX imediato · cartão em segundos).
          </p>
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/chrismed/minha-conta' })}
            className="w-full border-[var(--chrismed-sand)]"
          >
            Ver minhas consultas
          </Button>
        </aside>
      </section>
    </ChrismedShell>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[var(--chrismed-mist)]">{label}</span>
      <span
        className={
          'text-right text-[var(--chrismed-ink)] ' + (mono ? 'font-mono text-[11px]' : '')
        }
      >
        {value}
      </span>
    </div>
  );
}

function PixField({
  label,
  value,
  onCopy,
  readOnly = false,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-[var(--chrismed-mist)]">
        {label}
      </label>
      <div className="mt-1 flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          className="flex-1 rounded-lg border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] px-3 py-2 text-sm text-[var(--chrismed-ink)]"
          onFocus={(e) => e.currentTarget.select()}
        />
        {!readOnly && onCopy && (
          <Button
            type="button"
            variant="outline"
            onClick={onCopy}
            className="shrink-0 border-[var(--chrismed-sand)]"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex min-h-[64px] items-center gap-3 rounded-xl border p-3.5 text-left transition sm:p-4 ' +
        (active
          ? 'border-[var(--chrismed-ink)] bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]'
          : 'border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-bone)]')
      }
    >
      <div
        className={
          'shrink-0 ' + (active ? 'text-[var(--chrismed-amber)]' : 'text-[var(--chrismed-ink)]')
        }
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight sm:text-base">{title}</p>
        <p
          className={
            'truncate text-[11px] ' +
            (active ? 'text-[var(--chrismed-ivory)]/75' : 'text-[var(--chrismed-mist)]')
          }
        >
          {hint}
        </p>
      </div>
    </button>
  );
}
