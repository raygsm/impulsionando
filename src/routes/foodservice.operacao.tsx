import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, ChefHat, ClipboardList, Bike, Store, Package, Clock, Users, TrendingUp, CheckCircle2, AlertCircle, Circle } from "lucide-react";

export const Route = createFileRoute("/foodservice/operacao")({
  head: () => ({
    meta: [
      { title: "Operação da Casa — Comandas, Cozinha, Delivery — Casa Impulsiona" },
      { name: "description", content: "Demonstração da operação Casa Impulsiona: comandas digitais, mesas por QR code, KDS de cozinha, balcão, delivery próprio, motoboys e status de pedidos em tempo real." },
      { property: "og:title", content: "Operação da Casa (demo) — Casa Impulsiona" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/operacao" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/operacao" }],
  }),
  component: OperacaoPage,
});

const MESAS = [
  { id: 1, ocupada: true, pessoas: 4, tempo: "42min", ticket: 186 },
  { id: 2, ocupada: false, pessoas: 0, tempo: "-", ticket: 0 },
  { id: 3, ocupada: true, pessoas: 2, tempo: "18min", ticket: 78 },
  { id: 4, ocupada: true, pessoas: 6, tempo: "1h05", ticket: 412 },
  { id: 5, ocupada: false, pessoas: 0, tempo: "-", ticket: 0 },
  { id: 6, ocupada: true, pessoas: 3, tempo: "24min", ticket: 145 },
  { id: 7, ocupada: true, pessoas: 2, tempo: "8min", ticket: 42 },
  { id: 8, ocupada: false, pessoas: 0, tempo: "-", ticket: 0 },
];

const KDS = [
  { id: "#2418", status: "cozinhando", mesa: "Delivery", tempo: "6min", itens: ["Impulsa Burger", "Batata rústica", "IPA 500ml"] },
  { id: "#2417", status: "pronto", mesa: "Balcão", tempo: "0min", itens: ["Pizza Margherita"] },
  { id: "#2416", status: "cozinhando", mesa: "Mesa 4", tempo: "12min", itens: ["Risoto camarão", "Buddha Bowl", "2× Chianti"] },
  { id: "#2415", status: "aguardando", mesa: "Mesa 6", tempo: "2min", itens: ["Burrata", "Bolinho bacalhau"] },
];

const MOTOBOYS = [
  { nome: "Alex", veiculo: "Moto CG 160", status: "em rota", pedidos: 1, previsao: "14min" },
  { nome: "Juliana", veiculo: "Bike elétrica", status: "disponível", pedidos: 0, previsao: "-" },
  { nome: "Ricardo", veiculo: "Moto Biz 125", status: "em rota", pedidos: 2, previsao: "22min" },
  { nome: "Beatriz", veiculo: "Bike", status: "retornando", pedidos: 0, previsao: "-" },
];

