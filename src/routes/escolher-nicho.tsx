import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { PUBLIC_NICHE_GROUPS } from "@/data/public-niche-catalog";

export const Route = createFileRoute("/escolher-nicho")({
  head: () => ({
    meta: [
      { title: "Escolha seu segmento — Impulsionando Tecnologia" },
      { name: "description", content: "Encontre seu segmento e veja como a Impulsionando conecta PDV, ERP, CRM, relacionamento, automação, inteligência e crescimento para a sua realidade." },
      { property: "og:title", content: "Soluções por segmento — Impulsionando" },
      { property: "og:description", content: "Escolha seu tipo de negócio e veja uma jornada comercial construída para a sua operação." },
    ],
  }),
  component: EscolherNichoPage,
});

function EscolherNichoPage() {
  const navigate = useNavigate();
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
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur"><Target className="h-3.5 w-3.5" /> Encontre a sua operação</div>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">A Impulsionando precisa parecer feita para o seu negócio — porque a jornada é construída para ele.</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg">Do PDV, estoque e operação ao CRM, relacionamento, pesquisas, recorrência, LTV, ticket médio e Impulsionito. Escolha seu segmento e veja onde a Impulsionando gera valor.</p>
          <div className="relative mt-7 max-w-xl text-foreground"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busque: supermercado, farmácia, seguros, construção..." className="h-12 bg-background pl-11 shadow-lg" /></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {groups.map((group) => (
          <div key={group.slug}>
            <div className="mb-5"><h2 className="text-xl font-bold tracking-tight sm:text-2xl">{group.label}</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{group.description}</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return <button key={item.slug} type="button" onClick={() => navigate({ to: "/nichos/$slug", params: { slug: item.slug } })} className="rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Card className="flex h-full flex-col border-2 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
                    <div className="mb-3 flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Icon className="h-5 w-5"/></div><div className="font-semibold leading-tight">{item.label}</div></div>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Ver como funciona <ArrowRight className="h-4 w-4"/></div>
                  </Card>
                </button>;
              })}
            </div>
          </div>
        ))}

        {groups.length === 0 && <Card className="p-8 text-center"><Sparkles className="mx-auto h-6 w-6 text-primary"/><h2 className="mt-3 font-semibold">Não encontrou exatamente o seu segmento?</h2><p className="mt-2 text-sm text-muted-foreground">A arquitetura é modular e o Impulsionito pode montar uma configuração específica para a sua operação.</p><Button asChild className="mt-4"><Link to="/orcamento">Montar minha solução</Link></Button></Card>}
      </section>
      <PublicFooter />
    </div>
  );
}
