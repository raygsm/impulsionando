import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Building2, Ticket, Wallet, Sparkles, Package, Wrench, CalendarDays, Bike, Building, ArrowRight, Crown, Camera, BadgePercent, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TENANT_MODELS } from "@/data/tenant-registry";
import { CLUBE_CATEGORIAS, CLUBE_CASHBACK_SALDO } from "@/data/clube-mocks";
import { TenantHero, StatGrid, SectionHeader, FeatureGrid, CtaBlock, TrustBadges } from "@/components/impulsionando";

export const Route = createFileRoute("/clube/")({
  head: () => ({ meta: [{ title: "Clube Impulsionando — 10% de desconto em todo o ecossistema" }, { name: "description", content: "Assine ou acesse o Clube Impulsionando. Benefícios, 10% de desconto no ecossistema, vitrine, estoque próximo e ajuda inteligente do Impulsionito." }], links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube" }] }),
  component: ClubeHome,
});

const AREAS = [
  { icon: BadgePercent, title: "10% no ecossistema", description: "Assinantes elegíveis identificam e utilizam o benefício nas empresas participantes, conforme regras e permissionamentos." },
  { icon: MapPin, title: "Estoque próximo", description: "Encontre produtos disponíveis em integrantes do ecossistema próximos de você." },
  { icon: Camera, title: "Busca assistida por foto", description: "Jornada preparada para enviar a imagem de uma peça ou produto ao Impulsionito e localizar correspondências no estoque integrado." },
  { icon: Sparkles, title: "Impulsionito", description: "Ajuda a identificar o item, comparar alternativas e encontrar a empresa participante adequada." },
  { icon: Building2, title: "Empresas", description: "Todo o ecossistema num só lugar." },
  { icon: Package, title: "Produtos", description: "Produtos e estoques integrados dos participantes." },
  { icon: Wrench, title: "Serviços", description: "Serviços e profissionais disponíveis no ecossistema." },
  { icon: Ticket, title: "Benefícios", description: "Descontos, vouchers e cashback conforme o plano e as regras vigentes." },
];

function ClubeHome() {
  const totalEmpresas = TENANT_MODELS.length;
  return <>
    <TenantHero className="bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground" align="left" eyebrow={<><Crown className="w-3.5 h-3.5" /> Clube Impulsionando</>} title={<>Seu acesso ao ecossistema — <span className="opacity-80">com benefícios de assinante.</span></>} subtitle="Assine o Clube ou entre na sua conta. Assinantes, conforme o plano e os permissionamentos, acessam a vitrine do ecossistema, identificam benefícios de 10%, encontram estoque próximo e contam com o Impulsionito para localizar produtos e alternativas." actions={<div className="flex flex-col sm:flex-row flex-wrap gap-3"><Button asChild size="lg" className="gap-2 bg-background text-primary hover:bg-background/90"><Link to="/clube/planos">Conhecer e assinar <ArrowRight className="w-4 h-4" /></Link></Button><Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"><Link to="/clube/minha-conta"><LogIn className="w-4 h-4" /> Já sou assinante</Link></Button></div>} />

    <section className="mx-auto max-w-6xl px-6 -mt-8 relative z-10"><div className="grid md:grid-cols-3 gap-4"><Card className="p-5"><BadgePercent className="w-5 h-5 text-primary"/><div className="font-semibold mt-2">10% de desconto</div><p className="text-sm opacity-70 mt-1">Benefício do Clube sinalizado nas ofertas e empresas elegíveis do ecossistema.</p></Card><Card className="p-5"><MapPin className="w-5 h-5 text-primary"/><div className="font-semibold mt-2">Onde tem perto de mim?</div><p className="text-sm opacity-70 mt-1">Consulte a vitrine e os estoques integrados por localização e disponibilidade.</p></Card><Card className="p-5"><Camera className="w-5 h-5 text-primary"/><div className="font-semibold mt-2">Não sabe o nome da peça?</div><p className="text-sm opacity-70 mt-1">A jornada do Impulsionito contempla identificação por imagem assim que o upload visual estiver conectado ao estoque.</p></Card></div></section>

    <section className="mx-auto max-w-5xl px-6 py-10"><Card className="p-4 md:p-6 shadow-lg"><form role="search" className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3" onSubmit={(e)=>e.preventDefault()}><label className="relative"><span className="sr-only">CEP</span><MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/><Input placeholder="CEP" className="pl-9" inputMode="numeric"/></label><Input placeholder="Cidade / Bairro"/><label className="relative"><span className="sr-only">O que você procura?</span><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/><Input placeholder="Produto, serviço ou empresa..." className="pl-9"/></label><Button asChild><Link to="/clube/buscar">Buscar <ArrowRight className="ml-2 w-4 h-4"/></Link></Button></form></Card></section>

    <section className="mx-auto max-w-7xl px-6 py-8"><StatGrid stats={[{value:`${totalEmpresas}+`,label:"empresas no ecossistema"},{value:"10%",label:"benefício do Clube"},{value:"Próximo",label:"busca por localização"},{value:`R$ ${CLUBE_CASHBACK_SALDO.toFixed(0)}`,label:"saldo demonstrativo de cashback"}]} columns={4}/></section>

    <section className="mx-auto max-w-7xl px-6 py-8"><SectionHeader eyebrow="O que o assinante encontra" title="Clube, vitrine, estoque e inteligência na mesma jornada" align="left"/><div className="mt-6"><FeatureGrid features={AREAS} columns={4}/></div></section>

    <section className="mx-auto max-w-7xl px-6 py-8"><SectionHeader eyebrow="Categorias" title="Explore o ecossistema" align="left"/><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">{CLUBE_CATEGORIAS.map((c)=><Link key={c.slug} to="/clube/buscar" className="rounded-xl border border-border bg-card/60 p-4 text-center hover:border-primary/40 transition"><div className="text-primary font-serif text-2xl">{c.count}</div><div className="text-xs opacity-75 mt-1">{c.label}</div></Link>)}</div></section>

    <section className="mx-auto max-w-7xl px-6 py-10"><SectionHeader eyebrow="Empresas participantes" title="Vitrine do Ecossistema Impulsionando" description="Acesso às empresas e ofertas participantes, com benefícios e disponibilidade apresentados conforme o perfil e o permissionamento do assinante." align="left"/><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">{TENANT_MODELS.slice(0,8).map((t)=><Link key={t.slug} to={t.route} className="rounded-xl border border-border bg-card/60 p-5 hover:border-primary/40 transition"><div className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-semibold mb-3">{t.name.slice(0,2).toUpperCase()}</div><div className="font-serif text-base">{t.name}</div><div className="text-xs opacity-70 mt-1">{t.segmentLabel}</div></Link>)}</div><Button asChild variant="outline" className="mt-6"><Link to="/clube/empresas">Ver toda a vitrine <ArrowRight className="ml-2 w-4 h-4"/></Link></Button></section>

    <section className="bg-muted/30 border-y border-border"><div className="mx-auto max-w-7xl px-6 py-10"><TrustBadges columns={4} badges={[{title:"Assinatura identificada",description:"Benefícios dependem do plano e do status real da assinatura."},{title:"Permissionamento",description:"Cada recurso é liberado conforme perfil, plano e regras do Clube."},{title:"LGPD e privacidade",description:"Dados e localização usados somente dentro da jornada autorizada."},{title:"Ecossistema integrado",description:"Vitrine, estoque, ofertas e Impulsionito convergem para a mesma experiência."}]}/></div></section>

    <CtaBlock variant="primary" eyebrow="Clube Impulsionando" title="Quer assinar ou já faz parte?" description="Escolha seu caminho: conheça a assinatura e os benefícios ou entre diretamente na sua área de assinante." actions={<><Button asChild size="lg" className="bg-background text-primary hover:bg-background/90"><Link to="/clube/planos">Quero assinar o Clube</Link></Button><Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"><Link to="/clube/minha-conta">Acessar minha conta</Link></Button></>}/>
  </>;
}
