import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Cake, ShoppingCart, Star, Zap, Sparkles, Users, TrendingUp, Bot, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/foodservice/crm")({
  head: () => ({
    meta: [
      { title: "CRM, Automações e Impulsionito — Casa Impulsiona" },
      { name: "description", content: "Campanhas WhatsApp, aniversariantes, régua de recompra, carrinho abandonado, pesquisas de satisfação e recomendações contextuais do agente Impulsionito." },
      { property: "og:title", content: "CRM & Impulsionito — Casa Impulsiona" },
      { property: "og:url", content: "https://impulsionando.com.br/foodservice/crm" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/foodservice/crm" }],
  }),
  component: CrmPage,
});

function CrmPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-[color:var(--fs-brick)] to-[color:var(--fs-ink)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">CRM & Impulsionito · demonstração</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2 max-w-3xl">
            O relacionamento com o cliente, guiado por IA.
          </h1>
          <p className="mt-4 text-white/85 max-w-3xl">
            Campanhas WhatsApp, réguas automáticas, aniversariantes, recompra, carrinho abandonado
            e pesquisas — orquestradas por N8N e enriquecidas pelo agente <strong className="text-[color:var(--fs-amber)]">Impulsionito</strong>,
            que recomenda pratos e ofertas por perfil, dieta e ocasião.
          </p>
        </div>
      </section>

      {/* KPIs de relacionamento */}
      <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { i: Users, t: "Base ativa", v: "3.842 clientes", s: "+128 este mês" },
          { i: MessageCircle, t: "Taxa de resposta WhatsApp", v: "87%", s: "média 4 min" },
          { i: TrendingUp, t: "Recompra em 30d", v: "42%", s: "+6 p.p. após régua" },
          { i: Star, t: "NPS", v: "72", s: "excelente" },
        ].map((k) => (
          <div key={k.t} className="rounded-xl bg-white border border-black/5 p-5">
            <k.i className="h-5 w-5 text-[color:var(--fs-amber)]" />
            <div className="text-xs text-black/60 mt-2">{k.t}</div>
            <div className="font-serif text-2xl font-bold mt-1">{k.v}</div>
            <div className="text-[10px] text-black/50 mt-1">{k.s}</div>
          </div>
        ))}
      </section>

      {/* Automações ativas */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="font-serif text-2xl font-bold">Réguas e automações ativas</h2>
        <p className="text-sm text-black/60">Orquestradas por N8N via WhatsApp Business API.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[
            { i: Cake, t: "Aniversariantes", d: "Cupom de sobremesa grátis 7 dias antes do aniversário.", stats: "128 disparos/mês · 44% conversão" },
            { i: ShoppingCart, t: "Carrinho abandonado", d: "Mensagem em 30min oferecendo frete grátis para retomar o pedido.", stats: "312 disparos/mês · 28% recuperação" },
            { i: Zap, t: "Régua de recompra", d: "Cliente sem pedido há 21 dias recebe cupom personalizado pelo Impulsionito.", stats: "486 disparos/mês · 22% conversão" },
            { i: Star, t: "Pesquisa NPS pós-pedido", d: "Enviada 2h após entrega. Notas <7 abrem ticket automático.", stats: "1.842 disparos/mês · NPS 72" },
            { i: MessageCircle, t: "Confirmação de reserva", d: "Confirma reserva 24h e 2h antes, com opção de reagendar.", stats: "94 disparos/mês · 96% comparecimento" },
            { i: Sparkles, t: "Happy Hour do dia", d: "Notifica clube Prata+ sobre happy hour do dia com sugestão do Impulsionito.", stats: "428 disparos/mês · 31% conversão" },
          ].map((a) => (
            <div key={a.t} className="rounded-xl bg-white border border-black/5 p-5">
              <div className="h-9 w-9 rounded-md bg-[color:var(--fs-cream)] text-[color:var(--fs-brick)] grid place-items-center">
                <a.i className="h-4 w-4" />
              </div>
              <div className="font-serif font-bold mt-3">{a.t}</div>
              <p className="text-sm text-black/60 mt-1">{a.d}</p>
              <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded px-2 py-1 inline-block">{a.stats}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Impulsionito */}
      <section className="bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="rounded-2xl bg-gradient-to-br from-[color:var(--fs-ink)] to-[color:var(--fs-brick)] text-white p-8 md:p-12">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[color:var(--fs-amber)] text-white grid place-items-center shrink-0">
                <Bot className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[color:var(--fs-amber)] font-semibold">Agente IA · Ecossistema Impulsionando</p>
                <h2 className="font-serif text-3xl font-bold mt-2">Impulsionito recomenda por contexto.</h2>
                <p className="mt-3 text-white/85 max-w-3xl">
                  O cardápio da Casa Impulsiona já está estruturado para o agente: cada prato carrega
                  dieta, ocasião, harmonização, ticket e público. O Impulsionito cruza esse mapa com o
                  histórico do cliente e recomenda ofertas contextuais no salão, delivery, WhatsApp e site.
                </p>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-4">
              {[
                { q: "Cliente vegetariano abriu comanda na mesa 4", r: "Sugere Buddha Bowl, Veg Burger de grão-de-bico e vinho Sauvignon Blanc — omite pratos com carne do cardápio digital." },
                { q: "Cliente comprou pizza pela 3ª vez em 30d", r: "Ativa cupom '2ª pizza com 40% OFF' e cross-sell de vinho Chianti harmonizado." },
                { q: "É quinta-feira 17h — happy hour", r: "Push no clube Prata+ com combo IPA + petisco. Impulsionito prioriza os favoritos históricos de cada cliente." },
                { q: "Aniversariante da semana com histórico de doces", r: "Envia cupom de sobremesa cortesia e sugere reserva de mesa com mensagem 'sua cheesecake preferida está esperando'." },
              ].map((c) => (
                <div key={c.q} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-xs text-white/60">Sinal</div>
                  <div className="text-sm font-semibold mt-1">{c.q}</div>
                  <div className="mt-3 text-xs text-white/60">Ação do Impulsionito</div>
                  <div className="text-sm text-white/90 mt-1">{c.r}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/foodservice/cardapio" className="bg-[color:var(--fs-amber)] text-white px-6 py-3 rounded-md font-semibold hover:opacity-90 inline-flex items-center gap-2">
                Ver dataset do cardápio <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/foodservice/operacao" className="border border-white/30 px-6 py-3 rounded-md font-semibold hover:bg-white/10">
                Voltar à operação
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Integrações */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="font-serif text-2xl font-bold">Integrações do Core</h2>
        <p className="text-sm text-black/60">Todas nativas do Ecossistema Impulsionando.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {["WhatsApp Business API", "N8N (orquestração)", "Mercado Pago", "Impulsionito (IA)", "Clube Impulsionando", "CRM Central", "Fila prioritária delivery", "BI de recompra"].map((t) => (
            <div key={t} className="rounded-xl bg-white border border-black/5 p-4 text-sm font-medium text-center">{t}</div>
          ))}
        </div>
      </section>
    </>
  );
}
