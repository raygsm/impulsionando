import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, QrCode, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { checkinChrismedEventQr, listChrismedCheckinEvents } from '@/lib/chrismed-event-checkin.functions';

export const Route = createFileRoute('/_authenticated/chrismed/eventos-checkin')({
  component: ChrismedEventCheckinPage,
  head: () => ({ meta: [{ title: 'Check-in de eventos — CHRISMED' }] }),
});

type EventRow = { id: string; title: string; starts_at: string; ends_at: string; status: string; venue_name: string | null; city: string | null; contractor_name: string | null };

function extractToken(raw: string) {
  const value = raw.trim();
  const direct = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)?.[0];
  if (direct) return direct;
  const payload = value.match(/^CHRISMED-EVENT:[0-9a-f-]+:([0-9a-f-]+)$/i)?.[1];
  if (payload) return payload;
  try { const url = new URL(value); return url.searchParams.get('token') ?? ''; } catch { return ''; }
}

function ChrismedEventCheckinPage() {
  const [events, setEvents] = useState<EventRow[]>([]); const [eventId, setEventId] = useState(''); const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(true); const [checking, setChecking] = useState(false); const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const selected = useMemo(() => events.find(e => e.id === eventId) ?? null, [events, eventId]);

  async function load() { setLoading(true); try { const rows = (await listChrismedCheckinEvents()) as EventRow[]; setEvents(rows); if (!eventId && rows[0]) setEventId(rows[0].id); } catch(error:any) { toast.error(error?.message ?? 'Falha ao carregar eventos autorizados.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);

  async function submit() {
    const token = extractToken(raw);
    if (!eventId) return toast.error('Selecione o evento.');
    if (!token) return toast.error('QR/credencial inválido. Leia novamente ou cole o token da credencial.');
    setChecking(true); setLastResult(null);
    try { const result = await checkinChrismedEventQr({ data: { event_id: eventId, qr_token: token } }); setLastResult(result); setRaw(''); toast.success('Presença confirmada.'); }
    catch(error:any) { toast.error(error?.message ?? 'Não foi possível confirmar a presença.'); }
    finally { setChecking(false); }
  }

  return <div className="mx-auto max-w-5xl space-y-6 p-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-primary">CHRISMED · Eventos</p><h1 className="text-3xl font-bold tracking-tight">Check-in</h1><p className="mt-1 text-sm text-muted-foreground">Valide a credencial individual do profissional e confirme a presença em tempo real.</p></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/>Atualizar</Button></header>
    <Card><CardHeader><CardTitle>Evento</CardTitle></CardHeader><CardContent><Label>Evento autorizado</Label><select className="mt-2 h-11 w-full rounded-md border bg-background px-3" value={eventId} onChange={e=>{setEventId(e.target.value);setLastResult(null);}} disabled={loading}><option value="">Selecione</option>{events.map(event=><option key={event.id} value={event.id}>{event.title} · {new Date(event.starts_at).toLocaleDateString('pt-BR')}</option>)}</select>{selected && <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm"><strong>{selected.title}</strong><p className="mt-1 text-muted-foreground">{selected.contractor_name || 'CHRISMED'} · {[selected.venue_name,selected.city].filter(Boolean).join(' · ')}</p></div>}{!loading && events.length===0 && <p className="mt-4 text-sm text-muted-foreground">Sua conta ainda não está vinculada a nenhum evento para check-in.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5"/>Ler credencial</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-dashed p-5"><div className="flex items-start gap-3"><Camera className="mt-0.5 h-5 w-5"/><div><strong>Leitor de QR</strong><p className="mt-1 text-sm text-muted-foreground">Use o leitor de QR do aparelho e cole abaixo o conteúdo lido. Este modo funciona como fallback universal sem depender de permissões específicas do navegador.</p></div></div></div><div><Label>QR Code / token / link da credencial</Label><Input className="mt-2" value={raw} onChange={e=>setRaw(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void submit();}}} placeholder="Cole ou leia a credencial aqui" autoComplete="off"/></div><Button onClick={()=>void submit()} disabled={checking||!eventId}><Users className="mr-2 h-4 w-4"/>{checking?'Validando…':'Confirmar presença'}</Button></CardContent></Card>
    {lastResult && <Card className="border-emerald-300"><CardContent className="pt-6"><CheckCircle2 className="h-10 w-10 text-emerald-700"/><h2 className="mt-3 text-2xl font-bold">Check-in confirmado</h2><p className="mt-2 text-sm text-muted-foreground">A presença foi registrada e a jornada pós-check-in foi acionada no backend.</p></CardContent></Card>}
  </div>;
}
