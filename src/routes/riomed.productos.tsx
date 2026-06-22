import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listRiomedPublicProducts } from "@/lib/riomed-public.functions";
import { Search, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/riomed/productos")({
  head: () => ({
    meta: [
      { title: "Productos — RioMed" },
      { name: "description", content: "Catálogo de equipamiento médico-hospitalario RioMed." },
      { property: "og:title", content: "Productos RioMed" },
      { property: "og:description", content: "Catálogo de equipamiento médico-hospitalario." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  component: ProductosPage,
});

function ProductosPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const list = useServerFn(listRiomedPublicProducts);
  const products = useQuery({ queryKey: ["riomed-products", q], queryFn: () => list({ data: { search: q || undefined, limit: 60 } }) });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Productos</h1>
      <p className="text-muted-foreground mb-6">Buscá por nombre, código o marca.</p>

      <form className="flex items-center gap-2 bg-white border rounded-full p-2 max-w-xl mb-8" onSubmit={(e) => e.preventDefault()}>
        <Search className="h-5 w-5 text-slate-400 ml-2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Concentrador, cama hospitalaria, monitor…" className="flex-1 bg-transparent outline-none px-2 py-2" />
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(products.data?.items ?? []).map((p: any) => (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-slate-100 flex items-center justify-center">
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="object-cover w-full h-full" />
                : <Stethoscope className="h-12 w-12 text-slate-300" />}
            </div>
            <div className="p-4">
              <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
              <div className="font-semibold text-sm line-clamp-2 mb-1 h-10">{p.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 h-8">{p.description}</div>
              <div className="flex gap-2 mt-3">
                <Link to="/riomed/cotizar" search={{ producto: p.sku } as any} className="flex-1 text-center text-xs rounded-full py-2 text-white font-semibold" style={{ background: "var(--riomed-primary, #0E7C66)" }}>
                  Cotizar
                </Link>
              </div>
            </div>
          </div>
        ))}
        {!products.data?.items?.length && !products.isLoading && (
          <div className="col-span-full text-center text-muted-foreground py-10">No encontramos productos.</div>
        )}
      </div>
    </div>
  );
}
