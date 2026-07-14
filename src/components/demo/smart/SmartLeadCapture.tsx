import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitMarketingLead } from "@/lib/marketing-lead.functions";
import { buildDemoSiteDraft, saveDemoSiteDraft, type DemoGeneratedSiteDraft } from "@/lib/demo-site-draft";
import { toast } from "sonner";
import type { DemoTemplate } from "@/data/demo-templates/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  businessLabel: string;
  planLabel: string;
  ctaLabel: string;
  template: DemoTemplate;
};

export function SmartLeadCapture({ open, onOpenChange, templateId, businessLabel, planLabel, ctaLabel, template }: Props) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [goal, setGoal] = useState("");
  const [consent, setConsent] = useState(false);
  const [draft, setDraft] = useState<DemoGeneratedSiteDraft | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLead = useServerFn(submitMarketingLead);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast.error("Confirme a autorização de contato para gerar o rascunho.");
      return;
    }
    setSubmitting(true);
    try {
      const key = "demo:leads";
      const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
      prev.push({ templateId, businessLabel, planLabel, name, whatsapp, email, company, city, teamSize, monthlyRevenue, goal, ts: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch { /* noop */ }
    try {
      const generatedDraft = buildDemoSiteDraft(template, {
        name,
        email,
        phone: whatsapp,
        company,
        city,
        teamSize,
        monthlyRevenue,
        goal,
        planLabel,
      });
      await submitLead({
        data: {
          name,
          email,
          phone: whatsapp,
          company,
          interest: `${businessLabel} · Plano ${planLabel}`,
          message: `Lead capturado na demo ${templateId}. Cidade: ${city || "não informado"}. Time: ${teamSize || "não informado"}. Receita: ${monthlyRevenue || "não informado"}. Objetivo: ${goal || "não informado"}.`,
          page_url: typeof window !== "undefined" ? window.location.href : null,
        },
      });
      saveDemoSiteDraft(generatedDraft);
      setDraft(generatedDraft);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSent(false); setDraft(null); } }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <DialogTitle>Recebemos seu interesse!</DialogTitle>
            <DialogDescription>
              Um consultor Impulsionando vai falar com você em breve com a proposta do plano {planLabel}. O rascunho inicial do site foi gerado a partir desta demo.
            </DialogDescription>
            {draft && (
              <div className="w-full rounded-lg border bg-muted/30 p-4 text-left">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Rascunho gerado</p>
                <h3 className="mt-1 text-base font-semibold">{draft.hero.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{draft.hero.subtitle}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {draft.sections.slice(0, 4).map((section) => (
                    <div key={section.title} className="rounded-md border bg-background p-3">
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{section.bullets.slice(0, 2).join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {draft && (
                <Button asChild>
                  <Link to="/demo/rascunho/$id" params={{ id: draft.id }} onClick={() => onOpenChange(false)}>
                    Ver meu rascunho
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>Continuar explorando</Button>
            </div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{ctaLabel}</DialogTitle>
              <DialogDescription>
                Deixe seu contato para receber a proposta personalizada de {businessLabel} no plano {planLabel}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-name">Seu nome</Label>
                <Input id="lead-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-company">Empresa</Label>
                <Input id="lead-company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder={businessLabel} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-wa">WhatsApp</Label>
                <Input id="lead-wa" required inputMode="tel" placeholder="(21) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-email">E-mail</Label>
                <Input id="lead-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-city">Cidade de atuação</Label>
                <Input id="lead-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Rio de Janeiro" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-team">Tamanho do time</Label>
                <Input id="lead-team" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="Ex.: 6-10 pessoas" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="lead-revenue">Faixa de faturamento mensal</Label>
                <Input id="lead-revenue" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} placeholder="Ex.: R$ 50k a R$ 100k" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="lead-goal">Principal objetivo agora</Label>
                <Textarea id="lead-goal" rows={3} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex.: captar mais clientes, reduzir faltas, automatizar cobrança..." />
              </div>
            </div>
            <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
              <span>Autorizo a Impulsionando a entrar em contato e usar estes dados para gerar um rascunho inicial do site e da proposta comercial. Sem spam.</span>
            </label>
            <Button type="submit" className="w-full" disabled={submitting || !consent}>
              {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando rascunho...</>) : "Gerar rascunho e receber proposta"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
