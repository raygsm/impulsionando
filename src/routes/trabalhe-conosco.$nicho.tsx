import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { NICHOS_TALENTOS } from "./trabalhe-conosco.index";

export const Route = createFileRoute("/trabalhe-conosco/$nicho")({
  head: ({ params }) => ({
    meta: [
      { title: `Trabalhe conosco — ${params.nicho} | Impulsionando Tecnologia` },
      { name: "description", content: `Candidate-se a vagas no nicho ${params.nicho} dentro do ecossistema Impulsionando.` },
    ],
  }),
  component: TrabalheConoscoNicho,
});

// Catálogos por nicho (estruturados, sem texto livre)
const SUBSECTORS_BY_NICHE: Record<string, string[]> = {
  academias: [
    "Academia de musculação",
    "Box de CrossFit",
    "Estúdio de funcional / HIIT",
    "Estúdio de Pilates",
    "Estúdio de Yoga",
    "Lutas e MMA (Jiu-Jitsu, Muay Thai, Boxe)",
    "Dança e ritmos",
    "Natação e hidroginástica",
    "Studio Personal / Small Group",
    "Performance esportiva / atletas",
    "Reabilitação e treinamento clínico",
  ],
  supermercados: [
    "Atacarejo / Atacado",
    "Supermercado de bairro / Vizinhança",
    "Hipermercado",
    "Hortifruti / Sacolão",
    "Mercearia / Empório",
    "Loja de conveniência",
    "Mini market autônomo (24h)",
    "Açougue / Peixaria",
    "Padaria / Confeitaria",
    "Adega / Bebidas",
    "Produtos naturais / Saudáveis",
  ],
};

const ROLES_BY_NICHE: Record<string, string[]> = {
  fitness: ["Professor de musculação", "Coach CrossFit", "Personal trainer", "Instrutor de funcional", "Recepção", "Comercial", "Gerência", "Financeiro", "Avaliador físico", "Nutricionista parceiro"],
  academias: [
    "Professor de musculação", "Personal trainer", "Coach CrossFit", "Instrutor de funcional",
    "Instrutor de Pilates", "Instrutor de Yoga", "Professor de lutas", "Professor de dança",
    "Avaliador físico", "Fisioterapeuta esportivo", "Nutricionista parceiro",
    "Recepção", "Consultor comercial", "Gerente de unidade", "Coordenador técnico", "Financeiro", "Limpeza e manutenção",
  ],
  supermercados: [
    "Operador de caixa", "Repositor de mercadorias", "Empacotador", "Auxiliar de hortifruti",
    "Açougueiro", "Peixeiro", "Padeiro", "Confeiteiro", "Atendente de padaria",
    "Auxiliar de depósito / estoque", "Conferente de mercadorias", "Comprador",
    "Encarregado de loja", "Fiscal de loja / Prevenção de perdas",
    "Gerente de loja", "Subgerente", "Supervisor de frente de caixa",
    "Promotor de vendas", "Atendente delivery", "Motorista entregador",
    "Analista financeiro / fiscal", "RH / DP", "TI / Sistemas",
  ],
  corporativo: ["Engenharia de software", "Produto", "Design", "Customer Success", "Vendas", "Marketing", "Operações", "Financeiro", "RH"],
};

const ESPEC_BY_NICHE: Record<string, string[]> = {
  fitness: ["CrossFit L1", "CrossFit L2", "Funcional", "HIIT", "Mobilidade", "Pilates", "Yoga", "Musculação", "Treinamento esportivo", "Reabilitação", "Emagrecimento", "Hipertrofia", "Idosos", "Crianças", "Gestantes"],
  academias: [
    "Musculação", "Hipertrofia", "Emagrecimento", "Condicionamento", "CrossFit", "Funcional", "HIIT",
    "Pilates solo", "Pilates aparelhos", "Yoga", "Mobilidade", "Alongamento",
    "Jiu-Jitsu", "Muay Thai", "Boxe", "MMA", "Karatê", "Taekwondo",
    "Dança fitness", "Zumba", "Ritmos", "Spinning", "Natação", "Hidroginástica",
    "Treinamento de atletas", "Reabilitação", "Idosos", "Crianças", "Gestantes",
  ],
  supermercados: [
    "PDV / Frente de caixa", "Recebimento e conferência", "Controle de validade", "Inventário cíclico",
    "Reposição e ruptura", "Precificação e etiquetagem", "Layout e exposição",
    "Carnes e cortes", "Pescados", "Panificação", "Confeitaria", "Hortifruti",
    "Compras e negociação", "Logística e abastecimento", "Prevenção de perdas",
    "Atendimento ao cliente", "Delivery e e-commerce", "Cartão fidelidade / CRM",
    "ERP supermercadista", "SNGPC / fiscal", "Gestão de FLV",
  ],
  corporativo: ["React", "TypeScript", "Node.js", "Postgres", "DevOps", "UX/UI", "Growth", "Inbound", "Outbound", "Onboarding"],
};

