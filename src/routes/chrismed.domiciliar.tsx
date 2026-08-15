import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { ChrismedFlagsBar } from '@/components/chrismed/ChrismedFlagsBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Home, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { lookupCEP } from '@/lib/validators';

export const Route = createFileRoute('/chrismed/domiciliar')({
  head: () => ({
    meta: [
      { title: 'Consulta domiciliar — Dra. Christiane Alencar · CHRISMED' },
      { name: 'description', content: 'Atendimento médico domiciliar no Rio de Janeiro com a Dra. Christiane Alencar. Validação de endereço, agenda integrada e pagamento online via Mercado Pago.' },
      { property: 'og:title', content: 'Consulta domiciliar · CHRISMED' },
      { property: 'og:description', content: 'Atendimento domiciliar onde você estiver. Verifique disponibilidade para sua região.' },
    ],
  }),
  component: DomiciliarPage,
});

function DomiciliarPage() {
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [municipioIbge, setMunicipioIbge] = useState('');
  const [numeroComplemento, setNumeroComplemento] = useState('');
  const [obs, setObs] = useState('');
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [consent, setConsent] = useState(false);

  async function lookupCep(value: string) {
    const clean = value.replace(/\D/g, '').slice(0,8);
    setCep(clean);
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const address = await lookupCEP(clean);
      if (!address) { toast.error('CEP não encontrado.'); return; }
      setLogradouro(address.logradouro ?? '');
      setBairro(address.bairro ?? '');
      setCidade(address.cidade ?? '');
      setUf(address.uf ?? '');
      setMunicipioIbge(address.ibge ?? '');
    } catch { toast.error('Não foi possível consultar o CEP agora.'); }
    finally { setLoadingCep(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cep.replace(/\D/g,'').length !== 8 || !cidade || !uf || !municipioIbge) { toast.error('Informe primeiro um CEP válido.'); return; }
    if (!nome || !contato) { toast.error('Informe nome e contato.'); return; }
    if (!consent) { toast.error('É necessário aceitar o tratamento de dados.'); return; }
    setSending(true);
    try {
      const enderecoCompleto=[logradouro,numeroComplemento,bairro,`${cidade}/${uf}`].filter(Boolean).join(' · ');
      const { error } = await supabase.from('marketing_leads').insert({
        source: 'contato',
        name: nome,
        phone: contato.includes('@') ? null : contato,
        email: contato.includes('@') ? contato : null,
        message: `Solicitação de consulta domiciliar.\nCEP: ${cep}\nEndereço: ${enderecoCompleto}\nObservações: ${obs}`,
        answers: { tipo: 'consulta_domiciliar', cep, logradouro, numero_complemento: numeroComplemento, bairro, cidade, uf, municipio_ibge: municipioIbge, observacoes: obs },
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      toast.success('Solicitação recebida. Vamos confirmar a disponibilidade e seguir com o agendamento.');
      setCep(''); setLogradouro(''); setBairro(''); setCidade(''); setUf(''); setMunicipioIbge(''); setNumeroComplemento(''); setObs(''); setNome(''); setContato(''); setConsent(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível enviar agora.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ChrismedShell><div className="bg-[var(--chrismed-ivory)]">
      <section className="chrismed-bleed chrismed-page-forest">
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <ChrismedFlagsBar tone="dark" align="right" className="mb-6" />
          <Badge className="bg-[var(--chrismed-forest-deep)] text-[var(--chrismed-amber)] border border-[var(--chrismed-amber)]/40 mb-5 uppercase tracking-[0.18em] text-[10px]">Consulta Domiciliar</Badge>
          <h1 className="chrismed-serif text-4xl md:text-6xl leading-[1.02] max-w-3xl">Consulta Domiciliar — onde você estiver.</h1>
          <p className="chrismed-lede mt-6 max-w-2xl">Atendimento médico com a Dra. Christiane Alencar no conforto e na discrição do seu ambiente. Após validar seu endereço, você recebe os horários disponíveis e finaliza o agendamento com pagamento online. Os retornos poderão ser realizados por Teleconsulta ou Consulta Presencial no consultório em Copacabana, conforme orientação médica.</p>
          <div className="mt-8 inline-flex flex-col rounded-2xl border border-[var(--chrismed-amber)]/30 bg-[var(--chrismed-forest-deep)]/60 px-6 py-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--chrismed-amber)] mb-2">Bairros atualmente atendidos</div>
            <ul className="text-[var(--chrismed-ivory)] text-base space-y-1"><li>· Zona Sul do Rio de Janeiro</li><li>· Grande Tijuca</li><li>· Barra da Tijuca</li></ul>
            <p className="mt-3 text-xs text-[var(--chrismed-ivory)]/70 max-w-md">Outras regiões podem ser avaliadas mediante consulta prévia.</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6"><h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><MapPin className="h-4 w-4" /> Como confirmamos seu endereço</h3><p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Informe primeiro o CEP. O sistema preenche município, UF, bairro e logradouro quando disponíveis; você digita apenas número/complemento e exceções necessárias.</p></div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6"><h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><Home className="h-4 w-4" /> Onde atendemos</h3><p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Onde você estiver, dentro das regiões atendidas e confirmadas pela equipe. Pacientes brasileiros e estrangeiros. Retornos posteriores ocorrem por Teleconsulta ou Consulta Presencial em Copacabana.</p></div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6"><h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento e reserva</h3><p className="mt-2 text-[var(--chrismed-graphite)] text-sm">A reserva do horário só é confirmada após pagamento aprovado via Mercado Pago.</p></div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6"><h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> LGPD</h3><p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Seus dados são usados exclusivamente para análise da solicitação e contato pela equipe CHRISMED.</p></div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-7 space-y-4">
          <div><div className="text-[11px] uppercase tracking-[0.18em] text-[var(--chrismed-champagne-deep)]">Verificar disponibilidade</div><h3 className="chrismed-serif text-xl text-[var(--chrismed-ink)] mt-1">Solicite seu atendimento domiciliar</h3></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>CEP*</Label><Input value={cep} onChange={(e) => lookupCep(e.target.value)} placeholder="00000-000" inputMode="numeric" />{loadingCep&&<div className="text-xs mt-1 text-[var(--chrismed-mist)]">Consultando endereço…</div>}</div>
            <div><Label>UF</Label><Input value={uf} readOnly /></div>
            <div><Label>Município</Label><Input value={cidade} readOnly /></div>
            <div><Label>Bairro</Label><Input value={bairro} onChange={(e) => setBairro(e.target.value)} readOnly={!!bairro} placeholder="Preenchido pelo CEP quando disponível" /></div>
            <div><Label>Logradouro</Label><Input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} readOnly={!!logradouro} placeholder="Preenchido pelo CEP quando disponível" /></div>
            <div className="col-span-2"><Label>Número e complemento*</Label><Input value={numeroComplemento} onChange={(e)=>setNumeroComplemento(e.target.value)} placeholder="Ex.: 120, ap. 301" /></div>
            <div><Label>Seu nome*</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><Label>WhatsApp ou e-mail*</Label><Input value={contato} onChange={(e) => setContato(e.target.value)} /></div>
            <div className="col-span-2"><Label>Observações clínicas</Label><Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Conte brevemente o motivo do atendimento." /></div>
          </div>
          <label className="flex items-start gap-2 text-xs text-[var(--chrismed-graphite)]"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /><span>Autorizo o uso dos meus dados pela CHRISMED para retorno comercial e clínico, conforme a LGPD.</span></label>
          <Button type="submit" disabled={sending||loadingCep} className="w-full bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]">{sending ? 'Enviando…' : 'Solicitar disponibilidade'}</Button>
          <p className="text-[11px] text-[var(--chrismed-mist)]">Após confirmação da zona, enviamos os horários e o link de pagamento. <Link to="/chrismed/agendar" search={{ modality: 'domiciliar' }} className="underline">Ver fluxo completo</Link>.</p>
        </form>
      </section>
    </div></ChrismedShell>
  );
}
