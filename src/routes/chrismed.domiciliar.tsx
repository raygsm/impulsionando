import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Home, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/chrismed/domiciliar')({
  head: () => ({
    meta: [
      { title: 'Consulta domiciliar — Dra. Cristiane Alencar · CrisMed' },
      { name: 'description', content: 'Atendimento médico domiciliar no Rio de Janeiro com a Dra. Cristiane Alencar. Validação de endereço, agenda integrada e pagamento online via Mercado Pago.' },
      { property: 'og:title', content: 'Consulta domiciliar · CrisMed' },
      { property: 'og:description', content: 'A médica vai até você — em casa, hotel ou empresa. Verifique disponibilidade para sua região.' },
    ],
  }),
  component: DomiciliarPage,
});

function DomiciliarPage() {
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [obs, setObs] = useState('');
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [sending, setSending] = useState(false);
  const [consent, setConsent] = useState(false);

  async function lookupCep(value: string) {
    const clean = value.replace(/\D/g, '');
    if (clean.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const j = await r.json();
      if (!j.erro) {
        setEndereco(`${j.logradouro ?? ''}${j.localidade ? ' — ' + j.localidade : ''}${j.uf ? '/' + j.uf : ''}`.trim());
        setBairro(j.bairro ?? '');
      }
    } catch { /* silencioso */ }
  }

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
        message: `Solicitação de consulta domiciliar.\nCEP: ${cep}\nEndereço: ${endereco}\nBairro: ${bairro}\nObservações: ${obs}`,
        answers: { tipo: 'consulta_domiciliar', cep, endereco, bairro, observacoes: obs },
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      toast.success('Solicitação recebida. Vamos confirmar a disponibilidade e seguir com o agendamento.');
      setCep(''); setEndereco(''); setBairro(''); setObs(''); setNome(''); setContato(''); setConsent(false);
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
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">Consulta domiciliar</Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">A médica vai até você</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">
            Atendimento domiciliar no Rio de Janeiro. A disponibilidade depende de localização, agenda e confirmação prévia. Após validar seu endereço, você recebe os horários disponíveis e finaliza o agendamento com pagamento online.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><MapPin className="h-4 w-4" /> Como confirmamos seu endereço</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Informe CEP, bairro e cidade. Validamos a zona de atendimento e respondemos com a disponibilidade do dia/horário desejado.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><Home className="h-4 w-4" /> Onde atendemos</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Residências, hotéis, escritórios e empresas. Pacientes brasileiros e estrangeiros.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento e reserva</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">A reserva do horário só é confirmada após pagamento aprovado via Mercado Pago.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> LGPD</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Seus dados são usados exclusivamente para análise da solicitação e contato pela equipe CrisMed.</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-emerald-900/10 bg-white p-7 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-amber-700/90">Verificar disponibilidade</div>
            <h3 className="font-serif text-xl text-emerald-950 mt-1">Solicite seu atendimento domiciliar</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CEP</Label>
              <Input value={cep} onChange={(e) => setCep(e.target.value)} onBlur={(e) => lookupCep(e.target.value)} placeholder="00000-000" />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Endereço (rua, número, complemento, cidade)</Label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            </div>
            <div>
              <Label>Seu nome*</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp ou e-mail*</Label>
              <Input value={contato} onChange={(e) => setContato(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Observações clínicas</Label>
              <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Conte brevemente o motivo do atendimento." />
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-emerald-900/75">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>Autorizo o uso dos meus dados pela CrisMed para retorno comercial e clínico, conforme a LGPD.</span>
          </label>
          <Button type="submit" disabled={sending} className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-50">
            {sending ? 'Enviando…' : 'Solicitar disponibilidade'}
          </Button>
          <p className="text-[11px] text-emerald-900/60">Após confirmação da zona, enviamos os horários e o link de pagamento. <Link to="/chrismed/agendar" search={{ modality: 'domiciliar' }} className="underline">Ver fluxo completo</Link>.</p>
        </form>
      </section>
    </ChrismedShell>
  );
}
