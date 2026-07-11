import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bloco de ajuda contextual do Impulsinito.
 * Explica em linguagem humana como conectar / testar / interpretar.
 */
export function ImpulsinitoHint({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">
            Impulsinito · {title ?? "Como especialista em integrações"}
          </div>
          <div className="text-foreground/90 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
