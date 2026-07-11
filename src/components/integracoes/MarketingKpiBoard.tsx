import { Card } from "@/components/ui/card";
import { MARKETING_KPIS } from "@/data/marketing-kpis-mock";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

const toneCls: Record<"positive" | "warning" | "neutral", string> = {
  positive: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
  neutral: "text-muted-foreground",
};

export function MarketingKpiBoard() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
        <Info className="h-4 w-4" />
        Layout de desenvolvimento — os números abaixo são placeholders visuais. Os dados reais entram
        quando o Codex concluir as integrações.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {MARKETING_KPIS.cards.map((c) => {
          const Icon = c.tone === "positive" ? TrendingUp : c.tone === "warning" ? TrendingDown : Minus;
          return (
            <Card key={c.key} className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="mt-1 text-2xl font-semibold">{c.value}</div>
              <div className={cn("mt-1 flex items-center gap-1 text-xs", toneCls[c.tone])}>
                <Icon className="h-3.5 w-3.5" /> {c.delta}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-semibold">Origem do tráfego</div>
          <ul className="mt-3 space-y-2">
            {MARKETING_KPIS.origens.map((o) => (
              <li key={o.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{o.label}</span>
                  <span className="text-muted-foreground">{o.share}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${o.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold">Funil</div>
          <ul className="mt-3 space-y-2">
            {MARKETING_KPIS.funil.map((f, i) => {
              const first = MARKETING_KPIS.funil[0].value;
              const pct = Math.round((f.value / first) * 100);
              return (
                <li key={f.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>
                      {i + 1}. {f.label}
                    </span>
                    <span className="text-muted-foreground">{f.value.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary/80" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
