import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2, Lock, Search, Sparkles, RotateCcw, ArrowRight, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  MOTHER_MODULES,
  MOTHER_MODULE_CATEGORIES,
  type MotherModule,
} from "@/data/motherModules";
import { useDemoContracted } from "@/lib/demoContracting";
import { DemoContractFlow } from "@/components/demo/DemoContractFlow";

export const Route = createFileRoute("/demo/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos & Contratação — DEMO — Impulsionando" },
      {
        name: "description",
        content:
          "Vitrine demo dos 14 módulos da plataforma. Contrate na simulação para liberar os recursos com dados fictícios.",
      },
      { property: "og:title", content: "Módulos & Contratação — DEMO" },
      {
        property: "og:description",
        content:
          "Veja todos os módulos disponíveis e simule a contratação. Tudo client-side, sem cobrança real.",
      },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/modulos" }],
  }),
  component: DemoModulesPage,
});

function DemoModulesPage() {
  const { contracted, isContracted, uncontract, reset } = useDemoContracted();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOTHER_MODULES.filter((m) => {
      if (category !== "Todas" && m.category !== category) return false;
      if (!q) return true;
      return (
        m.shortName.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.submodules.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const totalActive = contracted.size;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <DemoModeBanner />
        <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <Badge className="bg-gradient-primary mb-3">Demonstração • simulação de contratação</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Módulos & Contratação
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Escolha os módulos que deseja testar. Na demo, você simula a contratação
                e libera recursos com dados fictícios — entendendo como a plataforma se
                adapta à sua operação por parametrizações SIM/NÃO.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      reset();
                      toast.success("Contratações da demo zeradas.");
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Zerar contratações
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Remove todas as contratações simuladas — apenas no seu navegador.
                </TooltipContent>
              </Tooltip>
              <Button asChild size="sm" className="bg-gradient-primary">
                <Link to="/orcamento">
                  Orçamento real <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Resumo */}
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <SummaryCard
              label="Módulos disponíveis"
              value={MOTHER_MODULES.length}
              hint="Vitrine completa da plataforma"
            />
            <SummaryCard
              label="Contratados na demo"
              value={totalActive}
              hint="Liberados para teste com dados fictícios"
              accent
            />
            <SummaryCard
              label="Ainda como vitrine"
              value={MOTHER_MODULES.length - totalActive}
              hint='Clique em "Contratar Módulo X" para liberar'
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar módulo, recurso ou termo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {(["Todas", ...MOTHER_MODULE_CATEGORIES] as const).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={category === c ? "default" : "outline"}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((m) => (
              <ModuleCard
                key={m.slug}
                module={m}
                contracted={isContracted(m.slug)}
                onUncontract={() => {
                  uncontract(m.slug);
                  toast.message(`Módulo "${m.shortName}" voltou para a vitrine.`);
                }}
              />
            ))}
            {visible.length === 0 && (
              <Card className="p-8 col-span-full text-center text-sm text-muted-foreground">
                Nenhum módulo encontrado para esses filtros.
              </Card>
            )}
          </div>

          <div className="mt-10 rounded-xl border bg-card p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Lembrete:</strong> tudo aqui é
                simulação. Nenhuma cobrança, mensagem real ou cadastro é feito ao
                contratar um módulo na demonstração. No ambiente real, essa mesma
                tela mostra apenas os módulos do seu plano e habilita
                <em> Solicitar contratação </em> para os demais.
              </div>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

function SummaryCard({
  label, value, hint, accent,
}: { label: string; value: number; hint: string; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </Card>
  );
}

function ModuleCard({
  module: m, contracted, onUncontract,
}: {
  module: MotherModule;
  contracted: boolean;
  onUncontract: () => void;
}) {
  const Icon = m.icon;
  const [flowOpen, setFlowOpen] = useState(false);
  const testRoute = INTERACTIVE_DEMO[m.slug] ?? "/demo/cliente-final";

  return (
    <Card className={`p-5 flex flex-col ${contracted ? "border-primary/50 shadow-elegant" : ""}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            contracted
              ? "bg-gradient-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{m.shortName}</h3>
            {contracted ? (
              <Badge className="bg-primary/15 text-primary border-primary/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> PAGO — DEMO
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <Lock className="w-3 h-3 mr-1" /> Vitrine
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.tagline}</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {m.pitch}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {m.submodules.slice(0, contracted ? 12 : 5).map((s) => (
          <span
            key={s}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
          >
            {s}
          </span>
        ))}
        {m.submodules.length > (contracted ? 12 : 5) && (
          <span className="text-[10px] text-muted-foreground">
            +{m.submodules.length - (contracted ? 12 : 5)} recursos
          </span>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center gap-2">
        {contracted ? (
          <>
            <TestarRecursosButton slug={m.slug} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={onUncontract}>
                  Cancelar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancelamento fictício — volta o módulo para a vitrine.</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Button size="sm" className="bg-gradient-primary flex-1" onClick={() => setFlowOpen(true)}>
              Contratar na Demonstração
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="sm" variant="outline">
                  <Link
                    to="/modulos/$slug"
                    params={{ slug: m.slug }}
                  >
                    Detalhes
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Ver descrição comercial completa, recursos e nichos onde brilha.
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <DemoContractFlow
        open={flowOpen}
        onOpenChange={setFlowOpen}
        slug={m.slug}
        moduleName={m.shortName}
        moduleDescription={m.pitch}
        amountReference={referenceAmountFor(m.slug)}
        features={m.submodules}
        testRoute={testRoute}
      />
    </Card>
  );
}

/** Mapeia slug do catálogo → rota demo interativa específica (quando existir). */
const INTERACTIVE_DEMO: Record<string, "/demo/afiliados" | "/demo/checkout" | "/demo/eventos" | "/demo/crm" | "/demo/whatsapp" | "/demo/agenda" | "/demo/cliente-final"> = {
  fidelizacao: "/demo/afiliados",
  commerce: "/demo/checkout",
  eventos: "/demo/eventos",
  crm: "/demo/crm",
  automacao: "/demo/whatsapp",
  agenda: "/demo/agenda",
};

function TestarRecursosButton({ slug }: { slug: string }) {
  const target = INTERACTIVE_DEMO[slug] ?? "/demo/cliente-final";
  return (
    <Button asChild size="sm" className="bg-gradient-primary flex-1">
      <Link to={target}>
        <Sparkles className="w-4 h-4 mr-1" /> Testar recursos
      </Link>
    </Button>
  );
}

/** Valor fictício de referência por módulo (R$/mês) — só para a tela de pagamento demo. */
const REFERENCE_AMOUNTS: Record<string, number> = {
  fidelizacao: 297,
  commerce: 247,
  eventos: 197,
  atendimento: 397,
  agenda: 147,
  crm: 247,
  bi: 197,
  prontuario: 297,
  paciente: 97,
  permissoes: 0,
  whitelabel: 997,
  viagens: 247,
  delivery: 197,
  followups: 147,
};
function referenceAmountFor(slug: string): number {
  return REFERENCE_AMOUNTS[slug] ?? 197;
}

