import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, Truck, Store, UtensilsCrossed } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { useMarocasCart, formatBRL } from "@/components/marocas/useMarocasCart";

export const Route = createFileRoute("/marocas/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Marocas" },
      { name: "description", content: "Revise seus pedidos antes de finalizar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CarrinhoPage,
});

function CarrinhoPage() {
  const { state, setQtd, remove, setModo, subtotal, totalItens } = useMarocasCart();
  const taxa = state.modo === "delivery" ? 8.9 : 0;
  const total = subtotal + taxa;

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Carrinho" }]}>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold">Seu carrinho</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {totalItens} {totalItens === 1 ? "item" : "itens"}
        </p>

        {state.linhas.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-4 font-semibold">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground mt-1">Comece pelo cardápio.</p>
            <Link to="/marocas/cardapio" className="inline-block mt-6 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold">
              Ver cardápio
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Linhas */}
            <ul className="space-y-3">
              {state.linhas.map((l) => (
                <li key={l.id} className="rounded-xl border p-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{l.nome}</div>
                    {l.adicionais.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {l.adicionais.map((a, i) => (
                          <li key={i}>+ {a.nome}{a.preco > 0 ? ` (${formatBRL(a.preco)})` : ""}</li>
                        ))}
                      </ul>
                    )}
                    {l.observacao && (
                      <p className="text-xs italic text-muted-foreground mt-1">Obs: {l.observacao}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center rounded-full border">
                        <button onClick={() => setQtd(l.id, l.qtd - 1)} className="p-1.5 hover:bg-muted rounded-l-full" aria-label="Diminuir">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-sm font-semibold w-8 text-center">{l.qtd}</span>
                        <button onClick={() => setQtd(l.id, l.qtd + 1)} className="p-1.5 hover:bg-muted rounded-r-full" aria-label="Aumentar">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(l.id)}
                        className="text-xs text-muted-foreground hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold">
                      {formatBRL((l.precoUnit + l.adicionais.reduce((a, x) => a + x.preco, 0)) * l.qtd)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Resumo */}
            <aside className="rounded-2xl border p-5 h-fit lg:sticky lg:top-24 space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Modo de entrega</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "delivery", label: "Delivery", i: <Truck className="h-4 w-4" /> },
                    { id: "retirada", label: "Retirada", i: <Store className="h-4 w-4" /> },
                    { id: "salao", label: "No salão", i: <UtensilsCrossed className="h-4 w-4" /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModo(m.id as any)}
                      aria-pressed={state.modo === m.id}
                      className={`rounded-lg border p-3 flex flex-col items-center gap-1 ${state.modo === m.id ? "border-primary bg-primary/5 text-primary font-semibold" : "hover:bg-muted"}`}
                    >
                      {m.i} {m.label}
                    </button>
                  ))}
                </div>
                {state.modo === "salao" && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Módulo de comandas por pulseira numerada será solicitado ao entrar no salão.
                  </p>
                )}
              </div>

              <dl className="text-sm space-y-2">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-medium">{formatBRL(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Taxa de entrega</dt>
                  <dd className="font-medium">{state.modo === "delivery" ? formatBRL(taxa) : "—"}</dd>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <dt>Total</dt>
                  <dd>{formatBRL(total)}</dd>
                </div>
              </dl>

              <Link
                to="/marocas/checkout"
                className="block text-center rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90"
              >
                Ir para o pagamento
              </Link>
              <Link to="/marocas/cardapio" className="block text-center text-sm text-muted-foreground hover:text-primary">
                ← Continuar pedindo
              </Link>
            </aside>
          </div>
        )}
      </div>
    </MarocasShell>
  );
}
