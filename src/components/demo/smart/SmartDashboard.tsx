import { AlertTriangle, Info, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DemoPlanId, DemoTemplate } from "@/data/demo-templates/types";
import { PLAN_LABEL } from "@/data/demo-templates/types";
import { filterByPlan, isLockedByPlan } from "@/data/demo-templates/registry";

type Props = {
  template: DemoTemplate;
  plan: DemoPlanId;
  onUnlock: (minPlan: DemoPlanId) => void;
};

const SEVERITY: Record<string, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "border-sky-200 bg-sky-50 text-sky-900" },
  warning: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-900" },
  critical: { icon: AlertTriangle, className: "border-rose-200 bg-rose-50 text-rose-900" },
  opportunity: { icon: Sparkles, className: "border-violet-200 bg-violet-50 text-violet-900" },
};

export function SmartDashboard({ template, plan, onUnlock }: Props) {
  const indicators = filterByPlan(template.indicators, plan).slice(0, 5);
  const alerts = filterByPlan(template.alerts, plan).slice(0, 3);
  const actions = filterByPlan(template.actions, plan).slice(0, 3);
  const tables = filterByPlan(template.tables, plan);
  const planCfg = template.plans[plan];

  const lockedIndicators = template.indicators.filter((i) => isLockedByPlan(i.minPlan, plan));
  const lockedAlerts = template.alerts.filter((a) => isLockedByPlan(a.minPlan, plan));
  const nextLocked = [...lockedIndicators, ...lockedAlerts][0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Badge variant="outline" className="mb-2">
          Plano {PLAN_LABEL[plan]}
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight">{planCfg.headline}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{planCfg.benefit}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {indicators.map((ind) => {
          const Trend = ind.trend === "down" ? TrendingDown : TrendingUp;
          return (
            <Card key={ind.id} className="p-4">
              <p className="text-xs text-muted-foreground">{ind.label}</p>
              <p className="mt-1 text-xl font-semibold">{ind.value}</p>
              {ind.hint && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  {ind.trend && <Trend className="h-3 w-3" />} {ind.hint}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {alerts.map((a) => {
            const cfg = SEVERITY[a.severity] ?? SEVERITY.info;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className={`rounded-xl border p-3 text-sm ${cfg.className}`}>
                <div className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4" /> {a.title}
                </div>
                <p className="mt-1 text-xs opacity-90">{a.message}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a, idx) => (
          <Button key={a.id} variant={idx === 0 ? "default" : "outline"} size="sm">
            {a.label}
          </Button>
        ))}
      </div>

      {tables.map((t) => (
        <Card key={t.id} className="overflow-hidden">
          <div className="border-b px-4 py-3 text-sm font-medium">{t.title}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  {t.columns.map((c) => (
                    <th key={c.key} className="px-4 py-2 text-left font-medium">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    {t.columns.map((c) => (
                      <td key={c.key} className="px-4 py-2">{r[c.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {nextLocked && nextLocked.minPlan && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-dashed p-4">
          <div>
            <p className="text-sm font-medium">Descubra mais no plano {PLAN_LABEL[nextLocked.minPlan]}</p>
            <p className="text-xs text-muted-foreground">
              {template.plans[nextLocked.minPlan].benefit}
            </p>
          </div>
          <Button size="sm" onClick={() => onUnlock(nextLocked.minPlan!)}>
            Ver no plano {PLAN_LABEL[nextLocked.minPlan]}
          </Button>
        </Card>
      )}
    </div>
  );
}
