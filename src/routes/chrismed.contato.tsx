import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, MapPin, CalendarCheck, Briefcase, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/chrismed/contato')({
  head: () => ({
    meta: [
      { title: 'Contato — CrisMed · Dra. Cristiane Alencar' },
      { name: 'description', content: 'Fale com a equipe CrisMed por WhatsApp, e-mail ou formulário. Atendimento em Copacabana, Rio de Janeiro.' },
      { property: 'og:title', content: 'Contato · CrisMed' },
      { property: 'og:description', content: 'Canais oficiais de contato CrisMed.' },
    ],
  }),
  component: ContatoPage,
});

const WHATSAPP = 'https://wa.me/5521000000000?text=Ol%C3%A1%20CrisMed';
const EMAIL = 'contato@crismed.com.br';

function ContatoPage() {
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [msg, setMsg] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !contato) { toast.error('Informe nome e contato.'); return; }
    if (!consent) { toast.error('É necessário aceitar o tratamento de dados.'); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('marketing_leads').insert({
        source: 'contato',
        name: nome,
        phone: contato.includes('@') ? null : contato,
        email: contato.includes('@') ? contato : null,
        message: msg,
        answers: { origem: 'chrismed_contato' },
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      toast.success('Mensagem recebida. Retornamos em breve.');
      setNome(''); setContato(''); setMsg(''); setConsent(false);
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
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">Contato</Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">Como podemos ajudar?</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">Escolha o melhor canal. A equipe CrisMed responde em horário comercial, com sigilo e cordialidade.</p>
        </div>
      </section>

      <section className="container py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="block rounded-2xl border border-emerald-900/10 bg-white p-6 hover:bg-emerald-900/5 transition">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp principal</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Atendimento rápido para dúvidas e suporte ao agendamento.</p>
          </a>
          <a href={`mailto:${EMAIL}`} className="block rounded-2xl border border-emerald-900/10 bg-white p-6 hover:bg-emerald-900/5 transition">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><Mail className="h-4 w-4" /> E-mail</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">{EMAIL}</p>
          </a>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Copacabana — Rio de Janeiro. Endereço completo enviado na confirmação do agendamento.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button asChild className="bg-emerald-900 hover:bg-emerald-950 text-amber-50 gap-1.5"><Link to="/chrismed/agendar"><CalendarCheck className="h-4 w-4" />Agendar</Link></Button>
            <Button asChild variant="outline" className="border-emerald-900/20 gap-1.5"><Link to="/chrismed/ocupacional"><Briefcase className="h-4 w-4" />Empresa</Link></Button>
            <Button asChild variant="outline" className="border-emerald-900/20 gap-1.5"><Link to="/chrismed/medicos"><Stethoscope className="h-4 w-4" />Médicos</Link></Button>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-emerald-900/10 bg-white p-7 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-amber-700/90">Mensagem</div>
            <h3 className="font-serif text-xl text-emerald-950 mt-1">Fale com a equipe CrisMed</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Seu nome*</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp ou e-mail*</Label>
              <Input value={contato} onChange={(e) => setContato(e.target.value)} />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-emerald-900/75">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>Autorizo o uso dos meus dados para retorno da equipe CrisMed (LGPD).</span>
          </label>
          <Button type="submit" disabled={sending} className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-50">
            {sending ? 'Enviando…' : 'Enviar mensagem'}
          </Button>
        </form>
      </section>
    </ChrismedShell>
  );
}
