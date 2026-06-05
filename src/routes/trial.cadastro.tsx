import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { requestTrial } from "@/lib/trial.functions";

export const Route = createFileRoute("/trial/cadastro")({
  head: () => ({
    meta: [
      { title: "Iniciar Trial de 7 dias — Impulsionando Tecnologia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrialCadastro,
});

const Schema = z.object({
  contact_name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  contact_company: z.string().trim().min(2, "Informe sua empresa").max(120),
  contact_email: z.string().trim().email("E-mail inválido").max(200),
  contact_whatsapp: z.string().trim().min(8, "WhatsApp obrigatório").max(40),
  contact_doc: z.string().trim().max(40).optional(),
  chosen_plan: z.enum(["essencial", "integrado", "avancado", "sob_medida"]),
});

function TrialCadastro() {
  const navigate = useNavigate();
  const fetcher = useServerFn(requestTrial);

  const [form, setForm] = useState({
    contact_name: "",
    contact_company: "",
    contact_email: "",
    contact_whatsapp: "",
    contact_doc: "",
    chosen_plan: "essencial" as const,
  });
  const [accept, setAccept] = useState({ terms: false, billing: false, suspension: false, comm: false });

  const m = useMutation({
    mutationFn: async () => {
      const parsed = Schema.parse(form);
      return fetcher({
        data: {
          ...parsed,
          accept_terms: true as const,
          accept_billing: true as const,
          accept_suspension: true as const,
          accept_communication: true as const,
          source: "site:/trial/cadastro",
        },
      });
    },
    onSuccess: () => {
      toast.success("Trial ativado! Enviamos seus dados de acesso por WhatsApp e e-mail.");
      navigate({ to: "/auth" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Não foi possível iniciar o Trial. Tente novamente.";
      // Traduz mensagens comuns vindas do Zod/Postgres para português.
      const pt = msg.includes("Já existe um Trial")
        ? msg
        : msg.toLowerCase().includes("invalid")
          ? "Verifique os campos preenchidos e tente novamente."
          : msg;
      toast.error(pt);
    },
  });

  const handleStart = () => {
    const missing: string[] = [];
    if (!form.contact_name.trim()) missing.push("Nome completo");
    if (!form.contact_company.trim()) missing.push("Empresa");
    if (!form.contact_email.trim()) missing.push("E-mail");
    if (!form.contact_whatsapp.trim()) missing.push("WhatsApp");
    if (missing.length) {
      toast.error(`Preencha: ${missing.join(", ")}`);
      return;
    }
    const missingTerms: string[] = [];
    if (!accept.terms) missingTerms.push("termos do Trial");
    if (!accept.billing) missingTerms.push("política de cobrança");
    if (!accept.suspension) missingTerms.push("regras de suspensão");
    if (!accept.comm) missingTerms.push("autorização de comunicação");
    if (missingTerms.length) {
      toast.error(`Aceite obrigatório: ${missingTerms.join(", ")}.`);
      return;
    }
    m.mutate();
  };

  const allAccepted = accept.terms && accept.billing && accept.suspension && accept.comm;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-12 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Iniciar Trial de 7 dias</h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados e aceite os termos para liberar todos os recursos da Impulsionando Tecnologia por 7 dias.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome completo *</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Empresa *</Label>
              <Input value={form.contact_company} onChange={(e) => setForm({ ...form, contact_company: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} maxLength={200} />
            </div>
            <div>
              <Label>WhatsApp *</Label>
              <Input value={form.contact_whatsapp} onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} maxLength={40} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>CPF ou CNPJ</Label>
              <Input value={form.contact_doc} onChange={(e) => setForm({ ...form, contact_doc: e.target.value })} maxLength={40} />
            </div>
            <div>
              <Label>Plano desejado após o Trial *</Label>
              <Select value={form.chosen_plan} onValueChange={(v) => setForm({ ...form, chosen_plan: v as typeof form.chosen_plan })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="essencial">Essencial — R$ 697,00/mês</SelectItem>
                  <SelectItem value="integrado">Integrado — R$ 997,90/mês</SelectItem>
                  <SelectItem value="avancado">Avançado — R$ 1.497,97/mês</SelectItem>
                  <SelectItem value="sob_medida">Sob Medida — sob análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
            <strong>Declaro estar ciente</strong> de que o Trial da Impulsionando Tecnologia terá duração de 7 dias corridos.
            Após esse prazo, será gerada automaticamente a cobrança do plano escolhido. Caso o pagamento não seja
            identificado, o acesso operacional será suspenso, permanecendo disponível apenas a área financeira para
            regularização.
          </div>

          <div className="space-y-2">
            {[
              { k: "terms", label: "Aceito os termos do Trial." },
              { k: "billing", label: "Aceito a política de cobrança após 7 dias." },
              { k: "suspension", label: "Aceito as regras de suspensão por inadimplência." },
              { k: "comm", label: "Autorizo comunicação por WhatsApp e e-mail." },
            ].map((opt) => (
              <label key={opt.k} className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={accept[opt.k as keyof typeof accept]}
                  onCheckedChange={(v) => setAccept({ ...accept, [opt.k]: !!v })}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={m.isPending}
            onClick={handleStart}
          >
            {m.isPending ? "Ativando..." : "Ativar Trial de 7 dias"}
          </Button>
          {!allAccepted && (
            <p className="text-[11px] text-muted-foreground text-center">
              Aceite todos os itens acima para ativar o Trial.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground text-center">
            Já existe um Trial registrado para estes dados? Fale com a equipe da Impulsionando Tecnologia.
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
