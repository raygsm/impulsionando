import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, CalendarDays, ArrowRight, ShieldCheck } from 'lucide-react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { acceptChrismedEventInvitation } from '@/lib/chrismed-events';

export const Route = createFileRoute('/chrismed/evento-convite')({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === 'string' ? search.token : '' }),
  head: () => ({ meta: [{ title: 'Convite para evento — CHRISMED' }, { name: 'description', content: 'Aceite seguro de convite para eventos CHRISMED.' }] }),
  component: EventInvitationPage,
});

function EventInvitationPage() {
  const { token } = Route.useSearch();
  const mutation = useMutation({ mutationFn: () => acceptChrismedEventInvitation(token) });
  const invalid = !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);

  return <ChrismedShell><main className="min-h-[70vh] bg-[var(--chrismed-ivory)] px-5 py-16 text-[var(--chrismed-forest-deep)] sm:px-6 md:py-24">
    <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[var(--chrismed-sand)] bg-white shadow-[var(--chrismed-shadow-md)]">
      <div className="bg-[var(--chrismed-forest-deep)] px-7 py-10 text-white md:px-10"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[var(--chrismed-amber-soft)]"><CalendarDays className="h-6 w-6" /></div><h1 className="chrismed-serif mt-5 text-4xl md:text-5xl">Convite CHRISMED</h1><p className="mt-3 max-w-2xl text-white/75">Seu convite é individual. Ao aceitar, sua participação é confirmada imediatamente e a vaga passa a ficar reservada em seu nome.</p></div>
      <div className="p-7 md:p-10">
        {invalid && <Message title="Convite inválido" text="Este link não contém uma credencial de convite válida. Solicite um novo convite à equipe CHRISMED." />}
        {!invalid && !mutation.data && !mutation.error && <><div className="flex gap-3 rounded-2xl bg-[#f4efdf] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><p className="text-sm leading-relaxed">O aceite é pessoal e confirma uma única participação. Não há cobrança para o profissional de saúde.</p></div><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="chrismed-cta mt-7 inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-bold">{mutation.isPending ? 'Confirmando…' : 'Aceitar convite e confirmar participação'}</button></>}
        {mutation.error && <Message title="Não foi possível aceitar o convite" text={mutation.error.message || 'O convite pode estar expirado, já utilizado ou indisponível.'} />}
        {mutation.data && <div role="status"><CheckCircle2 className="h-10 w-10 text-emerald-700"/><h2 className="chrismed-serif mt-4 text-3xl">Participação confirmada</h2><p className="mt-3 text-[var(--chrismed-graphite)]">Sua vaga foi confirmada. Protocolo: <strong>{mutation.data.registration_code}</strong>.</p><p className="mt-2 text-sm text-[var(--chrismed-graphite)]">A credencial com QR Code será enviada para o e-mail do convite pela jornada oficial CHRISMED.</p><Link to="/chrismed/eventos" className="chrismed-cta mt-7 inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">Ver agenda de eventos<ArrowRight className="h-4 w-4"/></Link></div>}
      </div>
    </section>
  </main></ChrismedShell>;
}

function Message({ title, text }: { title: string; text: string }) { return <div><h2 className="chrismed-serif text-3xl">{title}</h2><p className="mt-3 text-[var(--chrismed-graphite)]">{text}</p><Link to="/chrismed/contato" className="mt-6 inline-flex items-center gap-2 font-semibold underline">Falar com a CHRISMED<ArrowRight className="h-4 w-4"/></Link></div>; }
