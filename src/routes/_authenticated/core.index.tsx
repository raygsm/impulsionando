import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { coreExecutiveDashboard } from "@/lib/provisioning.functions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageElements";
import { Building2, Boxes, CreditCard, ClipboardList, AlertTriangle, Globe, Rocket, ShieldOff, PieChart, Package, CircleDollarSign, TrendingUp, Wallet, CalendarClock, Target } from "lucide-react";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/_authenticated/core/")({
  component: CoreIndex,
});

function CoreIndex() {
  const fetchDash = useServerFn(coreExecutiveDashboard);
  const { data } = useQuery({ queryKey: ["core-exec-dash"], queryFn: () => fetchDash() });

  const cards = [
    { label: "Clientes ativos", value: `${data?.active ?? 0} / ${data?.total ?? 0}`, icon: Building2 },
    { label: "MRR (contratos ativos)", value: fmtBRL(data?.mrr ?? 0), icon: CreditCard },
    { label: "Inadimplência", value: `${data?.overdueCount ?? 0} · ${fmtBRL(data?.overdueAmount ?? 0)}`, icon: CircleDollarSign },
    { label: "Bloqueados (suspensos)", value: data?.blocked ?? 0, icon: ShieldOff },
    { label: "Em onboarding", value: data?.onboarding ?? 0, icon: ClipboardList },
    { label: "Aguardando domínio", value: data?.awaitingDomain ?? 0, icon: Globe },
    { label: "Aguardando implantação", value: data?.awaitingDeploy ?? 0, icon: Boxes },
    { label: "Provisionamentos pendentes", value: data?.provisioningPending ?? 0, icon: AlertTriangle },
    { label: "Implantações concluídas", value: data?.provisioningDone ?? 0, icon: Rocket },
  ];

  const byNiche = data?.byNiche ?? [];
  const topModules = data?.topModules ?? [];
  const topPlans = data?.topPlans ?? [];
  const maxNiche = Math.max(1, ...byNiche.map((n) => n.count));
  const maxMod = Math.max(1, ...topModules.map((m) => m.count));
  const maxPlan = Math.max(1, ...topPlans.map((p) => p.count));

  return (
    <>
      <PageHeader
        title="Core Manager"
        description="Governança da plataforma. Toda contratação se transforma automaticamente em empresa provisionada, módulos instalados, checklist atualizado e cliente notificado."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-1 text-xl font-bold">{c.value}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-3 mt-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Clientes por nicho</h3>
          </div>
          {byNiche.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {byNiche.map((n) => (
                <li key={n.name} className="text-sm">
                  <div className="flex justify-between"><span>{n.name}</span><span className="font-medium">{n.count}</span></div>
                  <div className="h-1.5 bg-muted rounded mt-1 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(n.count / maxNiche) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Top módulos instalados</h3>
          </div>
          {topModules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {topModules.map((m) => (
                <li key={m.name} className="text-sm">
                  <div className="flex justify-between"><span>{m.name}</span><span className="font-medium">{m.count}</span></div>
                  <div className="h-1.5 bg-muted rounded mt-1 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(m.count / maxMod) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Planos ativos</h3>
          </div>
          {topPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {topPlans.map((p) => (
                <li key={p.name} className="text-sm">
                  <div className="flex justify-between"><span>{p.name}</span><span className="font-medium">{p.count}</span></div>
                  <div className="h-1.5 bg-muted rounded mt-1 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(p.count / maxPlan) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>


      <Card className="p-5 mt-4">
        <h3 className="font-semibold mb-2">Atalhos rápidos</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/core/clientes" className="text-primary underline">Clientes</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/core/modulos" className="text-primary underline">Biblioteca de Módulos</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/core/implantacoes" className="text-primary underline">Implantações automáticas</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/admin/billing-contracts" className="text-primary underline">Contratos</Link>
        </div>
      </Card>
    </>
  );
}
