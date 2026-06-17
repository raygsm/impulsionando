import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  TrendingUp,
  Quote,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Star,
  PlayCircle,
  Stethoscope,
  Utensils,
  Beer,
  Briefcase,
  ShoppingBag,
} from "lucide-react";

export const Route = createFileRoute("/showroom/cases")({
  head: () => ({
    meta: [
      { title: "Casos de sucesso — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Histórias reais de clientes por nicho: clínicas, restaurantes, cervejarias, serviços e e-commerce. Métricas, antes-e-depois e vídeos.",
      },
      { property: "og:title", content: "Cases de sucesso — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Resultados auditáveis: faturamento, no-show, NPS, retenção e payback. Filtre por nicho.",
      },
    ],
  }),
  component: ShowroomCases,
});

type NicheSlug = "todos" | "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type CaseItem = {
  slug: string;
  niche: Exclude<NicheSlug, "todos">;
  company: string;
  city: string;
  size: string;
  logo: typeof Stethoscope;
  hero: string; // resultado principal
  quote: string;
  author: string;
  role: string;
  rating: number;
  metrics: { label: string; before: string; after: string; delta: string }[];
  duration: string;
  featured?: boolean;
};

const CASES: CaseItem[] = [
  {
    slug: "clinica-vitalis",
    niche: "clinicas",
    company: "Clínica Vitalis",
    city: "São Paulo · SP",
    size: "12 profissionais · 3 unidades",
    logo: Stethoscope,
    hero: "+38% de receita em 6 meses",
    quote:
      "Reduzimos o no-show drasticamente e a equipe finalmente parou de gerenciar planilhas. O Copilot de IA antecipa cancelamentos e sugere encaixes.",
    author: "Dra. Marina Ferraz",
    role: "Diretora clínica",
    rating: 5,
    metrics: [
      { label: "Faturamento mensal", before: "R$ 320k", after: "R$ 442k", delta: "+38%" },
      { label: "Taxa de no-show", before: "18%", after: "7%", delta: "-61%" },
      { label: "NPS de pacientes", before: "54", after: "78", delta: "+24 pts" },
      { label: "Tempo de check-in", before: "4 min", after: "45 s", delta: "-81%" },
    ],
    duration: "Resultados em 6 meses",
    featured: true,
  },
  {
    slug: "bar-do-zeca",
    niche: "bares",
    company: "Bar do Zeca",
    city: "Belo Horizonte · MG",
    size: "65 lugares · delivery + salão",
    logo: Utensils,
    hero: "Ticket médio +22% e zero ruptura",
    quote:
      "O QR na mesa virou padrão. A integração com iFood resolveu a guerra de cozinha — vejo tudo no mesmo KDS. Caixa fecha 25 min mais cedo todo dia.",
    author: "José ‘Zeca’ Almeida",
    role: "Proprietário",
    rating: 5,
    metrics: [
      { label: "Ticket médio", before: "R$ 64", after: "R$ 78", delta: "+22%" },
      { label: "Pedidos/dia", before: "180", after: "246", delta: "+37%" },
      { label: "Ruptura de cardápio", before: "11/sem", after: "0/sem", delta: "-100%" },
      { label: "Tempo fechamento caixa", before: "45 min", after: "20 min", delta: "-56%" },
    ],
    duration: "Resultados em 90 dias",
    featured: true,
  },
  {
    slug: "cervejaria-alquimia",
    niche: "cervejarias",
    company: "Cervejaria Alquimia",
    city: "Curitiba · PR",
    size: "120 mil L/ano · 28 SKUs",
    logo: Beer,
    hero: "Rastreabilidade 100% e -71% de erros",
    quote:
      "Cada lote tem QR e diário digital. Quando o ML pediu auditoria de origem, exportamos tudo em 2 minutos. Antes era pasta-arquivo e Excel.",
    author: "Rafael Costa",
    role: "Mestre cervejeiro",
    rating: 5,
    metrics: [
      { label: "Erros de produção", before: "21/mês", after: "6/mês", delta: "-71%" },
      { label: "Rastreabilidade", before: "Parcial", after: "100%", delta: "Completa" },
      { label: "Tempo por lote", before: "3,4 h", after: "2,1 h", delta: "-38%" },
      { label: "Pedidos B2B/mês", before: "84", after: "138", delta: "+64%" },
    ],
    duration: "Resultados em 4 meses",
  },
  {
    slug: "studio-nordeste",
    niche: "servicos",
    company: "Studio Nordeste",
    city: "Recife · PE",
    size: "Agência · 18 pessoas",
    logo: Briefcase,
    hero: "+46% de horas faturáveis registradas",
    quote:
      "Tirou a fricção do apontamento — vira hábito. O DRE por projeto matou aquela dúvida de qual cliente realmente dá lucro.",
    author: "Camila Andrade",
    role: "Sócia-diretora",
    rating: 5,
    metrics: [
      { label: "Horas faturáveis", before: "1.180/mês", after: "1.720/mês", delta: "+46%" },
      { label: "Lead time de aprovação", before: "5,2 dias", after: "2,8 dias", delta: "-46%" },
      { label: "Margem por projeto", before: "23%", after: "34%", delta: "+11 pts" },
      { label: "Churn anual", before: "18%", after: "9%", delta: "-50%" },
    ],
    duration: "Resultados em 5 meses",
  },
  {
    slug: "drop-store",
    niche: "ecommerce",
    company: "Drop Store",
    city: "Porto Alegre · RS",
    size: "Moda · 3 marcas · DTC + ML",
    logo: ShoppingBag,
    hero: "Conversão +32% no app e ROAS 5,8x",
    quote:
      "O app com biometria reduziu fricção e o motor de recomendação por IA fez upsell virar regra. ROAS subiu sem aumentar verba.",
    author: "Bruno Tavares",
    role: "Head de growth",
    rating: 5,
    metrics: [
      { label: "Conversão (app)", before: "1,9%", after: "2,5%", delta: "+32%" },
      { label: "ROAS médio", before: "3,2x", after: "5,8x", delta: "+81%" },
      { label: "Retenção D30", before: "22%", after: "41%", delta: "+19 pts" },
      { label: "Carrinhos recuperados", before: "6%", after: "14%", delta: "+133%" },
    ],
    duration: "Resultados em 4 meses",
    featured: true,
  },
  {
    slug: "clinica-sorriso",
    niche: "clinicas",
    company: "Sorriso Odontologia",
    city: "Florianópolis · SC",
    size: "6 cadeiras · 8 profissionais",
    logo: Stethoscope,
    hero: "Agenda 92% ocupada em 90 dias",
    quote:
      "Os lembretes por WhatsApp e o checkout antecipado mudaram o jogo. Conseguimos ocupação que nunca tínhamos visto.",
    author: "Dr. Pedro Lin",
    role: "Sócio fundador",
    rating: 5,
    metrics: [
      { label: "Ocupação da agenda", before: "68%", after: "92%", delta: "+24 pts" },
      { label: "Pagamentos antecipados", before: "12%", after: "63%", delta: "+51 pts" },
      { label: "Avaliação Google", before: "4,4", after: "4,9", delta: "+0,5" },
      { label: "Recompra em 6 meses", before: "31%", after: "58%", delta: "+27 pts" },
    ],
    duration: "Resultados em 90 dias",
  },
];

