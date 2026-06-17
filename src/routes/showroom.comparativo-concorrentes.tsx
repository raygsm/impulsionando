import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  Minus,
  Trophy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  Users,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/showroom/comparativo-concorrentes")({
  head: () => ({
    meta: [
      {
        title:
          "Comparativo: Impulsionando vs concorrentes — Quem entrega mais por nicho",
      },
      {
        name: "description",
        content:
          "Veja como a Impulsionando se compara a Trinks, ClinicWeb, RD Station, Conta Azul, Bling, Tiny e outros: recursos, preço, integrações, IA, multi-unidades e suporte.",
      },
      {
        property: "og:title",
        content: "Impulsionando vs concorrentes — Comparativo completo",
      },
      {
        property: "og:description",
        content:
          "Quadro lado a lado de funcionalidades, preço, IA, automações e suporte. Descubra por que clientes migram para a Impulsionando.",
      },
    ],
  }),
  component: ComparativoConcorrentes,
});

type Cell = "yes" | "no" | "partial";

interface Competitor {
  id: string;
  name: string;
  category: string;
  focus: string;
  price: string;
  highlights: string[];
}

const COMPETITORS: Competitor[] = [
  {
    id: "impulsionando",
    name: "Impulsionando",
    category: "Plataforma 360°",
    focus: "Gestão + CRM + IA + WhatsApp + BI",
    price: "R$ 197 a R$ 997/mês",
    highlights: [
      "Tudo em uma plataforma",
      "Copilot IA nativo",
      "Multi-unidades e franquias",
    ],
  },
  {
    id: "trinks",
    name: "Trinks",
    category: "Agenda para serviços",
    focus: "Salões, barbearias e estética",
    price: "R$ 149 a R$ 449/mês",
    highlights: ["Marketplace de busca", "Boa agenda", "Sem BI avançado"],
  },
  {
    id: "clinicweb",
    name: "ClinicWeb",
    category: "Gestão clínica",
    focus: "Clínicas e consultórios",
    price: "R$ 199 a R$ 599/mês",
    highlights: ["Prontuário completo", "Faturamento TISS", "UX legada"],
  },
  {
    id: "rdstation",
    name: "RD Station",
    category: "Marketing/CRM",
    focus: "Inbound e funil comercial",
    price: "R$ 379 a R$ 2.999/mês",
    highlights: ["CRM e automação", "Sem operação", "Sem agenda/PDV"],
  },
  {
    id: "contaazul",
    name: "Conta Azul",
    category: "ERP financeiro",
    focus: "PMEs, NF-e, conciliação",
    price: "R$ 89 a R$ 459/mês",
    highlights: ["Financeiro forte", "Sem CRM/agenda", "Integração externa"],
  },
  {
    id: "bling",
    name: "Bling",
    category: "ERP e-commerce",
    focus: "Lojas e marketplaces",
    price: "R$ 39 a R$ 359/mês",
    highlights: ["Ótimo p/ marketplaces", "Sem agenda/CRM nativo", "Foco fiscal"],
  },
];

interface FeatureRow {
  group: string;
  feature: string;
  description: string;
  matrix: Record<string, Cell>;
}

