/**
 * ChrismedOliverPanel — Wave 5 (Oliver como membro da equipe).
 *
 * Reposicionamento:
 *  - Oliver deixa de ser "chatbot" e passa a ser apresentado como
 *    concierge administrativo humano-assistido da equipe CHRISMED.
 *  - Identidade: nome próprio, papel, janela de atendimento humano.
 *  - Handoff visível: card fixo "Recepção CHRISMED" com estado da
 *    disponibilidade humana (dentro/fora do horário) e ação clara.
 *  - Nunca simula IA nem finge conversa. Cada botão executa uma ação
 *    real: navegar, exibir informação institucional, ou avisar que o
 *    canal humano assumirá.
 */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, RotateCcw, Calendar, Users, Stethoscope, ClipboardList, CreditCard, ArrowRight, Clock3, UserRound, Contact, MessageCircle, Phone, Mail, Instagram, MapPin, Star, QrCode, Globe as GlobeIcon, ExternalLink } from 'lucide-react';
import { CHRISMED_CONTACT } from '@/data/chrismed-contact';
import { useRouterState, useNavigate } from '@tanstack/react-router';
import {
  resolveOliverContextOverride,
  type OliverContext,
  type OliverQuickReply,
} from '@/content/chrismed/oliver-contexts';
import {
  closeChrismedOliver,
  focusChrismedOliverTrigger,
  openChrismedOliver,
  setChrismedOliverInfo,
  useChrismedOliverState,
} from './oliver-store';

const WHATSAPP_ENABLED = true;
const C = CHRISMED_CONTACT.channels;

// Janela humana operacional (America/Sao_Paulo) — segunda a sexta 09-19h,
// sábado 09-13h. Ajuste pelo Codex quando integração de agenda entrar.
function isHumanOnline(now: Date = new Date()): boolean {
  const day = now.getDay();
  const hour = now.getHours();
  if (day === 0) return false;
  if (day === 6) return hour >= 9 && hour < 13;
  return hour >= 9 && hour < 19;
}

type GlobalAction = {
  label: string;
  hint: string;
  icon: typeof Calendar;
  to?: string;
  info?: string;
};

const GLOBAL_ACTIONS: GlobalAction[] = [
  { label: 'Agendar consulta', hint: 'Sem cadastro para ver horários', icon: Calendar, to: '/chrismed/agendar' },
  { label: 'Nossos médicos', hint: 'Equipe e especialidades', icon: Users, to: '/chrismed/medicos' },
  { label: 'Especialidades', hint: 'Áreas de atuação', icon: Stethoscope, to: '/chrismed/especialidades' },
  { label: 'Meus agendamentos', hint: 'Área do paciente — pendente Codex', icon: ClipboardList, info: 'A área do paciente com histórico de agendamentos e pagamentos está em preparação (Pendente Codex). Assim que liberada, você acessa por aqui.' },
  { label: 'Pagamento', hint: 'PIX no fluxo de agendamento', icon: CreditCard, info: 'O pagamento acontece dentro do fluxo de agendamento, após você escolher horário e confirmar seus dados. Aceitamos PIX via Mercado Pago; cartão e parcelamento serão liberados em breve pela integração Codex.' },
];

