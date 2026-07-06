import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles } from "lucide-react";
import { GenericSectionCrud } from "@/components/impulsionito-ic/GenericSectionCrud";
import { PromptMasterEditor } from "@/components/impulsionito-ic/PromptMasterEditor";
import { LearningsReview } from "@/components/impulsionito-ic/LearningsReview";
import { MetricsDashboard } from "@/components/impulsionito-ic/MetricsDashboard";
import { HistoryPanel, PromptVersionsPanel } from "@/components/impulsionito-ic/ReadonlyPanels";
import { LlmConfigPanel } from "@/components/impulsionito-ic/LlmConfigPanel";

const sectionSchema = z.enum([
  "metricas",
  "prompt-mestre",
  "base-conhecimento",
  "servicos",
  "planos",
  "nichos",
  "modulos",
  "faq",
  "scripts-comerciais",
  "scripts-suporte",
  "objecoes",
  "aprendizados",
  "historico",
  "versoes-prompt",
  "regras-agente",
  "fontes-conhecimento",
  "configuracoes-llm",
]);
type Section = z.infer<typeof sectionSchema>;

const NAV: { section: Section; label: string; group: string }[] = [
  { section: "metricas", label: "Painel de métricas", group: "Visão geral" },
  { section: "prompt-mestre", label: "Prompt Mestre", group: "Núcleo" },
  { section: "regras-agente", label: "Regras do Agente", group: "Núcleo" },
  { section: "fontes-conhecimento", label: "Fontes de Conhecimento", group: "Núcleo" },
  { section: "base-conhecimento", label: "Base de Conhecimento", group: "Conhecimento" },
  { section: "servicos", label: "Serviços", group: "Conhecimento" },
  { section: "planos", label: "Planos", group: "Conhecimento" },
  { section: "nichos", label: "Nichos", group: "Conhecimento" },
  { section: "modulos", label: "Módulos", group: "Conhecimento" },
  { section: "faq", label: "FAQ", group: "Conhecimento" },
  { section: "scripts-comerciais", label: "Scripts Comerciais", group: "Playbooks" },
  { section: "scripts-suporte", label: "Scripts de Suporte", group: "Playbooks" },
  { section: "objecoes", label: "Objeções", group: "Playbooks" },
  { section: "aprendizados", label: "Aprendizados Automáticos", group: "Operação" },
  { section: "historico", label: "Histórico", group: "Operação" },
  { section: "versoes-prompt", label: "Versões do Prompt", group: "Operação" },
  { section: "configuracoes-llm", label: "Motor LLM", group: "Configurações" },
];

export const Route = createFileRoute("/_authenticated/admin/impulsionito/centro-inteligencia")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: sectionSchema.catch("metricas").parse(search.section ?? "metricas"),
  }),
  component: CentroInteligenciaPage,
});

function CentroInteligenciaPage() {
  const { section } = Route.useSearch();
  const grouped = NAV.reduce<Record<string, typeof NAV>>((acc, it) => {
    (acc[it.group] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Administração › Impulsionito
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Centro de Inteligência
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            O cérebro oficial do Ecossistema Impulsionando. O modelo LLM é apenas o
            motor; o conhecimento vive aqui. O Prompt Mestre é montado dinamicamente a
            cada interação.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" /> Estrutura visual pronta — integração posterior
        </Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <nav className="space-y-4">
          {Object.entries(grouped).map(([group, entries]) => (
            <div key={group}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-1">
                {group}
              </div>
              <ul className="space-y-0.5">
                {entries.map((e) => {
                  const active = e.section === section;
                  return (
                    <li key={e.section}>
                      <Link
                        to="/admin/impulsionito/centro-inteligencia"
                        search={{ section: e.section }}
                        className={
                          "block rounded-md px-3 py-2 text-sm transition-colors " +
                          (active
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-foreground/80")
                        }
                      >
                        {e.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0">
          <SectionRouter section={section} />
        </div>
      </div>
    </div>
  );
}

function SectionRouter({ section }: { section: Section }) {
  switch (section) {
    case "metricas":
      return <MetricsDashboard />;
    case "prompt-mestre":
      return (
        <div className="space-y-4">
          <SectionIntro
            title="Prompt Mestre"
            desc="Editor do núcleo + montagem dinâmica com Serviços, Planos, Módulos, FAQ, Nichos, Aprendizados e Contexto."
          />
          <PromptMasterEditor />
        </div>
      );
    case "aprendizados":
      return (
        <div className="space-y-4">
          <SectionIntro
            title="Aprendizados Automáticos"
            desc="Todo atendimento sugere novos conhecimentos. Nada entra no Prompt Mestre sem aprovação humana."
          />
          <LearningsReview />
        </div>
      );
    case "historico":
      return (
        <div className="space-y-4">
          <SectionIntro title="Histórico" desc="Atendimentos recentes usados para gerar aprendizados." />
          <HistoryPanel />
        </div>
      );
    case "versoes-prompt":
      return (
        <div className="space-y-4">
          <SectionIntro title="Versões do Prompt" desc="Histórico versionado de todas as publicações." />
          <PromptVersionsPanel />
        </div>
      );
    case "base-conhecimento":
      return <GenericSectionCrud section={section} title="Base de Conhecimento" />;
    case "servicos":
      return <GenericSectionCrud section={section} title="Serviços" />;
    case "planos":
      return <GenericSectionCrud section={section} title="Planos" />;
    case "nichos":
      return <GenericSectionCrud section={section} title="Nichos" />;
    case "modulos":
      return <GenericSectionCrud section={section} title="Módulos" />;
    case "faq":
      return <GenericSectionCrud section={section} title="FAQ" bodyLabel="Resposta" />;
    case "scripts-comerciais":
      return <GenericSectionCrud section={section} title="Scripts Comerciais" bodyLabel="Script" />;
    case "scripts-suporte":
      return <GenericSectionCrud section={section} title="Scripts de Suporte" bodyLabel="Script" />;
    case "objecoes":
      return <GenericSectionCrud section={section} title="Objeções" bodyLabel="Resposta padrão" />;
    case "regras-agente":
      return <GenericSectionCrud section={section} title="Regras do Agente" bodyLabel="Regra" />;
    case "fontes-conhecimento":
      return <GenericSectionCrud section={section} title="Fontes de Conhecimento" bodyLabel="Descrição / URL" />;
    case "configuracoes-llm":
      return <LlmConfigPanel />;
    default:
      return (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Seção não encontrada.
          </CardContent>
        </Card>
      );
  }
}

function SectionIntro({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-2xl">{desc}</p>
    </div>
  );
}
