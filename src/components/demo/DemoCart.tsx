/**
 * DemoCart — gaveta inferior do carrinho da demo Bar & Restaurante.
 * Mostra itens, total, e botão "Avançar para pagamento" (que apenas dispara telemetria;
 * o checkout simulado em si entra na Fase 3).
 */
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, ShieldAlert } from "lucide-react";
import { formatBRL, type DemoCartItem } from "@/hooks/useDemoCart";

type Props = {
  items: DemoCartItem[];
  count: number;
  totalCents: number;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  onOpen?: () => void;
};

export function DemoCart({ items, count, totalCents, onRemove, onClear, onCheckout, onOpen }: Props) {
  return (
    <Sheet onOpenChange={(open) => open && onOpen?.()}>
      <SheetTrigger asChild>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)]">
          <Button
            size="lg"
            className="w-full justify-between shadow-lg"
            disabled={count === 0}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {count === 0 ? "Carrinho vazio" : `${count} item${count > 1 ? "s" : ""}`}
            </span>
            <span className="font-semibold">{formatBRL(totalCents)}</span>
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Seu pedido
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-xs text-amber-900 dark:text-amber-100">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Demonstração — ao avançar nada é cobrado. O fluxo serve para mostrar como o restaurante
            captura cliente, preferência e ticket médio.
          </p>
        </div>

        <ul className="mt-4 divide-y">
          {items.map((it) => (
            <li key={it.id} className="py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-tight truncate">{it.name}</p>
                <p className="text-xs text-muted-foreground">
                  {it.qty} × {formatBRL(it.priceCents)} · {it.category}
                </p>
              </div>
              <span className="text-sm font-semibold">{formatBRL(it.priceCents * it.qty)}</span>
              <button
                onClick={() => onRemove(it.id)}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label={`Remover ${it.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              Adicione itens do cardápio para simular o pedido.
            </li>
          )}
        </ul>

        <div className="mt-4 space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatBRL(totalCents)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total simulado</span>
            <span>{formatBRL(totalCents)}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClear} disabled={items.length === 0} className="flex-1">
              Limpar
            </Button>
            <Button onClick={onCheckout} disabled={items.length === 0} className="flex-1">
              Avançar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Checkout simulado (Pix / cartão / na entrega) entra na próxima fase da demo.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
