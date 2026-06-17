import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Store,
  Search,
  Star,
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  Code2,
  DollarSign,
  Users,
  Download,
  ArrowRight,
  TrendingUp,
  Package,
  Bot,
  CalendarClock,
  BarChart3,
  MessageCircle,
  CreditCard,
  Mail,
  Truck,
  Stethoscope,
  Beer,
  Briefcase,
  ShoppingBag,
  Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/showroom/marketplace-apps")({
  head: () => ({
    meta: [
      { title: "Marketplace de Apps — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Loja interna de apps de terceiros: ative módulos verticais, automações de IA e ferramentas em 1 clique. Programa de devs com 70% de revenue share.",
      },
      { property: "og:title", content: "Marketplace de Apps — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "+120 apps publicados por parceiros, com sandbox, revenue share e instalação em 1 clique.",
      },
    ],
  }),
  component: ShowroomMarketplaceApps,
});

type Category =
  | "Destaques"
  | "IA & Copilots"
  | "Agendamento"
  | "Financeiro"
  | "Marketing"
  | "Atendimento"
  | "Logística"
  | "Verticais";

type App = {
  name: string;
  developer: string;
  desc: string;
  category: Category;
  vertical?: string;
  price: "Grátis" | "Freemium" | "Pago";
  monthly?: string;
  installs: string;
  rating: number;
  featured?: boolean;
  badge?: "Novo" | "Top" | "Editor's pick";
  icon: typeof Bot;
};

const APPS: App[] = [
  { name: "CopilotIA Vendas", developer: "Impulsionando Labs", desc: "Sugere próximos passos e responde leads com base no CRM.", category: "IA & Copilots", price: "Freemium", monthly: "R$ 49+", installs: "8.2k", rating: 4.9, featured: true, badge: "Top", icon: Bot },
  { name: "Resumo IA de Reuniões", developer: "Nexlo", desc: "Transcreve calls e gera follow-ups automáticos por e-mail.", category: "IA & Copilots", price: "Pago", monthly: "R$ 29", installs: "3.1k", rating: 4.7, icon: Sparkles },
  { name: "Agenda Inteligente Pro", developer: "TimeFlow", desc: "Recompõe agenda ao cancelar, reduz no-show em 34%.", category: "Agendamento", price: "Pago", monthly: "R$ 39", installs: "5.6k", rating: 4.8, featured: true, badge: "Editor's pick", icon: CalendarClock },
  { name: "BI Dashboards Plug-and-Play", developer: "GraphLane", desc: "20 dashboards prontos sobre seu data warehouse.", category: "Financeiro", price: "Pago", monthly: "R$ 79", installs: "2.4k", rating: 4.6, icon: BarChart3 },
  { name: "Conciliador Pix Avançado", developer: "MeioPagar", desc: "Concilia recebíveis em segundos com regras por canal.", category: "Financeiro", price: "Freemium", monthly: "R$ 19+", installs: "4.7k", rating: 4.7, icon: CreditCard },
  { name: "WhatsApp Multi-Atendente", developer: "ChatPilot", desc: "Filas, tags, métricas e templates HSM com IA.", category: "Atendimento", price: "Pago", monthly: "R$ 59", installs: "9.4k", rating: 4.8, featured: true, badge: "Top", icon: MessageCircle },
  { name: "E-mail Marketing Pro", developer: "Mailify", desc: "Cadências, A/B test e automações com IA generativa.", category: "Marketing", price: "Freemium", monthly: "R$ 0–149", installs: "6.8k", rating: 4.5, icon: Mail },
  { name: "Anúncios Performance IA", developer: "AdSpark", desc: "Otimiza Meta/Google Ads com base nas conversões reais.", category: "Marketing", price: "Pago", monthly: "R$ 99", installs: "3.9k", rating: 4.6, badge: "Novo", icon: Megaphone },
  { name: "Roteirizador de Entregas", developer: "RotaSmart", desc: "Otimização Vehicle Routing Problem com janelas.", category: "Logística", price: "Pago", monthly: "R$ 89", installs: "1.8k", rating: 4.7, icon: Truck },
  { name: "Prontuário Plus", developer: "MedCore", desc: "Templates por especialidade e prescrição com IA.", category: "Verticais", vertical: "Clínicas", price: "Pago", monthly: "R$ 69", installs: "2.6k", rating: 4.9, badge: "Editor's pick", icon: Stethoscope },
  { name: "Diário do Cervejeiro", developer: "MaltLog", desc: "Acompanha fermentação, OG/FG e custo de receita.", category: "Verticais", vertical: "Cervejarias", price: "Pago", monthly: "R$ 49", installs: "920", rating: 4.8, icon: Beer },
  { name: "Projetos & Horas", developer: "DeskOps", desc: "Apontamento, faturamento por hora e DRE por projeto.", category: "Verticais", vertical: "Serviços", price: "Freemium", monthly: "R$ 0–59", installs: "3.4k", rating: 4.6, icon: Briefcase },
  { name: "Catálogo Multi-Canal", developer: "OmniCart", desc: "Sincroniza estoque entre Shopify, ML e loja física.", category: "Verticais", vertical: "E-commerce", price: "Pago", monthly: "R$ 99", installs: "4.2k", rating: 4.7, icon: ShoppingBag },
  { name: "Estoque Just-in-Time", developer: "StockAI", desc: "Sugestão de compra por previsão de demanda.", category: "Verticais", price: "Pago", monthly: "R$ 79", installs: "2.1k", rating: 4.5, icon: Package },
];

const CATEGORIES: Category[] = [
  "Destaques",
  "IA & Copilots",
  "Agendamento",
  "Financeiro",
  "Marketing",
  "Atendimento",
  "Logística",
  "Verticais",
];