const CERTS_BY_NICHE: Record<string, string[]> = {
  fitness: ["CREF ativo", "Bacharel Educação Física", "CrossFit Level 1", "CrossFit Level 2", "Functional Training", "Pilates", "Yoga RYT-200", "Primeiros Socorros"],
  academias: [
    "CREF ativo", "Bacharel Educação Física", "Licenciatura Educação Física",
    "CrossFit Level 1", "CrossFit Level 2", "CrossFit Level 3",
    "Functional Training", "Pilates (Polestar, Physio, Voll)", "Yoga RYT-200", "Yoga RYT-500",
    "Faixa em Jiu-Jitsu", "Federação de Boxe / Muay Thai", "Personal Trainer certificado",
    "Fisioterapia (CREFITO)", "Nutrição (CRN)", "Primeiros Socorros / SBV",
  ],
  supermercados: [
    "Manipulação de alimentos", "Boas Práticas (ANVISA RDC 216)", "NR-35 (altura)", "NR-11 (empilhadeira)",
    "NR-12 (máquinas)", "Operador de empilhadeira", "Curso de açougue / cortes",
    "Padaria e confeitaria profissional", "Gestão de varejo", "Prevenção de perdas",
    "ERP supermercadista (Linx, Consinco, VR, Bluesoft)", "Excel intermediário/avançado",
  ],
  corporativo: ["AWS", "GCP", "PMP", "Scrum Master", "CSPO"],
};

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const IDIOMAS = ["Português","Inglês","Espanhol","Francês","Italiano","Alemão"];
const DISPONIBILIDADE = ["Imediata","Em até 15 dias","Em até 30 dias","Em até 60 dias","A combinar"];
const EXPERIENCIA = ["Sem experiência","Menos de 1 ano","1 a 3 anos","3 a 5 anos","5 a 10 anos","Mais de 10 anos"];

const schema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo").max(160),
  email: z.string().trim().email("E-mail inválido").max(254),
  phone: z.string().trim().min(8, "Telefone com DDD").max(40),
  state: z.string().min(1, "Selecione o estado"),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  role: z.string().min(1, "Selecione um cargo"),
  subsector: z.string().optional(),
  availability: z.string().min(1, "Selecione disponibilidade"),
  experience_years: z.string().min(1, "Selecione a experiência"),
  specializations: z.array(z.string()).min(1, "Selecione ao menos 1 especialização"),
  certifications: z.array(z.string()),
  languages: z.array(z.string()).min(1, "Selecione ao menos 1 idioma"),
  consent: z.literal(true, { errorMap: () => ({ message: "Aceite necessário para envio" }) }),
});

const ALLOWED_MIME = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

