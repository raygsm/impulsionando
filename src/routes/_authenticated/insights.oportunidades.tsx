import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Clock, CreditCard, GitBranch,
  Inbox, Lightbulb, Receipt, UserPlus, Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/insights/oportunidades")({
  head: () => ({ meta: [{ title: "Central de Oportunidades — Impulsionando" }] }),
  component: OportunidadesPage,
});

type Severity = "high" | "medium" | "low" | "info";

interface Opportunity {
  id: string;
  severity: Severity;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count?: number;
  cta: { label: string; to: string };
}

async function fetchOpportunities(): Promise<Opportunity[]> {
  const ops: Opportunity[] = [];

  const queries = await Promise.allSettled([
    // Leads sem follow-up há > 3 dias
    supabase.from("crm_leads").select("id", { count: "exact", head: true })
      .lt("updated_at", new Date(Date.now() - 3 * 86400000).toISOString()),
    // Oportunidades abertas
    supabase.from("crm_opportunities").select("id", { count: "exact", head: true })
      .not("status", "eq", "won").not("status", "eq", "lost"),
    // Faturas vencidas
    supabase.from("billing_invoices").select("id", { count: "exact", head: true })
      .eq("status", "overdue"),
    // Webhooks com falha (últimas 24h)
    supabase.from("webhook_event_log").select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    // Mensagens não respondidas (realestate)
    supabase.from("realestate_internal_messages").select("id", { count: "exact", head: true })
      .eq("is_read", false),
    // Faturas de mesa expiradas/falhas hoje
    supabase.from("restaurant_table_invoices").select("id", { count: "exact", head: true })
      .in("status", ["failed", "expired"])
      .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
  ]);

  const counts = queries.map((q) => (q.status === "fulfilled" ? (q.value.count ?? 0) : 0));

  if (counts[3] > 0) {
    ops.push({
      id: "webhooks-failed",
      severity: "high",
      icon: AlertTriangle,
      title: "Webhooks com falha nas últimas 24h",
      description: "Pagamentos podem ter ficado sem baixa. Revise e reprocesse.",
      count: counts[3],
      cta: { label: "Abrir log de webhooks", to: "/finance/webhook-log" },
    });
  }
  if (counts[2] > 0) {
    ops.push({
      id: "invoices-overdue",
      severity: "high",
      icon: CreditCard,
      title: "Faturas vencidas",
      description: "Clientes inadimplentes — acione régua de cobrança.",
      count: counts[2],
      cta: { label: "Ver billing", to: "/admin/billing" },
    });
  }
  if (counts[5] > 0) {
    ops.push({
      id: "table-invoices-failed",
      severity: "medium",
      icon: Receipt,
      title: "Pagamentos de mesa expirados/falhos hoje",
      description: "Clientes podem estar esperando uma nova cobrança.",
      count: counts[5],
      cta: { label: "Ir pra Vendas", to: "/sales" },
    });
  }
  if (counts[0] > 0) {
    ops.push({
      id: "leads-stale",
      severity: "medium",
      icon: UserPlus,
      title: "Leads sem follow-up há mais de 3 dias",
      description: "Risco de esfriar a oportunidade. Coloque atividade na agenda.",
      count: counts[0],
      cta: { label: "Abrir leads", to: "/crm/leads" },
    });
  }
  if (counts[4] > 0) {
    ops.push({
      id: "msgs-unread",
      severity: "medium",
      icon: Inbox,
      title: "Mensagens de interessados sem resposta",
      description: "Imobiliária — responda enquanto o interesse está quente.",
      count: counts[4],
      cta: { label: "Abrir mensagens", to: "/imobiliaria/mensagens" },
    });
  }
  if (counts[1] > 0) {
    ops.push({
      id: "opps-open",
      severity: "info",
      icon: GitBranch,
      title: "Oportunidades abertas no funil",
      description: "Acompanhe progresso e identifique gargalos por etapa.",
      count: counts[1],
      cta: { label: "Abrir Kanban", to: "/crm/board" },
    });
  }

  return ops;
}

const SEVERITY_STYLE: Record<Severity, { badge: string; border: string }> = {
  high: { badge: "bg-destructive text-destructive-foreground", border: "border-destructive/40" },
  medium: { badge: "bg-amber-500 text-white", border: "border-amber-500/40" },
  low: { badge: "bg-muted text-muted-foreground", border: "border-muted" },
  info: { badge: "bg-primary/15 text-primary", border: "border-primary/30" },
};

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "Crítico", medium: "Atenção", low: "Baixo", info: "Acompanhar",
};

function OportunidadesPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["central-oportunidades"],
    queryFn: fetchOpportunities,
    staleTime: 60_000,
  });

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <PageHeader
        title="Central de Oportunidades"
        description="O que mais precisa da sua atenção agora, consolidado de toda a operação."
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <Zap className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
          <h3 className="font-semibold mb-1">Tudo sob controle.</h3>
          <p className="text-sm text-muted-foreground">
            Nenhuma oportunidade crítica pendente. Bom momento pra avançar o funil.
          </p>
          <Button asChild className="mt-4">
            <Link to="/crm/board">Abrir Kanban <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((op) => {
          const Icon = op.icon;
          const style = SEVERITY_STYLE[op.severity];
          return (
            <Card key={op.id} className={`p-4 border-l-4 ${style.border}`}>
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-muted p-2"><Icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={style.badge}>{SEVERITY_LABEL[op.severity]}</Badge>
                    {typeof op.count === "number" && <Badge variant="outline">{op.count}</Badge>}
                    <h3 className="font-semibold">{op.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{op.description}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={op.cta.to}>{op.cta.label} <ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
        <Clock className="h-3 w-3" /> Atualizado a cada 60s. Sinais combinados de CRM, Financeiro, Webhooks e operação.
        <Lightbulb className="h-3 w-3 ml-2" /> Itens críticos aparecem no topo.
      </div>
    </div>
  );
}
