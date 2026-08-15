import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, Building2, CheckCircle2, CircleDot, Radio, Rocket, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { openImpulsionito } from "@/lib/impulsionito-tracking";

type InvestorSection = {
  section_key: string;
  section_order: number;
  eyebrow: string | null;
  title: string;
  summary: string | null;
  body: Record<string, unknown>;
  updated_at?: string;
};

const FALLBACK_SECTIONS: InvestorSection[] = [
  { section_key: "vision", section_order: 10, eyebrow: "A tese", title: "Um sistema operacional do negócio, com inteligência no centro.", summary: "A Impulsionando conecta aquisição, vendas, atendimento, operação, financeiro, automação, relacionamento e inteligência em um único ecossistema.", body: { bullets: ["Uma arquitetura modular em vez de softwares isolados", "Impulsionito como camada de inteligência e orquestração", "Dados e jornadas conectados de ponta a ponta", "Experiência adaptada por empresa, segmento e modelo de negócio"] } },
  { section_key: "problem", section_order: 20, eyebrow: "O problema", title: "Empresas ainda operam em ilhas.", summary: "Leads, vendas, atendimento, pagamentos, estoque, automações e relacionamento vivem em ferramentas separadas. O custo real aparece em retrabalho, perda de contexto, baixa conversão e pouca recorrência.", body: { bullets: ["Leads esquecidos", "Dados fragmentados", "Pouca visão de CAC, LTV e recorrência", "Atendimento sem histórico", "Processos manuais que não escalam"] } },
  { section_key: "solution", section_order: 30, eyebrow: "A solução", title: "Um ecossistema. Uma inteligência. Todo o negócio conectado.", summary: "O Core entrega capacidades universais e adapta a experiência ao contexto da empresa, sem recriar um software diferente para cada operação.", body: { bullets: ["CRM e vendas", "Comunicação", "Automação e jornadas", "Billing e financeiro", "Analytics e atribuição", "Customer Success", "White Label", "IA e agentes especializados"] } },
  { section_key: "impulsionito", section_order: 40, eyebrow: "A inteligência", title: "Impulsionito: o cérebro vivo do ecossistema.", summary: "O Impulsionito interpreta contexto, orienta usuários, acompanha indicadores, diagnostica problemas e coordena ações autorizadas entre os módulos do Core.", body: { bullets: ["Concierge", "Analista", "Growth Manager", "Operador", "Auditor"] } },
  { section_key: "business", section_order: 50, eyebrow: "Modelo de negócio", title: "Receita recorrente, expansão e distribuição.", summary: "A estratégia combina contratos empresariais, White Label e ecossistema de relacionamento com consumidor final.", body: { bullets: ["Empresas como principal frente comercial", "White Label 50, 100, 500 e 1.000", "Clube Impulsionando como camada de relacionamento e descoberta", "Receita recorrente com expansão por capacidade e uso"] } },
  { section_key: "moat", section_order: 60, eyebrow: "Vantagem estrutural", title: "Quanto mais o ecossistema aprende, mais difícil fica copiá-lo.", summary: "A vantagem não está em um único módulo, mas na conexão entre dados, jornadas, automação, inteligência, distribuição e aprendizado reutilizável entre contextos compatíveis.", body: { bullets: ["Core reutilizável", "Capability Packs por segmento", "Aprendizado cliente → nicho → Core", "Dados operacionais conectados", "Impulsionito como interface de inteligência"] } },
  { section_key: "execution", section_order: 70, eyebrow: "Execução", title: "Construção orientada por evidência, não por promessa.", summary: "A Impulsionando diferencia explicitamente aquilo que está testado, aquilo que está implementado e aquilo que ainda depende de homologação.", body: { bullets: ["🟢 TESTADO E FUNCIONAL", "🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE", "🟠 PARCIAL", "🔴 AUSENTE", "⚫ BLOQUEADO"] } },
  { section_key: "market", section_order: 80, eyebrow: "Oportunidade", title: "Substituir fragmentação por uma camada operacional única.", summary: "A tese comercial captura valor não apenas pela substituição de ferramentas, mas pela melhoria da jornada de captação, conversão, relacionamento, fidelização e gestão.", body: { bullets: ["Menos ferramentas soltas", "Menos trabalho manual", "Mais contexto por cliente", "Mais recorrência", "Melhor capacidade de decisão"] } },
];

