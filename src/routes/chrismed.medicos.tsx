import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Stethoscope, UserCheck, Search, Filter, ArrowRight, ArrowLeft,
  Check, Info, Briefcase, Heart, Baby, Brain, Plane, Video, Home, MapPin,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CHRISMED_DOCTORS, CHRISMED_SPECIALTIES, CHRISMED_UNITS } from '@/data/chrismed-mock';

export const Route = createFileRoute('/chrismed/medicos')({
  head: () => ({
    meta: [
      { title: 'Nossos Médicos — CrisMed' },
      { name: 'description', content: 'Conheça a rede curada de médicos CrisMed e cadastre-se como profissional parceiro. Multiespecialidades, incluindo Medicina Ocupacional.' },
      { property: 'og:title', content: 'Nossos Médicos · CrisMed' },
      { property: 'og:description', content: 'Rede curada de médicos CrisMed e cadastro de parceiros.' },
    ],
  }),
  component: MedicosPage,
});

const MODS = [
  { id: 'presencial', label: 'Presencial', icon: MapPin },
  { id: 'telemedicina', label: 'Teleconsulta', icon: Video },
  { id: 'domiciliar', label: 'Domiciliar', icon: Home },
  { id: 'ocupacional', label: 'Ocupacional', icon: Briefcase },
] as const;

const SPEC_ICON: Record<string, any> = {
  stethoscope: Stethoscope, heart: Heart, briefcase: Briefcase,
  baby: Baby, brain: Brain, plane: Plane,
};

/* --------------------------------- Page --------------------------------- */

function MedicosPage() {
  return (
    <ChrismedShell>
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container py-16 md:py-20 max-w-5xl">
          <Badge className="bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] border border-[var(--chrismed-sand)] mb-5 uppercase tracking-[0.18em] text-[10px]">Rede CrisMed</Badge>
          <h1 className="chrismed-serif text-4xl md:text-6xl text-[var(--chrismed-ink)] leading-[1.05] max-w-3xl">Nossos médicos</h1>
          <p className="mt-6 text-lg text-[var(--chrismed-graphite)] max-w-2xl">
            Rede curada pela Dra. Cristiane Alencar. Atendimento presencial, teleconsulta, domiciliar e medicina ocupacional.
          </p>
        </div>
      </section>

      <DoctorsDirectory />
      <DoctorRegistration />
    </ChrismedShell>
  );
}

/* ---------------------------- Doctors Directory ---------------------------- */

