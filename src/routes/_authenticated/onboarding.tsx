import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/core/OnboardingWizard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Globe,
  Mail,
  Users,
  Boxes,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingMasterPage,
});

type StepKey = "nicho" | "dominio" | "emails" | "equipe" | "modulos";

type Step = {
  key: StepKey;
  label: string;
  description: string;
  icon: typeof Sparkles;
  to: string;
  linkLabel: string;
  done: boolean;
};

function OnboardingMasterPage() {
  const { data: me } = useCurrentUser();
  const companyId = me?.memberships?.[0]?.company_id;

  const { data: status } = useQuery({
    queryKey: ["onboarding-status", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) return null;
      const [company, modules, members, domain, email] = await Promise.all([
        supabase.from("companies").select("id, niche_id").eq("id", companyId).maybeSingle(),
        supabase.from("company_modules").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("user_profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("onboarding_domain_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("onboarding_email_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);
      return {
        hasNiche: Boolean(company.data?.niche_id),
        modulesCount: modules.count ?? 0,
        membersCount: members.count ?? 0,
        hasDomainReq: (domain.count ?? 0) > 0,
        hasEmailReq: (email.count ?? 0) > 0,
      };
    },
  });

  if (!companyId) {
    return (
      <Card className="p-6 max-w-xl mx-auto">
        <h2 className="font-semibold mb-2">Empresa não encontrada</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Não foi possível identificar sua empresa. Entre em contato com o suporte.
        </p>
        <Button asChild variant="outline"><Link to="/dashboard">Voltar</Link></Button>
      </Card>
    );
  }

  const steps: Step[] = [
    {
      key: "nicho",
      label: "Escolha seu nicho",
      description: "Instala módulos, menus e relatórios certos para o segmento.",
      icon: Sparkles,
      to: "/onboarding/nicho",
      linkLabel: "Configurar nicho",
      done: status?.hasNiche ?? false,
    },
    {
      key: "dominio",
      label: "Domínio próprio",
      description: "Conecte seudominio.com.br à plataforma.",
      icon: Globe,
      to: "/onboarding#wizard",
      linkLabel: "Configurar domínio",
      done: status?.hasDomainReq ?? false,
    },
    {
      key: "emails",
      label: "E-mails da empresa",
      description: "Habilite envio com a sua marca (DKIM/SPF).",
      icon: Mail,
      to: "/onboarding#wizard",
      linkLabel: "Configurar e-mails",
      done: status?.hasEmailReq ?? false,
    },
    {
      key: "equipe",
      label: "Convide sua equipe",
      description: "Adicione usuários com perfis pré-configurados.",
      icon: Users,
      to: "/users",
      linkLabel: "Gerenciar usuários",
      done: (status?.membersCount ?? 0) > 1,
    },
    {
      key: "modulos",
      label: "Módulos opcionais",
      description: "Ative recursos extras além do template do nicho.",
      icon: Boxes,
      to: "/modules",
      linkLabel: "Ver módulos",
      done: (status?.modulesCount ?? 0) > 0,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onboarding</h1>
        <p className="text-sm text-muted-foreground">
          Complete os passos abaixo para deixar sua operação 100% configurada.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium">Progresso</div>
            <div className="text-xs text-muted-foreground">
              {completed} de {steps.length} passos concluídos
            </div>
          </div>
          <Badge variant={pct === 100 ? "default" : "secondary"}>{pct}%</Badge>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <div className="grid gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    s.done
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {s.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium leading-tight">{s.label}</h3>
                    {s.done ? (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Pronto
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                        <Circle className="h-3 w-3" /> Pendente
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                </div>
                <Button asChild size="sm" variant={s.done ? "outline" : "default"}>
                  <Link to={s.to}>
                    {s.done ? "Revisar" : s.linkLabel}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card id="wizard" className="p-5 space-y-4 scroll-mt-20">
        <div>
          <h2 className="font-semibold">Domínio e e-mails</h2>
          <p className="text-sm text-muted-foreground">
            Configure seu domínio próprio e o envio de e-mails com a marca da empresa.
          </p>
        </div>
        <OnboardingWizard companyId={companyId} />
      </Card>
    </div>
  );
}