export const Route = createFileRoute("/mvp")({
  head: () => ({
    meta: [
      { title: "MVP para Investidores — Impulsionando" },
      { name: "description", content: "Investor Room viva da Impulsionando: tese, produto, tecnologia, modelo de negócio, evolução e inteligência do ecossistema." },
      { property: "og:title", content: "Impulsionando — Investor MVP" },
      { property: "og:description", content: "Um ecossistema. Uma inteligência. Todo o negócio conectado." },
      { property: "og:url", content: "https://impulsionando.com.br/mvp" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/mvp" }],
  }),
  component: MvpPage,
});

function SectionCard({ section }: { section: InvestorSection }) {
  const bullets = Array.isArray(section.body?.bullets) ? (section.body.bullets as string[]) : [];
  return (
    <Card className="p-6 sm:p-8">
      {section.eyebrow && <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{section.eyebrow}</div>}
      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{section.title}</h2>
      {section.summary && <p className="mt-3 leading-relaxed text-muted-foreground">{section.summary}</p>}
      {bullets.length > 0 && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {bullets.map((item) => (
            <div key={item} className="flex gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MvpPage() {
  const [sections, setSections] = useState<InvestorSection[]>(FALLBACK_SECTIONS);
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const ordered = useMemo(() => [...sections].sort((a, b) => a.section_order - b.section_order), [sections]);

  useEffect(() => {
    let mounted = true;
    const client = supabase as any;

    async function refresh() {
      try {
        const { data, error } = await client
          .from("mvp_investor_content")
          .select("section_key,section_order,eyebrow,title,summary,body,updated_at")
          .eq("status", "published")
          .eq("approved_for_publication", true)
          .order("section_order", { ascending: true });
        if (!error && mounted && Array.isArray(data) && data.length) {
          setSections(data);
          setLastUpdate(new Date().toISOString());
        }
      } catch {
        // A página continua funcional com conteúdo-base versionado no front.
      }
    }

    refresh();

    const poll = window.setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    let channel: any;
    try {
      channel = client
        .channel("mvp-investor-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "mvp_investor_content" }, () => refresh())
        .subscribe((status: string) => setLive(status === "SUBSCRIBED"));
    } catch {
      setLive(false);
    }

    return () => {
      mounted = false;
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      if (channel) client.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="pointer-events-none absolute -right-32 -top-24 h-[520px] w-[520px] rounded-full bg-accent/25 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-white/15 text-white"><Sparkles className="mr-1 h-3.5 w-3.5" /> Investor Room</Badge>
              <Badge className="border-0 bg-white/10 text-white">
                {live ? <Radio className="mr-1 h-3.5 w-3.5" /> : <CircleDot className="mr-1 h-3.5 w-3.5" />}
                {live ? "Atualização em tempo real" : "Sincronização contínua"}
              </Badge>
            </div>
            <h1 className="mt-6 max-w-5xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              A Impulsionando quer ser o sistema operacional do negócio.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85">
              Uma plataforma que conecta aquisição, vendas, atendimento, operação, financeiro, automação, relacionamento e inteligência — com o Impulsionito como cérebro vivo do ecossistema.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 bg-white text-primary hover:bg-white/90" onClick={() => openImpulsionito("mvp-investidor")}>
                Conversar com o Impulsionito <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href="#tese">Explorar a tese</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="tese" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Building2, "Empresas", "Principal frente comercial"],
              [Users, "White Label", "Distribuição escalável"],
              [Bot, "Impulsionito", "Inteligência e orquestração"],
              [TrendingUp, "Core", "Dados, operação e crescimento"],
            ].map(([Icon, title, body]: any) => (
              <Card key={title} className="p-5">
                <Icon className="h-5 w-5 text-primary" />
                <div className="mt-3 font-semibold">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{body}</div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-5 px-4 pb-14 sm:px-6 lg:px-8">
          {ordered.map((section) => <SectionCard key={section.section_key} section={section} />)}
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-6"><ShieldCheck className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">Governança de publicação</h3><p className="mt-2 text-sm text-muted-foreground">A página pública só consome conteúdo marcado como publicado e aprovado para investidores. Conteúdo interno, dados sensíveis e segredos nunca entram neste feed.</p></Card>
              <Card className="p-6"><Radio className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">Atualização viva</h3><p className="mt-2 text-sm text-muted-foreground">A página tenta Realtime e mantém sincronização automática a cada 5 segundos como fallback, além de atualizar quando o navegador volta ao foco.</p></Card>
              <Card className="p-6"><Rocket className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">Narrativa evolutiva</h3><p className="mt-2 text-sm text-muted-foreground">O Impulsionito pode reorganizar e atualizar a narrativa conforme produto, integrações, status de homologação e modelo de negócio evoluem — sempre respeitando aprovação de publicação.</p></Card>
            </div>
            <div className="mt-6 text-xs text-muted-foreground">
              {lastUpdate ? `Última sincronização: ${new Date(lastUpdate).toLocaleString("pt-BR")}` : "Conteúdo-base versionado no Core do front-end."}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A oportunidade é construir uma camada que o negócio não queira mais desligar.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Não apenas software. Uma infraestrutura operacional, comercial e de inteligência que melhora à medida que aprende com a operação.</p>
          <Button size="lg" className="mt-7 gap-2" onClick={() => openImpulsionito("mvp-fechamento")}>Falar sobre a tese de investimento <ArrowRight className="h-4 w-4" /></Button>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
