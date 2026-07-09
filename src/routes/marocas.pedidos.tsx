import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Package } from "lucide-react";
import { useState } from "react";
import { MarocasShell } from "@/components/marocas/MarocasShell";

export const Route = createFileRoute("/marocas/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — Marocas" },
      { name: "description", content: "Consulte histórico, rastreio e status dos seus pedidos Marocas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PedidosPage,
});

function PedidosPage() {
  const [codigo, setCodigo] = useState("");
  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Meus pedidos" }]}>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold">Meus pedidos</h1>
        <p className="text-muted-foreground mt-2">
          Rastreie um pedido pelo código enviado no WhatsApp ou entre para ver seu histórico completo.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (codigo.trim()) window.location.assign(`/marocas/pedidos/${codigo.trim().toUpperCase()}`);
          }}
          className="mt-6 rounded-2xl border p-5"
        >
          <label htmlFor="cod" className="text-sm font-semibold">Rastrear por código</label>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="cod"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex.: MRC123456"
                autoCapitalize="characters"
                className="w-full rounded-md border pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold hover:opacity-90">
              Rastrear
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-dashed p-8 text-center">
          <Package className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-3 font-semibold">Entre para ver seu histórico</p>
          <p className="text-sm text-muted-foreground mt-1">
            Repita pedidos favoritos com 1 clique e acumule benefícios.
          </p>
          <Link to="/marocas/login" className="inline-block mt-4 rounded-md bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
            Entrar
          </Link>
        </div>
      </div>
    </MarocasShell>
  );
}