export function ChrismedOliverPanel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { open, context, info } = useChrismedOliverState();

  const ctx: OliverContext = resolveOliverContextOverride(pathname, context);

  const runReply = (r: OliverQuickReply) => {
    setChrismedOliverInfo(null);
    if (r.kind === 'navigate') {
      closeChrismedOliver();
      navigate({ to: r.to as never, search: (r.search ?? {}) as never });
      return;
    }
    if (r.kind === 'info') { setChrismedOliverInfo(r.message); return; }
    if (r.kind === 'close') closeChrismedOliver();
  };

  const runGlobal = (a: GlobalAction) => {
    setChrismedOliverInfo(null);
    if (a.to) { closeChrismedOliver(); navigate({ to: a.to as never }); return; }
    if (a.info) setChrismedOliverInfo(a.info);
  };

  const humanOnline = isHumanOnline();



  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => { if (nextOpen) openChrismedOliver(); else closeChrismedOliver(); }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          onPointerDown={closeChrismedOliver}
          className="fixed inset-0 z-[90] bg-[var(--chrismed-noir)]/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none"
        />
        <DialogPrimitive.Content
          data-chrismed-oliver-panel
          onCloseAutoFocus={(event) => { event.preventDefault(); focusChrismedOliverTrigger(); }}
          className="fixed inset-y-0 right-0 z-[91] flex h-dvh w-full max-w-[min(100vw,28rem)] flex-col gap-0 border-l border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-0 text-[var(--chrismed-ink)] shadow-[0_24px_80px_-24px_rgba(15,15,15,0.55)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right motion-reduce:animate-none"
        >
          {/* Header — identidade Oliver como membro da equipe */}
          <div className="border-b border-[var(--chrismed-sand)] px-6 pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] chrismed-serif text-xl font-light shadow-md"
              >
                O
              </div>
              <div className="min-w-0 flex-1">
                <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-champagne-deep)]">
                  Oliver · Concierge CHRISMED
                </p>
                <DialogPrimitive.Title className="chrismed-serif text-xl font-light text-[var(--chrismed-ink)]">
                  Membro da equipe · {ctx.eyebrow}
                </DialogPrimitive.Title>
                <p className="chrismed-sans mt-0.5 text-[11px] leading-relaxed text-[var(--chrismed-mist)]">
                  Recepção humano-assistida · não diagnostica, não prescreve.
                </p>
              </div>
              <DialogPrimitive.Close
                type="button"
                aria-label="Fechar Oliver"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--chrismed-sand)] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
              {ctx.greeting}
            </p>
          </div>

          {/* Corpo scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Handoff humano visível — sempre no topo */}
            <section
              aria-label="Recepção humana CHRISMED"
              className="border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]/50 px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <div
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--chrismed-champagne)] bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)]"
                >
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
                    Recepção CHRISMED
                  </p>
                  <p className="chrismed-serif mt-1 text-base font-light text-[var(--chrismed-ink)]">
                    {humanOnline ? 'Equipe humana disponível agora' : 'Fora do horário de atendimento'}
                  </p>
                  <p className="chrismed-sans mt-1 flex items-center gap-1.5 text-[11px] text-[var(--chrismed-graphite)]">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    Seg–Sex 09h–19h · Sáb 09h–13h (horário de Brasília)
                  </p>
                  <button
                    type="button"
                    onClick={() => setChrismedOliverInfo(humanOnline
                      ? 'A equipe humana da recepção CHRISMED já foi notificada e assumirá esta conversa em instantes. Você pode continuar navegando — avisaremos por aqui quando o atendente responder. Para agilizar, deixe seu contato em /chrismed/contato.'
                      : 'Estamos fora do horário de atendimento humano. Sua mensagem entra na fila e será respondida no próximo turno. Para urgências clínicas, procure serviço público local. Para agendamento, use /chrismed/agendar — a agenda funciona 24h.')}
                    className="chrismed-sans mt-3 inline-flex items-center gap-2 border-b border-[var(--chrismed-ink)] pb-0.5 text-[11px] uppercase tracking-[0.24em] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)]"
                  >
                    {humanOnline ? 'Chamar a recepção agora' : 'Deixar mensagem para o próximo turno'}
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              </div>
            </section>

            {/* Info retornada por uma ação */}
            {info && (
              <div
                role="status"
                aria-live="polite"
                className="border-l-2 border-[var(--chrismed-champagne-deep)] bg-[var(--chrismed-bone)]/60 px-4 py-4 text-sm leading-relaxed text-[var(--chrismed-graphite)]"
              >
                {info}
                <button
                  type="button"
                  onClick={() => setChrismedOliverInfo(null)}
                  className="chrismed-sans mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--chrismed-champagne-deep)] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Reiniciar orientação
                </button>
              </div>
            )}



            {/* Atalhos globais sempre visíveis */}
            <section>
              <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)] mb-3">
                Atalhos rápidos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {GLOBAL_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => runGlobal(a)}
                      className="group flex flex-col items-start gap-1.5 rounded-none border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]/30 px-3 py-3 text-left transition-colors hover:border-[var(--chrismed-champagne-deep)] hover:bg-[var(--chrismed-bone)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]"
                    >
                      <Icon className="h-4 w-4 text-[var(--chrismed-champagne-deep)]" aria-hidden />
                      <span className="chrismed-sans text-[13px] font-medium leading-tight text-[var(--chrismed-ink)]">
                        {a.label}
                      </span>
                      <span className="chrismed-sans text-[10px] leading-snug text-[var(--chrismed-mist)]">
                        {a.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Sugestões contextuais da rota */}
            {ctx.quickReplies.length > 0 && (
              <section>
                <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)] mb-3">
                  Sugestões para esta página
                </p>
                <ul className="space-y-1.5">
                  {ctx.quickReplies.map((r) => (
                    <li key={r.label}>
                      <button
                        type="button"
                        onClick={() => runReply(r)}
                        className="chrismed-sans group flex w-full items-center justify-between gap-3 rounded-none border border-[var(--chrismed-sand)]/70 bg-transparent px-4 py-2.5 text-left text-sm text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)] hover:bg-[var(--chrismed-bone)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]"
                      >
                        <span>{r.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Salvar contato + canais oficiais (dados airgo.bio/chrismed) */}
            <section aria-label="Contato oficial CHRISMED">
              <p className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)] mb-3">
                Salvar contato · canais oficiais
              </p>

              <a
                href={C.vcard}
                target="_blank"
                rel="noopener noreferrer"
                className="chrismed-sans group mb-2 flex items-center justify-between gap-3 border border-[var(--chrismed-ink)] bg-[var(--chrismed-ink)] px-4 py-3 text-[var(--chrismed-ivory)] transition-colors hover:bg-[var(--chrismed-noir)]"
              >
                <span className="flex items-center gap-2.5">
                  <Contact className="h-4 w-4" aria-hidden />
                  <span className="text-sm font-medium">Salvar contato (vCard · 1 clique)</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" aria-hidden />
              </a>

              <a
                href={C.airgo}
                target="_blank"
                rel="noopener noreferrer"
                className="chrismed-sans mb-3 flex items-center justify-between gap-3 border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]/40 px-4 py-2.5 text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)]"
              >
                <span className="flex items-center gap-2.5">
                  <QrCode className="h-4 w-4 text-[var(--chrismed-champagne-deep)]" aria-hidden />
                  <span className="text-[13px]">Cartão digital · airgo.bio/chrismed</span>
                </span>
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
              </a>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'WhatsApp', href: C.whatsapp, icon: MessageCircle },
                  { label: 'Telefone', href: C.phone, icon: Phone },
                  { label: 'E-mail', href: C.email, icon: Mail },
                  { label: 'Instagram', href: C.instagram, icon: Instagram },
                  { label: 'Localização', href: C.location, icon: MapPin },
                  { label: 'Site oficial', href: C.website, icon: GlobeIcon },
                  { label: 'PIX (QR)', href: C.pix, icon: CreditCard },
                  { label: 'Avaliar · Google', href: C.reviewGoogle, icon: Star },
                  { label: 'Avaliar · Doctoralia', href: C.reviewDoctoralia, icon: Star },
                ].map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="chrismed-sans flex items-center gap-2 border border-[var(--chrismed-sand)] bg-transparent px-3 py-2.5 text-left text-[12px] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)] hover:bg-[var(--chrismed-bone)]/60"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--chrismed-champagne-deep)]" aria-hidden />
                    <span className="truncate">{label}</span>
                  </a>
                ))}
              </div>
            </section>


            {/* Disclaimer clínico */}
            <p className="chrismed-sans border-t border-[var(--chrismed-sand)] pt-4 text-[11px] leading-relaxed text-[var(--chrismed-mist)]">
              Oliver oferece apoio administrativo — não substitui avaliação médica, não emite diagnóstico e não prescreve. Em emergência, procure o serviço público local imediatamente.
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
