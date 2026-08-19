import { createFileRoute, Link } from "@tanstack/react-router";
import { breadcrumbJsonLd } from "@/lib/seo";
import { ArrowRight, MessageCircle, Search, Target, Layers3, Route as RouteIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { PUBLIC_NICHE_GROUPS, PUBLIC_NICHES } from "@/data/public-niche-catalog";
import { openImpulsionito } from "@/lib/impulsionito-tracking";

export const Route = createFileRoute("/nichos/")({
  head: () => ({
    meta: [
      { title: "Soluções por segmento — Impulsionando Tecnologia" },
      { name: "description", content: "Soluções organizadas por macro-nichos e micro-nichos para saúde, alimentação, indústria, imobiliário, serviços, varejo, educação, turismo e muito mais." },
      { property: "og:title", content: "Macro-nichos e jornadas por segmento — Impulsionando Tecnologia" },
      { property: "og:description", content: "Cada macro-nicho reúne micro-nichos com dores, jornada, relacionamento, recorrência e ganhos comerciais próprios." },
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
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10"><Layers3 className="mr-1 h-3.5 w-3.5" /> {PUBLIC_NICHE_GROUPS.length} macro-nichos</Badge>
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10"><RouteIcon className="mr-1 h-3.5 w-3.5" /> {PUBLIC_NICHES.length} micro-jornadas</Badge>
          </div>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Primeiro o macro. Depois o detalhe. Por fim, a jornada exata do seu negócio.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/85">A Impulsionando não trata “serviços”, “saúde” ou “alimentação” como se fossem uma coisa só. Cada macro-nicho abre seus micro-nichos e cada micro-nicho recebe uma jornada comercial e operacional própria.</p>
          <div className="relative mt-7 max-w-xl text-foreground"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busque pelo seu negócio, atividade ou segmento..." className="h-12 bg-background pl-11 shadow-lg"/></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-14 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {groups.map((group, groupIndex) => (
          <div key={group.slug} className="scroll-mt-24">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  <span>Macro {String(groupIndex + 1).padStart(2, "0")}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{group.items.length} micro-nicho{group.items.length === 1 ? "" : "s"}</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{group.label}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{group.description}</p>
              </div>
              <Badge variant="outline" className="w-fit">Jornadas específicas por atividade</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return <Card key={item.slug} className="group flex flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                  <div className="border-b bg-muted/25 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Micro {String(itemIndex + 1).padStart(2, "0")} · {group.label}</div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground"><Icon className="h-5 w-5"/></div><div><div className="font-semibold leading-tight tracking-tight">{item.label}</div><div className="mt-1 text-[11px] font-medium text-primary">Jornada própria</div></div></div>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">Captação</Badge>
                      <Badge variant="secondary" className="text-[10px]">CRM</Badge>
                      <Badge variant="secondary" className="text-[10px]">Automação</Badge>
                      <Badge variant="secondary" className="text-[10px]">Relacionamento</Badge>
                    </div>
                    <Button asChild size="sm" className="mt-5 gap-1.5 bg-gradient-primary"><Link to="/nichos/$slug" params={{ slug: item.slug }}>Abrir jornada deste micro-nicho <ArrowRight className="h-3.5 w-3.5"/></Link></Button>
                  </div>
                </Card>;
              })}
            </div>
          </div>
        ))}

        <Card className="relative mt-10 overflow-hidden border-0 bg-gradient-primary p-8 text-primary-foreground shadow-elegant lg:p-10">
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-2xl space-y-4"><h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Seu micro-nicho não apareceu exatamente como você chama?</h2><p className="leading-relaxed text-white/85">O Impulsionito parte da sua operação real, cria o enquadramento correto e monta a jornada sem forçar seu negócio dentro de um rótulo genérico.</p><div className="flex flex-wrap gap-2 pt-2"><Button type="button" size="lg" className="gap-2 shadow-lg" onClick={() => openImpulsionito("nichos-hub")}><MessageCircle className="h-4 w-4"/>Falar com o Impulsionito</Button><Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/orcamento">Montar orçamento</Link></Button></div></div>
        </Card>
      </section>
      <PublicFooter />
    </div>
  );
}
