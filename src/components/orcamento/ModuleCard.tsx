/**
 * Card de módulo do wizard "Monte seu Orçamento".
 * Toggle de seleção, tooltip, badges de compatibilidade.
 */
import { Check, HelpCircle, Plug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL, UNIT_PRICE_CENTS } from "@/lib/pricing";
import type { CatalogModule } from "@/data/moduleCatalog";

interface ModuleCardProps {
  module: CatalogModule;
  selected: boolean;
  onToggle: () => void;
}

export function ModuleCard({ module, selected, onToggle }: ModuleCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "relative cursor-pointer p-5 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{module.name}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Saiba mais sobre ${module.name}`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{module.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {module.description}
          </p>
        </div>

        <div
          className={cn(
            "h-6 w-6 rounded-md border-2 flex items-center justify-center flex-shrink-0",
            selected ? "bg-primary border-primary" : "border-muted-foreground/30",
          )}
          aria-hidden
        >
          {selected && <Check className="h-4 w-4 text-primary-foreground" />}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-sm font-semibold text-foreground">
          {formatBRL(module.priceCents)}
          <span className="text-xs font-normal text-muted-foreground">/mês</span>
        </span>
        {module.requiresExternalCredentials && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-xs">
                <Plug className="h-3 w-3" />
                Credenciais
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Este módulo depende de credenciais externas (gateway, WhatsApp API ou similar) que serão configuradas após a contratação.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {module.combinesWith.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium">Combina com:</span>{" "}
          {module.combinesWith.slice(0, 4).join(", ")}
        </p>
      )}
    </Card>
  );
}

// Re-export to avoid unused import lint when consumers don't use UNIT_PRICE
export const _unitPrice = UNIT_PRICE_CENTS;