function DoctorsDirectory() {
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState<string>('all');
  const [mod, setMod] = useState<string>('all');

  const filtered = useMemo(() => {
    return CHRISMED_DOCTORS.filter((d) => {
      if (spec !== 'all' && !d.specialtySlugs.includes(spec)) return false;
      if (mod !== 'all' && !d.modalities.includes(mod as any)) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (!d.name.toLowerCase().includes(s) && !d.title.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [q, spec, mod]);

  return (
    <section className="container py-12 md:py-16 max-w-6xl">
      <div className="flex items-center gap-2 mb-5 text-[var(--chrismed-ink)]">
        <Filter className="h-4 w-4" />
        <h2 className="chrismed-serif text-2xl">Encontrar um médico</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_220px] gap-3 mb-6">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--chrismed-ink)]/50" />
          <Input placeholder="Buscar por nome ou título" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={spec} onValueChange={setSpec}>
          <SelectTrigger><SelectValue placeholder="Especialidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as especialidades</SelectItem>
            {CHRISMED_SPECIALTIES.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={mod} onValueChange={setMod}>
          <SelectTrigger><SelectValue placeholder="Modalidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as modalidades</SelectItem>
            {MODS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-10 text-center text-[var(--chrismed-graphite)]">
          Nenhum médico encontrado com esses filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const specs = d.specialtySlugs.map((s) => CHRISMED_SPECIALTIES.find((x) => x.slug === s)).filter(Boolean);
            const units = d.unitSlugs.map((u) => CHRISMED_UNITS.find((x) => x.slug === u)).filter(Boolean);
            return (
              <article key={d.slug} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-900/10 text-[var(--chrismed-ink)] grid place-items-center chrismed-serif text-lg">
                    {d.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                  </div>
                  <div>
                    <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] leading-tight">{d.name}</h3>
                    <p className="text-[11px] text-[var(--chrismed-mist)] uppercase tracking-wider">{d.crm}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--chrismed-graphite)]">{d.title}</p>
                <p className="mt-2 text-xs text-[var(--chrismed-graphite)] flex-1">{d.bio}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {specs.map((s: any) => {
                    const Icon = SPEC_ICON[s.icon] ?? Stethoscope;
                    return (
                      <span key={s.slug} className="inline-flex items-center gap-1 rounded-full border border-emerald-900/15 bg-emerald-900/[0.03] px-2 py-0.5 text-[11px] text-[var(--chrismed-ink)]">
                        <Icon className="h-3 w-3" /> {s.name}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.modalities.map((m) => (
                    <span key={m} className="text-[10px] uppercase tracking-wider text-[var(--chrismed-mist)] border border-[var(--chrismed-sand)] rounded-full px-2 py-0.5">
                      {m}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-[11px] text-[var(--chrismed-ink)]/55">
                  {units.map((u: any) => u.name).join(' · ')}
                </p>

                <Link to="/chrismed/agendar" className="mt-5">
                  <Button className="w-full bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)] gap-1.5">
                    Agendar com este médico <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-[11px] text-[var(--chrismed-ink)]/55 flex items-start gap-1.5">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        Alguns perfis exibem "Pendente Codex" enquanto a integração com o banco definitivo de médicos parceiros é finalizada.
      </p>
    </section>
  );
}

/* --------------------------- Doctor Registration --------------------------- */

const STEPS = ['Pessoal', 'Profissional', 'Atendimento', 'Agenda'] as const;

type FormState = {
  nome: string; email: string; telefone: string; cidade: string;
  crm: string; crmUf: string;
  especialidades: string[]; // MULTIPLE
  especialidadePrincipal: string;
  modalidades: string[];
  disponibilidade: string;
  obs: string;
};

const INITIAL: FormState = {
  nome: '', email: '', telefone: '', cidade: '',
  crm: '', crmUf: '',
  especialidades: [], especialidadePrincipal: '',
  modalidades: [], disponibilidade: '', obs: '',
};

function DoctorRegistration() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(INITIAL);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function toggle<K extends 'especialidades' | 'modalidades'>(key: K, id: string) {
    setF((p) => ({ ...p, [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));
  }

  function canAdvance(): string | null {
    if (step === 0) {
      if (!f.nome.trim()) return 'Informe seu nome.';
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'E-mail inválido.';
    }
    if (step === 1) {
      if (!f.crm.trim() || !f.crmUf) return 'CRM e UF são obrigatórios.';
      if (f.especialidades.length === 0) return 'Selecione ao menos uma especialidade.';
      if (!f.especialidadePrincipal) return 'Escolha a especialidade principal.';
    }
    if (step === 2 && f.modalidades.length === 0) return 'Selecione ao menos uma modalidade.';
    return null;
  }

  function next() {
    const err = canAdvance();
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function submit() {
    if (!consent) { toast.error('Aceite o tratamento de dados (LGPD).'); return; }
    setSending(true);
    try {
      const specNames = f.especialidades
        .map((s) => CHRISMED_SPECIALTIES.find((x) => x.slug === s)?.name ?? s)
        .join(', ');
      const { error } = await supabase.from('marketing_leads').insert({
        source: 'outro',
        name: f.nome,
        email: f.email,
        phone: f.telefone || null,
        message:
          `Cadastro médico parceiro CrisMed.\n` +
          `CRM ${f.crm}/${f.crmUf}\n` +
          `Especialidades: ${specNames}\n` +
          `Principal: ${f.especialidadePrincipal}\n` +
          `Modalidades: ${f.modalidades.join(', ')}\n` +
          `Cidade: ${f.cidade}\n` +
          `Disponibilidade: ${f.disponibilidade}\n` +
          `Obs: ${f.obs}`,
        answers: { tipo: 'medico_parceiro', ...f },
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível enviar agora.');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <section className="container py-16 max-w-3xl">
        <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-900 text-amber-50 grid place-items-center">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="mt-5 chrismed-serif text-2xl text-[var(--chrismed-ink)]">Cadastro enviado</h3>
          <p className="mt-2 text-[var(--chrismed-graphite)]">Nossa equipe entrará em contato após análise dos dados.</p>
          <p className="mt-1 text-[11px] text-[var(--chrismed-ink)]/55">Status: novo cadastro → em análise → aprovado / recusado → ativo.</p>
          <Button onClick={() => { setDone(false); setF(INITIAL); setStep(0); setConsent(false); }} variant="outline" className="mt-6">
            Enviar outro cadastro
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-[var(--chrismed-sand)] bg-[#fbf9f4]/40">
      <div className="container py-16 max-w-3xl">
        <div className="flex items-center gap-2 text-[var(--chrismed-ink)] mb-2">
          <Stethoscope className="h-5 w-5" />
          <h2 className="chrismed-serif text-2xl">Seja um médico parceiro</h2>
        </div>
        <p className="text-sm text-[var(--chrismed-graphite)] mb-6">
          Cadastro em 4 etapas. Todos os cadastros passam por análise da equipe CrisMed.
        </p>

        {/* Stepper */}
        <ol className="flex items-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1 flex items-center gap-2">
              <div className={
                'h-7 w-7 rounded-full grid place-items-center text-xs font-medium border transition ' +
                (i < step ? 'bg-emerald-900 text-amber-50 border-emerald-900'
                  : i === step ? 'bg-emerald-900/10 text-[var(--chrismed-ink)] border-emerald-900/40'
                  : 'bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)]/50 border-emerald-900/15')
              }>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={'text-xs ' + (i === step ? 'text-[var(--chrismed-ink)] font-medium' : 'text-[var(--chrismed-mist)]')}>{label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-emerald-900/10" />}
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6 md:p-7 space-y-4">
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Nome completo*</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
              <div><Label>E-mail*</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
              <div><Label>Telefone / WhatsApp</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Cidade de atuação</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>CRM*</Label><Input value={f.crm} onChange={(e) => setF({ ...f, crm: e.target.value })} /></div>
                <div>
                  <Label>UF do CRM*</Label>
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

              <div>
                <Label>Especialidades (múltiplas)*</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHRISMED_SPECIALTIES.map((s) => {
                    const on = f.especialidades.includes(s.slug);
                    return (
                      <button
                        type="button" key={s.slug}
                        onClick={() => toggle('especialidades', s.slug)}
                        className={'px-3 py-1.5 rounded-full text-xs border transition ' +
                          (on ? 'bg-emerald-900 text-amber-50 border-emerald-900'
                              : 'border-[var(--chrismed-sand)] text-[var(--chrismed-graphite)] hover:bg-[var(--chrismed-bone)]')}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-[var(--chrismed-ink)]/55 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  O banco atual grava 1 especialidade principal por médico; múltiplas especialidades por profissional ficam pendentes de ajuste no schema (Codex).
                </p>
              </div>

              {f.especialidades.length > 0 && (
                <div>
                  <Label>Especialidade principal*</Label>
                  <Select value={f.especialidadePrincipal} onValueChange={(v) => setF({ ...f, especialidadePrincipal: v })}>
                    <SelectTrigger><SelectValue placeholder="Escolha a principal" /></SelectTrigger>
                    <SelectContent>
                      {f.especialidades.map((s) => {
                        const spec = CHRISMED_SPECIALTIES.find((x) => x.slug === s);
                        return <SelectItem key={s} value={s}>{spec?.name ?? s}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Modalidades de atendimento*</Label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODS.map((m) => {
                    const on = f.modalidades.includes(m.id);
                    const Icon = m.icon;
                    return (
                      <button
                        type="button" key={m.id}
                        onClick={() => toggle('modalidades', m.id)}
                        className={'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition ' +
                          (on ? 'bg-emerald-900 text-amber-50 border-emerald-900'
                              : 'border-emerald-900/15 text-[var(--chrismed-graphite)] hover:bg-[var(--chrismed-bone)]')}
                      >
                        <Icon className="h-5 w-5" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Observações sobre atendimento</Label>
                <Textarea rows={4} value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} placeholder="Preferências, público-alvo, idiomas, particularidades…" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Disponibilidade (turnos / dias)</Label>
                <Textarea rows={3} value={f.disponibilidade} onChange={(e) => setF({ ...f, disponibilidade: e.target.value })} placeholder="Ex.: seg/qua 14h–18h · sáb manhã" />
              </div>

              <div className="rounded-xl border border-[var(--chrismed-sand)] bg-[#fbf9f4]/50 p-4 text-sm space-y-1">
                <p className="font-medium text-[var(--chrismed-ink)]">Revisão</p>
                <p className="text-[var(--chrismed-graphite)]"><b>Nome:</b> {f.nome || '—'}</p>
                <p className="text-[var(--chrismed-graphite)]"><b>CRM:</b> {f.crm ? `${f.crm}/${f.crmUf}` : '—'}</p>
                <p className="text-[var(--chrismed-graphite)]"><b>Especialidades:</b> {f.especialidades.length ? f.especialidades.map((s) => CHRISMED_SPECIALTIES.find((x) => x.slug === s)?.name).join(', ') : '—'}</p>
                <p className="text-[var(--chrismed-graphite)]"><b>Principal:</b> {CHRISMED_SPECIALTIES.find((x) => x.slug === f.especialidadePrincipal)?.name ?? '—'}</p>
                <p className="text-[var(--chrismed-graphite)]"><b>Modalidades:</b> {f.modalidades.join(', ') || '—'}</p>
              </div>

              <label className="flex items-start gap-2 text-xs text-[var(--chrismed-graphite)]">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>Autorizo o uso dos meus dados profissionais para análise de parceria, conforme a LGPD.</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button" variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || sending}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)] gap-1.5">
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={sending} className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)] gap-1.5">
                <UserCheck className="h-4 w-4" /> {sending ? 'Enviando…' : 'Enviar cadastro'}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-[var(--chrismed-ink)]/55">
          Status interno: novo cadastro → em análise → aprovado / recusado → ativo.
        </p>
      </div>
    </section>
  );
}
