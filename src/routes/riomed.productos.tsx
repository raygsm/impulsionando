import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listRiomedPublicProducts,
  listProductCategories,
  getCotacaoBobUsd,
} from "@/lib/riomed-public.functions";
import { addToCart, getOrCreateCart } from "@/lib/riomed-portal.functions";
import { Search, Stethoscope, ShoppingCart, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TOKEN_KEY = "riomed_cart_token";

export const Route = createFileRoute("/riomed/productos")({
  head: () => ({
    meta: [
      { title: "Catálogo Rio Med · Equipamento médico em BOB e USD" },
      { name: "description", content: "Catálogo Rio Med na Bolívia: equipamentos novos e usados para venda e locação, com preços em BOB e USD." },
      { property: "og:title", content: "Catálogo Rio Med" },
      { property: "og:description", content: "Equipamento médico-hospitalar com preços em BOB e USD." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    cat: typeof s.cat === "string" ? s.cat : "",
    cond: (s.cond === "new" || s.cond === "used" ? s.cond : "") as ""|"new"|"used",
    mod: (s.mod === "venta" || s.mod === "alquiler" ? s.mod : "") as ""|"venta"|"alquiler",
  }),
  component: ProductosPage,
});

function fmtBOB(v: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 2 }).format(v || 0);
}
function fmtUSD(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v || 0);
}

function ProductosPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [cat, setCat] = useState(search.cat ?? "");
  const [cond, setCond] = useState<""|"new"|"used">((search.cond as any) ?? "");
  const [mod, setMod] = useState<""|"venta"|"alquiler">((search.mod as any) ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  const list = useServerFn(listRiomedPublicProducts);
  const cats = useServerFn(listProductCategories);
  const cot = useServerFn(getCotacaoBobUsd);
  const ensure = useServerFn(getOrCreateCart);
  const add = useServerFn(addToCart);

  const products = useQuery({
    queryKey: ["riomed-products", q, cat, cond, mod],
    queryFn: () => list({ data: {
      search: q || undefined,
      category: cat || undefined,
      condition: cond || undefined,
      modality: mod || undefined,
      limit: 80,
    } }),
  });
  const categories = useQuery({ queryKey: ["riomed-cats"], queryFn: () => cats() });
  const cotacao = useQuery({ queryKey: ["riomed-cotacao"], queryFn: () => cot(), staleTime: 60_000 });
  const rate = cotacao.data?.rate ?? 6.96;

  const items = products.data?.items ?? [];

  const handleAdd = async (productId: string, modality: "sale"|"rental_monthly", name: string) => {
    setBusy(productId + modality);
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const cart = await ensure({ data: { subdomain: "riomed", sessionToken: token ?? undefined } });
      token = cart.sessionToken;
      if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
      await add({ data: { sessionToken: token, productId, modality, qty: 1 } });
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("riomed:cart-changed"));
      toast.success(`${name} agregado al carrito`);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally { setBusy(null); }
  };

  const appliedCount = useMemo(() => [q, cat, cond, mod].filter(Boolean).length, [q, cat, cond, mod]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Catálogo Rio Med</h1>
          <p className="text-muted-foreground mt-1">Equipamentos médicos novos e usados · venda e locação · preços em BOB e USD.</p>
        </div>
        <div className="text-xs bg-slate-50 border rounded-xl px-3 py-2">
          <div className="font-semibold text-slate-700">Cotação oficial</div>
          <div className="text-slate-600">1 USD ≈ {rate.toFixed(2)} BOB <span className="text-slate-400">({cotacao.data?.source ?? "ref."})</span></div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-2xl p-3 md:p-4 mb-8 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, código o marca…"
            className="flex-1 bg-transparent outline-none py-2 text-sm"
          />
        </div>

        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full border px-3 py-2 text-sm bg-white">
          <option value="">Todas categorías</option>
          {(categories.data?.categories ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="flex rounded-full bg-slate-100 p-1 text-sm">
          {[["","Todos"],["new","Nuevos"],["used","Usados"]].map(([v,l]) => (
            <button key={v} onClick={() => setCond(v as any)}
              className={`px-3 py-1.5 rounded-full font-medium ${cond===v ? "bg-white shadow text-slate-900" : "text-slate-600"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex rounded-full bg-slate-100 p-1 text-sm">
          {[["","Comprar+Alquilar"],["venta","Venta"],["alquiler","Alquiler"]].map(([v,l]) => (
            <button key={v} onClick={() => setMod(v as any)}
              className={`px-3 py-1.5 rounded-full font-medium ${mod===v ? "bg-white shadow text-slate-900" : "text-slate-600"}`}>
              {l}
            </button>
          ))}
        </div>

        {appliedCount > 0 && (
          <button onClick={() => { setQ(""); setCat(""); setCond(""); setMod(""); }} className="text-xs text-slate-500 underline ml-auto">
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p: any) => {
          const sale = Number(p.price_sale ?? 0);
          const monthly = Number(p.price_rental_monthly ?? 0);
          const condition = p.metadata?.condition ?? "new";
          const allowSale = p.modality === "venta" || p.modality === "ambos";
          const allowRent = p.modality === "alquiler" || p.modality === "ambos";
          return (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden border hover:shadow-xl transition-all flex flex-col">
              <div className="aspect-square bg-slate-50 flex items-center justify-center relative">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="object-cover w-full h-full" loading="lazy" />
                  : <Stethoscope className="h-12 w-12 text-slate-300" />}
                <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${condition==="used" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {condition === "used" ? "Usado" : "Nuevo"}
                </span>
                {p.category && (
                  <span className="absolute top-2 right-2 text-[10px] font-medium bg-white/90 border rounded-full px-2 py-1 text-slate-600 flex items-center gap-1">
                    <Tag className="h-3 w-3" />{p.category}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-[11px] text-slate-400 font-mono">{p.sku ?? "—"}</div>
                <div className="font-semibold text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                <div className="text-xs text-slate-500 line-clamp-2 min-h-[2rem] mb-3">{p.description ?? ""}</div>

                <div className="mt-auto space-y-2">
                  {allowSale && sale > 0 && (
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">Venta</div>
                        <div className="font-bold text-slate-900">{fmtBOB(sale)}</div>
                        <div className="text-[11px] text-slate-500">≈ {fmtUSD(sale / rate)}</div>
                      </div>
                      <button
                        disabled={busy === p.id + "sale"}
                        onClick={() => handleAdd(p.id, "sale", p.name)}
                        className="text-white text-xs font-semibold rounded-full px-3 py-2 flex items-center gap-1 shadow hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--riomed-primary, #0B3D74)" }}
                      >
                        {busy === p.id + "sale" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />}
                        Comprar
                      </button>
                    </div>
                  )}

                  {allowRent && monthly > 0 && (
                    <div className="flex items-baseline justify-between border-t pt-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">Alquiler/mes</div>
                        <div className="font-semibold text-slate-900">{fmtBOB(monthly)}</div>
                        <div className="text-[11px] text-slate-500">≈ {fmtUSD(monthly / rate)}</div>
                      </div>
                      <button
                        disabled={busy === p.id + "rental_monthly"}
                        onClick={() => handleAdd(p.id, "rental_monthly", p.name)}
                        className="text-white text-xs font-semibold rounded-full px-3 py-2 flex items-center gap-1 shadow hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--riomed-accent, #0AB1A0)" }}
                      >
                        {busy === p.id + "rental_monthly" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />}
                        Alquilar
                      </button>
                    </div>
                  )}

                  {!allowSale && !allowRent && (
                    <Link to="/riomed/cotizar" search={{ producto: p.sku } as any}
                      className="block w-full text-center text-xs rounded-full py-2 text-white font-semibold"
                      style={{ background: "var(--riomed-primary, #0B3D74)" }}>
                      Solicitar cotización
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!products.isLoading && items.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-16">
            No encontramos productos con esos filtros.
          </div>
        )}
        {products.isLoading && (
          <div className="col-span-full text-center text-slate-500 py-16 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo…
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-center">
        <button onClick={() => navigate({ to: "/riomed/carrinho" })}
          className="rounded-full px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
          style={{ background: "var(--riomed-primary, #0B3D74)" }}>
          <ShoppingCart className="h-4 w-4" /> Ver carrito
        </button>
      </div>
    </div>
  );
}
