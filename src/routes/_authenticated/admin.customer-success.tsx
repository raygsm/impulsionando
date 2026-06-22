import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getCustomerSuccessCockpit } from "@/lib/customer-success.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Headphones, AlertTriangle, TrendingUp, Smile, Activity, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customer-success")({
  head: () => ({
    meta: [
      { title: "Customer Success Cockpit — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CustomerSuccessPage,
});

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function scoreColor(s: number) {
  if (s >= 60) return "bg-destructive text-destructive-foreground";
  if (s >= 30) return "bg-amber-500 text-white";
  return "bg-emerald-500 text-white";
}

function CustomerSuccessPage() {
  const fn = useServerFn(getCustomerSuccessCockpit);
  const { data, isLoading } = useQuery({
    queryKey: ["cs-cockpit"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  const [filter, setFilter] = useState<"all" | "risk" | "expansion">("all");
  const [search, setSearch] = useState("");

  if (isLoading || !data)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );

  const k = data.kpis;
  const filtered = data.rows.filter((r) => {
    if (filter === "risk" && r.score < 60) return false;
    if (filter === "expansion" && !r.expansion) return false;
    if (search && !r.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="h-6 w-6" /> Customer Success Cockpit
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão proativa por tenant: SLA, CSAT, onboarding, atividade e sinais de risco/expansão.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Em risco" value={k.atRisk.toString()} sub={`${k.watch} em watch`} valueClass={k.atRisk > 0 ? "text-destructive" : ""} />
        <Kpi icon={<Smile className="h-4 w-4" />} label="Saudáveis" value={k.healthy.toString()} sub={`${k.tenants} tenants ativos`} valueClass="text-emerald-600" />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Expansion opp." value={k.expansionCandidates.toString()} sub="alta atividade, sem atrito" />
        <Kpi icon={<Clock className="h-4 w-4" />} label="Tickets vencidos" value={k.overdueTicketsTotal.toString()} sub={`${k.openTicketsTotal} abertos`} valueClass={k.overdueTicketsTotal > 0 ? "text-destructive" : ""} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="SLA atingido" value={k.slaRate === null ? "—" : `${k.slaRate}%`} valueClass={k.slaRate !== null && k.slaRate < 80 ? "text-amber-600" : ""} />
        <Kpi icon={<Smile className="h-4 w-4" />} label="CSAT médio" value={k.csatAvg === null ? "—" : `${k.csatAvg}/5`} />
        <Kpi icon={<Smile className="h-4 w-4" />} label="NPS proxy" value={k.npsProxy === null ? "—" : k.npsProxy.toString()} sub="(promoters − detractors)" />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Onboarding travado" value={k.stalledOnboardingTotal.toString()} valueClass={k.stalledOnboardingTotal > 0 ? "text-amber-600" : ""} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(["all", "risk", "expansion"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded border ${filter === f ? "bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {f === "all" ? "Todos" : f === "risk" ? "Em risco" : "Expansion"}
            </button>
          ))}
        </div>
        <Input
          placeholder="Buscar tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} resultado(s)</span>
      </div>

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="text-left p-2">Tenant</th>
              <th className="text-right p-2">Score</th>
              <th className="text-right p-2">MRR</th>
              <th className="text-right p-2">Tickets</th>
              <th className="text-right p-2">CSAT</th>
              <th className="text-right p-2">Atividade 30d</th>
              <th className="text-left p-2">Sinais</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.company_id} className="border-b last:border-0 align-top">
                <td className="p-2">
                  <Link to="/admin/tenant/$id" params={{ id: r.company_id }} className="font-medium hover:underline">
                    {r.company_name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{r.niche}</div>
                </td>
                <td className="p-2 text-right">
                  <Badge className={`${scoreColor(r.score)} border-0`}>{r.score}</Badge>
                  {r.expansion && <div className="text-xs text-emerald-600 mt-1">↑ expansion</div>}
                </td>
                <td className="p-2 text-right tabular-nums">{brl(r.mrr)}</td>
                <td className="p-2 text-right tabular-nums">
                  {r.openTickets}
                  {r.overdueTickets > 0 && <span className="text-destructive font-medium"> ({r.overdueTickets}⚠)</span>}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {r.csat === null ? "—" : (
                    <span className={r.csat <= 3 ? "text-destructive font-medium" : r.csat >= 4 ? "text-emerald-600" : ""}>
                      {r.csat}
                    </span>
                  )}
                </td>
                <td className="p-2 text-right tabular-nums text-muted-foreground">{r.activity30d.toLocaleString("pt-BR")}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {r.signals.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      r.signals.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal">{s}</Badge>
                      ))
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground text-sm">Nenhum tenant com os filtros atuais.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted-foreground">
        Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}. Score combina SLA vencido
        (+30), CSAT ≤3 (+25), sem atividade (+25), onboarding travado (+20), múltiplos tickets
        abertos (+15), suspensão (+30). ≥60 = atenção imediata, 30-59 = watch, &lt;30 = saudável.
      </p>
    </div>
  );
}

function Kpi({ icon, label, value, sub, valueClass }: { icon: React.ReactNode; label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`text-2xl font-bold tabular-nums mt-2 ${valueClass ?? ""}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}
