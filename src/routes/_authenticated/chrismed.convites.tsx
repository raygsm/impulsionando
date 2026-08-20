import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Building2, Mail, MessageCircle, RefreshCw, Send, Stethoscope, Upload, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/chrismed/convites')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedInvitesPage,
  head: () => ({ meta: [{ title: 'Convites — Gestão CHRISMED' }] }),
});

type InviteType = 'professional' | 'company' | 'patient';
type Invite = {
  id: string;
  invite_type: InviteType;
  recipient_name: string;
  recipient_email: string;
  organization_name: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
};

const typeLabel: Record<InviteType, string> = {
  professional: 'Profissional da saúde',
  company: 'Empresa',
  patient: 'Paciente',
};

function ChrismedInvitesPage() {
  const [type, setType] = useState<InviteType>('professional');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Invite[]>([]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('chrismed_management_invitations')
      .select('id,invite_type,recipient_name,recipient_email,organization_name,status,created_at,sent_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      toast.error('Não foi possível carregar os convites.');
      return;
    }
    setRows((data ?? []) as Invite[]);
  }

  useEffect(() => { void load(); }, []);

  async function sendInvite() {
    if (!name.trim() || !email.trim()) {
      toast.error('Informe nome e e-mail.');
      return;
    }
    setSending(true);
    const { error } = await (supabase as any).rpc('chrismed_send_management_invitation', {
      p_invite_type: type,
      p_recipient_name: name.trim(),
      p_recipient_email: email.trim(),
      p_recipient_phone: phone.trim() || null,
      p_organization_name: organization.trim() || null,
      p_metadata: { source: 'chrismed_management_invites_ui' },
    });
    setSending(false);
    if (error) {
      toast.error(error.message || 'Não foi possível enviar o convite.');
      return;
    }
    toast.success('Convite colocado na mensageria CHRISMED.');
    setName(''); setEmail(''); setPhone(''); setOrganization('');
    await load();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-7 text-[#0b2523] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#61706d]">Gestão CHRISMED · Captação e relacionamento</p>
              <h1 className="mt-2 text-3xl font-bold">Central de Convites</h1>
              <p className="mt-2 max-w-3xl text-sm text-[#53615e]">Convide profissionais, empresas e pacientes com registro auditável e comunicação automática. Para bases maiores, use a importação em massa do Core.</p>
            </div>
            <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <Link to="/admin/comunicacoes/email-massa" className="block"><Card className="h-full transition hover:shadow-md"><CardContent className="flex items-center gap-3 p-5"><Upload className="h-5 w-5 text-[#087f79]"/><div><strong>Importar lista / E-mail em massa</strong><p className="text-xs text-muted-foreground">Base segmentada, consentimento e campanhas.</p></div></CardContent></Card></Link>
          <Link to="/chrismed/whatsapp" className="block"><Card className="h-full transition hover:shadow-md"><CardContent className="flex items-center gap-3 p-5"><MessageCircle className="h-5 w-5 text-[#087f79]"/><div><strong>WhatsApp</strong><p className="text-xs text-muted-foreground">Conexão por QR e canal oficial.</p></div></CardContent></Card></Link>
          <Link to="/chrismed/time" className="block"><Card className="h-full transition hover:shadow-md"><CardContent className="flex items-center gap-3 p-5"><Stethoscope className="h-5 w-5 text-[#087f79]"/><div><strong>Comitê CHRISMED</strong><p className="text-xs text-muted-foreground">Aprovação e ativação dos profissionais.</p></div></CardContent></Card></Link>
        </section>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5"/>Novo convite</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div><Label>Categoria</Label><Select value={type} onValueChange={(v) => setType(v as InviteType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="professional">Profissional da saúde</SelectItem><SelectItem value="company">Empresa</SelectItem><SelectItem value="patient">Paciente</SelectItem></SelectContent></Select></div>
            <div><Label>{type === 'company' ? 'Nome do contato' : 'Nome'}</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" /></div>
            <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com.br" /></div>
            <div><Label>Celular / WhatsApp</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 21 ..." /></div>
            {type === 'company' && <div className="md:col-span-2"><Label>Empresa</Label><Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Razão social ou nome fantasia" /></div>}
            <div className="md:col-span-2 flex flex-wrap gap-3"><Button onClick={() => void sendInvite()} disabled={sending}><Mail className="mr-2 h-4 w-4"/>{sending ? 'Enviando…' : 'Enviar convite por e-mail'}</Button><p className="self-center text-xs text-muted-foreground">O envio entra na fila transacional CHRISMED e fica registrado na timeline operacional.</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Convites recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!loading && !rows.length && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum convite registrado ainda.</p>}
            {rows.map((r) => {
              const Icon = r.invite_type === 'professional' ? Stethoscope : r.invite_type === 'company' ? Building2 : UserRound;
              return <div key={r.id} className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1.4fr_1.4fr_1fr_auto] md:items-center"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f4f2]"><Icon className="h-4 w-4 text-[#087f79]"/></span><div><strong>{r.recipient_name}</strong><p className="text-xs text-muted-foreground">{typeLabel[r.invite_type]}</p></div></div><div className="text-sm"><p>{r.recipient_email}</p>{r.organization_name && <p className="text-xs text-muted-foreground">{r.organization_name}</p>}</div><div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</div><Badge variant={r.status === 'sent' || r.status === 'accepted' ? 'default' : 'secondary'}>{r.status.toUpperCase()}</Badge></div>;
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
