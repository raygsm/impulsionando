import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Building2, Crown, LockKeyhole, Search, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicVitrine } from "@/lib/consumer.functions";
import { listClubePlans } from "@/lib/clube-membership.functions";

export const Route = createFileRoute("/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine do Ecossistema Impulsionando" },
      { name: "description", content: "Conheça empresas e atividades do ecossistema. Detalhes e benefícios são liberados gratuitamente após cadastro no Clube Impulsionando." },
      { property: "og:url", content: "https://impulsionando.com.br/vitrine" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/vitrine" }],
  }),
  component: VitrinePage,
});

type Company = {
  id: string;
  public_slug: string | null;
  name: string;
  trade_name: string | null;
  segment: string | null;
  tagline: string | null;
  description: string | null;
};

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function VitrinePage() {
  const fetchVitrine = useServerFn(getPublicVitrine);
  const fetchPlans = useServerFn(listClubePlans);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("todos");
  const deferred = useDeferredValue(search);

  const companiesQuery = useQuery({
    queryKey: ["vitrine-core-live-teaser"],
    queryFn: () => fetchVitrine({ data: { sort: "name", limit: 200 } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  const plansQuery = useQuery({ queryKey: ["clube-plans-live"], queryFn: () => fetchPlans(), staleTime: 60_000, refetchOnWindowFocus: true });

  const all = (companiesQuery.data?.companies ?? []) as Company[];
  const segments = useMemo(() => [...new Set(all.map((c) => c.segment).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR")), [all]);
  const rows = useMemo(() => {
    const q = deferred.trim().toLocaleLowerCase("pt-BR");
    return all.filter((c) => (segment === "todos" || c.segment === segment) && (!q || `${c.name} ${c.trade_name ?? ""} ${c.segment ?? ""}`.toLocaleLowerCase("pt-BR").includes(q)));
  }, [all, deferred, segment]);
  const premium = (plansQuery.data?.plans ?? []).find((p: any) => p.code === "premium");

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <Badge className="mb-4 bg-gradient-primary"><Sparkles className="mr-1 h-3.5 w-3.5" />Vitrine viva do Core</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Empresas conectadas ao ecossistema Impulsionando</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">Veja quem faz parte do ecossistema e o que cada empresa faz. Contatos, endereços, benefícios, avaliações e experiências completas ficam disponíveis após entrar no Clube Impulsionando.</p>
            <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-left sm:grid-cols-2">
              <Card className="p-4"><p className="font-semibold">Free · R$ 0</p><p className="mt-1 text-sm text-muted-foreground">Cadastro gratuito para desbloquear os detalhes das empresas e começar sua jornada no Clube.</p></Card>
              <Card className="p-4"><p className="font-semibold">Premium{premium ? ` · ${money(Number(premium.monthly_price_cents))}/mês` : ""}</p><p className="mt-1 text-sm text-muted-foreground">Benefícios ampliados, ofertas exclusivas e vantagens adicionais conforme cada parceiro.</p></Card>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link to="/auth" search={{ persona: "clube", mode: "signup" }}><Crown className="mr-2 h-4 w-4" />Entrar no Clube Free</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/clube">Comparar planos <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa ou atividade..." className="pl-9" /></div>
              <div className="flex flex-wrap gap-2"><Button size="sm" variant={segment === "todos" ? "default" : "outline"} onClick={() => setSegment("todos")}>Todos</Button>{segments.map((s) => <Button key={s} size="sm" variant={segment === s ? "default" : "outline"} onClick={() => setSegment(s)}>{s}</Button>)}</div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">{companiesQuery.isLoading ? "Lendo o Core..." : `${rows.length} empresas exibidas · ${all.length} publicadas no Core`}</div>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {companiesQuery.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Card key={i} className="h-56 animate-pulse bg-muted/40" />)}</div> : rows.length === 0 ? <Card className="p-10 text-center"><Building2 className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Nenhuma empresa encontrada</h2><p className="mt-1 text-sm text-muted-foreground">Altere a busca ou a atividade.</p></Card> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((c) => (
                <Card key={c.id} className="flex flex-col p-6 transition-shadow hover:shadow-elegant">
                  <div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><Badge variant="outline">{c.segment || "serviços"}</Badge></div>
                  <h2 className="mt-4 text-xl font-semibold">{c.trade_name || c.name}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.description || c.tagline || "Operação conectada ao Core Impulsionando."}</p>
                  {c.public_slug ? <Button asChild className="mt-5 w-full"><Link to="/auth" search={{ persona: "clube", mode: "signin", next: `/vitrine/${c.public_slug}` }}><LockKeyhole className="mr-2 h-4 w-4" />Ver detalhes no Clube</Link></Button> : <Button className="mt-5 w-full" disabled>Detalhes em ativação</Button>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
