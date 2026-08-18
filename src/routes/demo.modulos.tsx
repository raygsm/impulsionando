import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/demo/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos certificados — DEMO — Impulsionando" },
      {
        name: "description",
        content: "Demonstração fiel dos módulos liberados pelo Core da Impulsionando Tecnologia.",
      },
      { property: "og:title", content: "Módulos certificados — DEMO" },
      {
        property: "og:description",
        content: "Veja apenas recursos realmente liberados para demonstração pelo Core da Impulsionando.",
      },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/modulos" }],
  }),
  component: DemoModulesPage,
});

type DemoModule = {
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  status_comercial: string;
  readiness_status: string;
  demo_url: string | null;
  cta_primary: string | null;
  cta_secondary: string | null;
  vertical_scope: string[] | null;
  allow_trial: boolean;
  allow_standalone: boolean;
  allow_combo: boolean;
};

function DemoModulesPage() {
  const [modules, setModules] = useState<DemoModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("list_public_demo_modules");
      if (!active) return;
      if (error) {
        setError("Não foi possível carregar o catálogo de demonstração.");
        setLoading(false);
        return;
      }
      setModules((data ?? []) as DemoModule[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(modules.map((m) => m.category).filter(Boolean) as string[])).sort(),
    [modules],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (category !== "Todas" && m.category !== category) return false;
      if (!q) return true;
      return [m.name, m.description ?? "", m.category ?? "", m.slug]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [modules, query, category]);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <Badge className="bg-gradient-primary mb-3">Demonstração conectada ao Core</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Módulos certificados</h1>
            <p className="mt-2 text-muted-foreground max-w-3xl">
              Esta vitrine usa a mesma fonte de verdade do ambiente contratado. Só aparecem módulos que o Core liberou explicitamente para demonstração.
            </p>
          </div>
          <Button asChild className="bg-gradient-primary">
            <Link to="/orcamento">
              Solicitar proposta <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
          <div className="flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Demo fidedigna:</strong> nenhum módulo, preço ou disponibilidade é inventado nesta tela. Módulos em homologação permanecem fora da contratação demonstrativa até serem liberados pelo Core.
            </div>
          </div>
        </Card>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <SummaryCard label="Liberados para demo" value={modules.length} hint="Controlados pelo Core" />
          <SummaryCard label="Certificados" value={modules.filter((m) => m.readiness_status === "certificado" || m.readiness_status === "publicado").length} hint="Prontidão comercial validada" />
          <SummaryCard label="Sob consulta" value={modules.filter((m) => m.status_comercial === "sob_consulta").length} hint="Preview sem promessa de contratação" />
        </div>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar módulo..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          {["Todas", ...categories].map((c) => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
              {c}
            </Button>
          ))}
        </div>

        {loading && (
          <Card className="p-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando catálogo do Core...
          </Card>
        )}

        {!loading && error && <Card className="p-8 text-center text-sm text-destructive">{error}</Card>}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((m) => (
              <Card key={m.slug} className="p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-lg">{m.name}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{m.category ?? "Plataforma"}</p>
                  </div>
                  <Badge variant={m.status_comercial === "disponivel_contratacao" ? "default" : "outline"}>
                    {m.status_comercial === "disponivel_contratacao" ? "Certificado" : "Sob consulta"}
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed flex-1">
                  {m.description || "Módulo integrante do Core Impulsionando."}
                </p>
                {m.vertical_scope && m.vertical_scope.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.vertical_scope.map((v) => <Badge key={v} variant="secondary">Vertical: {v}</Badge>)}
                  </div>
                )}
                <div className="mt-5 flex gap-2">
                  {m.demo_url ? (
                    <Button asChild size="sm" className="bg-gradient-primary flex-1">
                      <a href={m.demo_url}>
                        <Sparkles className="w-4 h-4 mr-1" /> {m.cta_primary || "Testar demonstração"}
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" disabled className="flex-1">Demo indisponível</Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link to="/modulos/$slug" params={{ slug: m.slug }}>{m.cta_secondary || "Detalhes"}</Link>
                  </Button>
                </div>
              </Card>
            ))}
            {visible.length === 0 && <Card className="p-8 col-span-full text-center text-sm text-muted-foreground">Nenhum módulo disponível para esse filtro.</Card>}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </Card>
  );
}