function OperacaoPage() {
  return (
    <>
      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Operação · demonstração</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">A casa inteira em um único painel.</h1>
          <p className="mt-3 text-white/85 max-w-3xl">
            Comandas, mesas, QR code, cozinha, balcão, delivery próprio, motoboys e histórico de pedidos —
            unificados no Core Impulsionando. Esta é uma <strong>prévia visual</strong> do painel operacional
            que a equipe da casa acessa; a plataforma de produção usa dados em tempo real.
          </p>
        </div>
      </section>

      {/* KPIs */}
      <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { i: TrendingUp, t: "Faturamento hoje", v: "R$ 4.892", s: "+18% vs ontem" },
          { i: ClipboardList, t: "Pedidos ativos", v: "12", s: "3 cozinha · 4 delivery · 5 mesas" },
          { i: Clock, t: "Tempo médio delivery", v: "38 min", s: "meta 45 min" },
          { i: Users, t: "Ocupação salão", v: "62%", s: "26/42 mesas" },
        ].map((k) => (
          <div key={k.t} className="rounded-xl bg-white border border-black/5 p-5">
            <k.i className="h-5 w-5 text-[color:var(--fs-amber)]" />
            <div className="text-xs text-black/60 mt-2">{k.t}</div>
            <div className="font-serif text-2xl font-bold mt-1">{k.v}</div>
            <div className="text-[10px] text-black/50 mt-1">{k.s}</div>
          </div>
        ))}
      </section>

      {/* Mesas */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold">Mapa de mesas</h2>
            <p className="text-sm text-black/60">Comandas digitais abertas por QR code na mesa.</p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1"><Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Livre</span>
            <span className="inline-flex items-center gap-1"><Circle className="h-3 w-3 fill-amber-500 text-amber-500" /> Ocupada</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {MESAS.map((m) => (
            <div key={m.id} className={`rounded-xl border p-4 ${m.ocupada ? "bg-white border-[color:var(--fs-amber)]/40" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold">Mesa {m.id}</span>
                <QrCode className="h-4 w-4 text-black/40" />
              </div>
              {m.ocupada ? (
                <div className="mt-3 space-y-1 text-sm">
                  <div className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {m.pessoas} pessoas</div>
                  <div className="inline-flex items-center gap-1 text-black/60"><Clock className="h-3 w-3" /> {m.tempo}</div>
                  <div className="font-bold text-[color:var(--fs-brick)] mt-1">R$ {m.ticket.toFixed(2).replace(".", ",")}</div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-emerald-700 font-semibold">Livre</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* KDS Cozinha */}
      <section className="bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl font-bold inline-flex items-center gap-2"><ChefHat className="h-5 w-5 text-[color:var(--fs-brick)]" /> Cozinha (KDS)</h2>
          <p className="text-sm text-black/60">Pedidos em preparo, tempos e semáforo de atraso.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {KDS.map((k) => {
              const cor = k.status === "pronto" ? "border-emerald-400 bg-emerald-50" : k.status === "cozinhando" ? "border-amber-400 bg-amber-50" : "border-black/10 bg-white";
              const icon = k.status === "pronto" ? CheckCircle2 : k.status === "cozinhando" ? AlertCircle : Clock;
              const Icon = icon;
              return (
                <div key={k.id} className={`rounded-xl border-2 p-4 ${cor}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{k.id}</span>
                    <span className="text-xs font-semibold inline-flex items-center gap-1"><Icon className="h-3 w-3" /> {k.status}</span>
                  </div>
                  <div className="text-xs text-black/60 mt-1">{k.mesa} · há {k.tempo}</div>
                  <ul className="mt-3 text-sm space-y-1">
                    {k.itens.map((i) => <li key={i}>· {i}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Delivery + Motoboys */}
      <section className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-black/5 p-6">
          <h2 className="font-serif text-2xl font-bold inline-flex items-center gap-2"><Bike className="h-5 w-5 text-[color:var(--fs-brick)]" /> Frota de entregadores</h2>
          <p className="text-sm text-black/60">Motos, bicicletas e rastreamento ao vivo.</p>
          <div className="mt-5 space-y-3">
            {MOTOBOYS.map((m) => (
              <div key={m.nome} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[color:var(--fs-cream)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[color:var(--fs-brick)] text-white grid place-items-center font-bold text-sm">
                    {m.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{m.nome}</div>
                    <div className="text-xs text-black/60">{m.veiculo}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className={`font-bold ${m.status === "disponível" ? "text-emerald-700" : m.status === "em rota" ? "text-amber-700" : "text-black/60"}`}>
                    {m.status}
                  </div>
                  <div className="text-black/60">{m.pedidos} pedidos · {m.previsao}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-black/5 p-6">
          <h2 className="font-serif text-2xl font-bold inline-flex items-center gap-2"><Store className="h-5 w-5 text-[color:var(--fs-brick)]" /> Balcão & retirada</h2>
          <p className="text-sm text-black/60">Pedidos prontos aguardando cliente.</p>
          <div className="mt-5 space-y-3">
            {[
              { id: "#2417", cliente: "Marina S.", itens: 2, pronto: "há 3min" },
              { id: "#2411", cliente: "João P.", itens: 4, pronto: "há 7min" },
              { id: "#2408", cliente: "Carlos M.", itens: 1, pronto: "há 12min" },
            ].map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div>
                  <div className="font-bold text-sm">{p.id} · {p.cliente}</div>
                  <div className="text-xs text-black/60">{p.itens} itens</div>
                </div>
                <div className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                  <Package className="h-3 w-3" /> Pronto {p.pronto}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Powered by Impulsionando</p>
          <h2 className="font-serif text-3xl font-bold mt-2">
            Toda essa operação, com um só Core.
          </h2>
          <p className="mt-3 text-white/80 max-w-2xl mx-auto">
            Comandas, cozinha, balcão, delivery, motoboys, CRM, fidelidade, cupons e financeiro
            unificados no Ecossistema Impulsionando — sem sistema paralelo, sem integração frágil.
          </p>
          <Link to="/foodservice/crm" className="mt-6 inline-flex items-center gap-2 bg-[color:var(--fs-amber)] text-white px-6 py-3 rounded-md font-semibold hover:opacity-90">
            Ver CRM & Impulsionito
          </Link>
        </div>
      </section>
    </>
  );
}
