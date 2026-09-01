import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Search, MapPin, Building2, Ticket, Wallet, Sparkles, Package, Wrench, CalendarDays, Bike, Building, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getClubePublicOverview } from "@/lib/clube-public.functions";
import { TenantHero, StatGrid, SectionHeader, FeatureGrid, CtaBlock, TrustBadges } from "@/components/impulsionando";

const overviewQuery = queryOptions({ queryKey: ["clube-public-overview"], queryFn: () => getClubePublicOverview(), staleTime: 60_000 });

export const Route = createFileRoute("/clube/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(overviewQuery),
  head: () => ({ meta: [
    { title: "Clube Impulsionando — Descubra, economize e ganhe benefícios" },
    { name: "description", content: "Marketplace inteligente do Ecossistema Impulsionando. Empresas participantes, ofertas, benefícios e recomendações personalizadas." },
    { property: "og:title", content: "Clube Impulsionando — Marketplace do Consumidor" },
    { property: "og:url", content: "https://impulsionando.com.br/clube" },
    { property: "og:type", content: "website" },
  ], links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube" }] }),
  component: ClubeHome,
});

const AREAS = [
  { icon: Building2, title: "Empresas", description: "Todo o ecossistema num só lugar." },
  { icon: Package, title: "Produtos", description: "Produtos dos parceiros participantes." },
  { icon: Wrench, title: "Serviços", description: "Serviços e soluções do ecossistema." },
  { icon: CalendarDays, title: "Eventos", description: "Experiências e eventos participantes." },
  { icon: Bike, title: "Delivery", description: "Opções oferecidas pelos parceiros." },
  { icon: Building, title: "Imóveis", description: "Compra, locação e temporada quando disponíveis." },
  { icon: Ticket, title: "Vouchers", description: "Benefícios ativos da sua conta." },
  { icon: Wallet, title: "Benefícios", description: "Saldo e vantagens sempre na área do assinante." },
];

function ClubeHome() {
  const { data } = useSuspenseQuery(overviewQuery);
  return <>
    <TenantHero className="bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground" align="left"
      eyebrow={<><Sparkles className="w-3.5 h-3.5" /> Clube Impulsionando</>}
      title={<>Descubra o ecossistema — <span className="opacity-80">e concentre seus benefícios.</span></>}
      subtitle="Empresas, produtos, serviços, eventos e benefícios do Ecossistema Impulsionando. Cadastro grátis e área do assinante integrada."
      actions={<div className="flex flex-col sm:flex-row gap-3"><Button asChild size="lg" className="gap-2 bg-background text-primary hover:bg-background/90"><Link to="/clube/cadastro">Entrar grátis <ArrowRight className="w-4 h-4" /></Link></Button><Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"><Link to="/clube/planos">Ver planos</Link></Button></div>} />

    <section className="mx-auto max-w-5xl px-6 -mt-10 relative z-10"><Card className="p-4 md:p-6 shadow-lg"><form role="search" className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3" onSubmit={(e)=>e.preventDefault()}><label className="relative"><span className="sr-only">CEP</span><MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/><Input placeholder="CEP" className="pl-9" inputMode="numeric"/></label><label><span className="sr-only">Cidade</span><Input placeholder="Cidade / Bairro"/></label><label className="relative"><span className="sr-only">Busca</span><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/><Input placeholder="Empresa, produto, serviço..." className="pl-9"/></label><Button asChild className="gap-2"><Link to="/clube/buscar">Buscar <ArrowRight className="w-4 h-4"/></Link></Button></form></Card></section>

    <section className="mx-auto max-w-7xl px-6 py-12"><StatGrid stats={[{value:String(data.stats.companies),label:"empresas publicadas"},{value:String(data.stats.activeOffers),label:"ofertas ativas agora"},{value:String(data.categories.length),label:"categorias disponíveis"},{value:"Área real",label:"benefícios do assinante"}]} columns={4}/></section>

    <section className="mx-auto max-w-7xl px-6 py-4"><SectionHeader eyebrow="Categorias" title="Explore o que já está disponível" align="left"/><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">{data.categories.length ? data.categories.slice(0,8).map((c:any)=><Link key={c.slug} to="/clube/buscar" className="rounded-xl border border-border bg-card/60 p-4 text-center hover:border-primary/40 transition"><div className="text-primary font-serif text-2xl">{c.count}</div><div className="text-xs opacity-75 mt-1">{c.label}</div></Link>) : <p className="col-span-full text-sm opacity-70">As categorias aparecerão aqui conforme empresas forem publicadas.</p>}</div></section>

    <section className="mx-auto max-w-7xl px-6 py-12"><SectionHeader eyebrow="Áreas do Clube" title="Um único lugar para descobrir e acompanhar" align="left"/><div className="mt-6"><FeatureGrid features={AREAS} columns={4}/></div></section>

    <section className="mx-auto max-w-7xl px-6 py-12"><SectionHeader eyebrow="Empresas participantes" title="Publicadas no ecossistema" description="Esta lista é carregada da vitrine pública real. Nenhuma empresa fictícia é exibida." align="left"/><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">{data.companies.slice(0,8).map((t:any)=><article key={t.id} className="rounded-xl border border-border bg-card/60 p-5"><div className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-semibold mb-3">{String(t.trade_name||t.name||"IP").slice(0,2).toUpperCase()}</div><div className="font-serif text-base">{t.trade_name||t.name}</div><div className="text-xs opacity-70 mt-1">{t.segment||"Parceiro"}{t.address_city?` · ${t.address_city}`:""}</div></article>)}</div><div className="mt-6"><Button asChild variant="outline" className="gap-2"><Link to="/clube/empresas">Ver todas as empresas <ArrowRight className="w-4 h-4"/></Link></Button></div></section>

    <section className="bg-muted/30 border-y border-border"><div className="mx-auto max-w-7xl px-6 py-12"><TrustBadges columns={4} badges={[{title:"Cadastro grátis",description:"Comece sem cartão de crédito."},{title:"Dados reais",description:"Vitrine e benefícios conectados ao Core."},{title:"LGPD e privacidade",description:"Dados protegidos e acesso autenticado."},{title:"Área do assinante",description:"Histórico, favoritos e benefícios em ambiente privado."}]}/></div></section>
    <CtaBlock variant="primary" eyebrow="Vamos começar?" title="Entre no Clube Impulsionando" description="Crie sua conta para acessar a experiência personalizada e seus benefícios reais." actions={<><Button asChild size="lg" className="bg-background text-primary hover:bg-background/90"><Link to="/clube/cadastro">Entrar grátis no Clube</Link></Button><Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"><Link to="/area-clube">Área do assinante</Link></Button></>}/>
  </>;
}
