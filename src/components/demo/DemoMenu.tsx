/**
 * DemoMenu — cardápio mobile-first do Boteco Aurora.
 * Lista itens agrupados por categoria, com filtro por tag e botão "Adicionar".
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Flame, Sparkles } from "lucide-react";
import { formatBRL } from "@/hooks/useDemoCart";

export type DemoMenuItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price_cents: number;
  tags: string[] | null;
  harmony: string | null;
  is_bestseller: boolean | null;
};

type Props = {
  items: DemoMenuItem[];
  onAdd: (item: DemoMenuItem) => void;
};

export function DemoMenu({ items, onAdd }: Props) {
  const categories = useMemo(() => {
    const set = new Map<string, DemoMenuItem[]>();
    for (const item of items) {
      if (!set.has(item.category)) set.set(item.category, []);
      set.get(item.category)!.push(item);
    }
    return Array.from(set.entries());
  }, [items]);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const visibleCats = activeCat ? categories.filter(([c]) => c === activeCat) : categories;

  if (!items.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Cardápio ainda não publicado nesta demonstração.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <CatChip label="Tudo" active={activeCat === null} onClick={() => setActiveCat(null)} />
        {categories.map(([cat, list]) => (
          <CatChip
            key={cat}
            label={`${cat} · ${list.length}`}
            active={activeCat === cat}
            onClick={() => setActiveCat(cat)}
          />
        ))}
      </div>

      {visibleCats.map(([cat, list]) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{cat}</h2>
          <div className="space-y-2">
            {list.map((item) => (
              <Card key={item.id} className="p-3 flex gap-3 items-start">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium leading-tight">{item.name}</span>
                    {item.is_bestseller && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Flame className="w-3 h-3" /> Mais pedido
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  {item.harmony && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Harmoniza com {item.harmony}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-0.5">
                      {item.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm font-semibold pt-1">{formatBRL(item.price_cents)}</p>
                </div>
                <Button size="sm" onClick={() => onAdd(item)} className="shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CatChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
