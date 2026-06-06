/**
 * Resumo lateral do orçamento — fixo no desktop, drawer no mobile.
 * Atualiza em tempo real conforme módulos são marcados/desmarcados.
 */
import { Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { computeQuote, formatBRL } from "@/lib/pricing";
import { getModule } from "@/data/moduleCatalog";

interface QuoteSidebarProps {
  selectedSlugs: string[];
  onRemove?: (slug: string) => void;
  compact?: boolean;
}

export function QuoteSidebar({ selectedSlugs, onRemove, compact }: QuoteSidebarProps) {
  const totals = computeQuote(selectedSlugs);
  const hasItems = totals.lineItems.length > 0;

  return (
    <Card className={compact ? "p-4" : "p-5 sticky top-24"}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Seu orçamento
        </h3>
        <span className="text-xs text-muted-foreground">
          {totals.selectedCount} {totals.selectedCount === 1 ? "módulo" : "módulos"}
        </span>
      </div>

      {!hasItems && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Selecione módulos para ver os valores aqui.
        </p>
      )}

      {hasItems && (
        <>
          <ul className="space-y-2 mb-4 max-h-64 overflow-auto">
            {totals.lineItems.map((item) => {
              const mod = getModule(item.slug);
              return (
                <li key={item.slug} className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate flex-1">{mod?.name ?? item.slug}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatBRL(item.priceCents)}
                  </span>
                  {onRemove && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onRemove(item.slug)}
                      aria-label={`Remover ${mod?.name ?? item.slug}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatBRL(totals.subtotalCents)}</span>
            </div>
            {totals.discountCents > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-500">
                <span className="flex items-center gap-1">
                  Desconto ({totals.discountPct}%)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Desconto progressivo: 2 módulos = 5%, 3 = 10%, 4 ou mais = 15%.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </span>
                <span className="tabular-nums">- {formatBRL(totals.discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border font-semibold text-base">
              <span>Total mensal</span>
              <span className="tabular-nums">{formatBRL(totals.totalCents)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Vencimento mensal recorrente. Sem multa por cancelamento.
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