const NICHES: { slug: NicheSlug; label: string; icon?: typeof Stethoscope }[] = [
  { slug: "todos", label: "Todos" },
  { slug: "clinicas", label: "Clínicas", icon: Stethoscope },
  { slug: "bares", label: "Bares & Restaurantes", icon: Utensils },
  { slug: "cervejarias", label: "Cervejarias", icon: Beer },
  { slug: "servicos", label: "Serviços", icon: Briefcase },
  { slug: "ecommerce", label: "E-commerce", icon: ShoppingBag },
];

function ShowroomCases() {
  const [niche, setNiche] = useState<NicheSlug>("todos");

  const list = useMemo(
    () => (niche === "todos" ? CASES : CASES.filter((c) => c.niche === niche)),
    [niche],
  );

  const featured = useMemo(() => CASES.filter((c) => c.featured), []);
  const aggregates = useMemo(() => {
    return {
      clients: "+1.840",
      avgRoi: "412%",
      avgPayback: "38 dias",
      retention: "94%",
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Trophy className="h-3 w-3" /> Showroom — Casos de sucesso
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Resultados reais, números auditáveis
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Empresas brasileiras de 5 nichos diferentes mostram o antes e o depois — com
              métricas verificadas pelos próprios clientes.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {NICHES.map((n) => (
                <Button
                  key={n.slug}
                  size="sm"
                  variant={niche === n.slug ? "default" : "outline"}
                  onClick={() => setNiche(n.slug)}
                >
                  {n.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Aggregates */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Clientes ativos</span>
              <Users className="h-4 w-4" />
            </div>
            <div className="mt-2 text-3xl font-bold">{aggregates.clients}</div>
            <div className="text-xs text-muted-foreground">em 27 estados</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>ROI médio (12m)</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">{aggregates.avgRoi}</div>
            <div className="text-xs text-muted-foreground">auditado por NPS surveys</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Payback médio</span>
              <Calendar className="h-4 w-4" />
            </div>
            <div className="mt-2 text-3xl font-bold">{aggregates.avgPayback}</div>
            <div className="text-xs text-muted-foreground">primeiro ciclo</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Retenção anual</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="mt-2 text-3xl font-bold">{aggregates.retention}</div>
            <div className="text-xs text-muted-foreground">acima da média SaaS BR</div>
          </Card>
        </div>
      </section>

      {/* Featured */}
      {niche === "todos" && (
        <section className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Histórias em destaque</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vídeos e estudos de caso completos.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((c) => {
              const Logo = c.logo;
              return (
                <Card key={c.slug} className="relative overflow-hidden">
                  <div className="relative aspect-video bg-gradient-to-br from-primary/15 via-primary/5 to-background">
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="rounded-full bg-background/80 p-4 shadow-lg backdrop-blur">
                        <PlayCircle className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <Badge className="absolute right-3 top-3 bg-amber-500/90 text-white hover:bg-amber-500">
                      <Trophy className="mr-1 h-3 w-3" /> Destaque
                    </Badge>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <Logo className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-sm font-semibold">{c.company}</div>
                    </div>
                    <div className="mt-2 text-lg font-bold text-emerald-600">{c.hero}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {c.city} · {c.duration}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Lista de cases */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {niche === "todos" ? "Todos os casos" : `Casos em ${NICHES.find((n) => n.slug === niche)?.label}`}
          </h2>
          <span className="text-sm text-muted-foreground">{list.length} resultado{list.length === 1 ? "" : "s"}</span>
        </div>

        <div className="space-y-6">
          {list.map((c) => {
            const Logo = c.logo;
            return (
              <Card key={c.slug} className="overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[1fr_1.4fr]">
                  {/* Coluna esquerda */}
                  <div className="border-b p-6 md:border-b-0 md:border-r">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-3">
                          <Logo className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-base font-bold">{c.company}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {c.city}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.size}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: c.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 rounded-lg bg-emerald-500/10 p-4">
                      <div className="text-xs uppercase tracking-wide text-emerald-700">
                        Resultado principal
                      </div>
                      <div className="mt-1 text-2xl font-bold text-emerald-700">{c.hero}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{c.duration}</div>
                    </div>

                    <div className="mt-5 rounded-lg border bg-muted/30 p-4 text-sm">
                      <Quote className="h-5 w-5 text-primary" />
                      <p className="mt-2 italic leading-relaxed">"{c.quote}"</p>
                      <div className="mt-3 text-xs">
                        <span className="font-semibold">{c.author}</span>
                        <span className="text-muted-foreground"> · {c.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coluna direita - métricas */}
                  <div className="bg-background p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Antes & depois</h3>
                      <Badge variant="outline" className="gap-1 text-[11px]">
                        <TrendingUp className="h-3 w-3" /> Auditado pelo cliente
                      </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {c.metrics.map((m) => (
                        <div key={m.label} className="rounded-lg border p-3">
                          <div className="text-xs text-muted-foreground">{m.label}</div>
                          <div className="mt-2 flex items-end justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground line-through">
                                {m.before}
                              </div>
                              <div className="text-lg font-bold">{m.after}</div>
                            </div>
                            <Badge
                              className={`text-[11px] ${
                                m.delta.startsWith("-") && !["Completa"].includes(m.delta)
                                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"
                                  : "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"
                              }`}
                            >
                              {m.delta}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button size="sm">
                        Ler estudo completo <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <PlayCircle className="mr-2 h-4 w-4" /> Ver vídeo (3 min)
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-8">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Sparkles className="h-3 w-3" /> Próximo case pode ser o seu
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                Comece com 14 dias grátis — sem cartão
              </h3>
              <p className="mt-2 text-muted-foreground">
                Onboarding guiado, migração padrão inclusa e Customer Success acompanhando os
                primeiros 90 dias.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/showroom/precificacao">
                    Ver planos & ROI <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/showroom">Voltar ao hub</Link>
                </Button>
              </div>
            </div>
            <div className="border-t bg-muted/30 p-8 md:border-l md:border-t-0">
              <div className="text-sm font-semibold">Provas sociais</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-2xl font-bold">4,9</div>
                  <div className="text-xs text-muted-foreground">★ avaliação média</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-2xl font-bold">+ 1.840</div>
                  <div className="text-xs text-muted-foreground">clientes ativos</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-2xl font-bold">27</div>
                  <div className="text-xs text-muted-foreground">estados atendidos</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-2xl font-bold">94%</div>
                  <div className="text-xs text-muted-foreground">retenção anual</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
