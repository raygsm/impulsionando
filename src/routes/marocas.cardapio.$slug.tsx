import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Clock, Minus, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { getMarocasItem, marocasItens, type MarocasItem } from "@/components/marocas/foodMenu";
import { useMarocasCart, formatBRL } from "@/components/marocas/useMarocasCart";

export const Route = createFileRoute("/marocas/cardapio/$slug")({
  loader: ({ params }) => {
    const item = getMarocasItem(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.item.nome} — Marocas` : "Cardápio — Marocas" },
      {
        name: "description",
        content: loaderData
          ? loaderData.item.descricao
          : "Prato do cardápio Marocas.",
      },
      { property: "og:type", content: "product" },
      { property: "og:title", content: loaderData ? loaderData.item.nome : "Cardápio Marocas" },
      { property: "og:image", content: loaderData?.item.imagem },
    ],
    links: [{ rel: "canonical", href: loaderData ? `/marocas/cardapio/${loaderData.item.slug}` : "/marocas/cardapio" }],
  }),
  notFoundComponent: () => (
    <MarocasShell>
      <div className="container mx-auto px-4 md:px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Prato não encontrado</h1>
        <p className="text-muted-foreground mt-2">Ele pode ter saído do cardápio.</p>
        <Link to="/marocas/cardapio" className="inline-block mt-4 underline">Voltar ao cardápio</Link>
      </div>
    </MarocasShell>
  ),
  component: PDPPage,
});

function PDPPage() {
  const { item } = Route.useLoaderData() as { item: MarocasItem };
  const { add } = useMarocasCart();
  const navigate = useNavigate();
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");
  const [selecoes, setSelecoes] = useState<Record<string, string[]>>({});

  const relacionados = useMemo(
    () => marocasItens.filter((i) => i.categoria === item.categoria && i.slug !== item.slug).slice(0, 3),
    [item.slug, item.categoria],
  );

  const toggle = (grupoId: string, opcaoId: string, max?: number) => {
    setSelecoes((prev) => {
      const cur = prev[grupoId] ?? [];
      const has = cur.includes(opcaoId);
      let next: string[];
      if (has) next = cur.filter((x) => x !== opcaoId);
      else if (max === 1) next = [opcaoId];
      else if (max && cur.length >= max) return prev;
      else next = [...cur, opcaoId];
      return { ...prev, [grupoId]: next };
    });
  };

  const adicionaisSelecionados = useMemo(() => {
    const out: { nome: string; preco: number }[] = [];
    (item.adicionais ?? []).forEach((g) => {
      (selecoes[g.id] ?? []).forEach((oid) => {
        const opt = g.opcoes.find((o) => o.id === oid);
        if (opt) out.push({ nome: opt.nome, preco: opt.preco });
      });
    });
    return out;
  }, [item.adicionais, selecoes]);

  const precoUnit = item.precoBase + adicionaisSelecionados.reduce((a, x) => a + x.preco, 0);
  const total = precoUnit * qtd;

  const obrigatoriosOk = (item.adicionais ?? []).every((g) => {
    if (!g.obrigatorio) return true;
    return (selecoes[g.id] ?? []).length >= (g.min ?? 1);
  });

  const handleAdd = (goCart = false) => {
    if (!item.disponivel || !obrigatoriosOk) return;
    add({
      slug: item.slug,
      nome: item.nome,
      precoUnit: item.precoBase,
      qtd,
      adicionais: adicionaisSelecionados,
      observacao: obs || undefined,
    });
    if (goCart) navigate({ to: "/marocas/carrinho" });
  };

  return (
    <MarocasShell breadcrumbs={[
      { label: "Marocas", to: "/marocas" },
      { label: "Cardápio", to: "/marocas/cardapio" },
      { label: item.nome },
    ]}>
      <div className="container mx-auto px-4 md:px-6 py-6">
        <Link to="/marocas/cardapio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar ao cardápio
        </Link>

        <div className="mt-4 grid md:grid-cols-[1fr_1fr] gap-8">
          <div className="rounded-2xl overflow-hidden border bg-muted aspect-[4/3]">
            <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
          </div>

          <div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {item.tags.map((t) => (
                  <span key={t} className="text-[10px] font-bold uppercase tracking-wider bg-muted rounded-full px-2 py-0.5">
                    {t.replace("-", " ")}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-bold">{item.nome}</h1>
            <p className="text-muted-foreground mt-2">{item.descricao}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {item.tempoPreparoMin} min</span>
              {!item.disponivel && <span className="text-red-600 font-semibold">Esgotado hoje</span>}
            </div>
            <div className="text-3xl font-bold mt-4">{formatBRL(item.precoBase)}</div>

            {(item.adicionais ?? []).map((g) => (
              <fieldset key={g.id} className="mt-6 rounded-xl border p-4">
                <legend className="px-2 font-semibold text-sm">
                  {g.titulo}
                  {g.obrigatorio && <span className="text-red-600 ml-1">*</span>}
                  {g.max && g.max > 1 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      (até {g.max})
                    </span>
                  )}
                </legend>
                <ul className="mt-2 space-y-1">
                  {g.opcoes.map((o) => {
                    const active = (selecoes[g.id] ?? []).includes(o.id);
                    return (
                      <li key={o.id}>
                        <label className="flex items-center justify-between gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                          <div className="flex items-center gap-2">
                            <input
                              type={g.max === 1 ? "radio" : "checkbox"}
                              name={g.id}
                              checked={active}
                              onChange={() => toggle(g.id, o.id, g.max)}
                              className="accent-primary"
                            />
                            <span className="text-sm">{o.nome}</span>
                          </div>
                          {o.preco > 0 && <span className="text-sm text-muted-foreground">+ {formatBRL(o.preco)}</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ))}

            <div className="mt-6">
              <label htmlFor="obs" className="block text-sm font-semibold">
                Observações <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                id="obs"
                rows={2}
                value={obs}
                onChange={(e) => setObs(e.target.value.slice(0, 180))}
                placeholder="Ex.: sem cebola, ponto da carne, embalagem separada..."
                className="mt-1 w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="text-[11px] text-muted-foreground mt-1 text-right">{obs.length}/180</div>
            </div>

            {/* Quantidade + CTA */}
            <div className="mt-6 sticky bottom-0 md:static bg-background md:bg-transparent -mx-4 md:mx-0 px-4 md:px-0 py-3 border-t md:border-0 flex items-center gap-3">
              <div className="flex items-center rounded-full border">
                <button
                  onClick={() => setQtd((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-muted rounded-l-full"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 font-semibold w-10 text-center" aria-live="polite">{qtd}</span>
                <button
                  onClick={() => setQtd((q) => Math.min(20, q + 1))}
                  className="p-2 hover:bg-muted rounded-r-full"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                disabled={!item.disponivel || !obrigatoriosOk}
                onClick={() => handleAdd(false)}
                className="flex-1 rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Adicionar · {formatBRL(total)}
              </button>
              <button
                type="button"
                disabled={!item.disponivel || !obrigatoriosOk}
                onClick={() => handleAdd(true)}
                className="hidden sm:inline-flex items-center gap-1 rounded-lg border px-4 py-3 font-semibold hover:bg-muted disabled:opacity-40"
                title="Adicionar e ir para o carrinho"
              >
                <ShoppingBag className="h-4 w-4" /> Ir ao carrinho
              </button>
            </div>
            {!obrigatoriosOk && (
              <p className="mt-2 text-xs text-red-600">Escolha as opções obrigatórias antes de adicionar.</p>
            )}
          </div>
        </div>

        {relacionados.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold">Combina bem</h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              {relacionados.map((r) => (
                <Link
                  key={r.slug}
                  to="/marocas/cardapio/$slug"
                  params={{ slug: r.slug }}
                  className="group rounded-2xl border overflow-hidden bg-card hover:shadow-md transition"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={r.imagem} alt={r.nome} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm">{r.nome}</div>
                    <div className="text-sm font-bold mt-1">{formatBRL(r.precoBase)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </MarocasShell>
  );
}
