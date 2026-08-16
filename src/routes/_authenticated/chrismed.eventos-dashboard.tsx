import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Building2, CalendarDays, CheckCircle2, Loader2, RefreshCw, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/chrismed/eventos-dashboard')({
  head: () => ({ meta: [{ title: 'Eventos B2B · CHRISMED' }] }),
  component: ChrismedEventsDashboard,
});

type EventRow = { event_id: string; title: string; starts_at: string; ends_at: string; status: string; venue_name: string | null; organization_names: string[]; };
type Overview = {
  event: { id: string; title: string; starts_at: string; ends_at: string; venue_name?: string; city?: string; capacity?: number; status: string; organizer_name?: string; event_kind?: string };
  metrics: { invited: number; invitation_accepted: number; registrations: number; confirmed: number; checked_in: number; surveys_scheduled: number; surveys_completed: number; avg_nps: number | null; avg_csat: number | null };
  organizations: Array<{ link_id: string; organization_id: string; name: string; document?: string; role: string; can_view_dashboard: boolean; contact_name?: string; contact_email?: string }>;
};

function ChrismedEventsDashboard() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc('chrismed_list_accessible_event_dashboards');
    if (error) { toast.error('Não foi possível carregar os eventos autorizados.'); setEvents([]); setLoading(false); return; }
    const list = (data ?? []) as EventRow[];
    setEvents(list);
    const id = selected || list[0]?.event_id || '';
    setSelected(id);
    if (id) await loadOverview(id);
    setLoading(false);
  }
  async function loadOverview(eventId: string) {
    const { data, error } = await (supabase as any).rpc('chrismed_event_dashboard_overview', { p_event_id: eventId });
    if (error) { toast.error('Não foi possível carregar os indicadores deste evento.'); setOverview(null); }
    else setOverview(data as Overview);
  }
  useEffect(() => { void loadEvents(); }, []);

  const conversion = useMemo(() => { const invited = overview?.metrics.invited ?? 0; const confirmed = overview?.metrics.confirmed ?? 0; return invited > 0 ? Math.round((confirmed / invited) * 100) : 0; }, [overview]);
  const attendance = useMemo(() => { const confirmed = overview?.metrics.confirmed ?? 0; const checked = overview?.metrics.checked_in ?? 0; return confirmed > 0 ? Math.round((checked / confirmed) * 100) : 0; }, [overview]);
  const surveyRate = useMemo(() => { const scheduled = overview?.metrics.surveys_scheduled ?? 0; const completed = overview?.metrics.surveys_completed ?? 0; return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0; }, [overview]);

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">Eventos CHRISMED</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard B2B de eventos</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#3F4A47]">Acompanhe convites, confirmações, check-ins, comparecimento e pesquisas. Organizações vinculadas enxergam somente os eventos para os quais receberam permissão.</p></div>
          <div className="mt-5 flex min-w-[280px] items-end gap-2 lg:mt-0"><div className="flex-1"><Select value={selected} onValueChange={(value) => { setSelected(value); void loadOverview(value); }}><SelectTrigger><SelectValue placeholder="Selecione um evento" /></SelectTrigger><SelectContent>{events.map((event) => <SelectItem key={event.event_id} value={event.event_id}>{event.title}</SelectItem>)}</SelectContent></Select></div><Button variant="outline" onClick={() => void loadEvents()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button></div>
        </header>
        {loading ? <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-[#D9D3CB] bg-white text-sm text-[#596660]"><Loader2 className="h-5 w-5 animate-spin" />Carregando indicadores…</div> : !overview ? <div className="rounded-2xl border border-[#D9D3CB] bg-white p-10 text-center text-sm text-[#596660]">Nenhum evento disponível para este usuário.</div> : <>
          <Card className="border-[#D9D3CB] bg-white"><CardContent className="p-6 lg:flex lg:items-start lg:justify-between lg:gap-6"><div><Badge className="border border-[#D9D3CB] bg-[#F7F3EA] text-[#071C18]">{overview.event.status}</Badge><h2 className="mt-3 text-2xl font-bold">{overview.event.title}</h2><p className="mt-2 text-sm text-[#596660]">{new Date(overview.event.starts_at).toLocaleString('pt-BR')} · {overview.event.venue_name || 'Local a definir'}{overview.event.city ? ` · ${overview.event.city}` : ''}</p></div><div className="mt-5 text-sm text-[#596660] lg:mt-0">{overview.organizations.length ? <><div className="font-medium text-[#071C18]">Organizações vinculadas</div><div className="mt-2 flex flex-wrap gap-2">{overview.organizations.map((org) => <Badge key={org.link_id} variant="outline"><Building2 className="mr-1 h-3 w-3" />{org.name}</Badge>)}</div></> : 'Evento sem organização externa vinculada.'}</div></CardContent></Card>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Convidados" value={overview.metrics.invited} sub={`${overview.metrics.invitation_accepted} aceitaram convite`} icon={Users} /><Metric title="Confirmados" value={overview.metrics.confirmed} sub={`${conversion}% dos convidados`} icon={CheckCircle2} /><Metric title="Check-ins" value={overview.metrics.checked_in} sub={`${attendance}% de comparecimento`} icon={CalendarDays} /><Metric title="Pesquisas respondidas" value={overview.metrics.surveys_completed} sub={`${surveyRate}% de resposta`} icon={BarChart3} /></section>
          <section className="grid gap-4 lg:grid-cols-2"><Card className="border-[#D9D3CB] bg-white"><CardHeader><CardTitle>Satisfação</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4"><Score label="NPS médio" value={overview.metrics.avg_nps} max="10" /><Score label="CSAT médio" value={overview.metrics.avg_csat} max="5" /></CardContent></Card><Card className="border-[#D9D3CB] bg-white"><CardHeader><CardTitle>Funil do evento</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{[['Convidados',overview.metrics.invited],['Inscrições',overview.metrics.registrations],['Confirmados',overview.metrics.confirmed],['Check-ins',overview.metrics.checked_in],['Pesquisas',overview.metrics.surveys_completed]].map(([label,value]) => <div key={String(label)} className="flex items-center justify-between border-b border-[#E7E2DB] pb-2"><span className="text-[#596660]">{label}</span><strong>{value}</strong></div>)}</CardContent></Card></section>
        </>}
      </div>
    </main>
  );
}
function Metric({ title, value, sub, icon: Icon }: { title: string; value: number; sub: string; icon: typeof Users }) { return <Card className="border-[#D9D3CB] bg-white"><CardContent className="p-5"><div className="flex items-start justify-between"><div><div className="text-3xl font-bold">{value}</div><div className="mt-1 text-sm font-medium">{title}</div><div className="mt-1 text-xs text-[#596660]">{sub}</div></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7EDEB]"><Icon className="h-5 w-5" /></div></div></CardContent></Card>; }
function Score({ label, value, max }: { label: string; value: number | null; max: string }) { return <div className="rounded-2xl border border-[#E7E2DB] bg-[#FDFCFB] p-5"><div className="text-xs uppercase tracking-[0.14em] text-[#596660]">{label}</div><div className="mt-2 text-3xl font-bold">{value ?? '—'}<span className="text-sm font-normal text-[#596660]">/{max}</span></div></div>; }
