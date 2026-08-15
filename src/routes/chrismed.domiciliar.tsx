import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { ChrismedFlagsBar } from '@/components/chrismed/ChrismedFlagsBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Home, MapPin, CreditCard, ShieldCheck, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { lookupCEP } from '@/lib/validators';

export const Route = createFileRoute('/chrismed/domiciliar')({
  head: () => ({
    meta: [
      { title: 'Consulta domiciliar — Dra. Christiane Alencar · CHRISMED' },
      { name: 'description', content: 'Atendimento médico domiciliar no Rio de Janeiro com a Dra. Christiane Alencar. Validação de endereço, agenda integrada e pagamento online via Mercado Pago.' },
      { property: 'og:title', content: 'Consulta domiciliar · CHRISMED' },
      { property: 'og:description', content: 'Atendimento domiciliar integrado à mesma agenda CHRISMED de consultas presenciais, teleconsultas, ASO e perícias.' },
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
  const [loadingCep, setLoadingCep] = useState(false);
  const [consent, setConsent] = useState(false);

  async function lookupCep(value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 8);
    setCep(clean);
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const address = await lookupCEP(clean);
      if (!address) {
        toast.error('CEP não encontrado.');
        return;
      }
      setLogradouro(address.logradouro ?? '');
      setBairro(address.bairro ?? '');
      setCidade(address.cidade ?? '');
      setUf(address.uf ?? '');
      setMunicipioIbge(address.ibge ?? '');
    } catch {
      toast.error('Não foi possível consultar o CEP agora.');
    } finally {
      setLoadingCep(false);
    }
  }

  function continueToAgenda(e: React.FormEvent) {
    e.preventDefault();
    if (cep.replace(/\D/g, '').length !== 8 || !cidade || !uf || !municipioIbge) {
      toast.error('Informe primeiro um CEP válido.');
      return;
    }
    if (!numeroComplemento.trim()) {
      toast.error('Informe número e complemento do endereço.');
      return;
    }
    if (!consent) {
      toast.error('É necessário aceitar o tratamento de dados para seguir.');
      return;
    }

    const addressContext = {
      cep,
      logradouro,
      numero_complemento: numeroComplemento.trim(),
      bairro,
      cidade,
      uf,
      municipio_ibge: municipioIbge,
      observacoes: obs.trim(),
      validated_at: new Date().toISOString(),
    };

    try {
      window.sessionStorage.setItem('chrismed_domiciliar_address', JSON.stringify(addressContext));
    } catch {
      // A agenda continua funcional mesmo se o navegador bloquear sessionStorage.
    }

    window.location.assign('/agendar?modality=domiciliar');
  }

  return (
    <ChrismedShell>
      <div className="bg-[var(--chrismed-ivory)]">
        <section className="chrismed-bleed chrismed-page-forest">
          <div className="container mx-auto max-w-5xl px-4 py-20">
            <ChrismedFlagsBar tone="dark" align="right" className="mb-6" />
            <Badge className="mb-5 border border-[var(--chrismed-amber)]/40 bg-[var(--chrismed-forest-deep)] text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-amber)]">Consulta Domiciliar</Badge>
            <h1 className="chrismed-serif max-w-3xl text-4xl leading-[1.02] md:text-6xl">Consulta domiciliar integrada à agenda CHRISMED.</h1>
            <p className="chrismed-lede mt-6 max-w-2xl">O atendimento domiciliar utiliza a mesma agenda da Dra. Christiane Alencar. Teleconsulta, consulta presencial em Copacabana, domiciliar, ASO e perícia compartilham os mesmos blocos de horário: quando um período é reservado, ele fica indisponível para todas as demais modalidades.</p>
            <div className="mt-8 inline-flex flex-col rounded-2xl border border-[var(--chrismed-amber)]/30 bg-[var(--chrismed-forest-deep)]/60 px-6 py-5">
              <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[var(--chrismed-amber)]">Bairros atualmente atendidos</div>
              <ul className="space-y-1 text-base text-[var(--chrismed-ivory)]"><li>· Zona Sul do Rio de Janeiro</li><li>· Grande Tijuca</li><li>· Barra da Tijuca</li></ul>
              <p className="mt-3 max-w-md text-xs text-[var(--chrismed-ivory)]/70">Outras regiões podem ser avaliadas pela equipe antes da confirmação definitiva.</p>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid max-w-5xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div className="space-y-4">
            <Info icon={MapPin} title="1. Valide o endereço">Informe o CEP e complete número/complemento. Esse contexto acompanha sua jornada de agendamento.</Info>
            <Info icon={CalendarDays} title="2. Escolha na agenda única">Você verá os horários realmente disponíveis da mesma agenda usada por todas as modalidades da CHRISMED.</Info>
            <Info icon={CreditCard} title="3. Confirme e pague">O horário só é confirmado após o pagamento aprovado pelo fluxo oficial da CHRISMED.</Info>
            <Info icon={ShieldCheck} title="Privacidade e LGPD">O endereço é utilizado exclusivamente para viabilizar o atendimento domiciliar e permanece vinculado ao contexto protegido do agendamento.</Info>
          </div>

          <form onSubmit={continueToAgenda} className="space-y-4 rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-7">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--chrismed-champagne-deep)]">Primeiro passo</div>
              <h3 className="chrismed-serif mt-1 text-xl text-[var(--chrismed-ink)]">Valide o endereço e abra a agenda</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>CEP*</Label><Input value={cep} onChange={(e) => void lookupCep(e.target.value)} placeholder="00000-000" inputMode="numeric" />{loadingCep && <div className="mt-1 text-xs text-[var(--chrismed-mist)]">Consultando endereço…</div>}</div>
              <div><Label>UF</Label><Input value={uf} readOnly /></div>
              <div><Label>Município</Label><Input value={cidade} readOnly /></div>
              <div><Label>Bairro</Label><Input value={bairro} onChange={(e) => setBairro(e.target.value)} readOnly={Boolean(bairro)} placeholder="Preenchido pelo CEP" /></div>
              <div><Label>Logradouro</Label><Input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} readOnly={Boolean(logradouro)} placeholder="Preenchido pelo CEP" /></div>
              <div className="col-span-2"><Label>Número e complemento*</Label><Input value={numeroComplemento} onChange={(e) => setNumeroComplemento(e.target.value)} placeholder="Ex.: 120, ap. 301" /></div>
              <div className="col-span-2"><Label>Observações para o atendimento</Label><Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: instruções de acesso, mobilidade ou outra informação necessária ao atendimento." /></div>
            </div>
            <label className="flex items-start gap-2 text-xs text-[var(--chrismed-graphite)]"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /><span>Autorizo o tratamento desses dados pela CHRISMED para viabilizar o atendimento domiciliar, conforme a LGPD.</span></label>
            <Button type="submit" disabled={loadingCep} className="w-full bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] hover:bg-[var(--chrismed-champagne-deep)]">Abrir agenda domiciliar</Button>
            <p className="text-[11px] text-[var(--chrismed-mist)]">Você será levado diretamente para a agenda compartilhada com Domiciliar já selecionado. <Link to="/chrismed/agendar" search={{ modality: 'domiciliar' }} className="underline">Ir direto para a agenda</Link>.</p>
          </form>
        </section>
      </div>
    </ChrismedShell>
  );
}

function Info({ icon: Icon, title, children }: { icon: typeof Home; title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6"><h3 className="chrismed-serif flex items-center gap-2 text-lg text-[var(--chrismed-ink)]"><Icon className="h-4 w-4" />{title}</h3><p className="mt-2 text-sm text-[var(--chrismed-graphite)]">{children}</p></div>;
}
