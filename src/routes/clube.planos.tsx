import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader, FaqAccordion, buildFaqJsonLd, type FaqItem } from "@/components/impulsionando";

const FAQS: FaqItem[] = [
  { question: "Posso cancelar a qualquer momento?", answer: "Sim. Sem fidelidade e sem multa. O cancelamento é feito em um clique em Minha Conta." },
  { question: "Como funciona o teste de 30 dias?", answer: "Você ativa o Premium por 30 dias grátis. Ao final, se não cancelar, começa a cobrança de R$ 9,99/mês." },
  { question: "Preciso de cartão para entrar no Free?", answer: "Não. O plano Free é grátis e não pede cartão." },
  { question: "Cashback é sacável?", answer: "Não. O cashback é utilizável no checkout dos tenants participantes do Ecossistema." },
  { question: "Onde consulto vouchers e cashback?", answer: "Vouchers em /clube/vouchers e cashback em /clube/cashback, com saldo, pendentes e histórico." },
];

export const Route = createFileRoute("/clube/planos")({
  head: () => ({
    meta: [
      { title: "Planos — Clube Impulsionando" },
      { name: "description", content: "Free grátis para sempre ou Premium por R$ 9,99/mês com 30 dias de teste. Sem fidelidade." },
      { property: "og:title", content: "Planos — Clube Impulsionando" },
      { property: "og:description", content: "Compare Free vs Premium do Clube Impulsionando." },
      { property: "og:url", content: "https://impulsionando.com.br/clube/planos" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/planos" }],
    scripts: [buildFaqJsonLd(FAQS)],
  }),
  component: ClubePlanos,
});

const FEATURES: { label: string; free: boolean; premium: boolean }[] = [
  { label: "Cadastro grátis", free: true, premium: true },
  { label: "Buscar empresas, produtos, serviços, eventos, imóveis, delivery", free: true, premium: true },
  { label: "Vouchers públicos", free: true, premium: true },
  { label: "Cashback padrão", free: true, premium: true },
  { label: "Impulsionito (recomendação inteligente)", free: true, premium: true },
  { label: "Cashback multiplicado em categorias selecionadas", free: false, premium: true },
  { label: "Vouchers exclusivos Premium", free: false, premium: true },
  { label: "Alertas inteligentes por CEP e categoria", free: false, premium: true },
  { label: "Suporte prioritário", free: false, premium: true },
  { label: "Convites antecipados para eventos", free: false, premium: true },
];

function Check2({ ok }: { ok: boolean }) {
  return ok ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 opacity-40" />;
}

function ClubePlanos() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <SectionHeader
          eyebrow="Planos"
          title="Comece grátis. Se quiser mais, Premium por R$ 9,99/mês."
          description="30 dias de teste do Premium. Sem cartão obrigatório no Free. Sem fidelidade em nenhum plano."
          align="left"
        />

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <Card className="p-8 flex flex-col hover-lift">
            <div className="text-xs uppercase tracking-[0.2em] opacity-70">Free</div>
            <div className="font-serif text-4xl mt-2">R$ 0</div>
            <div className="text-xs opacity-70 mt-1">Para sempre. Sem cartão.</div>
            <ul className="mt-6 space-y-2 text-sm flex-1">
              {FEATURES.filter((f) => f.free).map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f.label}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-6 focus-ring"><Link to="/clube/cadastro">Entrar grátis</Link></Button>
          </Card>

          <Card className="p-8 flex flex-col border-primary/60 ring-1 ring-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
              <Crown className="w-4 h-4" /> Premium
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-4xl">R$ 9,99</span>
              <span className="text-sm opacity-70">/mês</span>
            </div>
            <div className="text-xs text-primary mt-1">30 dias de teste grátis · cancele quando quiser</div>
            <ul className="mt-6 space-y-2 text-sm flex-1">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  <Check2 ok={f.premium} /> {f.label}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 gap-1">
              <Link to="/clube/cadastro">Ativar teste de 30 dias <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <p className="text-[11px] opacity-60 mt-3">
              Cobrança recorrente via checkout transparente do Ecossistema (Mercado Pago). Sem fidelidade.
            </p>
          </Card>
        </div>

        {/* Tabela comparativa */}
        <div className="mt-10 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider opacity-70">
              <tr>
                <th className="text-left px-5 py-3">Benefício</th>
                <th className="text-center px-5 py-3">Free</th>
                <th className="text-center px-5 py-3 text-primary">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FEATURES.map((f) => (
                <tr key={f.label}>
                  <td className="px-5 py-3">{f.label}</td>
                  <td className="px-5 py-3 text-center"><div className="inline-flex justify-center"><Check2 ok={f.free} /></div></td>
                  <td className="px-5 py-3 text-center"><div className="inline-flex justify-center"><Check2 ok={f.premium} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <SectionHeader eyebrow="Perguntas frequentes" title="Tudo o que você precisa saber antes de assinar" align="left" />
        <div className="mt-6">
          <FaqAccordion faqs={FAQS} />
        </div>
      </section>
    </>
  );
}
