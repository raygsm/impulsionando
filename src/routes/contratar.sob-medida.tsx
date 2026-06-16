import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitBriefing } from "@/lib/core-integrations.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contratar/sob-medida")({
  head: () => ({
    meta: [
      { title: "Plano Sob Medida — Impulsionando Tecnologia" },
      { name: "description", content: "Conte sobre seu negócio e receba uma proposta sob medida com módulos, integrações e SLA específicos para sua operação." },
      { property: "og:title", content: "Plano Sob Medida — Impulsionando Tecnologia" },
      { property: "og:description", content: "Briefing inteligente para uma proposta personalizada." },
    ],
  }),
  component: SobMedidaPage,
});

function SobMedidaPage() {
  const submit = useServerFn(submitBriefing);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    contact_name: "", contact_email: "", contact_whatsapp: "",
    company_name: "", niche: "", team_size: "", budget_range: "", urgency: "",
    current_tools: "", goals: "", integrations_needed: "", notes: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => submit({ data: { ...form, source: "site:contratar/sob-medida" } }),
    onSuccess: () => { setDone(true); toast.success("Briefing enviado!"); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao enviar"),
  });

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 mx-auto text-green-600" />
          <h1 className="text-2xl font-bold">Briefing recebido!</h1>
          <p className="text-muted-foreground">
            Nossa equipe vai analisar suas respostas e retornar com uma proposta sob medida
            em até 2 dias úteis no e-mail e WhatsApp informados.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plano Sob Medida</h1>
        <p className="text-muted-foreground mt-2">
          Quanto mais detalhes você der, mais precisa será a proposta. Tudo é confidencial e vai
          direto para a equipe da <strong>Impulsionando Tecnologia</strong>.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <Section title="Contato">
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldInput label="Seu nome*" value={form.contact_name} onChange={set("contact_name")} />
            <FieldInput label="Empresa*" value={form.company_name} onChange={set("company_name")} />
            <FieldInput label="E-mail*" type="email" value={form.contact_email} onChange={set("contact_email")} />
            <FieldInput label="WhatsApp*" value={form.contact_whatsapp} onChange={set("contact_whatsapp")} placeholder="(11) 99999-9999" />
          </div>
        </Section>

        <Section title="Sobre o negócio">
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldInput label="Nicho / segmento" value={form.niche} onChange={set("niche")} placeholder="Imobiliária, clínica, fitness..." />
            <FieldSelect label="Tamanho da equipe" value={form.team_size} onChange={set("team_size")}
              options={["1 (autônomo)", "2-5", "6-15", "16-50", "50+"]} />
            <FieldSelect label="Faixa de investimento mensal" value={form.budget_range} onChange={set("budget_range")}
              options={["Até R$ 1.000", "R$ 1.000-3.000", "R$ 3.000-7.000", "R$ 7.000+", "Não sei ainda"]} />
            <FieldSelect label="Urgência" value={form.urgency} onChange={set("urgency")}
              options={["Imediata", "30 dias", "60-90 dias", "Sem prazo definido"]} />
          </div>
        </Section>

        <Section title="O que você precisa">
          <FieldArea label="Quais são seus principais objetivos com o sistema?" value={form.goals} onChange={set("goals")} />
          <FieldArea label="Quais ferramentas você usa hoje?" value={form.current_tools} onChange={set("current_tools")} />
          <FieldArea label="Quais integrações são essenciais? (WhatsApp, MP, ERPs, CRMs...)" value={form.integrations_needed} onChange={set("integrations_needed")} />
          <FieldArea label="Algo mais que devemos saber?" value={form.notes} onChange={set("notes")} />
        </Section>

        <div className="flex justify-end">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending} size="lg">
            {mut.isPending ? "Enviando..." : "Enviar briefing"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FieldArea({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
        <SelectContent>
          {options.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
