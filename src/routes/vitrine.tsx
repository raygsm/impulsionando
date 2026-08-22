import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Building2, Crown, Globe, Search, Sparkles } from "lucide-react";
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
      { name: "description", content: "Clientes conectados ao Core Impulsionando, seus segmentos e endereços públicos oficiais." },
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
  logo_url: string | null;
  website: string | null;
  subdomain: string | null;
  domain: string | null;
};

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function stripProtocol(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function canonicalCompanyUrl(company: Company): { host: string | null; url: string | null } {
  const subdomain = company.subdomain?.trim().toLowerCase().replace(/\.+$/, "") || null;
  if (subdomain) {
    const host = subdomain.endsWith(".impulsionando.com.br") ? subdomain : `${subdomain}.impulsionando.com.br`;
    return { host, url: `https://${host}` };
  }

  const domain = company.domain?.trim() || null;
  if (domain) {
    const host = stripProtocol(domain).split("/")[0];
    return { host, url: `https://${host}` };
  }

  const website = company.website?.trim() || null;
  if (website) {
    const url = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    try {
      return { host: new URL(url).host, url };
    } catch {
      return { host: stripProtocol(website).split("/")[0] || null, url };
    }
  }

  return { host: null, url: null };
}

function VitrinePage() {
  const fetchVitrine = useServerFn(getPublicVitrine);
  const fetchPlans = useServerFn(listClubePlans);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("todos");
  const deferred = useDeferredValue(search);

  const companiesQuery = useQuery({
    queryKey: ["vitrine-core-live"],
    queryFn: () => fetchVitrine({ data: { sort: "name", limit: 200 } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  const plansQuery = useQuery({
    queryKey: ["clube-plans-live"],
    queryFn: () => fetchPlans(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const all = (companiesQuery.data?.companies ?? []) as Company[];
  const segments = useMemo(
    () => [...new Set(all.map((c) => c.segment).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [all],
  );
  const rows = useMemo(() => {
    const q = deferred.trim().toLocaleLowerCase("pt-BR");
    return all.filter(
      (c) =>
        (segment === "todos" || c.segment === segment) &&
        (!q || `${c.name} ${c.trade_name ?? ""} ${c.segment ?? ""}`.toLocaleLowerCase("pt-BR").includes(q)),
    );
  }, [all, deferred, segment]);
  const premium = (plansQuery.data?.plans ?? []).find((p: any) => p.code === "premium");

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <Badge className="mb-4 bg-gradient-primary"><Sparkles className="mr-1 h-3.5 w-3.5" />Vitrine viva do Core</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Clientes conectados ao ecossistema Impulsionando</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A lista vem diretamente do cadastro canônico do Core. Novos clientes e subdomínios entram nesta vitrine sem manter uma segunda lista manual.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link to="/clube"><Crown className="mr-2 h-4 w-4" />{premium ? `Clube Premium · ${money(Number(premium.monthly_price_cents))}/mês` : "Conhecer o Clube"}</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/apresentacao">Apresentação viva <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente ou segmento..." className="pl-9" /></div>
              <div className="flex flex-wrap gap-2"><Button size="sm" variant={segment === "todos" ? "default" : "outline"} onClick={() => setSegment("todos")}>Todos</Button>{segments.map((s) => <Button key={s} size="sm" variant={segment === s ? "default" : "outline"} onClick={() => setSegment(s)}>{s}</Button>)}</div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">{companiesQuery.isLoading ? "Lendo o Core..." : `${rows.length} clientes exibidos · ${all.length} clientes publicados no Core`}</div>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {companiesQuery.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Card key={i} className="h-56 animate-pulse bg-muted/40" />)}</div>
          ) : rows.length === 0 ? (
            <Card className="p-10 text-center"><Building2 className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Nenhum cliente encontrado</h2><p className="mt-1 text-sm text-muted-foreground">Altere a busca ou o segmento.</p></Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((c) => {
                const canonical = canonicalCompanyUrl(c);
                return (
                  <Card key={c.id} className="flex flex-col p-6 transition-shadow hover:shadow-elegant">
                    <div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><Badge variant="outline">{c.segment || "serviços"}</Badge></div>
                    <h2 className="mt-4 text-xl font-semibold">{c.trade_name || c.name}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.description || c.tagline || "Operação conectada ao Core Impulsionando."}</p>
                    {canonical.host ? <div className="mt-4 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{canonical.host}</span><span className="ml-2">· endereço oficial</span></div> : null}
                    <div className="mt-5 flex gap-2">
                      {c.public_slug ? <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/vitrine/$slug" params={{ slug: c.public_slug }}>Perfil</Link></Button> : null}
                      {canonical.url ? <Button asChild size="sm" className="flex-1"><a href={canonical.url} target="_blank" rel="noreferrer"><Globe className="mr-2 h-3.5 w-3.5" />Abrir site</a></Button> : <Button size="sm" className="flex-1" disabled>Site em ativação</Button>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
