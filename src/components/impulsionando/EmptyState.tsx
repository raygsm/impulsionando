import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  /** Título do estado vazio. */
  title: string;
  /** Descrição orientativa (curta, em tom de plataforma madura). */
  description?: string;
  /** Ícone opcional (Lucide). Default: Inbox. */
  icon?: ReactNode;
  /** Ação primária opcional (botão/link). */
  action?: ReactNode;
  /** Variante de densidade. */
  variant?: "default" | "compact";
  /** Classe extra. */
  className?: string;
}

/**
 * Estado vazio padrão do Core Impulsionando.
 *
 * IMPORTANTE (regra de produto): NÃO usar frases como "Disponível na
 * próxima versão" ou "Em breve" — essa API foi criada para transmitir
 * plataforma madura. Prefira copy como:
 *   - "Nenhum dado disponível no momento. Assim que este cliente utilizar
 *      os recursos correspondentes, esta visão será preenchida
 *      automaticamente."
 *   - "Esta área está preparada para consolidar as informações. Os dados
 *      serão exibidos automaticamente conforme os módulos e integrações
 *      forem ativados."
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  const pad = variant === "compact" ? "p-6" : "p-10";
  return (
    <div
      role="status"
      className={`rounded-xl border border-dashed bg-muted/20 ${pad} text-center ${className}`.trim()}
    >
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-background text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
