import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  Building2,
  Ticket,
  Wallet,
  Sparkles,
  Package,
  Wrench,
  CalendarDays,
  Bike,
  Building,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TENANT_MODELS } from "@/data/tenant-registry";
import { CLUBE_CATEGORIAS, CLUBE_CASHBACK_SALDO } from "@/data/clube-mocks";
import {
  TenantHero,
  StatGrid,
  SectionHeader,
  FeatureGrid,
  CtaBlock,
  TrustBadges,
} from "@/components/impulsionando";

export const Route = createFileRoute("/clube/")({
  head: () => ({
    meta: [
      { title: "Clube Impulsionando — Descubra, economize e ganhe cashback" },
      { name: "description", content: "Marketplace inteligente do Ecossistema Impulsionando. Empresas participantes, ofertas, vouchers, cashback e recomendações personalizadas." },
      { property: "og:title", content: "Clube Impulsionando — Marketplace do Consumidor" },
      { property: "og:description", content: "Descubra empresas, produtos, serviços, imóveis, eventos e delivery. Voucher, cashback e Impulsionito num só lugar." },
      { property: "og:url", content: "https://impulsionando.com.br/clube" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube" }],
  }),
  component: ClubeHome,
});

const AREAS = [
  { icon: Building2, title: "Empresas", description: "Todo o ecossistema num só lugar." },
  { icon: Package, title: "Produtos", description: "Suplementos, itens B2B e mais." },
  { icon: Wrench, title: "Serviços", description: "Consultas, produção, gestão." },
  { icon: CalendarDays, title: "Eventos", description: "Casamentos, corporativos, shows." },
  { icon: Bike, title: "Delivery", description: "Restaurantes e bares parceiros." },
  { icon: Building, title: "Imóveis", description: "Compra, locação e temporada." },
  { icon: Ticket, title: "Vouchers", description: "Descontos ativos em segundos." },
  { icon: Wallet, title: "Cashback", description: "Dinheiro de volta em cada compra." },
];

function ClubeHome() {
  const totalEmpresas = TENANT_MODELS.length;
  const totalOfertas = 320; // mock — futuro: contagem real do backend
  const economiaMedia = "R$ 84,00";

  return (
    <>
      {/* HERO */}
      <TenantHero
        className="bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground"
        align="left"
        eyebrow={<><Sparkles className="w-3.5 h-3.5" /> Clube Impulsionando</>}
        title={
          <>
            Descubra tudo perto de você — <span className="opacity-80">e ganhe dinheiro de volta.</span>
          </>
        }
        subtitle="Marketplace inteligente do Ecossistema Impulsionando: empresas, produtos, serviços, imóveis, eventos, delivery, vouchers, cashback e recomendações do Impulsionito. Cadastro grátis."
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="gap-2 bg-background text-primary hover:bg-background/90">
              <Link to="/clube/cadastro">
                Entrar grátis <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/clube/planos">
                Ver Premium por R$ 9,99
              </Link>
            </Button>
          </div>
        }
      />

      {/* BUSCA */}
      <section className="mx-auto max-w-5xl px-6 -mt-10 relative z-10">
        <Card className="p-4 md:p-6 shadow-lg">
          <form
            role="search"
            className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="relative">
              <span className="sr-only">CEP</span>
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <Input placeholder="CEP" className="pl-9" inputMode="numeric" />
            </label>
            <label className="relative">
              <span className="sr-only">Cidade</span>
              <Input placeholder="Cidade / Bairro" />
            </label>
            <label className="relative">
              <span className="sr-only">O que você procura?</span>
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <Input placeholder="Empresa, produto, serviço, evento..." className="pl-9" />
            </label>
            <Button asChild className="gap-2">
              <Link to="/clube/buscar">
                Buscar <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </form>
        </Card>
      </section>

      {/* KPIs */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <StatGrid
          stats={[
            { value: `${totalEmpresas}+`, label: "empresas modelo" },
            { value: `${totalOfertas}`, label: "ofertas ativas" },
            { value: economiaMedia, label: "economia média/mês" },
            { value: `R$ ${CLUBE_CASHBACK_SALDO.toFixed(0)}`, label: "cashback disponível" },
          ]}
          columns={4}
        />
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-7xl px-6 py-4">
        <SectionHeader eyebrow="Categorias" title="Explore por categoria" align="left" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
          {CLUBE_CATEGORIAS.map((c) => (
            <Link
              key={c.slug}
              to="/clube/buscar"
              className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 text-center hover:border-primary/40 transition"
            >
              <div className="text-primary font-serif text-2xl">{c.count}</div>
              <div className="text-xs opacity-75 mt-1 leading-tight">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ÁREAS */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <SectionHeader eyebrow="Áreas do Clube" title="Tudo o que você pode fazer aqui" align="left" />
        <div className="mt-6">
          <FeatureGrid features={AREAS} columns={4} />
        </div>
      </section>

      {/* EMPRESAS EM DESTAQUE */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <SectionHeader
          eyebrow="Empresas participantes"
          title="Todos os tenants do Ecossistema Impulsionando"
          description="Os modelos oficiais de cada segmento. Consumo direto do TENANT_MODELS — a Vitrine e o Impulsionito recomendam a partir destes."
          align="left"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {TENANT_MODELS.slice(0, 8).map((t) => (
            <Link
              key={t.slug}
              to={t.route}
              className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-primary/40 transition"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-semibold mb-3">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="font-serif text-base">{t.name}</div>
              <div className="text-xs opacity-70 mt-1">{t.segmentLabel}</div>
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/clube/empresas">Ver todas as empresas <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* GARANTIAS */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <TrustBadges
            columns={4}
            badges={[
              { title: "Cadastro grátis", description: "Sem cartão de crédito, sem pegadinha." },
              { title: "Cashback real", description: "Créditos utilizáveis no próprio checkout." },
              { title: "LGPD e privacidade", description: "Você controla seus dados a qualquer momento." },
              { title: "Sem fidelidade", description: "Cancele o Premium quando quiser." },
            ]}
          />
        </div>
      </section>

      {/* CTA FINAL */}
      <CtaBlock
        variant="primary"
        eyebrow="Vamos começar?"
        title="Descubra o que o ecossistema tem para você"
        description="Cadastro leva menos de 1 minuto. Impulsionito recomenda na hora o que faz sentido para o seu momento."
        actions={
          <>
            <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90">
              <Link to="/clube/cadastro">Entrar grátis no Clube</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/clube/recomendacoes">Falar com o Impulsionito</Link>
            </Button>
          </>
        }
      />
    </>
  );
}
