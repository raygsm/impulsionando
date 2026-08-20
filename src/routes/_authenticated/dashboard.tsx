import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { WmpManagementDashboard } from "@/components/wmp/WmpManagementDashboard";
import {
  ArrowRight,
  Building2,
  Cog,
  Headphones,
  Loader2,
  MessageCircle,
  Package,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Impulsionando" }] }),
  component: DashboardPage,
});

function currentHost(): string {
  return typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
}

function isWmpHost(): boolean {
  return currentHost() === "wmp.impulsionando.com.br";
}

function isChrismedHost(): boolean {
  return currentHost() === "chrismed.impulsionando.com.br";
}

function ChrismedDashboardEntry() {
  useEffect(() => {
    void (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      const user = auth.user;
      if (authError || !user) {
        window.location.replace("/auth?mode=signin");
        return;
      }

      const appMetadata = user.app_metadata as Record<string, unknown> | undefined;
      const isManagement =
        appMetadata?.is_super_admin === true ||
        appMetadata?.is_impulsionando_staff === true ||
        appMetadata?.platform_role === "super_admin";

      if (isManagement) {
        window.location.replace("/chrismed/admin");
        return;
      }

      const { data: professional } = await supabase
        .from("agenda_professionals")
        .select("id, profile_status")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      const userMetadata = user.user_metadata as Record<string, unknown> | undefined;
      const professionalSignup =
        userMetadata?.chrismed_professional_signup === true ||
        typeof userMetadata?.health_profession_id === "string" ||
        typeof userMetadata?.profession_id === "string";

      if (professional?.id) {
        const status = String(professional.profile_status ?? "").toLowerCase();
        const onboardingNeeded = Boolean(status) && !["active", "approved"].includes(status);
        window.location.replace(onboardingNeeded ? "/chrismed/profissional/onboarding" : "/agenda/profissional");
        return;
      }

      if (professionalSignup) {
        window.location.replace("/chrismed/profissional/onboarding");
        return;
      }

      window.location.replace("/chrismed/minha-conta");
    })().catch(() => {
      window.location.replace("/chrismed/minha-conta");
    });
  }, []);

  return (
    <main className="flex min-h-[55vh] items-center justify-center p-6" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Identificando seu acesso CHRISMED…</span>
      </div>
    </main>
  );
}

async function fetchOverview() {
  const [companies, conversations, whatsapp, workflows] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("communication_conversations").select("*", { count: "exact", head: true }).in("status", ["open", "active", "pending"]),
    supabase.from("communication_whatsapp_numbers").select("id,connection_status,health_status,is_enabled"),
    supabase.from("n8n_workflow_registry").select("id,status,n8n_workflow_id"),
  ]);

  const waRows = whatsapp.data ?? [];
  const wfRows = workflows.data ?? [];
  return {
    activeCompanies: companies.count ?? 0,
    openConversations: conversations.count ?? 0,
    whatsappConnected: waRows.filter((x: any) => x.is_enabled && String(x.connection_status).toLowerCase() === "connected").length,
    whatsappTotal: waRows.length,
    workflowsActive: wfRows.filter((x: any) => x.status === "ACTIVE" && x.n8n_workflow_id).length,
    workflowsTotal: wfRows.length,
  };
}

type HubCardProps = {
  title: string;
  description: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  priority?: boolean;
  badge?: string;
};

function HubCard({ title, description, to, icon: Icon, priority, badge }: HubCardProps) {
  return (
    <Link to={to as never} className="group block h-full">
      <Card className={`h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${priority ? "border-primary/40 bg-primary/[0.03]" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${priority ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
          {badge ? <Badge variant={priority ? "default" : "secondary"}>{badge}</Badge> : null}
        </div>
        <h2 className="mt-5 text-base font-semibold">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}

function DashboardPage() {
  if (isWmpHost()) return <WmpManagementDashboard />;
  if (isChrismedHost()) return <ChrismedDashboardEntry />;
  return <CoreDashboardPage />;
}

function CoreDashboardPage() {
  const { data: me } = useCurrentUser();
  const { data: overview } = useQuery({
    queryKey: ["core-clean-overview"],
    queryFn: fetchOverview,
    refetchInterval: 30000,
  });

  if (me?.isMasterObserver && !me.isImpulsionandoStaff && !me.isSuperAdmin) {
    return <Navigate to="/master-observer" replace />;
  }

  const greeting = me?.memberships[0]?.display_name ?? me?.user.email ?? "";

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <PageHeader
        title={`Olá, ${greeting}`}
        description="Escolha o que precisa operar agora. O restante fica fora do caminho."
        action={me?.isSuperAdmin ? <Badge className="bg-gradient-primary">Gestão Impulsionando</Badge> : undefined}
      />

      <section className="rounded-2xl border border-primary/25 bg-primary/[0.035] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">WhatsApp e Atendimento</h2>
                <Badge>Prioridade</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Conecte números, acompanhe a saúde do canal e responda conversas do cliente pelo próprio Core.
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{overview?.whatsappConnected ?? 0}/{overview?.whatsappTotal ?? 0} números conectados</span>
                <span>•</span>
                <span>{overview?.openConversations ?? 0} conversas abertas</span>
              </div>
            </div>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to={"/admin/comunicacao" as never}>Abrir atendimento <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Áreas principais</p>
            <h2 className="mt-1 text-xl font-semibold">Cinco caminhos. Nada de labirinto.</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <HubCard title="Gestão" description="Clientes, equipe, agenda, operações e acompanhamento diário." to="/inicio" icon={Users} />
          <HubCard title="Comunicação" description="WhatsApp, e-mail, conversas, templates, tickets e Impulsionito." to="/admin/comunicacao" icon={Headphones} priority badge="WhatsApp" />
          <HubCard title="ERP" description="Financeiro, pedidos, produtos, estoque, documentos e cobrança." to="/dashboards/operacao" icon={Package} />
          <HubCard title="Growth" description="CRM, captação, conversão, retenção, campanhas e jornadas." to="/crm/board" icon={Sparkles} />
          <HubCard title="Configurações" description="Integrações, usuários, permissões, domínios, segurança e módulos." to="/settings" icon={Settings} />
        </div>
      </section>

      {me?.isSuperAdmin ? (
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-primary" /><span className="text-sm font-medium">Clientes ativos</span></div>
            <div className="mt-3 text-3xl font-semibold">{overview?.activeCompanies ?? "—"}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3"><Workflow className="h-5 w-5 text-primary" /><span className="text-sm font-medium">Automações n8n</span></div>
            <div className="mt-3 text-3xl font-semibold">{overview ? `${overview.workflowsActive}/${overview.workflowsTotal}` : "—"}</div>
            <p className="mt-1 text-xs text-muted-foreground">Ativas e vinculadas ao runtime</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3"><Cog className="h-5 w-5 text-primary" /><span className="text-sm font-medium">Administração avançada</span></div>
            <Button asChild variant="outline" size="sm" className="mt-4"><Link to={"/admin/master-hub" as never}>Abrir controles técnicos</Link></Button>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