function priceTone(p: App["price"]) {
  if (p === "Grátis") return "bg-emerald-500/15 text-emerald-700";
  if (p === "Freemium") return "bg-blue-500/15 text-blue-700";
  return "bg-amber-500/15 text-amber-700";
}

function ShowroomMarketplaceApps() {
  const [cat, setCat] = useState<Category>("Destaques");
  const [query, setQuery] = useState("");
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(["WhatsApp Multi-Atendente", "Agenda Inteligente Pro"]),
  );

  const list = useMemo(() => {
    return APPS.filter((a) => {
      const matchCat =
        cat === "Destaques" ? a.featured : a.category === cat;
      const matchQ =
        !query ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.desc.toLowerCase().includes(query.toLowerCase()) ||
        a.developer.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [cat, query]);

  function toggle(name: string) {
    setInstalled((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const top = useMemo(() => APPS.filter((a) => a.featured).slice(0, 3), []);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Store className="h-3 w-3" /> Showroom — Marketplace de Apps
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Estenda a plataforma com 1 clique
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Mais de 120 apps publicados por parceiros, instaláveis sem código e cobrados
              direto na sua fatura. Programa de devs com 70% de revenue share.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar app, dev ou categoria…"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Apps publicados</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">120+</div>
            <div className="text-xs text-muted-foreground">8 categorias</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Devs no programa</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">340</div>
            <div className="text-xs text-muted-foreground">+22% no trimestre</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue share dev</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">70%</div>
            <div className="text-xs text-muted-foreground">após Stripe fees</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sandbox</span>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">100%</div>
            <div className="text-xs text-muted-foreground">isolado por tenant</div>
          </Card>
        </div>
      </section>

      {/* Destaques (carrossel-like) */}
      <section className="container mx-auto px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Em alta esta semana</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecionados pelo time editorial.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" /> Top instalados
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {top.map((a) => {
            const Icon = a.icon;
            return (
              <Card
                key={a.name}
                className="relative overflow-hidden p-6"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                <div className="mb-3 flex items-start justify-between">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  {a.badge && (
                    <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
                      <Sparkles className="mr-1 h-3 w-3" /> {a.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-lg font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground">por {a.developer}</div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.desc}</p>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {a.rating}
                  </span>
                  <span className="text-muted-foreground">{a.installs} instalações</span>
                  <span className={`ml-auto rounded px-2 py-0.5 ${priceTone(a.price)}`}>
                    {a.price}
                    {a.monthly ? ` · ${a.monthly}/mês` : ""}
                  </span>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant={installed.has(a.name) ? "outline" : "default"}
                  onClick={() => toggle(a.name)}
                >
                  {installed.has(a.name) ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Instalado
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" /> Instalar agora
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tabs de categorias */}
      <section className="container mx-auto px-4 py-8">
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cat === c ? "default" : "outline"}
                onClick={() => setCat(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </Card>
      </section>

      {/* Grid de apps */}
      <section className="container mx-auto px-4 pb-4">
        <div className="mb-3 text-sm text-muted-foreground">
          {list.length} app{list.length === 1 ? "" : "s"} em {cat}
        </div>
        {list.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhum app encontrado com os filtros atuais.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => {
              const Icon = a.icon;
              const isInstalled = installed.has(a.name);
              return (
                <Card key={a.name} className="flex flex-col p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      {a.badge && (
                        <Badge variant="outline" className="text-[11px]">
                          {a.badge}
                        </Badge>
                      )}
                      {a.vertical && (
                        <Badge variant="secondary" className="text-[11px]">
                          {a.vertical}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">por {a.developer}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.desc}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {a.rating}
                    </span>
                    <span className="text-muted-foreground">{a.installs}</span>
                    <span className={`ml-auto rounded px-2 py-0.5 ${priceTone(a.price)}`}>
                      {a.price}
                      {a.monthly ? ` · ${a.monthly}` : ""}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      variant={isInstalled ? "outline" : "default"}
                      onClick={() => toggle(a.name)}
                    >
                      {isInstalled ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Instalado
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" /> Instalar
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost">
                      Detalhes
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Para desenvolvedores */}
      <section className="container mx-auto px-4 py-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-8">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Code2 className="h-3 w-3" /> Programa de desenvolvedores
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                Publique seu app e fature recorrente
              </h3>
              <p className="mt-2 text-muted-foreground">
                Use nossa API + SDKs em 5 linguagens. Empacote, publique e receba mensalmente em
                Pix ou transferência internacional.
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <DollarSign className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>
                    <span className="font-medium">70% de revenue share</span> após fees do
                    processador
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Sandbox isolado por tenant + checklist de segurança
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Acesso à base de milhares de negócios ativos
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Co-marketing dos apps em destaque editorial
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/showroom/api-publica">
                    Ver API & SDKs <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/showroom">Voltar ao hub</Link>
                </Button>
              </div>
            </div>

            <div className="border-t bg-muted/30 p-8 md:border-l md:border-t-0">
              <div className="text-sm font-semibold">Como funciona o billing</div>
              <ol className="mt-3 space-y-3 text-sm">
                {[
                  "Cliente instala seu app pelo marketplace",
                  "Cobrança aparece junto da fatura da plataforma",
                  "Repassamos 70% da receita líquida no dia 5",
                  "Você acompanha MRR, churn e LTV no painel do dev",
                ].map((s, i) => (
                  <li key={s} className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </div>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-lg border bg-background p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Política de qualidade
                </div>
                <p className="mt-1">
                  Apps com NPS &lt; 30 ou rating &lt; 4 saem do destaque em até 30 dias.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
