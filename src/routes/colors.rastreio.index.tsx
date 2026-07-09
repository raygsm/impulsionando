import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Package, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/colors/rastreio/")({
  head: () => ({
    meta: [
      { title: "Rastrear pedido — Colors Saúde" },
      { name: "description", content: "Acompanhe seu pedido Colors Saúde em tempo real. Entregas Correios e Melhor Envio." },
    ],
    links: [{ rel: "canonical", href: "https://colors.impulsionando.com.br/colors/rastreio" }],
  }),
  component: RastreioSearchPage,
});

function RastreioSearchPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    navigate({ to: "/colors/rastreio/$codigo", params: { codigo: c } });
  }

  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      <header className="border-b border-white/10 bg-[#050a08]/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <a href="/colors" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
            <span className="text-lg font-black tracking-tight">colors<span className="text-emerald-400">.</span></span>
          </a>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
          <Package className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-center text-4xl font-black leading-tight sm:text-5xl">
          Rastreie seu pedido <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">sem sair da Colors.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-white/70">
          Consultamos direto Correios e Melhor Envio. Cole o código de rastreio ou o número do pedido.
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3">
            <Search className="h-5 w-5 text-white/50" />
            <input
              value={code} onChange={(e) => setCode(e.target.value)} autoFocus
              placeholder="Ex.: ME1234567BR ou #COL-1042"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
          <button type="submit"
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3 text-sm font-black text-black shadow-lg shadow-emerald-500/40 hover:scale-[1.01]">
            Rastrear agora
          </button>
        </form>

        <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-white/50">
          <ShieldCheck className="h-3.5 w-3.5" /> Você não precisa estar logado para rastrear.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { t: "Correios", d: "Rastreamento oficial integrado à Colors." },
            { t: "Melhor Envio", d: "Consulta em tempo real de status e trânsito." },
            { t: "Suporte humano", d: "Atendimento no WhatsApp para qualquer entrega." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-bold">{c.t}</p>
              <p className="mt-1 text-xs text-white/60">{c.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
