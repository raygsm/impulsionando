import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

export type BannerTone = "info" | "success" | "warning" | "critical";

export interface StatusBannerProps {
  tone?: BannerTone;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const TONE: Record<BannerTone, { wrap: string; icon: ReactNode; label: string }> = {
  info: {
    wrap: "border-primary/30 bg-primary/5 text-foreground",
    icon: <Info className="h-4 w-4 text-primary" aria-hidden="true" />,
    label: "Informação",
  },
  success: {
    wrap: "border-emerald-500/30 bg-emerald-500/5 text-foreground",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
    label: "Sucesso",
  },
  warning: {
    wrap: "border-amber-500/30 bg-amber-500/5 text-foreground",
    icon: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
    label: "Atenção",
  },
  critical: {
    wrap: "border-destructive/40 bg-destructive/5 text-foreground",
    icon: <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" />,
    label: "Crítico",
  },
};

/**
 * Banner de status padronizado (aviso operacional, integração indisponível,
 * permissão insuficiente, dados parciais).
 * Consolidação da Fase P6.
 */
export function StatusBanner({
  tone = "info",
  title,
  description,
  action,
  className = "",
}: StatusBannerProps) {
  const cfg = TONE[tone];
  return (
    <div
      role="status"
      aria-label={cfg.label}
      className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between ${cfg.wrap} ${className}`.trim()}
    >
      <div className="flex items-start gap-2 min-w-0">
        <span className="mt-0.5 shrink-0">{cfg.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
