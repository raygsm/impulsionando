import { createFileRoute, Link } from "@tanstack/react-router";
import { breadcrumbJsonLd } from "@/lib/seo";
import { ArrowRight, MessageCircle, Search, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { PUBLIC_NICHE_GROUPS, PUBLIC_NICHES } from "@/data/public-niche-catalog";
import { openImpulsionito } from "@/lib/impulsionito-tracking";

export const Route = createFileRoute("/nichos/")({
  head: () => ({
    meta: [
      { title: "Soluções por segmento — Impulsionando Tecnologia" },
      { name: "description", content: "Soluções para supermercados, materiais de construção, corretoras, farmácias, saúde, alimentação, varejo, serviços, indústria, educação, turismo e muito mais." },
      { property: "og:title", content: "Soluções por segmento — Impulsionando Tecnologia" },
      { property: "og:description", content: "Cada segmento com dores, jornada, relacionamento, recorrência e ganhos comerciais próprios." },
      { property: "og:url", content: "https://impulsionando.com.br/nichos" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/nichos" }],
    scripts: [breadcrumbJsonLd([{ name: "Início", path: "/" }, { name: "Nichos", path: "/nichos" }])],
  }),
  component: NichosIndex,
});

function NichosIndex() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const groups = useMemo(() => PUBLIC_NICHE_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !normalized || `${item.label} ${item.description}`.toLocaleLowerCase("pt-BR").includes(normalized)),
  })).filter((group) => group.items.length > 0), [normalized]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur"><Target className="h-3.5 w-3.5" /> {PUBLIC_NICHES.length} jornadas comerciais publicadas</div>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Encontre a sua realidade. Veja como a Impulsionando conecta operação, venda e relacionamento no seu segmento.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/85">Não é uma apresentação genérica. Cada jornada parte da perda silenciosa do setor, mostra como PDV, ERP, CRM, automação, pesquisas e Impulsionito trabalham juntos e conduz para contratação.</p>
          <div className="relative mt-7 max-w-xl text-foreground"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busque seu segmento..." className="h-12 bg-background pl-11 shadow-lg"/></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {groups.map((group) => (
          <div key={group.slug}>
            <div className="mb-4"><h2 className="text-xl font-bold tracking-tight sm:text-2xl">{group.label}</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{group.description}</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return <Card key={item.slug} className="flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                  <div className="mb-3 flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground"><Icon className="h-5 w-5"/></div><div className="font-semibold leading-tight tracking-tight">{item.label}</div></div>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  <Button asChild size="sm" className="mt-4 gap-1.5 bg-gradient-primary"><Link to="/nichos/$slug" params={{ slug: item.slug }}>Ver jornada <ArrowRight className="h-3.5 w-3.5"/></Link></Button>
                </Card>;
              })}
            </div>
          </div>
        ))}

        <Card className="relative mt-10 overflow-hidden border-0 bg-gradient-primary p-8 text-primary-foreground shadow-elegant lg:p-10">
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-2xl space-y-4"><h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Seu segmento ainda não apareceu exatamente como você chama?</h2><p className="leading-relaxed text-white/85">O Impulsionito faz o diagnóstico e monta a configuração a partir da sua operação, não de um rótulo genérico.</p><div className="flex flex-wrap gap-2 pt-2"><Button type="button" size="lg" className="gap-2 shadow-lg" onClick={() => openImpulsionito("nichos-hub")}><MessageCircle className="h-4 w-4"/>Falar com o Impulsionito</Button><Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/orcamento">Montar orçamento</Link></Button></div></div>
        </Card>
      </section>
      <PublicFooter />
    </div>
  );
}
