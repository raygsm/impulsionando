import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Star, Coins, Users, Cake, MessageCircle, CheckCircle2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/foodservice/fidelidade")({
  head: () => ({
    meta: [
      { title: "Programa de Fidelidade & Cashback — Casa Impulsiona" },
      { name: "description", content: "Ganhe cashback a cada pedido, cupons personalizados no WhatsApp, sobremesa no aniversário e vantagens exclusivas do clube Impulsionando." },
      { property: "og:title", content: "Clube Casa Impulsiona — Fidelidade e cashback" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/fidelidade" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/fidelidade" }],
  }),
  component: FidelidadePage,
});

const NIVEIS = [
  { nome: "Bronze", faixa: "R$ 0 - R$ 500 / mês", cashback: "2%", cor: "bg-amber-700", vantagens: ["Cashback 2%", "Cupom aniversário", "Fila prioritária delivery"] },
  { nome: "Prata", faixa: "R$ 500 - R$ 1.500", cashback: "5%", cor: "bg-slate-400", vantagens: ["Cashback 5%", "Sobremesa cortesia mensal", "Frete grátis acima R$ 60", "Reserva com 24h de antecedência"] },
  { nome: "Ouro", faixa: "acima de R$ 1.500", cashback: "8%", cor: "bg-yellow-500", vantagens: ["Cashback 8%", "Sobremesa cortesia semanal", "Frete sempre grátis", "Acesso a menu degustação", "Convite para eventos exclusivos"] },
];

function FidelidadePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-[color:var(--fs-brick)] to-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Clube Casa Impulsiona</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2">Coma bem, junte pontos e ganhe cashback.</h1>
          <p className="mt-4 text-white/85 max-w-2xl">
            Fidelidade sem cartão físico. A cada pedido você acumula pontos e cashback, recebe
            cupons personalizados no WhatsApp e sobe de nível automaticamente.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/foodservice/cardapio" className="bg-[color:var(--fs-amber)] text-white px-6 py-3 rounded-md font-semibold hover:opacity-90">
              Fazer meu primeiro pedido
            </Link>
            <a href="https://wa.me/5521999990000?text=Quero%20entrar%20no%20clube%20Casa%20Impulsiona" target="_blank" rel="noopener" className="border border-white/30 px-6 py-3 rounded-md font-semibold hover:bg-white/10 inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Entrar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="font-serif text-3xl font-bold text-center">Como funciona</h2>
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          {[
            { i: Users, t: "1. Cadastre-se", d: "Rápido, pelo WhatsApp ou no salão. Só CPF e telefone." },
            { i: Coins, t: "2. Acumule pontos", d: "Cada R$ 1 gasto vira 1 ponto. 100 pts = R$ 5 de crédito." },
            { i: TrendingUp, t: "3. Suba de nível", d: "Bronze, Prata e Ouro com vantagens crescentes." },
            { i: Gift, t: "4. Use as recompensas", d: "Cashback, sobremesas, cupons e convites exclusivos." },
          ].map((s) => (
            <div key={s.t} className="rounded-xl bg-white border border-black/5 p-6">
              <div className="h-10 w-10 rounded-md bg-[color:var(--fs-cream)] text-[color:var(--fs-brick)] grid place-items-center">
                <s.i className="h-5 w-5" />
              </div>
              <div className="font-serif font-bold mt-3">{s.t}</div>
              <p className="text-sm text-black/60 mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Níveis */}
      <section className="bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <h2 className="font-serif text-3xl font-bold text-center">Níveis do clube</h2>
          <p className="text-sm text-center text-black/60 mt-2">Você sobe automaticamente com base no seu consumo mensal.</p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {NIVEIS.map((n) => (
              <div key={n.nome} className="rounded-2xl bg-[color:var(--fs-cream)] border border-black/5 overflow-hidden">
                <div className={`${n.cor} text-white px-6 py-4`}>
                  <div className="text-xs uppercase tracking-widest opacity-80">Nível</div>
                  <div className="font-serif text-2xl font-bold">{n.nome}</div>
                  <div className="text-xs mt-1 opacity-90">{n.faixa}</div>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-bold text-[color:var(--fs-brick)]">{n.cashback}</div>
                  <div className="text-xs text-black/60">de cashback em todo pedido</div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {n.vantagens.map((v) => (
                      <li key={v} className="inline-flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vantagens extras */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="font-serif text-3xl font-bold">Vantagens que todo membro tem</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            { i: Cake, t: "Sobremesa no aniversário", d: "Cortesia no mês do seu aniversário, no salão ou delivery." },
            { i: MessageCircle, t: "Cupons no WhatsApp", d: "Ofertas personalizadas pelo Impulsionito com base no seu histórico." },
            { i: Star, t: "Indicações rendem", d: "Indique um amigo e ganhem juntos R$ 25 de crédito." },
            { i: Users, t: "Casal & família", d: "Pontos podem ser somados com CPF do parceiro ou familiar." },
            { i: Gift, t: "Sorteios mensais", d: "Jantar completo para 2, cestas, kits de vinho e mais." },
            { i: Coins, t: "Crédito não expira", d: "Enquanto você pedir ao menos 1x a cada 90 dias." },
          ].map((v) => (
            <div key={v.t} className="rounded-xl bg-white border border-black/5 p-5">
              <v.i className="h-5 w-5 text-[color:var(--fs-amber)]" />
              <div className="font-serif font-bold mt-2">{v.t}</div>
              <p className="text-sm text-black/60 mt-1">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[color:var(--fs-ink)] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <h2 className="font-serif text-3xl font-bold">Pronto para começar a acumular?</h2>
          <p className="mt-3 text-white/80">Grátis. Sem mensalidade. Cadastro em 30 segundos.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5521999990000" target="_blank" rel="noopener" className="bg-[color:var(--fs-amber)] text-white px-6 py-3 rounded-md font-semibold hover:opacity-90 inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Entrar no clube
            </a>
            <Link to="/foodservice/promocoes" className="border border-white/30 px-6 py-3 rounded-md font-semibold hover:bg-white/10">
              Ver cupons ativos
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
