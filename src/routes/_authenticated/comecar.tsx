import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getClient360, initChecklist, completeChecklistItem } from "@/lib/onboarding.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, CreditCard, Rocket, Globe, Mail, Boxes, Sparkles,
  ArrowRight, Loader2, PartyPopper, ShieldCheck,
} from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/comecar")({
  head: () => ({ meta: [{ title: "Começar — Impulsionando" }] }),
  component: ComecarPage,
});

type Step = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  cta?: { label: string; to: string };
};

const STEPS: Step[] = [
  { key: "payment_approved", title: "Pagamento aprovado", description: "Confirmação automática após o checkout.", icon: CreditCard },
  { key: "onboarding_done", title: "Onboarding guiado concluído", description: "Diagnóstico de nicho e metas iniciais.", icon: Sparkles, cta: { label: "Refazer onboarding", to: "/onboarding" } },
  { key: "subdomain_reserved", title: "Subdomínio reservado", description: "Endereço seuespaço.impulsionando.com.br ativo.", icon: Globe, cta: { label: "Gerenciar domínio", to: "/onboarding" } },
  { key: "domain_requested", title: "Domínio próprio solicitado", description: "Pedido enviado ao time de provisionamento.", icon: Globe },
  { key: "domain_migration_requested", title: "Migração de domínio", description: "Quando você já tem um domínio em outro provedor.", icon: Globe },
  { key: "emails_requested", title: "E-mails corporativos", description: "Caixas @seudominio criadas pelo nosso time.", icon: Mail },
  { key: "modules_activated", title: "Módulos ativados", description: "Funcionalidades habilitadas conforme seu plano.", icon: Boxes },
  { key: "client_released", title: "Cliente liberado", description: "Acesso completo e go-live aprovado.", icon: Rocket },
];

function ComecarPage() {
  const { data: currentUser, isLoading: loadingUser } = useCurrentUser();
  const companyId = currentUser?.memberships?.[0]?.company_id ?? null;

  const fetchClient360 = useServerFn(getClient360);
  const initFn = useServerFn(initChecklist);
  const completeFn = useServerFn(completeChecklistItem);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comecar-client360", companyId],
    enabled: !!companyId,
    queryFn: () => fetchClient360({ data: { companyId: companyId! } }),
  });

  // Garante checklist semeado
  useEffect(() => {
    if (companyId && data && (data.checklist?.length ?? 0) === 0) {
      initFn({ data: { companyId } }).then(() => qc.invalidateQueries({ queryKey: ["comecar-client360", companyId] }));
    }
  }, [companyId, data, initFn, qc]);

  const skipMut = useMutation({
    mutationFn: (itemKey: string) => completeFn({ data: { companyId: companyId!, itemKey, status: "skipped" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comecar-client360", companyId] }),
  });
  const doneMut = useMutation({
    mutationFn: (itemKey: string) => completeFn({ data: { companyId: companyId!, itemKey, status: "done" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comecar-client360", companyId] }),
  });

  if (loadingUser || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container max-w-3xl py-12">
        <Card className="p-8 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma empresa vinculada</h2>
          <p className="text-muted-foreground mb-6">Seu usuário ainda não está associado a uma empresa. Conclua a contratação para liberar o painel.</p>
          <Button asChild><Link to="/planos">Ver planos</Link></Button>
        </Card>
      </div>
    );
  }

  const checklist = data?.checklist ?? [];
  const statusMap = new Map(checklist.map((c: any) => [c.item_key, c.status]));
  const done = STEPS.filter((s) => statusMap.get(s.key) === "done").length;
  const total = STEPS.length;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <PageHeader
        title="Começar"
        description={`Acompanhe seu go-live na ${data?.company?.name ?? "sua empresa"}.`}
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-muted-foreground">Progresso do go-live</div>
            <div className="text-2xl font-semibold">{done} de {total} concluídos</div>
          </div>
          <Badge variant={allDone ? "default" : "secondary"} className="text-base px-3 py-1">
            {pct}%
          </Badge>
        </div>
        <Progress value={pct} className="h-2" />
        {allDone && (
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <PartyPopper className="h-5 w-5" />
            <span className="font-medium">Tudo pronto! Seu ambiente está oficialmente no ar.</span>
          </div>
        )}
      </Card>

      <div className="grid gap-3">
        {STEPS.map((step, idx) => {
          const status = statusMap.get(step.key) ?? "pending";
          const isDone = status === "done";
          const isSkipped = status === "skipped";
          const Icon = step.icon;
          return (
            <Card key={step.key} className={`p-4 transition ${isDone ? "bg-green-50/40 border-green-200" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`mt-1 ${isDone ? "text-green-600" : "text-muted-foreground"}`}>
                  {isDone ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{step.title}</h3>
                    {isSkipped && <Badge variant="outline" className="text-xs">pulado</Badge>}
                    {isDone && <Badge variant="secondary" className="text-xs">concluído</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {step.cta && !isDone && (
                    <Button asChild size="sm" variant="default">
                      <Link to={step.cta.to}>
                        {step.cta.label}
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                  {!isDone && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={skipMut.isPending}
                        onClick={() => skipMut.mutate(step.key)}
                      >
                        Pular
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={doneMut.isPending}
                        onClick={() => doneMut.mutate(step.key)}
                      >
                        Marcar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
        <h3 className="font-semibold mb-2">Precisa de ajuda?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Nosso time fica feliz em conduzir cada etapa contigo. Abra um ticket, fale com um consultor ou consulte a central.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default" size="sm"><Link to="/abrir-ticket">Abrir ticket</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/central-de-ajuda">Central de ajuda</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/onboarding-guiado">Onboarding guiado</Link></Button>
        </div>
      </Card>
    </div>
  );
}
