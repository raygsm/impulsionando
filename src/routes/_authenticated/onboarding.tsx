import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useActiveCompany } from "@/hooks/use-active-company";
import {
  initChecklist,
  completeChecklistItem,
} from "@/lib/onboarding.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  CreditCard,
  Globe,
  Mail,
  Package,
  Rocket,
  SkipForward,
  Sparkles,
  UserCheck,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingWizard,
  head: () => ({
    meta: [
      { title: "Onboarding — Impulsionando" },
      { name: "description", content: "Configure sua conta em poucos passos." },
    ],
  }),
});

type ItemMeta = {
  key: string;
  title: string;
  description: string;
  Icon: typeof Rocket;
  cta?: { label: string; to: string };
};

const ITEMS: ItemMeta[] = [
  {
    key: "payment_approved",
    title: "Pagamento confirmado",
    description: "Sua assinatura foi recebida e a conta está ativa.",
    Icon: CreditCard,
  },
  {
    key: "subdomain_reserved",
    title: "Subdomínio reservado",
    description: "Sua marca já tem um endereço seu-nome.impulsionando.app.",
    Icon: Sparkles,
    cta: { label: "Personalizar branding", to: "/_authenticated/admin/branding" as never },
  },
  {
    key: "domain_requested",
    title: "Domínio próprio (opcional)",
    description: "Conecte seu domínio (suaempresa.com.br) ou pule essa etapa.",
    Icon: Globe,
    cta: { label: "Solicitar domínio", to: "/onboarding-guiado" as never },
  },
  {
    key: "emails_requested",
    title: "E-mails do time",
    description: "Crie endereços @suaempresa para a equipe.",
    Icon: Mail,
    cta: { label: "Solicitar e-mails", to: "/onboarding-guiado" as never },
  },
  {
    key: "modules_activated",
    title: "Módulos ativados",
    description: "Confirme os módulos contratados e configure os principais.",
    Icon: Package,
    cta: { label: "Ver módulos", to: "/_authenticated/admin/modules" as never },
  },
  {
    key: "onboarding_done",
    title: "Equipe convidada",
    description: "Convide colaboradores e defina perfis de acesso.",
    Icon: UserCheck,
    cta: { label: "Convidar equipe", to: "/_authenticated/admin/equipe" as never },
  },
  {
    key: "client_released",
    title: "Tudo pronto — vamos lançar!",
    description: "Libere para seus clientes e comece a operar.",
    Icon: Rocket,
  },
];

function OnboardingWizard() {
  const { companyId, options } = useActiveCompany();
  const qc = useQueryClient();
  const init = useServerFn(initChecklist);
  const complete = useServerFn(completeChecklistItem);

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-checklist", companyId],
    enabled: !!companyId,
    queryFn: () => init({ data: { companyId } }),
  });

  // Auto-inicializa o checklist se vazio
  useEffect(() => {
    if (companyId && data && !data.items?.length) {
      void init({ data: { companyId } }).then(() => qc.invalidateQueries({ queryKey: ["onboarding-checklist", companyId] }));
    }
  }, [companyId, data, init, qc]);

  const toggle = useMutation({
    mutationFn: (vars: { itemKey: string; status: "done" | "skipped" | "pending" }) =>
      complete({ data: { companyId, itemKey: vars.itemKey, status: vars.status } }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "done" ? "Etapa concluída!" : vars.status === "skipped" ? "Etapa pulada." : "Etapa reaberta.",
      );
      qc.invalidateQueries({ queryKey: ["onboarding-checklist", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId && !options.length) {
    return (
      <div className="container max-w-2xl py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Onboarding</h1>
        <p className="text-muted-foreground">
          Você ainda não tem uma empresa vinculada. Conclua sua contratação para começar.
        </p>
        <Button asChild>
          <Link to="/planos">Ver planos</Link>
        </Button>
      </div>
    );
  }

  const items = data?.items ?? [];
  const statusMap = new Map(items.map((i) => [i.item_key, i.status]));
  const total = ITEMS.length;
  const done = ITEMS.filter((it) => statusMap.get(it.key) === "done").length;
  const skipped = ITEMS.filter((it) => statusMap.get(it.key) === "skipped").length;
  const progress = Math.round(((done + skipped) / total) * 100);
  const allDone = done + skipped === total;

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PartyPopper className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Bem-vindo ao Impulsionando!</h1>
        </div>
        <p className="text-muted-foreground">
          Configure sua operação em alguns passos. Você pode pular o que não se aplica agora — volte quando quiser.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Progresso</CardTitle>
            <Badge variant={allDone ? "default" : "secondary"}>
              {done}/{total} concluídos {skipped > 0 && `· ${skipped} pulados`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
          {allDone && (
            <p className="text-sm text-emerald-600 mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Tudo pronto! Você pode acessar o painel completo.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando checklist...</p>
        ) : (
          ITEMS.map((item, idx) => {
            const status = statusMap.get(item.key) ?? "pending";
            const isDone = status === "done";
            const isSkipped = status === "skipped";
            const Icon = item.Icon;

            return (
              <Card key={item.key} className={isDone ? "border-emerald-500/40" : isSkipped ? "opacity-60" : ""}>
                <CardContent className="pt-5 flex items-start gap-4">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isDone
                        ? "bg-emerald-500/15 text-emerald-600"
                        : isSkipped
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
                      <h3 className="font-semibold">{item.title}</h3>
                      {isSkipped && <Badge variant="outline" className="text-[10px]">Pulado</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {!isDone && (
                        <Button
                          size="sm"
                          onClick={() => toggle.mutate({ itemKey: item.key, status: "done" })}
                          disabled={toggle.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Marcar como feito
                        </Button>
                      )}
                      {isDone && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggle.mutate({ itemKey: item.key, status: "pending" })}
                          disabled={toggle.isPending}
                        >
                          <Circle className="w-3.5 h-3.5 mr-1.5" />
                          Reabrir
                        </Button>
                      )}
                      {item.cta && !isDone && (
                        <Button asChild size="sm" variant="outline">
                          <Link to={item.cta.to}>{item.cta.label}</Link>
                        </Button>
                      )}
                      {!isDone && !isSkipped && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggle.mutate({ itemKey: item.key, status: "skipped" })}
                          disabled={toggle.isPending}
                        >
                          <SkipForward className="w-3.5 h-3.5 mr-1.5" />
                          Pular
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Precisa de ajuda?</CardTitle>
          <CardDescription>Nosso time de Customer Success acompanha sua implantação.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link to="/suporte">Falar com suporte</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/demonstracoes">Ver demonstrações</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
