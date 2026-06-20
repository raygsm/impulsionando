import { createFileRoute } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/chrismed/medicos')({
  head: () => ({
    meta: [
      { title: 'Área dos Médicos — CrisMed' },
      { name: 'description', content: 'Cadastro de médicos parceiros CrisMed. Envie seus dados profissionais para análise da equipe.' },
      { property: 'og:title', content: 'Área dos Médicos · CrisMed' },
      { property: 'og:description', content: 'Médicos: cadastre-se como parceiro CrisMed.' },
    ],
  }),
  component: MedicosPage,
});

const MODS = [
  { id: 'presencial', label: 'Atendimento presencial' },
  { id: 'domiciliar', label: 'Atendimento domiciliar' },
  { id: 'teleconsulta', label: 'Teleconsulta' },
  { id: 'ocupacional', label: 'Medicina ocupacional' },
];

function MedicosPage() {
  const [f, setF] = useState({
    nome: '', email: '', telefone: '',
    especialidade: '', crm: '', crmUf: '',
    cidade: '', disponibilidade: '',
    interesses: [] as string[],
    obs: '',
  });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  function toggle(id: string) {
    setF((prev) => ({
      ...prev,
      interesses: prev.interesses.includes(id) ? prev.interesses.filter((x) => x !== id) : [...prev.interesses, id],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome || !f.email || !f.crm) { toast.error('Nome, e-mail e CRM são obrigatórios.'); return; }
    if (!consent) { toast.error('Aceite o tratamento de dados (LGPD).'); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('marketing_leads').insert({
        source: 'outro',
        name: f.nome,
        email: f.email,
        phone: f.telefone || null,
        message: `Cadastro médico parceiro CrisMed.\nCRM ${f.crm}/${f.crmUf} — ${f.especialidade}\nCidade: ${f.cidade}\nDisponibilidade: ${f.disponibilidade}\nInteresses: ${f.interesses.join(', ')}\nObs: ${f.obs}`,
        answers: { tipo: 'medico_parceiro', ...f },
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      toast.success('Cadastro enviado. Nossa equipe entrará em contato após análise.');
      setF({ nome: '', email: '', telefone: '', especialidade: '', crm: '', crmUf: '', cidade: '', disponibilidade: '', interesses: [], obs: '' });
      setConsent(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível enviar agora.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">Área dos Médicos</Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">Seja um médico parceiro CrisMed</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">Compartilhamos uma rede curada de profissionais para atendimento presencial, domiciliar, teleconsulta e medicina ocupacional. Envie seus dados — todos os cadastros passam por análise da equipe.</p>
        </div>
      </section>

      <section className="container py-16 max-w-4xl">
        <form onSubmit={submit} className="rounded-2xl border border-emerald-900/10 bg-white p-7 space-y-4">
          <div className="flex items-center gap-2 text-emerald-950">
            <Stethoscope className="h-5 w-5" />
            <h3 className="font-serif text-xl">Cadastro do médico</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Nome completo*</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
            <div><Label>E-mail*</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>Telefone / WhatsApp</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
            <div><Label>Especialidade</Label><Input value={f.especialidade} onChange={(e) => setF({ ...f, especialidade: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>CRM*</Label><Input value={f.crm} onChange={(e) => setF({ ...f, crm: e.target.value })} /></div>
              <div>
                <Label>UF do CRM</Label>
                <Select value={f.crmUf} onValueChange={(v) => setF({ ...f, crmUf: v })}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Cidade de atuação</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
            <div><Label>Disponibilidade (turnos / dias)</Label><Input value={f.disponibilidade} onChange={(e) => setF({ ...f, disponibilidade: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Label>Interesse de atuação</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {MODS.map((m) => (
                  <button
                    type="button" key={m.id} onClick={() => toggle(m.id)}
                    className={'px-3 py-1.5 rounded-full text-xs border transition ' +
                      (f.interesses.includes(m.id)
                        ? 'bg-emerald-900 text-amber-50 border-emerald-900'
                        : 'border-emerald-900/20 text-emerald-900/80 hover:bg-emerald-900/5')}
                  >{m.label}</button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2"><Label>Observações</Label><Textarea rows={4} value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} /></div>
          </div>

          <label className="flex items-start gap-2 text-xs text-emerald-900/75">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>Autorizo o uso dos meus dados profissionais para análise de parceria, conforme a LGPD.</span>
          </label>

          <Button type="submit" disabled={sending} className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-50 gap-1.5">
            <UserCheck className="h-4 w-4" /> {sending ? 'Enviando…' : 'Enviar cadastro para análise'}
          </Button>
          <p className="text-[11px] text-emerald-900/60">Status interno: novo cadastro → em análise → aprovado / recusado → ativo.</p>
        </form>
      </section>
    </ChrismedShell>
  );
}