const FEATURES: FeatureRow[] = [
  {
    group: "Operação",
    feature: "Agenda multi-profissional",
    description: "Agendamento por sala, profissional e equipamento, com regras.",
    matrix: {
      impulsionando: "yes",
      trinks: "yes",
      clinicweb: "yes",
      rdstation: "no",
      contaazul: "no",
      bling: "no",
    },
  },
  {
    group: "Operação",
    feature: "PDV + Caixa unificada",
    description: "Frente de caixa, sangria, suprimento, fechamento.",
    matrix: {
      impulsionando: "yes",
      trinks: "partial",
      clinicweb: "no",
      rdstation: "no",
      contaazul: "partial",
      bling: "yes",
    },
  },
  {
    group: "Operação",
    feature: "Estoque com lotes e validade",
    description: "Controle por SKU, lote, validade e curva ABC.",
    matrix: {
      impulsionando: "yes",
      trinks: "no",
      clinicweb: "partial",
      rdstation: "no",
      contaazul: "partial",
      bling: "yes",
    },
  },
  {
    group: "Relacionamento",
    feature: "CRM 360° com histórico unificado",
    description: "Linha do tempo completa do cliente em toda a operação.",
    matrix: {
      impulsionando: "yes",
      trinks: "partial",
      clinicweb: "partial",
      rdstation: "yes",
      contaazul: "no",
      bling: "no",
    },
  },
  {
    group: "Relacionamento",
    feature: "WhatsApp oficial nativo",
    description: "API oficial, templates, automações e atendimento humano.",
    matrix: {
      impulsionando: "yes",
      trinks: "partial",
      clinicweb: "no",
      rdstation: "partial",
      contaazul: "no",
      bling: "no",
    },
  },
  {
    group: "Inteligência",
    feature: "Copilot IA nativo",
    description: "Resumo de cliente, próximas ações, anti no-show, upsell.",
    matrix: {
      impulsionando: "yes",
      trinks: "no",
      clinicweb: "no",
      rdstation: "partial",
      contaazul: "no",
      bling: "no",
    },
  },
  {
    group: "Inteligência",
    feature: "Automações no-code",
    description: "Gatilhos, condições e ações entre módulos.",
    matrix: {
      impulsionando: "yes",
      trinks: "partial",
      clinicweb: "no",
      rdstation: "yes",
      contaazul: "no",
      bling: "partial",
    },
  },
  {
    group: "Inteligência",
    feature: "BI avançado com cohorts",
    description: "LTV, churn, retenção, cohorts e dashboards customizáveis.",
    matrix: {
      impulsionando: "yes",
      trinks: "no",
      clinicweb: "no",
      rdstation: "partial",
      contaazul: "partial",
      bling: "partial",
    },
  },
  {
    group: "Estrutura",
    feature: "Multi-unidades e franquias",
    description: "Consolidação por filial, royalties e DRE por unidade.",
    matrix: {
      impulsionando: "yes",
      trinks: "partial",
      clinicweb: "partial",
      rdstation: "no",
      contaazul: "partial",
      bling: "partial",
    },
  },
  {
    group: "Estrutura",
    feature: "API pública e webhooks",
    description: "REST documentada, OAuth e eventos em tempo real.",
    matrix: {
      impulsionando: "yes",
      trinks: "partial",
      clinicweb: "no",
      rdstation: "yes",
      contaazul: "yes",
      bling: "yes",
    },
  },
  {
    group: "Estrutura",
    feature: "SSO + auditoria + LGPD",
    description: "Login corporativo, trilha de auditoria e DPA assinado.",
    matrix: {
      impulsionando: "yes",
      trinks: "no",
      clinicweb: "partial",
      rdstation: "yes",
      contaazul: "partial",
      bling: "partial",
    },
  },
  {
    group: "Suporte",
    feature: "Onboarding humano + SLA",
    description: "Implantação guiada, success manager e SLA por contrato.",
    matrix: {
      impulsionando: "yes",
      trinks: "partial",
      clinicweb: "partial",
      rdstation: "yes",
      contaazul: "partial",
      bling: "partial",
    },
  },
];

const HIGHLIGHT_CARDS = [
  {
    icon: Trophy,
    title: "Plataforma 360° vs ferramentas isoladas",
    body:
      "Concorrentes resolvem um pedaço (agenda, financeiro ou marketing). Impulsionando entrega a operação inteira em uma assinatura — sem stack frankenstein.",
  },
  {
    icon: Zap,
    title: "Copilot IA nativo em todos os módulos",
    body:
      "Enquanto a maioria ainda promete IA, a Impulsionando entrega resumos, sugestões de ação e automações inteligentes embarcadas em agenda, CRM e BI.",
  },
  {
    icon: ShieldCheck,
    title: "Conformidade e segurança de nível enterprise",
    body:
      "SSO, auditoria granular, residência de dados no Brasil, DPA assinado e RBAC — o que outras plataformas SaaS PME só oferecem em planos enterprise.",
  },
  {
    icon: Globe2,
    title: "Pensada para multi-unidades e franquias",
    body:
      "DRE por filial, royalties, padronização de cardápio/procedimentos e consolidação financeira por grupo — sem precisar de ERP separado.",
  },
];

const MIGRATION_STORIES = [
  {
    from: "Trinks + Conta Azul",
    to: "Impulsionando",
    persona: "Rede de 4 clínicas de estética — SP",
    result: "−42% no-show, +28% recorrência, −R$ 3,2k/mês em SaaS",
  },
  {
    from: "RD Station + planilhas",
    to: "Impulsionando",
    persona: "Studio de pilates — Curitiba",
    result: "+34% conversão de leads, automação anti-churn em 7 dias",
  },
  {
    from: "Bling + WhatsApp manual",
    to: "Impulsionando",
    persona: "Empório artesanal — Belo Horizonte",
    result: "Tempo de atendimento −61%, ticket médio +18%",
  },
];

