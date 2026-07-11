import { CheckCircle2, AlertTriangle, XCircle, CircleDashed, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntegrationConnState } from "@/data/integracoes-catalog";

const MAP: Record<IntegrationConnState, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  "conectado": {
    label: "Conectado",
    icon: CheckCircle2,
    cls: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  },
  "atencao": {
    label: "Precisa de atenção",
    icon: AlertTriangle,
    cls: "border-amber-500/40 text-amber-800 dark:text-amber-200 bg-amber-500/10",
  },
  "erro": {
    label: "Com erro",
    icon: XCircle,
    cls: "border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/10",
  },
  "nao-configurado": {
    label: "Não conectado",
    icon: CircleDashed,
    cls: "border-muted-foreground/30 text-muted-foreground bg-muted/40",
  },
  "sincronizando": {
    label: "Sincronizando",
    icon: Loader2,
    cls: "border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-500/10",
  },
};

export function IntegrationStatusPill({
  state,
  className,
}: {
  state: IntegrationConnState;
  className?: string;
}) {
  const meta = MAP[state];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        meta.cls,
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", state === "sincronizando" && "animate-spin")} />
      {meta.label}
    </span>
  );
}
