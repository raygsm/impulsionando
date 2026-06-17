import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Building2, Users, Boxes, Tags, FileSearch, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { NicheOnboardingBanner } from "@/components/app/NicheOnboardingBanner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Impulsionando" }] }),
  component: DashboardPage,
});

async function fetchStats() {
  const counts = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("company_units").select("*", { count: "exact", head: true }),
    supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("niches").select("*", { count: "exact", head: true }),
    supabase.from("modules").select("*", { count: "exact", head: true }),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }),
  ]);
  return {
    companies: counts[0].count ?? 0,
    activeCompanies: counts[1].count ?? 0,
    units: counts[2].count ?? 0,
    users: counts[3].count ?? 0,
    niches: counts[4].count ?? 0,
    modules: counts[5].count ?? 0,
    auditEvents: counts[6].count ?? 0,
  };
}

async function fetchRecentAudit() {
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity, user_email, created_at, company_id")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

function DashboardPage() {
  const { data: me } = useCurrentUser();
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });
  const { data: audit } = useQuery({ queryKey: ["dashboard-audit"], queryFn: fetchRecentAudit });

  const greeting = me?.memberships[0]?.display_name ?? me?.user.email ?? "";

  return (
    <div>
      <PageHeader
        title={`Olá, ${greeting}`}
        description={me?.isSuperAdmin ? "Visão master consolidada de todos os clientes." : "Indicadores da sua empresa."}
        action={me?.isSuperAdmin && <Badge className="bg-gradient-primary">Super Admin</Badge>}
      />

      <NicheOnboardingBanner companyId={me?.memberships?.[0]?.company_id} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Empresas" value={stats?.companies ?? "—"} hint={`${stats?.activeCompanies ?? 0} ativas`} icon={Building2} accent />
        <StatCard label="Unidades" value={stats?.units ?? "—"} icon={MapPin} />
        <StatCard label="Usuários ativos" value={stats?.users ?? "—"} icon={Users} />
        <StatCard label="Nichos" value={stats?.niches ?? "—"} icon={Tags} />
        <StatCard label="Módulos" value={stats?.modules ?? "—"} icon={Boxes} />
        <StatCard label="Eventos de auditoria" value={stats?.auditEvents ?? "—"} icon={FileSearch} />
      </div>

      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Auditoria recente</h2>
            <p className="text-xs text-muted-foreground">Últimas ações registradas no sistema.</p>
          </div>
        </div>
        <div className="divide-y">
          {(audit ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem eventos registrados ainda.</p>
          )}
          {audit?.map((row) => (
            <div key={row.id} className="py-3 flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="font-mono text-[10px]">{row.action}</Badge>
                <span className="font-medium truncate">{row.entity}</span>
                <span className="text-muted-foreground truncate">{row.user_email ?? "—"}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(row.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
