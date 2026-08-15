import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CalendarDays, MapPin, ShieldCheck } from 'lucide-react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { getChrismedEventCredential } from '@/lib/chrismed-events';

export const Route = createFileRoute('/chrismed/evento-credencial')({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === 'string' ? search.token : '' }),
  head: () => ({ meta: [{ title: 'Credencial de evento — CHRISMED' }, { name: 'robots', content: 'noindex,nofollow' }] }),
  component: EventCredentialPage,
});

function EventCredentialPage() {
  const { token } = Route.useSearch();
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
  const { data, isLoading, error } = useQuery({ queryKey: ['chrismed-event-credential', token], queryFn: () => getChrismedEventCredential(token), enabled: valid, retry: false });
  const [qr, setQr] = useState('');
  useEffect(() => { if (!data?.qrToken) return; void QRCode.toDataURL(`CHRIMED-EVENT:${data.eventId}:${data.qrToken}`, { width: 360, margin: 2 }).then(setQr); }, [data]);
  const fmt = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value));

  return <ChrismedShell><main className="min-h-[70vh] bg-[var(--chrismed-ivory)] px-5 py-14 text-[var(--chrismed-forest-deep)] sm:px-6 md:py-20">
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[var(--chrismed-mustard-deep)]"><ShieldCheck className="h-4 w-4"/>Credencial individual CHRISMED</div>
      {isLoading && <div className="rounded-[2rem] bg-white p-10 shadow-sm">Carregando credencial…</div>}
      {(!valid || error) && <div className="rounded-[2rem] border border-[var(--chrismed-sand)] bg-white p-10 shadow-sm"><h1 className="chrismed-serif text-4xl">Credencial indisponível</h1><p className="mt-4 text-[var(--chrismed-graphite)]">O link pode ser inválido ou a participação ainda não estar confirmada. Entre em contato com a CHRISMED para verificar.</p></div>}
      {data && <article className="overflow-hidden rounded-[2rem] border border-[var(--chrismed-sand)] bg-white shadow-[var(--chrismed-shadow-md)]"><header className="bg-[var(--chrismed-forest-deep)] p-7 text-white md:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--chrismed-amber-soft)]">Participação confirmada</p><h1 className="chrismed-serif mt-3 text-4xl md:text-5xl">{data.eventTitle}</h1><p className="mt-4 text-white/75">{data.attendeeName}</p></header><div className="grid gap-8 p-7 md:grid-cols-[1fr_300px] md:p-10"><div><div className="flex gap-3"><CalendarDays className="mt-1 h-5 w-5 shrink-0"/><div><strong>{fmt(data.startsAt)}</strong><p className="mt-1 text-sm text-[var(--chrismed-graphite)]">Término: {fmt(data.endsAt)}</p></div></div><div className="mt-5 flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0"/><div><strong>{data.venueName || 'Local informado pela CHRISMED'}</strong><p className="mt-1 text-sm text-[var(--chrismed-graphite)]">{[data.venueAddress, data.city].filter(Boolean).join(' · ')}</p></div></div><div className="mt-7 rounded-xl bg-[#f4efdf] p-4 text-sm"><strong>Protocolo:</strong> {data.registrationCode}<br/><span className="text-[var(--chrismed-graphite)]">Apresente este QR Code no check-in. A credencial é pessoal e válida apenas para este evento.</span></div></div><div className="flex items-center justify-center rounded-2xl border bg-white p-4">{qr ? <img src={qr} alt="QR Code da credencial CHRISMED" className="h-auto w-full max-w-[280px]" /> : <span className="text-sm text-muted-foreground">Gerando QR Code…</span>}</div></div></article>}
    </section>
  </main></ChrismedShell>;
}
