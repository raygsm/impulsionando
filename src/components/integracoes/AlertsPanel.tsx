import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ALERTAS, type AlertaSeveridade } from "@/data/alertas-mock";
import { AlertTriangle, XCircle, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const META: Record<
  AlertaSeveridade,
  { icon: React.ComponentType<{ className?: string }>; cls: string; label: string }
> = {
  erro: {
    icon: XCircle,
    cls: "border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-300",
    label: "Erro",
  },
  atencao: {
    icon: AlertTriangle,
    cls: "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200",
    label: "Atenção",
  },
  info: {
    icon: Info,
    cls: "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-300",
    label: "Info",
  },
};

export function AlertsPanel() {
  return (
    <ul className="space-y-2">
      {ALERTAS.map((a) => {
        const meta = META[a.severidade];
        const Icon = meta.icon;
        return (
          <Card key={a.id} className={cn("p-4", meta.cls)}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">· {a.quando}</span>
                </div>
                <div className="mt-0.5 font-medium text-foreground">{a.titulo}</div>
                <p className="mt-1 text-sm text-muted-foreground">{a.descricao}</p>
              </div>
              {a.integracaoSlug && a.grupo && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link
                    to={`/core/integracoes/${a.grupo}/${a.integracaoSlug}` as never}
                    search={{ wizard: 1 } as never}
                  >
                    <RefreshCw className="h-4 w-4" /> Resolver
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </ul>
  );
}
