import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Loader2, QrCode, RefreshCw, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/chrismed/presenca')({
  beforeLoad: requireChrismedManagement,
  head: () => ({ meta: [{ title: 'Presença e check-in · CHRISMED' }] }),
  component: ChrismedPresencePage,
});

type PresenceRow = {
  appointment_id: string;
  patient_name: string;
  patient_email: string;
  professional_name: string;
  offering_name: string;
  starts_at: string;
  ends_at: string;
  checkin_token: string;
  checked_in_at: string | null;
  checkin_method: string | null;
};

function todayBr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function ChrismedPresencePage() {
  const [date, setDate] = useState(todayBr());
  const [rows, setRows] = useState<PresenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrToken, setQrToken] = useState('');
  const [checking, setChecking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc('chrismed_list_today_presence', { p_date: date });
    if (error) {
      toast.error('Não foi possível carregar a presença agora.');
      setRows([]);
    } else {
      setRows((data ?? []) as PresenceRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [date]);

  async function manualCheckin(appointmentId: string) {
    setChecking(appointmentId);
    const { error } = await (supabase as any).rpc('chrismed_checkin_appointment_manual', { p_appointment_id: appointmentId });
    setChecking(null);
    if (error) return toast.error(error.message || 'Não foi possível confirmar o check-in.');
    toast.success('Check-in confirmado. As boas-vindas foram enfileiradas imediatamente.');
    await load();
  }

  async function qrCheckin() {
    const token = qrToken.trim();
    if (!token) return toast.error('Informe ou leia o token do QR Code.');
    setChecking('qr');
    const { error } = await (supabase as any).rpc('chrismed_checkin_appointment_qr', { p_token: token });
    setChecking(null);
    if (error) return toast.error(error.message || 'QR Code inválido ou consulta não confirmada.');
    setQrToken('');
    toast.success('QR Code validado e presença confirmada.');
    await load();
  }

  const present = useMemo(() => rows.filter((row) => row.checked_in_at).length, [rows]);
  const pending = rows.length - present;

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">Agenda CHRISMED</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Presença e check-in</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#3F4A47]">Confirme a chegada do paciente por QR Code ou manualmente. O check-in dispara boas-vindas imediatas e agenda a pesquisa de experiência para 24 horas depois.</p>
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-3 lg:mt-0">
            <div><Label htmlFor="presence-date">Data</Label><Input id="presence-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric title="Consultas confirmadas" value={rows.length} icon={CalendarDays} />
          <Metric title="Check-ins realizados" value={present} icon={CheckCircle2} />
          <Metric title="Aguardando presença" value={pending} icon={UserCheck} />
        </section>

        <Card className="border-[#D9D3CB] bg-white">
          <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" />Leitura de QR Code</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div><Label htmlFor="qr-token">Token do QR Code</Label><Input id="qr-token" value={qrToken} onChange={(e) => setQrToken(e.target.value)} placeholder="Cole o token lido pelo leitor/câmera" /></div>
              <Button onClick={() => void qrCheckin()} disabled={checking === 'qr'} className="bg-[#071C18] text-white hover:bg-[#0B2A24]">{checking === 'qr' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar QR</Button>
            </div>
            <p className="mt-2 text-xs text-[#596660]">A câmera/leitor pode preencher este campo automaticamente. O backend valida o token e a consulta antes de registrar presença.</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[#D9D3CB] bg-white">
          <CardHeader className="border-b border-[#E7E2DB]"><CardTitle>Pacientes do dia</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-[#596660]"><Loader2 className="h-5 w-5 animate-spin" />Carregando…</div> : rows.length === 0 ? <div className="p-10 text-center text-sm text-[#596660]">Nenhuma consulta confirmada nesta data.</div> : (
              <div className="divide-y divide-[#E7E2DB]">
                {rows.map((row) => {
                  const start = new Date(row.starts_at).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                  const end = new Date(row.ends_at).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                  return <div key={row.appointment_id} className="grid gap-4 p-5 lg:grid-cols-[100px_1.5fr_1fr_1fr_auto] lg:items-center">
                    <div className="font-semibold">{start}–{end}</div>
                    <div><div className="font-medium">{row.patient_name}</div><div className="text-xs text-[#596660]">{row.patient_email}</div></div>
                    <div><div className="text-sm font-medium">{row.professional_name}</div><div className="text-xs text-[#596660]">{row.offering_name}</div></div>
                    <div>{row.checked_in_at ? <Badge className="border border-emerald-300 bg-emerald-50 text-emerald-900">Presente · {row.checkin_method === 'qr' ? 'QR' : 'manual'}</Badge> : <Badge className="border border-amber-300 bg-amber-50 text-amber-950">Aguardando</Badge>}</div>
                    <Button size="sm" variant={row.checked_in_at ? 'outline' : 'default'} disabled={Boolean(row.checked_in_at) || checking === row.appointment_id} onClick={() => void manualCheckin(row.appointment_id)}>{checking === row.appointment_id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{row.checked_in_at ? 'Check-in feito' : 'Confirmar presença'}</Button>
                  </div>;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof CalendarDays }) {
  return <Card className="border-[#D9D3CB] bg-white"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7EDEB]"><Icon className="h-5 w-5" /></div><div><div className="text-2xl font-bold">{value}</div><div className="text-xs text-[#596660]">{title}</div></div></CardContent></Card>;
}
