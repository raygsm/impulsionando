import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaPct?: number | null;
  format?: "number" | "currency" | "percent";
  hint?: string;
  inverse?: boolean; // when true, increase = bad (e.g. errors)
}

function fmt(v: string | number, format: KpiCardProps["format"]) {
  if (typeof v === "string") return v;
  if (format === "currency") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (format === "percent") return `${v.toFixed(1)}%`;
  return v.toLocaleString("pt-BR");
}

export function KpiCard({ label, value, delta, deltaPct, format = "number", hint, inverse }: KpiCardProps) {
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const positive = hasDelta ? (inverse ? (deltaPct as number) < 0 : (deltaPct as number) > 0) : false;
  const negative = hasDelta ? (inverse ? (deltaPct as number) > 0 : (deltaPct as number) < 0) : false;
  const Icon = !hasDelta ? Minus : positive ? TrendingUp : negative ? TrendingDown : Minus;
  const tone = !hasDelta
    ? "text-muted-foreground"
    : positive
      ? "text-emerald-600 dark:text-emerald-400"
      : negative
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";

  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{fmt(value, format)}</div>
      {hasDelta ? (
        <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", tone)}>
          <Icon className="h-3 w-3" />
          {(deltaPct as number) > 0 ? "+" : ""}
          {(deltaPct as number).toFixed(1)}%
          {typeof delta === "number" && (
            <span className="text-muted-foreground font-normal">
              ({delta > 0 ? "+" : ""}
              {fmt(delta, format)})
            </span>
          )}
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">sem comparação</Badge>
        </div>
      )}
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
