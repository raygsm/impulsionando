import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Eye, Pencil, Plus, RefreshCw, Trash2, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import {
  deleteChrismedEvent,
  listChrismedEventsManagement,
  listChrismedEventRegistrationsManagement,
  saveChrismedEvent,
  setChrismedEventStatus,
} from '@/lib/chrismed-events-management.functions';

type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished';
type EventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  cover_url: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  starts_at: string;
  ends_at: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  capacity: number;
  price_cents: number;
  status: EventStatus;
  organizer_name: string;
  created_at: string;
  updated_at: string;
};

type RegistrationRow = {
  id: string;
  registration_code: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  quantity: number;
  status: string;
  source: string | null;
  created_at: string;
};

const emptyForm = {
  id: undefined as string | undefined,
  slug: '',
  title: '',
  summary: '',
  description: '',
  cover_url: '',
  venue_name: '',
  venue_address: '',
  city: 'Rio de Janeiro',
  starts_at: '',
  ends_at: '',
  registration_opens_at: '',
  registration_closes_at: '',
  capacity: 50,
  price_reais: '0,00',
  status: 'draft' as EventStatus,
  organizer_name: 'CHRISMED',
};

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIso(value: string) { return value ? new Date(value).toISOString() : null; }
function parsePrice(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  return Math.round(Number(normalized || 0) * 100);
}
function brl(cents: number) { return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

export const Route = createFileRoute('/_authenticated/chrismed/eventos-gestao')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedEventManagementPage,
  head: () => ({ meta: [{ title: 'Eventos — Gestão CHRISMED' }] }),
});

function ChrismedEventManagementPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [registrationEvent, setRegistrationEvent] = useState<EventRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await listChrismedEventsManagement();
      setEvents((rows ?? []) as EventRow[]);
    } catch (error: any) {
      toast.error(error?.message ?? 'Falha ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => ({
    total: events.length,
    published: events.filter((e) => e.status === 'published').length,
    future: events.filter((e) => new Date(e.starts_at).getTime() > Date.now() && e.status !== 'cancelled').length,
  }), [events]);

  function startNew() {
    setForm(emptyForm);
    setEditing(true);
    setRegistrationEvent(null);
  }

  function edit(event: EventRow) {
    setForm({
      id: event.id,
      slug: event.slug,
      title: event.title,
      summary: event.summary ?? '',
      description: event.description ?? '',
      cover_url: event.cover_url ?? '',
      venue_name: event.venue_name ?? '',
      venue_address: event.venue_address ?? '',
      city: event.city ?? 'Rio de Janeiro',
      starts_at: toLocalInput(event.starts_at),
      ends_at: toLocalInput(event.ends_at),
      registration_opens_at: toLocalInput(event.registration_opens_at),
      registration_closes_at: toLocalInput(event.registration_closes_at),
      capacity: event.capacity,
      price_reais: (event.price_cents / 100).toFixed(2).replace('.', ','),
      status: event.status,
      organizer_name: event.organizer_name,
    });
    setEditing(true);
    setRegistrationEvent(null);
  }

  async function save() {
    if (!form.slug || !form.title || !form.starts_at || !form.ends_at) return toast.error('Preencha slug, título, início e término.');
    setSaving(true);
    try {
      await saveChrismedEvent({ data: {
        id: form.id,
        slug: form.slug.trim().toLowerCase(),
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        description: form.description.trim() || null,
        cover_url: form.cover_url.trim() || null,
        venue_name: form.venue_name.trim() || null,
        venue_address: form.venue_address.trim() || null,
        city: form.city.trim() || 'Rio de Janeiro',
        starts_at: toIso(form.starts_at)!,
        ends_at: toIso(form.ends_at)!,
        registration_opens_at: toIso(form.registration_opens_at),
        registration_closes_at: toIso(form.registration_closes_at),
        capacity: Number(form.capacity),
        price_cents: parsePrice(form.price_reais),
        status: form.status,
        organizer_name: form.organizer_name.trim() || 'CHRISMED',
      } });
      toast.success(form.id ? 'Evento atualizado.' : 'Evento criado.');
      setEditing(false);
      setForm(emptyForm);
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? 'Não foi possível salvar o evento.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(event: EventRow, status: EventStatus) {
    try {
      await setChrismedEventStatus({ data: { id: event.id, status } });
      toast.success(status === 'published' ? 'Evento publicado.' : 'Status atualizado.');
      await load();
    } catch (error: any) { toast.error(error?.message ?? 'Falha ao alterar status.'); }
  }

  async function remove(event: EventRow) {
    const ok = window.confirm(`Excluir definitivamente o evento “${event.title}”? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    setDeleting(event.id);
    try {
      await deleteChrismedEvent({ data: { id: event.id } });
      toast.success('Evento excluído definitivamente.');
      if (form.id === event.id) { setEditing(false); setForm(emptyForm); }
      if (registrationEvent?.id === event.id) setRegistrationEvent(null);
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? 'Não foi possível excluir o evento.');
    } finally {
      setDeleting(null);
    }
  }

  async function showRegistrations(event: EventRow) {
    try {
      const rows = await listChrismedEventRegistrationsManagement({ data: { event_id: event.id } });
      setRegistrations((rows ?? []) as RegistrationRow[]);
      setRegistrationEvent(event);
      setEditing(false);
    } catch (error: any) { toast.error(error?.message ?? 'Falha ao carregar inscrições.'); }
  }

  return <div className="mx-auto max-w-7xl space-y-6 p-6">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-sm font-medium text-primary">CHRISMED · Gestão</p><h1 className="text-3xl font-bold tracking-tight">Eventos</h1><p className="mt-1 text-sm text-muted-foreground">Crie, edite, publique, acompanhe inscrições, finalize ou exclua eventos em uma única central.</p></div>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><a href="/eventos" target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" />Abrir página pública</a></Button><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button><Button onClick={startNew}><Plus className="mr-2 h-4 w-4" />Novo evento</Button></div>
    </header>

    <section className="grid gap-4 sm:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Eventos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totals.total}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Publicados</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totals.published}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Próximos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totals.future}</CardContent></Card>
    </section>

    {editing && <Card><CardHeader><CardTitle>{form.id ? 'Editar evento' : 'Novo evento'}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} placeholder="evento-chrismed" /></div>
      <div className="space-y-2"><Label>Status</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="cancelled">Cancelado</option><option value="finished">Finalizado</option></select></div>
      <div className="space-y-2 md:col-span-2"><Label>Resumo</Label><Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Descrição</Label><textarea className="min-h-32 w-full rounded-md border bg-background p-3 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="space-y-2"><Label>Início</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
      <div className="space-y-2"><Label>Término</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
      <div className="space-y-2"><Label>Abertura das inscrições</Label><Input type="datetime-local" value={form.registration_opens_at} onChange={(e) => setForm({ ...form, registration_opens_at: e.target.value })} /></div>
      <div className="space-y-2"><Label>Encerramento das inscrições</Label><Input type="datetime-local" value={form.registration_closes_at} onChange={(e) => setForm({ ...form, registration_closes_at: e.target.value })} /></div>
      <div className="space-y-2"><Label>Capacidade</Label><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
      <div className="space-y-2"><Label>Preço (R$)</Label><Input value={form.price_reais} onChange={(e) => setForm({ ...form, price_reais: e.target.value })} /></div>
      <div className="space-y-2"><Label>Local</Label><Input value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} /></div>
      <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Input value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Imagem de capa (URL)</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
      <div className="flex flex-wrap gap-2 md:col-span-2"><Button onClick={() => void save()} disabled={saving}>{saving ? 'Salvando…' : 'Salvar evento'}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button></div>
    </CardContent></Card>}

    {registrationEvent && <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Inscrições · {registrationEvent.title}</CardTitle><Button variant="outline" size="sm" onClick={() => setRegistrationEvent(null)}>Fechar</Button></div></CardHeader><CardContent>{registrations.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma inscrição.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-left"><th className="py-2">Código</th><th>Participante</th><th>E-mail</th><th>Qtde.</th><th>Status</th></tr></thead><tbody>{registrations.map((r) => <tr key={r.id} className="border-b"><td className="py-3 font-mono text-xs">{r.registration_code}</td><td>{r.attendee_name}</td><td>{r.attendee_email}</td><td>{r.quantity}</td><td>{r.status}</td></tr>)}</tbody></table></div>}</CardContent></Card>}

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Eventos cadastrados</CardTitle></CardHeader><CardContent className="space-y-3">{loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : events.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Nenhum evento cadastrado. Use “Novo evento”.</div> : events.map((event) => <div key={event.id} className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong>{event.title}</strong><Badge variant={event.status === 'published' ? 'default' : 'secondary'}>{event.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{new Date(event.starts_at).toLocaleString('pt-BR')} · {event.capacity} vagas · {brl(event.price_cents)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => edit(event)}><Pencil className="mr-1 h-4 w-4" />Editar</Button><Button size="sm" variant="outline" onClick={() => void showRegistrations(event)}><Users className="mr-1 h-4 w-4" />Inscrições</Button>{event.status !== 'published' && <Button size="sm" onClick={() => void changeStatus(event, 'published')}><CheckCircle2 className="mr-1 h-4 w-4" />Publicar</Button>}{event.status === 'published' && <Button size="sm" variant="destructive" onClick={() => void changeStatus(event, 'cancelled')}><XCircle className="mr-1 h-4 w-4" />Cancelar</Button>}<Button asChild size="sm" variant="ghost"><a href="/eventos" target="_blank" rel="noreferrer"><Eye className="mr-1 h-4 w-4" />Ver público</a></Button><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={deleting === event.id} onClick={() => void remove(event)}><Trash2 className="mr-1 h-4 w-4" />{deleting === event.id ? 'Excluindo…' : 'Excluir'}</Button></div></div>)}</CardContent></Card>
  </div>;
}
