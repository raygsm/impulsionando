import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { ChrismedFlagsBar } from '@/components/chrismed/ChrismedFlagsBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, MapPin, CalendarCheck, Briefcase, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CHRISMED_CONTACT } from '@/data/chrismed-contact';

export const Route = createFileRoute('/chrismed/contato')({
  head: () => ({
    meta: [
      { title: 'Contato — CHRISMED · Dra. Christiane Alencar' },
      { name: 'description', content: 'Fale com a equipe CHRISMED por WhatsApp, e-mail ou formulário. Atendimento em Copacabana, Rio de Janeiro.' },
      { property: 'og:title', content: 'Contato · CHRISMED' },
      { property: 'og:description', content: 'Canais oficiais de contato CHRISMED.' },
    ],
  }),
  component: ContatoPage,
});

const WHATSAPP = `${CHRISMED_CONTACT.channels.whatsapp}&text=${encodeURIComponent('Olá CHRISMED, gostaria de orientação sobre uma consulta.')}`;
const EMAIL = CHRISMED_CONTACT.channels.emailDisplay;

function ContatoPage() {
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [msg, setMsg] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !contato.trim()) { toast.error('Informe seu nome e um WhatsApp ou e-mail para retorno.'); return; }
    if (!consent) { toast.error('É necessário autorizar o uso dos dados para que a equipe possa retornar seu contato.'); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('marketing_leads').insert({
        source: 'contato',
        name: nome.trim(),
        phone: contato.includes('@') ? null : contato.trim(),
        email: contato.includes('@') ? contato.trim() : null,
        message: msg.trim(),
        answers: { origem: 'chrismed_contato' },
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      toast.success('Mensagem recebida. A equipe CHRISMED retornará seu contato em breve.');
      setNome(''); setContato(''); setMsg(''); setConsent(false);
    } catch (error) {
      console.error('[CHRISMED] Falha ao registrar contato', error);
      toast.error('Não foi possível enviar sua mensagem agora. Tente novamente ou utilize um dos canais oficiais ao lado.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ChrismedShell>
      <div className="chrismed-page-mustard">
        <section className="chrismed-band-forest">
          <div className="mx-auto max-w-4xl px-4 py-24 md:px-6 text-center text-white">
            <ChrismedFlagsBar tone="dark" align="center" className="mb-6" />
            <Badge className="bg-white/10 text-[var(--chrismed-amber-soft)] border border-white/15 mb-5 uppercase tracking-[0.22em] text-[10px]">Contato</Badge>
            <h1 className="chrismed-serif text-4xl md:text-6xl leading-[1.02] tracking-tight">Fale com a CHRISMED</h1>
            <p className="mx-auto mt-6 text-lg max-w-2xl text-white/80">Escolha o canal mais adequado para consultas, Medicina Ocupacional, GMS, ASO, perícias ou suporte institucional.</p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 md:px-6 py-16 grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="block rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6 hover:bg-[var(--chrismed-bone)] transition">
              <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp principal</h3>
              <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Atendimento rápido para dúvidas e suporte ao agendamento.</p>
            </a>
            <a href={`mailto:${EMAIL}`} className="block rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6 hover:bg-[var(--chrismed-bone)] transition">
              <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden="true" /> E-mail</h3>
              <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">{EMAIL}</p>
            </a>
            <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
              <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden="true" /> Endereço</h3>
              <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Copacabana — Rio de Janeiro. Endereço completo enviado na confirmação do agendamento.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-forest)] text-[var(--chrismed-ivory)] gap-1.5"><Link to="/chrismed/agendar"><CalendarCheck className="h-4 w-4" aria-hidden="true" />Agendar</Link></Button>
              <Button asChild variant="outline" className="border-[var(--chrismed-forest)] bg-white text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-forest-mist)] gap-1.5"><Link to="/chrismed/ocupacional"><Briefcase className="h-4 w-4" aria-hidden="true" />Empresa</Link></Button>
              <Button asChild variant="outline" className="border-[var(--chrismed-forest)] bg-white text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-forest-mist)] gap-1.5"><Link to="/chrismed/medicos"><Stethoscope className="h-4 w-4" aria-hidden="true" />Profissionais</Link></Button>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-7 space-y-4" noValidate>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)]">Mensagem</div>
              <h2 className="chrismed-serif text-xl text-[var(--chrismed-ink)] mt-1">Fale com a equipe CHRISMED</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="chrismed-contact-name">Seu nome*</Label>
                <Input id="chrismed-contact-name" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} aria-required="true" />
              </div>
              <div>
                <Label htmlFor="chrismed-contact-channel">WhatsApp ou e-mail*</Label>
                <Input id="chrismed-contact-channel" autoComplete="email" value={contato} onChange={(e) => setContato(e.target.value)} aria-required="true" />
              </div>
              <div>
                <Label htmlFor="chrismed-contact-message">Mensagem</Label>
                <Textarea id="chrismed-contact-message" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs text-[var(--chrismed-graphite)]">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" />
              <span>Autorizo o uso dos meus dados exclusivamente para o retorno da equipe CHRISMED, conforme a LGPD.</span>
            </label>
            <Button type="submit" disabled={sending} className="w-full bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-forest)] text-[var(--chrismed-ivory)]">
              {sending ? 'Enviando com segurança…' : 'Enviar mensagem'}
            </Button>
          </form>
        </section>
      </div>
    </ChrismedShell>
  );
}
