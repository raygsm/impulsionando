import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { useBrand } from "./BrandThemeProvider";
import { toast } from "sonner";

export function BrandCatalog() {
  const b = useBrand();
  const [cat, setCat] = useState<string>("todos");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return b.catalog.items.filter((i) => {
      const okCat = cat === "todos" || i.category === cat;
      const okQ = !q || (i.name + i.description).toLowerCase().includes(q.toLowerCase());
      return okCat && okQ;
    });
  }, [b.catalog.items, cat, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <div className="text-xs uppercase tracking-wider" style={{ color: b.palette.muted }}>
        {b.catalog.label}
      </div>
      <h1 className="mt-2 text-4xl font-bold" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>
        Encontre exatamente o que precisa
      </h1>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: b.palette.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar em ${b.catalog.label.toLowerCase()}...`}
            className="w-full rounded-md border pl-9 pr-3 py-2 text-sm outline-none"
            style={{ background: "#fff", borderColor: `${b.palette.ink}22`, color: b.palette.ink }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {b.catalog.categories.map((c) => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                style={{
                  background: active ? b.palette.primary : "transparent",
                  color: active ? b.palette.primaryFg : b.palette.ink,
                  borderColor: active ? b.palette.primary : `${b.palette.ink}22`,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border overflow-hidden group flex flex-col"
            style={{ background: "#fff", borderColor: `${b.palette.ink}10` }}
          >
            <div className="aspect-[4/3] grid place-items-center relative overflow-hidden" style={{ background: item.imageGradient }}>
              <span className="text-7xl transition-transform group-hover:scale-110" aria-hidden>{item.emoji}</span>
              {item.highlight && (
                <span
                  className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded"
                  style={{ background: b.palette.accent, color: b.palette.ink }}
                >
                  {item.highlight}
                </span>
              )}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="text-[11px] uppercase tracking-wider" style={{ color: b.palette.muted }}>
                {b.catalog.categories.find((c) => c.id === item.category)?.label ?? item.category}
              </div>
              <h3 className="mt-1 font-semibold text-lg" style={{ color: b.palette.ink, fontFamily: b.typography.heading }}>
                {item.name}
              </h3>
              <p className="mt-1.5 text-sm flex-1" style={{ color: b.palette.muted }}>{item.description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs" style={{ color: b.palette.accent }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                <span className="ml-1" style={{ color: b.palette.muted }}>4.9 · 240 avaliações</span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-lg font-bold" style={{ color: b.palette.primary }}>{item.priceLabel}</span>
                <button
                  onClick={() => toast.success(`Simulação: ${item.name} adicionado.`)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold"
                  style={{ background: b.palette.primary, color: b.palette.primaryFg }}
                >
                  Selecionar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center text-sm" style={{ color: b.palette.muted }}>
          Nenhum resultado para essa busca.
        </div>
      )}
    </div>
  );
}
