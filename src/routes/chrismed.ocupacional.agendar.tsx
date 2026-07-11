/**
 * /chrismed/ocupacional/agendar — Intake B2B de Medicina Ocupacional.
 *
 * Fluxo dedicado (SEPARADO de /chrismed/agendar, que é ambulatorial):
 *   1. Selecionar serviço (ASO ou Perícia/Laudo).
 *   2. Informar empresa + colaborador + janela preferencial.
 *   3. Enviar intake → Oliver assume conversão consultiva.
 *
 * A reserva transacional real (calendário, lock, contrato B2B, faturamento
 * por empresa) permanece Pendência Codex. O front garante que o lead
 * ocupacional NUNCA cai na jornada ambulatorial.
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { openChrismedOliver } from '@/components/chrismed/oliver-store';
import { Briefcase, FileText, ShieldCheck, ChevronLeft, CheckCircle2 } from 'lucide-react';

type Service = 'aso' | 'pericia';

const SERVICES: Array<{
  id: Service;
  title: string;
  price: string;
  sla: string;
  desc: string;
  icon: typeof Briefcase;
}> = [
  {
    id: 'aso',
    title: 'Atestado de Saúde Ocupacional (ASO)',
    price: 'R$ 110,00',
    sla: 'Agendamento em até 48h úteis',
    desc: 'Admissional · Periódico · Retorno ao trabalho · Mudança de função · Demissional.',
    icon: Briefcase,
  },
  {
    id: 'pericia',
    title: 'Perícia · Laudo judicial ou previdenciário',
    price: 'R$ 2.400,00',
    sla: 'Entrega em até 15 dias corridos após entrevista e documentação',
    desc: 'Entrevista técnica com a Dra. Christiane Alencar, análise documental e emissão de laudo.',
    icon: FileText,
  },
];

const searchSchema = z.object({
  service: fallback(z.enum(['aso', 'pericia']).optional(), undefined),
});

export const Route = createFileRoute('/chrismed/ocupacional/agendar')({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: 'Agendar Medicina Ocupacional · CHRISMED' },
      {
        name: 'description',
        content:
          'Solicite ASO ou perícia médica com a Dra. Christiane Alencar. Intake B2B dedicado para empresas e departamentos jurídicos.',
      },
      { property: 'og:title', content: 'Agendar Medicina Ocupacional · CHRISMED' },
      {
        property: 'og:description',
        content: 'Fluxo B2B para ASO e perícias médicas. Atendimento consultivo em Copacabana.',
      },
    ],
  }),
  component: OcupacionalAgendarPage,
});

function OcupacionalAgendarPage() {
  const search = Route.useSearch();
  const [service, setService] = useState<Service | undefined>(search.service);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    company: '',
    cnpj: '',
    contactName: '',
    email: '',
    phone: '',
    employees: '',
    window: '',
    notes: '',
  });

  const selected = useMemo(() => SERVICES.find((s) => s.id === service), [service]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Pendência Codex: persistir em `occupational_intakes` + notificar equipe.
    // Enquanto isso, capturamos localmente e abrimos Oliver para follow-up.
    setSent(true);
    if (typeof window !== 'undefined') openChrismedOliver();
  }

  return (
    <ChrismedShell>
      <section className="chrismed-bleed chrismed-page-forest pt-24 md:pt-32 pb-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <Link
            to="/chrismed/ocupacional"
            className="chrismed-sans inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[var(--chrismed-amber-soft)] hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Medicina Ocupacional
          </Link>
          <div className="chrismed-sans mt-6 text-[11px] uppercase tracking-[0.32em] text-[var(--chrismed-amber)]">
            Intake B2B · Empresa e Perícia
          </div>
          <h1 className="chrismed-serif mt-4 text-[clamp(2.25rem,5vw,4rem)] font-light leading-[1.05] text-[var(--chrismed-amber)]">
            Agendar Medicina Ocupacional
          </h1>
          <p className="chrismed-lede mt-6 max-w-2xl text-white/85">
            Selecione o serviço e envie os dados da empresa ou do caso. A equipe da CHRISMED confirma
            janela, documentação e responsável em até 48h úteis.
          </p>
        </div>
      </section>

      <section className="chrismed-bleed chrismed-page-forest pb-24">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-2 md:px-6">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            const active = service === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setService(s.id)}
                className={[
                  'text-left border p-6 md:p-8 transition-all chrismed-card-lift',
                  active
                    ? 'border-[var(--chrismed-amber)] bg-[var(--chrismed-amber)]/10'
                    : 'border-[var(--chrismed-amber)]/25 bg-black/10 hover:border-[var(--chrismed-amber)]/70',
                ].join(' ')}
                aria-pressed={active}
              >
                <div className="flex items-start justify-between gap-4">
                  <Icon className="h-6 w-6 text-[var(--chrismed-amber)]" aria-hidden />
                  <span className="chrismed-serif text-2xl text-[var(--chrismed-amber)]">{s.price}</span>
                </div>
                <div className="chrismed-serif mt-4 text-xl font-light text-white">{s.title}</div>
                <p className="chrismed-sans mt-3 text-sm leading-relaxed text-white/75">{s.desc}</p>
                <div className="chrismed-sans mt-4 text-[10px] uppercase tracking-[0.28em] text-[var(--chrismed-amber-soft)]/80">
                  {s.sla}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {service && !sent && (
        <section className="chrismed-bleed chrismed-page-forest pb-24">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <div className="border border-[var(--chrismed-amber)]/25 bg-black/15 p-6 md:p-10">
              <div className="chrismed-sans text-[11px] uppercase tracking-[0.28em] text-[var(--chrismed-amber)]">
                Serviço selecionado
              </div>
              <div className="chrismed-serif mt-2 text-2xl text-white">{selected?.title}</div>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                <Field label="Empresa / Razão social" required>
                  <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="CNPJ">
                    <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label={service === 'aso' ? 'Nº de colaboradores' : 'Nº do processo (opcional)'}>
                    <input value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <Field label="Responsável pelo contato" required>
                  <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} />
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="E-mail corporativo" required>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Telefone / WhatsApp" required>
                    <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <Field label="Janela preferencial (dias e turno)">
                  <input placeholder="Ex.: seg–qua, período da manhã" value={form.window} onChange={(e) => setForm({ ...form, window: e.target.value })} className={inputCls} />
                </Field>
                <Field label={service === 'aso' ? 'Tipos de ASO e observações' : 'Contexto do caso e documentos disponíveis'}>
                  <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
                </Field>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    className="chrismed-sans chrismed-cta-glow inline-flex items-center justify-center gap-3 bg-[var(--chrismed-amber)] px-8 py-4 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-forest-deep)] shadow-[0_20px_60px_-20px_rgba(228,181,74,0.55)] hover:bg-[var(--chrismed-amber-deep)] hover:text-white"
                  >
                    Enviar solicitação <span aria-hidden>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openChrismedOliver()}
                    className="chrismed-sans inline-flex items-center justify-center gap-2 border border-[var(--chrismed-amber)]/50 px-6 py-4 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-amber)] hover:bg-[var(--chrismed-amber)]/10"
                  >
                    Falar com Oliver antes
                  </button>
                </div>
                <p className="chrismed-sans text-[11px] text-white/55">
                  Dados usados exclusivamente para retorno consultivo — em conformidade com a LGPD.
                </p>
              </form>
            </div>
          </div>
        </section>
      )}

      {sent && (
        <section className="chrismed-bleed chrismed-page-forest pb-32">
          <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--chrismed-amber)]/15 ring-1 ring-[var(--chrismed-amber)]/60">
              <CheckCircle2 className="h-8 w-8 text-[var(--chrismed-amber)]" aria-hidden />
            </div>
            <h2 className="chrismed-serif mt-6 text-3xl text-[var(--chrismed-amber)] md:text-4xl">
              Solicitação recebida
            </h2>
            <p className="chrismed-lede mt-4 text-white/85">
              A equipe da CHRISMED retorna em até 48h úteis com janela confirmada, checklist de
              documentos e responsável dedicado. Oliver está aberto para conversas imediatas.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/chrismed/ocupacional"
                className="chrismed-sans inline-flex items-center justify-center gap-2 border border-[var(--chrismed-amber)]/50 px-6 py-3 text-[12px] uppercase tracking-[0.25em] text-[var(--chrismed-amber)] hover:bg-[var(--chrismed-amber)]/10"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden /> Voltar à Medicina Ocupacional
              </Link>
            </div>
          </div>
        </section>
      )}
    </ChrismedShell>
  );
}

const inputCls =
  'w-full border border-[var(--chrismed-amber)]/30 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 focus:border-[var(--chrismed-amber)] focus:outline-none';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="chrismed-sans mb-2 block text-[10px] uppercase tracking-[0.28em] text-[var(--chrismed-amber-soft)]/80">
        {label} {required && <span className="text-[var(--chrismed-amber)]">*</span>}
      </span>
      {children}
    </label>
  );
}
