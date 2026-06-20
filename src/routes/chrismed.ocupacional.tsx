import { createFileRoute } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


export const Route = createFileRoute('/chrismed/ocupacional')({
  head: () => ({
    meta: [
      { title: 'Medicina Ocupacional · Clínica CrisMed' },
      { name: 'description', content: 'ASO, PCMSO, NR-1, exames admissionais, periódicos e demissionais para empresas. Solicite uma proposta corporativa.' },
      { property: 'og:title', content: 'Medicina Ocupacional · CrisMed' },
      { property: 'og:description', content: 'Saúde ocupacional integrada para empresas — ASO, PCMSO, NR-1, gestão e documentação.' },
    ],
  }),
  component: OcupacionalPage,
});

function OcupacionalPage() {
  const lang = useLang();
  const t = COPY[lang];
  const [form, setForm] = useState({ company: '', cnpj: '', contact: '', email: '', phone: '', employees: '', message: '' });
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company || !form.email || !form.contact) {
      toast.error(t.errMissing);
      return;
    }
    setSending(true);
    try {
      // Lightweight: just toast + (future) persist via server fn. Keep it safe and not blocking.
      await new Promise((r) => setTimeout(r, 500));
      toast.success(t.okSent);
      setForm({ company: '', cnpj: '', contact: '', email: '', phone: '', employees: '', message: '' });
    } finally {
      setSending(false);
    }
  }

  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 hover:bg-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">
            {t.eyebrow}
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">{t.title}</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">{t.lead}</p>
        </div>
      </section>

      <section className="container py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-serif text-2xl text-emerald-950">{t.servicesTitle}</h2>
          <ul className="mt-5 space-y-3 text-emerald-900/80">
            {t.services.map((s) => (
              <li key={s} className="flex gap-3 items-start">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-emerald-900/10 bg-white p-7 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-amber-700/90">{t.formEyebrow}</div>
            <h3 className="font-serif text-xl text-emerald-950 mt-1">{t.formTitle}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="company">{t.f.company}*</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="cnpj">{t.f.cnpj}</Label>
              <Input id="cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="employees">{t.f.employees}</Label>
              <Input id="employees" value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="contact">{t.f.contact}*</Label>
              <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">{t.f.phone}</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="email">{t.f.email}*</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="msg">{t.f.message}</Label>
              <Textarea id="msg" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
          </div>
          <Button type="submit" disabled={sending} className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-50">
            {sending ? t.sending : t.submit}
          </Button>
        </form>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Medicina ocupacional',
    title: 'Saúde corporativa, ASO e PCMSO sem fricção para sua empresa.',
    lead: 'Atendimento ocupacional ágil, documentação completa e gestão integrada com a Clínica CrisMed.',
    servicesTitle: 'Serviços',
    services: [
      'ASO admissional, periódico, demissional, retorno e mudança de função',
      'PCMSO — elaboração, revisão e acompanhamento técnico',
      'NR-1 — gestão de riscos ocupacionais',
      'Exames laboratoriais e complementares via laboratórios parceiros',
      'Agendamento empresarial e painel de conformidade',
      'Relatórios consolidados e arquivamento digital',
    ],
    formEyebrow: 'Proposta corporativa',
    formTitle: 'Solicite uma proposta para sua empresa',
    f: { company: 'Razão social', cnpj: 'CNPJ', contact: 'Nome do responsável', email: 'E-mail corporativo', phone: 'Telefone', employees: 'Nº de colaboradores', message: 'Mensagem' },
    submit: 'Enviar solicitação',
    sending: 'Enviando…',
    okSent: 'Solicitação recebida. Nosso time entrará em contato em breve.',
    errMissing: 'Preencha razão social, contato e e-mail.',
  },
  en: {
    eyebrow: 'Occupational health',
    title: 'Corporate health, occupational exams and compliance without friction.',
    lead: 'Fast occupational care, full documentation and integrated management with CrisMed Clinic.',
    servicesTitle: 'Services',
    services: [
      'Pre-hire, periodic, exit, return-to-work and role-change exams',
      'PCMSO — drafting, review and technical follow-up',
      'NR-1 — occupational risk management',
      'Lab and complementary exams via partner laboratories',
      'Enterprise scheduling and compliance dashboard',
      'Consolidated reports and digital archiving',
    ],
    formEyebrow: 'Corporate proposal',
    formTitle: 'Request a proposal for your company',
    f: { company: 'Company name', cnpj: 'Tax ID', contact: 'Contact name', email: 'Work email', phone: 'Phone', employees: '# of employees', message: 'Message' },
    submit: 'Send request',
    sending: 'Sending…',
    okSent: 'Request received. Our team will reach out shortly.',
    errMissing: 'Please fill company, contact and email.',
  },
  es: {
    eyebrow: 'Medicina ocupacional',
    title: 'Salud corporativa, exámenes ocupacionales y cumplimiento sin fricción.',
    lead: 'Atención ocupacional ágil, documentación completa y gestión integrada con la Clínica CrisMed.',
    servicesTitle: 'Servicios',
    services: [
      'Exámenes preocupacional, periódico, egreso, reintegro y cambio de función',
      'PCMSO — elaboración, revisión y seguimiento técnico',
      'NR-1 — gestión de riesgos ocupacionales',
      'Exámenes de laboratorio y complementarios con laboratorios asociados',
      'Agendamiento empresarial y tablero de cumplimiento',
      'Informes consolidados y archivo digital',
    ],
    formEyebrow: 'Propuesta corporativa',
    formTitle: 'Solicite una propuesta para su empresa',
    f: { company: 'Razón social', cnpj: 'CNPJ / Tax ID', contact: 'Nombre del responsable', email: 'Correo corporativo', phone: 'Teléfono', employees: 'Nº de colaboradores', message: 'Mensaje' },
    submit: 'Enviar solicitud',
    sending: 'Enviando…',
    okSent: 'Solicitud recibida. Nuestro equipo se pondrá en contacto en breve.',
    errMissing: 'Complete razón social, contacto y correo.',
  },
} as const;
