import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PUBLIC_NICHE_GROUPS, PUBLIC_NICHES } from "@/data/public-niche-catalog";
import { ArrowRight, Bot, CheckCircle2, ChevronDown, FileDown, Filter, Sparkles } from "lucide-react";

export const Route = createFileRoute("/apresentacao")({
  head: () => ({
    meta: [
      { title: "Apresentação Viva — Impulsionando Tecnologia" },
      { name: "description", content: "Apresentação viva do Ecossistema Impulsionando guiada pelo Impulsionetro, organizada por nicho, módulos, jornadas e evidências reais do ecossistema." },
      { property: "og:url", content: "https://impulsionando.com.br/apresentacao" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/apresentacao" }],
  }),
  component: ApresentacaoPage,
});

type Evidence = {
  id: string;
  tenant_slug: string;
  niche_slug: string;
  capability_key: string;
  title: string;
  description: string;
  status: "TESTED" | "IMPLEMENTED_PENDING_EXTERNAL_TEST" | "PARTIAL" | "ABSENT" | "BLOCKED";
  evidence_url: string | null;
  sort_order: number;
};

const STATUS_LABEL: Record<Evidence["status"], string> = {
  TESTED: "🟢 Testado e funcional",
  IMPLEMENTED_PENDING_EXTERNAL_TEST: "🟡 Implementado — teste externo pendente",
  PARTIAL: "🟠 Parcial",
  ABSENT: "🔴 Ausente",
  BLOCKED: "⚫ Bloqueado",
};

const UNIVERSAL = [
  ["CRM", "Leads, clientes, oportunidades, histórico, follow-up, reativação, retenção e relacionamento."],
  ["Comunicação", "WhatsApp, e-mail, tickets, templates e Impulsionito conforme canais conectados."],
  ["Automações", "Boas-vindas, lembretes, pesquisas, reativação, pós-venda e jornadas n8n conforme o contexto."],
  ["ERP / Gestão", "Financeiro, pedidos, produtos, serviços, documentos, cobrança e operação conforme o plano."],
  ["Analytics", "Indicadores de operação, conversão, relacionamento e performance conforme disponibilidade de dados."],
] as const;

function ApresentacaoPage() {
  const [niche, setNiche] = useState("todos");
  const [query, setQuery] = useState("");

  const selected = PUBLIC_NICHES.find((n) => n.slug === niche);
  const group = PUBLIC_NICHE_GROUPS.find((g) => g.items.some((i) => i.slug === niche));
  const normalized = query.trim().toLocaleLowerCase("pt-BR");

  const visibleNiches = useMemo(() => PUBLIC_NICHE_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !normalized || `${i.label} ${i.description}`.toLocaleLowerCase("pt-BR").includes(normalized)),
  })).filter((g) => g.items.length), [normalized]);

  const { data: evidence = [] } = useQuery({
    queryKey: ["public-capability-evidence", niche],
    enabled: niche !== "todos",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("core_public_capability_evidence")
        .select("id,tenant_slug,niche_slug,capability_key,title,description,status,evidence_url,sort_order")
        .eq("niche_slug", niche)
        .eq("public_visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Evidence[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <Badge className="gap-2"><Bot className="h-3.5 w-3.5" /> Apresentado pelo Impulsionetro</Badge>
            <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-6xl">Apresentação viva do <span className="text-primary">Ecossistema Impulsionando</span></h1>
            <p className="mt-6 max-w-4xl text-lg leading-relaxed text-muted-foreground">Escolha seu nicho. O Impulsionetro organiza apenas os módulos, jornadas e exemplos que fazem sentido para aquela realidade e mostra quais capacidades já existem no ecossistema.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><a href="#indice">Escolher nicho <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => window.print()}><FileDown className="h-4 w-4" /> Gerar PDF</Button>
            </div>
          </div>
        </section>

        <section id="indice" className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><Filter className="h-4 w-4" /> Índice por nicho</div>
          <h2 className="mt-2 text-3xl font-semibold">Que tipo de empresa você quer visualizar?</h2>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nicho..." className="mt-5 h-11 w-full max-w-xl rounded-md border bg-background px-4 text-sm" />

          <div className="mt-8 space-y-5">
            {visibleNiches.map((g, macroIndex) => (
              <Card key={g.slug} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge variant="outline">Macro {String(macroIndex + 1).padStart(2, "0")}</Badge><h3 className="mt-2 text-xl font-semibold">{g.label}</h3><p className="mt-1 text-sm text-muted-foreground">{g.description}</p></div><span className="text-xs text-muted-foreground">{g.items.length} micro-nichos</span></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((item) => <button key={item.slug} onClick={() => { setNiche(item.slug); setTimeout(() => document.getElementById("conteudo-nicho")?.scrollIntoView({ behavior: "smooth" }), 0); }} className={`rounded-xl border p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03] ${niche === item.slug ? "border-primary bg-primary/[0.05]" : ""}`}><div className="font-semibold">{item.label}</div><div className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</div></button>)}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="conteudo-nicho" className="border-y bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-12">
            {niche === "todos" || !selected ? (
              <Card className="p-8 text-center"><Sparkles className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 text-2xl font-semibold">Escolha um nicho no índice</h2><p className="mx-auto mt-2 max-w-2xl text-muted-foreground">A apresentação será reorganizada para aquele contexto e mostrará recursos universais, recursos específicos e exemplos reais do ecossistema.</p></Card>
            ) : (
              <div className="space-y-6">
                <div><Badge>{group?.label ?? "Nicho"}</Badge><h2 className="mt-3 text-3xl font-semibold">{selected.label}</h2><p className="mt-2 max-w-3xl text-muted-foreground">{selected.description}</p></div>

                <details open className="group rounded-2xl border bg-card"><summary className="flex cursor-pointer list-none items-center justify-between p-5"><div><div className="text-lg font-semibold">1. Base do ecossistema para este nicho</div><div className="text-sm text-muted-foreground">Recursos que normalmente fazem sentido independentemente do setor.</div></div><ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary><div className="border-t p-5"><div className="grid gap-4 md:grid-cols-2">{UNIVERSAL.map(([title, desc]) => <div key={title} className="rounded-xl border p-4"><div className="font-semibold">{title}</div><p className="mt-1 text-sm text-muted-foreground">{desc}</p></div>)}</div></div></details>

                <details open className="group rounded-2xl border bg-card"><summary className="flex cursor-pointer list-none items-center justify-between p-5"><div><div className="text-lg font-semibold">2. Recursos específicos e exemplos reais do ecossistema</div><div className="text-sm text-muted-foreground">O Impulsionetro mostra apenas evidências públicas cadastradas para este subnicho.</div></div><ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary><div className="border-t p-5">{evidence.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há evidências públicas vinculadas especificamente a este subnicho. O Impulsionito pode montar a solução com os módulos universais e registrar novas evidências conforme forem implementadas e testadas.</p> : <div className="grid gap-4 md:grid-cols-2">{evidence.map((item) => <Card key={item.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline">{item.tenant_slug}</Badge><h3 className="mt-3 font-semibold">{item.title}</h3></div><span className="text-xs text-muted-foreground">{STATUS_LABEL[item.status]}</span></div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>{item.evidence_url ? <a href={item.evidence_url} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Ver evidência <ArrowRight className="h-3.5 w-3.5" /></a> : null}</Card>)}</div>}</div></details>

                <details className="group rounded-2xl border bg-card"><summary className="flex cursor-pointer list-none items-center justify-between p-5"><div><div className="text-lg font-semibold">3. Como o Impulsionito conduz esse cliente</div><div className="text-sm text-muted-foreground">Descoberta → demonstração → apresentação → configuração → jornada.</div></div><ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary><div className="border-t p-5"><ol className="space-y-3 text-sm">{["Identifica o nicho e o objetivo do visitante.","Oferece a demo correspondente ou abre esta apresentação já filtrada.","Explica módulos aplicáveis e evita mostrar recursos sem sentido para aquele negócio.","Apresenta exemplos reais do ecossistema com status transparente.","Conduz para orçamento, implantação ou aprofundamento no módulo desejado."].map((step, i) => <li key={step} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span><span className="pt-1">{step}</span></li>)}</ol></div></details>

                <div className="flex flex-wrap gap-3"><Button asChild><Link to="/demo">Ver demonstrações</Link></Button><Button asChild variant="outline"><Link to="/planos">Ver planos</Link></Button></div>
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