function CellIcon({ value }: { value: Cell }) {
  if (value === "yes")
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="h-4 w-4" />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Minus className="h-4 w-4" />
      </span>
    );
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
      <X className="h-4 w-4" />
    </span>
  );
}

function ComparativoConcorrentes() {
  const [activeGroup, setActiveGroup] = useState<string>("Todos");
  const groups = useMemo(
    () => ["Todos", ...Array.from(new Set(FEATURES.map((f) => f.group)))],
    [],
  );
  const filtered = useMemo(
    () =>
      activeGroup === "Todos"
        ? FEATURES
        : FEATURES.filter((f) => f.group === activeGroup),
    [activeGroup],
  );

  const score = useMemo(() => {
    const acc: Record<string, number> = {};
    COMPETITORS.forEach((c) => (acc[c.id] = 0));
    FEATURES.forEach((row) => {
      COMPETITORS.forEach((c) => {
        const v = row.matrix[c.id];
        acc[c.id] += v === "yes" ? 2 : v === "partial" ? 1 : 0;
      });
    });
    return acc;
  }, []);
  const maxScore = FEATURES.length * 2;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" /> Comparativo independente
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Impulsionando vs os principais SaaS do mercado
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Comparamos lado a lado funcionalidades, preço, IA, automações,
              multi-unidades e suporte de plataformas usadas por clínicas, salões,
              bares, e-commerces e franquias.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/showroom/precificacao">
                  Ver preço e ROI <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/showroom/cases">Ver casos de migração</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Score */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Pontuação por cobertura</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Cada recurso vale 2 pontos quando entregue nativamente, 1 quando
            parcial e 0 quando ausente. Total possível: {maxScore} pontos.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {COMPETITORS.map((c) => {
              const pct = Math.round((score[c.id] / maxScore) * 100);
              const isUs = c.id === "impulsionando";
              return (
                <Card
                  key={c.id}
                  className={`p-4 ${
                    isUs ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    {isUs && (
                      <Badge variant="default" className="gap-1">
                        <Trophy className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{score[c.id]}</span>
                    <span className="text-xs text-muted-foreground">
                      / {maxScore}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${
                        isUs ? "bg-primary" : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {pct}% de cobertura
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick profile cards */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold">Perfil de cada player</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COMPETITORS.map((c) => (
              <Card
                key={c.id}
                className={`p-5 ${
                  c.id === "impulsionando" ? "border-primary" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold">{c.name}</div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {c.category}
                    </Badge>
                  </div>
                  {c.id === "impulsionando" && (
                    <Badge className="gap-1">
                      <Trophy className="h-3 w-3" /> Recomendado
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{c.focus}</p>
                <div className="mt-3 text-sm">
                  <span className="text-muted-foreground">Faixa de preço: </span>
                  <span className="font-medium">{c.price}</span>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {c.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Matrix table */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Matriz de recursos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Filtre por categoria para focar no que importa para sua operação.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <Button
                  key={g}
                  size="sm"
                  variant={g === activeGroup ? "default" : "outline"}
                  onClick={() => setActiveGroup(g)}
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px]">Recurso</TableHead>
                    {COMPETITORS.map((c) => (
                      <TableHead
                        key={c.id}
                        className={`text-center ${
                          c.id === "impulsionando" ? "bg-primary/5" : ""
                        }`}
                      >
                        {c.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell>
                        <div className="font-medium">{row.feature}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.description}
                        </div>
                      </TableCell>
                      {COMPETITORS.map((c) => (
                        <TableCell
                          key={c.id}
                          className={`text-center ${
                            c.id === "impulsionando" ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex justify-center">
                            <CellIcon value={row.matrix[c.id]} />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CellIcon value="yes" /> Nativo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CellIcon value="partial" /> Parcial / via integração
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CellIcon value="no" /> Indisponível
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold">
            Por que clientes escolhem Impulsionando
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {HIGHLIGHT_CARDS.map((h) => (
              <Card key={h.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <h.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{h.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {h.body}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Migration */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Quem migrou recentemente</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {MIGRATION_STORIES.map((m) => (
              <Card key={m.persona} className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{m.from}</Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge>{m.to}</Badge>
                </div>
                <div className="mt-3 text-sm font-medium">{m.persona}</div>
                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                  {m.result}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link to="/showroom/migracao">
                Ver plano de migração assistida
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">
            Pronto para deixar a stack frankenstein no passado?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/85">
            Em uma demo de 30 minutos mostramos exatamente como a Impulsionando
            substitui sua combinação atual de ferramentas — com IA, multi-unidades
            e suporte humano.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/showroom/precificacao">Comparar planos</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/showroom">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
