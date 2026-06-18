import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, Info, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { fetchPercebidoInsights } from "@/lib/audience-dashboards.functions";

type Audience = "core" | "white-label" | "empresa" | "consumidor";

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
} as const;

const TONES = {
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900",
  critical: "border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-900",
} as const;

export function PercebidoSection({
  audience,
  companyId,
  days = 30,
}: {
  audience: Audience;
  companyId?: string;
  days?: number;
}) {
  const fn = useServerFn(fetchPercebidoInsights);
  const { data, isLoading } = useQuery({
    queryKey: ["percebido", audience, companyId ?? null, days],
    queryFn: () => fn({ data: { audience, companyId, days } }),
    staleTime: 60_000,
  });

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">O que a Impulsionando percebeu</h2>
        <Badge variant="secondary" className="ml-2 text-[10px]">últimos {days} dias</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-3 w-3 animate-spin" /> Analisando seus dados…
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.insights ?? []).map((i) => {
            const Icon = ICONS[i.severity];
            return (
              <div key={i.id} className={`rounded-md border p-3 ${TONES[i.severity]}`}>
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{i.title}</div>
                    <div className="text-xs opacity-80 mt-0.5">{i.detail}</div>
                    {i.cta && (
                      <Button asChild variant="link" size="sm" className="px-0 h-auto mt-1 text-xs">
                        <Link to={i.cta.to}>
                          {i.cta.label} <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