function TrabalheConoscoNicho() {
  const { nicho } = useParams({ from: "/trabalhe-conosco/$nicho" });
  const nichoInfo = NICHOS_TALENTOS.find((n) => n.slug === nicho);
  const roles = ROLES_BY_NICHE[nicho] ?? ROLES_BY_NICHE.corporativo;
  const especs = ESPEC_BY_NICHE[nicho] ?? ESPEC_BY_NICHE.corporativo;
  const certs = CERTS_BY_NICHE[nicho] ?? CERTS_BY_NICHE.corporativo;
  const subsectors = SUBSECTORS_BY_NICHE[nicho];

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", state: "", city: "",
    role: "", subsector: "", availability: "", experience_years: "",
    specializations: [] as string[], certifications: [] as string[], languages: ["Português"] as string[],
    consent: false,
  });
  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(field: "specializations" | "certifications" | "languages", v: string) {
    setForm((f) => ({ ...f, [field]: f[field].includes(v) ? f[field].filter((x) => x !== v) : [...f[field], v] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path.join(".")] = i.message; });
      setErrors(errs);
      toast.error("Revise os campos destacados");
      return;
    }
    if (subsectors && !form.subsector) {
      setErrors((e) => ({ ...e, subsector: "Selecione o subsetor" }));
      toast.error("Selecione o subsetor");
      return;
    }
    if (!resume) { setErrors((e) => ({ ...e, resume: "Currículo é obrigatório (PDF, DOC ou DOCX)" })); return; }
    if (!ALLOWED_MIME.includes(resume.type)) { setErrors((e) => ({ ...e, resume: "Formato inválido. Use PDF, DOC ou DOCX" })); return; }
    if (resume.size > 10 * 1024 * 1024) { setErrors((e) => ({ ...e, resume: "Máximo 10 MB" })); return; }

    setSubmitting(true);
    try {
      const ext = resume.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${nicho}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("talent-resumes").upload(path, resume, { contentType: resume.type, upsert: false });
      if (up.error) throw up.error;

      const ins = await (supabase.from("talent_applications" as never) as any).insert({
        niche_slug: nicho,
        role: form.role,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country: "BR",
        state: form.state,
        city: form.city.trim(),
        availability: form.availability,
        experience_years: form.experience_years,
        specializations: form.specializations,
        certifications: form.certifications,
        languages: form.languages,
        resume_path: up.data.path,
        resume_filename: resume.name,
        source: "trabalhe-conosco",
        user_agent: navigator.userAgent.slice(0, 240),
      });
      if (ins.error) throw ins.error;

      setDone(true);
      toast.success("Candidatura enviada! Retornaremos pelo e-mail informado.");
    } catch (err) {
      console.error(err);
      toast.error("Não conseguimos enviar agora. Tente novamente em alguns minutos.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <section className="flex-1 mx-auto max-w-2xl w-full px-4 py-20 text-center">
          <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
          <h1 className="text-3xl font-bold mt-4">Candidatura recebida</h1>
          <p className="text-muted-foreground mt-2">
            Você está no Banco de Talentos da Impulsionando. Vamos avaliar seu perfil e entrar em contato pelo e-mail informado.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="outline"><Link to="/trabalhe-conosco">Voltar para nichos</Link></Button>
            <Button asChild><Link to="/">Página inicial</Link></Button>
          </div>
        </section>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <section className="border-b border-border bg-gradient-to-br from-background via-background to-primary/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <Badge variant="outline" className="mb-2">Banco de Talentos</Badge>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{nichoInfo?.label ?? "Trabalhe conosco"}</h1>
          <p className="mt-2 text-muted-foreground">Formulário 100% estruturado. Currículo obrigatório (PDF, DOC ou DOCX, até 10 MB).</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={onSubmit}>
          <Card className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nome completo" error={errors.full_name}>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Telefone / WhatsApp" error={errors.phone}>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(21) 9 9999-9999" />
              </Field>
              <Field label="Estado" error={errors.state}>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{ESTADOS_BR.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Cidade" error={errors.city}>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Cargo desejado" error={errors.role}>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Disponibilidade" error={errors.availability}>
                <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{DISPONIBILIDADE.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Experiência" error={errors.experience_years}>
                <Select value={form.experience_years} onValueChange={(v) => setForm({ ...form, experience_years: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{EXPERIENCIA.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <MultiGroup
              title="Especializações"
              hint="Marque todas que se aplicam"
              options={especs}
              selected={form.specializations}
              onToggle={(v) => toggle("specializations", v)}
              error={errors.specializations}
            />

            <MultiGroup
              title="Certificações"
              hint="Marque as que possui"
              options={certs}
              selected={form.certifications}
              onToggle={(v) => toggle("certifications", v)}
            />

            <MultiGroup
              title="Idiomas"
              options={IDIOMAS}
              selected={form.languages}
              onToggle={(v) => toggle("languages", v)}
              error={errors.languages}
            />

            <div>
              <Label>Currículo (PDF, DOC ou DOCX — até 10 MB) *</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                />
                {resume && <Badge variant="outline" className="gap-1"><FileUp className="w-3 h-3" /> {resume.name}</Badge>}
              </div>
              {errors.resume && <p className="text-xs text-destructive mt-1">{errors.resume}</p>}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="consent" checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: v === true })} />
              <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
                Autorizo o tratamento dos meus dados pela Impulsionando Tecnologia para fins de recrutamento e seleção,
                conforme a <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
              </Label>
            </div>
            {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild><Link to="/trabalhe-conosco">Cancelar</Link></Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-primary gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Enviando…" : "Enviar candidatura"}
              </Button>
            </div>
          </Card>
        </form>
      </section>
      <PublicFooter />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label} *</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function MultiGroup({ title, hint, options, selected, onToggle, error }: { title: string; hint?: string; options: string[]; selected: string[]; onToggle: (v: string) => void; error?: string }) {
  return (
    <div>
      <Label>{title} {hint && <span className="text-xs font-normal text-muted-foreground">— {hint}</span>}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              type="button"
              key={o}
              onClick={() => onToggle(o)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
