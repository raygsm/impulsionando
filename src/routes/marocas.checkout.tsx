import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { useMarocasCart, formatBRL } from "@/components/marocas/useMarocasCart";

export const Route = createFileRoute("/marocas/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Marocas" },
      { name: "description", content: "Finalize seu pedido Marocas com PIX, cartão ou pagamento na retirada." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Pagamento = "pix" | "cartao" | "presencial";

function CheckoutPage() {
  const navigate = useNavigate();
  const { state, subtotal, clear } = useMarocasCart();
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    troco: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const taxa = state.modo === "delivery" ? 8.9 : 0;
  const total = subtotal + taxa;

  const canSubmit =
    state.linhas.length > 0 &&
    form.nome.trim().length > 2 &&
    form.telefone.trim().length >= 10 &&
    (state.modo !== "delivery" || (form.endereco.trim() && form.numero.trim() && form.bairro.trim()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setEnviando(true);
    // TODO Codex: integrar com createServerFn para criar o pedido e cobrar via PIX/cartão real.
    setTimeout(() => {
      const id = "MRC" + Math.floor(Math.random() * 900000 + 100000);
      clear();
      setSucesso(id);
      setEnviando(false);
    }, 900);
  };

  if (sucesso) {
    return (
      <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Pedido confirmado" }]}>
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-lg text-center">
          <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-600" />
          <h1 className="text-3xl font-bold mt-4">Pedido recebido!</h1>
          <p className="text-muted-foreground mt-2">
            Código <span className="font-mono font-semibold text-foreground">{sucesso}</span>.
            Acompanhe o preparo em tempo real.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/marocas/pedidos/$id" params={{ id: sucesso }} className="rounded-lg bg-primary text-primary-foreground px-5 py-3 font-semibold">
              Rastrear pedido
            </Link>
            <Link to="/marocas/cardapio" className="rounded-lg border px-5 py-3 font-semibold">
              Pedir mais
            </Link>
          </div>
        </div>
      </MarocasShell>
    );
  }

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Carrinho", to: "/marocas/carrinho" }, { label: "Checkout" }]}>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Link to="/marocas/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>
        <h1 className="text-3xl font-bold mt-3">Finalizar pedido</h1>

        {state.linhas.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
            <p className="font-semibold">Nenhum item no carrinho</p>
            <Link to="/marocas/cardapio" className="mt-4 inline-block underline text-primary">Ver cardápio</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-6">
              {/* Contato */}
              <section className="rounded-2xl border p-5">
                <h2 className="font-semibold">Contato</h2>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <label className="block">
                    <span className="text-xs font-medium">Nome</span>
                    <input required autoComplete="name" value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium">Telefone / WhatsApp</span>
                    <input required inputMode="tel" autoComplete="tel" value={form.telefone}
                      onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                      placeholder="(21) 9 0000-0000"
                      className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                </div>
              </section>

              {/* Entrega */}
              {state.modo === "delivery" && (
                <section className="rounded-2xl border p-5">
                  <h2 className="font-semibold">Endereço de entrega</h2>
                  <div className="grid sm:grid-cols-[1fr_120px] gap-3 mt-3">
                    <label className="block">
                      <span className="text-xs font-medium">Endereço</span>
                      <input required autoComplete="street-address" value={form.endereco}
                        onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                        className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium">Número</span>
                      <input required inputMode="numeric" value={form.numero}
                        onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                        className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <label className="block">
                      <span className="text-xs font-medium">Complemento</span>
                      <input value={form.complemento}
                        onChange={(e) => setForm((f) => ({ ...f, complemento: e.target.value }))}
                        className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium">Bairro</span>
                      <input required value={form.bairro}
                        onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
                        className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </label>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Taxa e tempo estimados por bairro. Confirmação em tempo real após envio.
                  </p>
                </section>
              )}

              {state.modo === "salao" && (
                <section className="rounded-2xl border p-5">
                  <h2 className="font-semibold">Mesa / Pulseira</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao entrar no salão, informe sua mesa. O módulo de comandas por pulseira numerada aparecerá aqui quando ativado.
                  </p>
                </section>
              )}

              {/* Pagamento */}
              <section className="rounded-2xl border p-5">
                <h2 className="font-semibold">Pagamento</h2>
                <div className="grid sm:grid-cols-3 gap-2 mt-3">
                  {[
                    { id: "pix", label: "PIX", d: "Aprovação em segundos" },
                    { id: "cartao", label: "Cartão", d: "Crédito ou débito" },
                    { id: "presencial", label: state.modo === "delivery" ? "Na entrega" : "No local", d: "Presencial" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPagamento(p.id as Pagamento)}
                      aria-pressed={pagamento === p.id}
                      className={`rounded-lg border p-3 text-left ${pagamento === p.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                    >
                      <div className="font-semibold text-sm">{p.label}</div>
                      <div className="text-[11px] text-muted-foreground">{p.d}</div>
                    </button>
                  ))}
                </div>
                {pagamento === "presencial" && state.modo === "delivery" && (
                  <label className="block mt-3">
                    <span className="text-xs font-medium">Precisa de troco para?</span>
                    <input inputMode="numeric" value={form.troco}
                      onChange={(e) => setForm((f) => ({ ...f, troco: e.target.value }))}
                      placeholder="Ex.: R$ 100"
                      className="mt-1 w-full sm:w-56 rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                )}
                <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Ambiente de pagamento protegido. Nenhum dado de cartão fica salvo.
                </p>
              </section>
            </div>

            {/* Resumo */}
            <aside className="rounded-2xl border p-5 h-fit lg:sticky lg:top-24 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo do pedido</div>
              <ul className="text-sm space-y-2 max-h-64 overflow-auto">
                {state.linhas.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      <span className="font-medium">{l.qtd}× {l.nome}</span>
                      {l.adicionais.length > 0 && (
                        <span className="block text-[11px] text-muted-foreground truncate">
                          {l.adicionais.map((a) => a.nome).join(", ")}
                        </span>
                      )}
                    </span>
                    <span className="font-medium shrink-0">
                      {formatBRL((l.precoUnit + l.adicionais.reduce((a, x) => a + x.preco, 0)) * l.qtd)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="text-sm space-y-1.5 pt-3 border-t">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(subtotal)}</dd></div>
                <div className="flex justify-between"><dt>Entrega</dt><dd>{state.modo === "delivery" ? formatBRL(taxa) : "—"}</dd></div>
                <div className="flex justify-between text-base font-bold pt-2 border-t"><dt>Total</dt><dd>{formatBRL(total)}</dd></div>
              </dl>
              <button
                type="submit"
                disabled={!canSubmit || enviando}
                className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {enviando ? "Enviando..." : `Confirmar pedido · ${formatBRL(total)}`}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Ao confirmar, você concorda com os termos de uso e a política de privacidade.
              </p>
            </aside>
          </form>
        )}
      </div>
    </MarocasShell>
  );
}
