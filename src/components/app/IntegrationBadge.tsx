import { CheckCircle2, Clock3, AlertTriangle, Wrench, UserCog, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntegrationStatus =
  | "pronto"
  | "em-homologacao"
  | "requer-codex"
  | "pendente-cliente"
  | "em-construcao"
  | "suspenso";

const MAP: Record<
  IntegrationStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  "pronto": {
    label: "Pronto",
    icon: CheckCircle2,
    cls: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  },
  "em-homologacao": {
    label: "Em homologação",
    icon: Clock3,
    cls: "border-amber-500/40 text-amber-800 dark:text-amber-200 bg-amber-500/10",
  },
  "requer-codex": {
    label: "Requer integração — Codex",
    icon: Wrench,
    cls: "border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-500/10",
  },
  "pendente-cliente": {
    label: "Aguardando cliente",
    icon: UserCog,
    cls: "border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-500/10",
  },
  "em-construcao": {
    label: "Em construção",
    icon: AlertTriangle,
    cls: "border-orange-500/40 text-orange-700 dark:text-orange-300 bg-orange-500/10",
  },
  "suspenso": {
    label: "Suspenso",
    icon: PauseCircle,
    cls: "border-muted text-muted-foreground bg-muted/40",
  },
};

/**
 * Selo visual usado nos hubs do Core para deixar claro se uma tela/fluxo
 * está pronto, dependendo de backend/integração, ou aguardando ação externa.
 * Puramente visual — não altera comportamento.
 */
export function IntegrationBadge({
  status,
  label,
  className,
}: {
  status: IntegrationStatus;
  label?: string;
  className?: string;
}) {
  const meta = MAP[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        meta.cls,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label ?? meta.label}
    </span>
  );
}
