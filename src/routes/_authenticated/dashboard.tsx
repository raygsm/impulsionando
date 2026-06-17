import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Building2, Users, Boxes, Tags, FileSearch, MapPin, LayoutGrid, RotateCcw, Star, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { NicheOnboardingBanner } from "@/components/app/NicheOnboardingBanner";
import { useDashboardWidgets, WIDGET_CATALOG, type WidgetId } from "@/hooks/use-dashboard-widgets";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentPages } from "@/hooks/use-recent-pages";

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

function CustomizeButton() {
  const { isEnabled, toggle, reset } = useDashboardWidgets();
  const groups = ["KPIs", "Painéis"] as const;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutGrid className="w-4 h-4" /> Personalizar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Widgets do dashboard</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={reset}>
            <RotateCcw className="w-3 h-3" /> Resetar
          </Button>
        </div>
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g}>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{g}</div>
              <div className="space-y-1.5">
                {WIDGET_CATALOG.filter((w) => w.group === g).map((w) => (
                  <label key={w.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={isEnabled(w.id as WidgetId)} onCheckedChange={() => toggle(w.id as WidgetId)} />
                    <span>{w.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FavoritesPanel() {
  const { favorites } = useFavorites();
  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-500" />
        <h2 className="font-semibold">Favoritos</h2>
      </div>
      {favorites.length === 0 ? (
        <p className="text-sm text-muted-foreground">Marque páginas como favoritas pelo ícone ★ no topo.</p>
      ) : (
        <ul className="space-y-1.5">
          {favorites.slice(0, 8).map((f) => (
            <li key={f.to}>
              <Link to={f.to as never} className="text-sm hover:underline">{f.label}</Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecentsPanel() {
  const recent = useRecentPages();
  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold">Acessadas recentemente</h2>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">Suas páginas recentes aparecerão aqui.</p>
      ) : (
        <ul className="space-y-1.5">
          {recent.slice(0, 8).map((r) => (
            <li key={r.to}>
              <Link to={r.to as never} className="text-sm hover:underline">{r.label}</Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DashboardPage() {
  const { data: me } = useCurrentUser();
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });
  const { data: audit } = useQuery({ queryKey: ["dashboard-audit"], queryFn: fetchRecentAudit });
  const { isEnabled } = useDashboardWidgets();

  const greeting = me?.memberships[0]?.display_name ?? me?.user.email ?? "";

  const anyStat = ["stat-companies","stat-units","stat-users","stat-niches","stat-modules","stat-audit"].some((id) => isEnabled(id as WidgetId));

  return (
    <div>
      <PageHeader
        title={`Olá, ${greeting}`}
        description={me?.isSuperAdmin ? "Visão master consolidada de todos os clientes." : "Indicadores da sua empresa."}
        action={
          <div className="flex items-center gap-2">
            {me?.isSuperAdmin && <Badge className="bg-gradient-primary">Super Admin</Badge>}
            <CustomizeButton />
          </div>
        }
      />

      <NicheOnboardingBanner companyId={me?.memberships?.[0]?.company_id} />

      {anyStat && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {isEnabled("stat-companies") && <StatCard label="Empresas" value={stats?.companies ?? "—"} hint={`${stats?.activeCompanies ?? 0} ativas`} icon={Building2} accent />}
          {isEnabled("stat-units") && <StatCard label="Unidades" value={stats?.units ?? "—"} icon={MapPin} />}
          {isEnabled("stat-users") && <StatCard label="Usuários ativos" value={stats?.users ?? "—"} icon={Users} />}
          {isEnabled("stat-niches") && <StatCard label="Nichos" value={stats?.niches ?? "—"} icon={Tags} />}
          {isEnabled("stat-modules") && <StatCard label="Módulos" value={stats?.modules ?? "—"} icon={Boxes} />}
          {isEnabled("stat-audit") && <StatCard label="Eventos de auditoria" value={stats?.auditEvents ?? "—"} icon={FileSearch} />}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isEnabled("panel-audit") && (
          <Card className="p-6 shadow-card lg:col-span-2">
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
        )}

        {isEnabled("panel-favorites") && <FavoritesPanel />}
        {isEnabled("panel-recents") && <RecentsPanel />}
      </div>
    </div>
  );
}
