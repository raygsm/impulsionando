import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { CheckCircle2, CalendarDays, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { acceptChrismedEventInvitation, trackChrismedEventInvitationActivity } from '@/lib/chrismed-events';

export const Route = createFileRoute('/chrismed/evento-convite')({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === 'string' ? search.token : '' }),
  head: () => ({ meta: [{ title: 'Convite para evento — CHRISMED' }, { name: 'description', content: 'Confirmação segura de presença em eventos CHRISMED.' }] }),
  component: EventInvitationPage,
});

function EventInvitationPage() {
  const { token } = Route.useSearch();
  const started = useRef(false);
  const openedTracked = useRef(false);
  const invalid = !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);

  const mutation = useMutation({
    mutationFn: async () => {
      await trackChrismedEventInvitationActivity(token, 'confirm_started');
      try {
        const result = await acceptChrismedEventInvitation(token);
        await trackChrismedEventInvitationActivity(token, 'confirmed');
        return result;
      } catch (error) {
        await trackChrismedEventInvitationActivity(token, 'confirm_failed', error);
        throw error;
      }
    },
  });

  useEffect(() => {
    if (invalid || openedTracked.current) return;
    openedTracked.current = true;
    void trackChrismedEventInvitationActivity(token, 'opened');
  }, [invalid, token]);

  useEffect(() => {
    if (invalid || started.current) return;
    started.current = true;
    mutation.mutate();
  }, [invalid, token]);

  return <ChrismedShell><main className="min-h-[70vh] bg-[var(--chrismed-ivory)] px-5 py-16 text-[var(--chrismed-forest-deep)] sm:px-6 md:py-24">
    <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[var(--chrismed-sand)] bg-white shadow-[var(--chrismed-shadow-md)]">
      <div className="bg-[var(--chrismed-forest-deep)] px-7 py-10 text-white md:px-10"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[var(--chrismed-amber-soft)]"><CalendarDays className="h-6 w-6" /></div><h1 className="chrismed-serif mt-5 text-4xl md:text-5xl">Convite CHRISMED</h1><p className="mt-3 max-w-2xl text-white/75">Este link é individual. Ao abri-lo, sua presença é confirmada automaticamente e a vaga fica reservada em seu nome.</p></div>
      <div className="p-7 md:p-10">
        {invalid && <Message title="Convite inválido" text="Este link não contém uma credencial de convite válida. Solicite um novo convite à equipe CHRISMED." />}
        {!invalid && mutation.isPending && <div role="status" className="flex items-start gap-4 rounded-2xl bg-[#f4efdf] p-5"><Loader2 className="mt-0.5 h-6 w-6 shrink-0 animate-spin"/><div><h2 className="chrismed-serif text-2xl">Confirmando sua presença…</h2><p className="mt-2 text-sm leading-relaxed">Não feche esta página. Estamos reservando sua vaga e gerando seu protocolo individual.</p></div></div>}
        {!invalid && !mutation.isPending && !mutation.data && !mutation.error && <div className="flex gap-3 rounded-2xl bg-[#f4efdf] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><p className="text-sm leading-relaxed">Seu convite é pessoal e confirma uma única participação. Não há cobrança para o profissional de saúde.</p></div>}
        {mutation.error && <><Message title="Não foi possível confirmar automaticamente" text={mutation.error.message || 'O convite pode estar expirado ou indisponível.'} /><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="chrismed-cta mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-bold">Tentar confirmar novamente</button></>}
        {mutation.data && <div role="status"><CheckCircle2 className="h-10 w-10 text-emerald-700"/><h2 className="chrismed-serif mt-4 text-3xl">Presença confirmada</h2><p className="mt-3 text-[var(--chrismed-graphite)]">Sua vaga está reservada. Protocolo: <strong>{mutation.data.registration_code}</strong>.</p><p className="mt-2 text-sm text-[var(--chrismed-graphite)]">Sua credencial individual com QR Code será enviada ao e-mail deste convite.</p><Link to="/chrismed/eventos" className="chrismed-cta mt-7 inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">Ver agenda de eventos<ArrowRight className="h-4 w-4"/></Link></div>}
      </div>
    </section>
  </main></ChrismedShell>;
}

function Message({ title, text }: { title: string; text: string }) { return <div><h2 className="chrismed-serif text-3xl">{title}</h2><p className="mt-3 text-[var(--chrismed-graphite)]">{text}</p><Link to="/chrismed/contato" className="mt-6 inline-flex items-center gap-2 font-semibold underline">Falar com a CHRISMED<ArrowRight className="h-4 w-4"/></Link></div>; }
