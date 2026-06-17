import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Plug,
  Search,
  Check,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  Star,
  ShieldCheck,
  Activity,
  Clock,
  MessageCircle,
  CreditCard,
  Calculator,
  Truck,
  ShoppingBag,
  Megaphone,
  BarChart3,
  Database,
  Mail,
  PhoneCall,
} from "lucide-react";

export const Route = createFileRoute("/showroom/integracoes-premium")({
  head: () => ({
    meta: [
      { title: "Integrações Premium — Marketplace | Showroom Impulsionando" },
      {
        name: "description",
        content:
          "Marketplace de integrações oficiais: WhatsApp Business, gateways, contabilidade, ERPs, marketplaces e marketing — adaptado por nicho.",
      },
      { property: "og:title", content: "Integrações Premium — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Mais de 60 conectores oficiais com SLA, sandbox e ativação em 1 clique. Demonstração navegável por nicho.",
      },
    ],
  }),
  component: ShowroomIntegracoes,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Category =
  | "Mensageria"
  | "Pagamentos"
  | "Contabilidade"
  | "ERP"
  | "Marketplace"
  | "Marketing"
  | "Logística"
  | "Dados & BI"
  | "Telefonia"
  | "E-mail";

type Integration = {
  name: string;
  category: Category;
  desc: string;
  installs: string;
  rating: number;
  premium: boolean;
  sla: string;
  recommendedFor: NicheSlug[];
  icon: typeof Plug;
};

const INTEGRATIONS: Integration[] = [
  { name: "WhatsApp Business API", category: "Mensageria", desc: "Templates HSM, multi-atendente, automações e métricas.", installs: "12.4k", rating: 4.9, premium: true, sla: "99,95%", recommendedFor: ["clinicas", "bares", "servicos", "ecommerce"], icon: MessageCircle },
  { name: "Mercado Pago", category: "Pagamentos", desc: "Pix, cartão, link de pagamento e split.", installs: "9.8k", rating: 4.8, premium: false, sla: "99,9%", recommendedFor: ["bares", "ecommerce", "servicos"], icon: CreditCard },
  { name: "Stripe", category: "Pagamentos", desc: "Assinaturas, billing e antifraude global.", installs: "7.2k", rating: 4.8, premium: true, sla: "99,99%", recommendedFor: ["servicos", "ecommerce"], icon: CreditCard },
  { name: "Stone / Pagar.me", category: "Pagamentos", desc: "Adquirência e antecipação automática.", installs: "5.1k", rating: 4.7, premium: false, sla: "99,9%", recommendedFor: ["bares", "ecommerce", "clinicas"], icon: CreditCard },
  { name: "Pix Banco do Brasil", category: "Pagamentos", desc: "QR Pix dinâmico com conciliação automática.", installs: "8.6k", rating: 4.9, premium: false, sla: "99,9%", recommendedFor: ["bares", "cervejarias", "servicos"], icon: CreditCard },
  { name: "Conta Azul", category: "Contabilidade", desc: "NF-e/NFS-e, plano de contas e DRE.", installs: "6.4k", rating: 4.6, premium: false, sla: "99,9%", recommendedFor: ["servicos", "clinicas", "cervejarias"], icon: Calculator },
  { name: "Omie", category: "ERP", desc: "Gestão financeira, fiscal e CRM integrados.", installs: "5.9k", rating: 4.5, premium: true, sla: "99,9%", recommendedFor: ["servicos", "ecommerce"], icon: Database },
  { name: "Bling ERP", category: "ERP", desc: "Estoque multi-canal e emissão de NF.", installs: "7.1k", rating: 4.6, premium: false, sla: "99,9%", recommendedFor: ["ecommerce", "cervejarias"], icon: Database },
  { name: "iFood Gestor", category: "Marketplace", desc: "Pedidos, cardápio e KDS em tempo real.", installs: "4.8k", rating: 4.7, premium: false, sla: "99,9%", recommendedFor: ["bares"], icon: ShoppingBag },
  { name: "Mercado Livre", category: "Marketplace", desc: "Anúncios, estoque e expedição Full.", installs: "5.7k", rating: 4.5, premium: true, sla: "99,9%", recommendedFor: ["ecommerce", "cervejarias"], icon: ShoppingBag },
  { name: "Shopify", category: "Marketplace", desc: "Sincronização de produtos, pedidos e clientes.", installs: "4.3k", rating: 4.8, premium: true, sla: "99,99%", recommendedFor: ["ecommerce"], icon: ShoppingBag },
  { name: "Meta Ads", category: "Marketing", desc: "Eventos do CAPI, audiências e ROAS por canal.", installs: "9.1k", rating: 4.6, premium: true, sla: "99,9%", recommendedFor: ["clinicas", "ecommerce", "servicos", "bares"], icon: Megaphone },
  { name: "Google Ads", category: "Marketing", desc: "Conversões offline e Enhanced Conversions.", installs: "8.4k", rating: 4.7, premium: true, sla: "99,9%", recommendedFor: ["clinicas", "ecommerce", "servicos"], icon: Megaphone },
  { name: "Mailchimp", category: "E-mail", desc: "Listas, automações e relatórios de campanha.", installs: "3.9k", rating: 4.4, premium: false, sla: "99,9%", recommendedFor: ["ecommerce", "servicos"], icon: Mail },
  { name: "Resend", category: "E-mail", desc: "Transacionais com alta entregabilidade.", installs: "2.7k", rating: 4.8, premium: false, sla: "99,99%", recommendedFor: ["servicos", "ecommerce"], icon: Mail },
  { name: "Twilio Voice", category: "Telefonia", desc: "Click-to-call, IVR e gravação.", installs: "1.8k", rating: 4.5, premium: true, sla: "99,95%", recommendedFor: ["clinicas", "servicos"], icon: PhoneCall },
  { name: "Melhor Envio", category: "Logística", desc: "Cotação multi-transportadora e etiquetas.", installs: "4.2k", rating: 4.6, premium: false, sla: "99,9%", recommendedFor: ["ecommerce", "cervejarias"], icon: Truck },
  { name: "Frenet", category: "Logística", desc: "Frete em tempo real e rastreamento.", installs: "2.9k", rating: 4.4, premium: false, sla: "99,9%", recommendedFor: ["ecommerce"], icon: Truck },
  { name: "Google Analytics 4", category: "Dados & BI", desc: "Eventos, conversões e funis e-commerce.", installs: "10.2k", rating: 4.5, premium: false, sla: "99,9%", recommendedFor: ["ecommerce", "servicos", "clinicas", "bares"], icon: BarChart3 },
  { name: "Looker Studio", category: "Dados & BI", desc: "Dashboards conectados ao data warehouse.", installs: "3.6k", rating: 4.6, premium: true, sla: "99,9%", recommendedFor: ["servicos", "ecommerce", "cervejarias"], icon: BarChart3 },
];

const CATEGORIES: Category[] = [
  "Mensageria",
  "Pagamentos",
  "Contabilidade",
  "ERP",
  "Marketplace",
  "Marketing",
  "Logística",
  "Dados & BI",
  "Telefonia",
  "E-mail",
];

const NICHES: { slug: NicheSlug | "todos"; label: string }[] = [
  { slug: "todos", label: "Todos" },
  { slug: "clinicas", label: "Clínicas" },
  { slug: "bares", label: "Bares" },
  { slug: "cervejarias", label: "Cervejarias" },
  { slug: "servicos", label: "Serviços" },
  { slug: "ecommerce", label: "E-commerce" },
];

function ShowroomIntegracoes() {
  const [niche, setNiche] = useState<NicheSlug | "todos">("todos");
  const [category, setCategory] = useState<Category | "todas">("todas");
  const [query, setQuery] = useState("");
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(["WhatsApp Business API", "Pix Banco do Brasil", "Google Analytics 4"]),
  );

  const list = useMemo(() => {
    return INTEGRATIONS.filter((i) => {
      const matchNiche = niche === "todos" || i.recommendedFor.includes(niche);
      const matchCat = category === "todas" || i.category === category;
      const matchQ =
        !query ||
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.desc.toLowerCase().includes(query.toLowerCase());
      return matchNiche && matchCat && matchQ;
    });
  }, [niche, category, query]);

  const stats = useMemo(() => {
    const total = INTEGRATIONS.length;
    const installedCount = installed.size;
    const coverage = Math.round((installedCount / total) * 100);
    const premium = INTEGRATIONS.filter((i) => i.premium).length;
    return { total, installedCount, coverage, premium };
  }, [installed]);

  function toggle(name: string) {
    setInstalled((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Plug className="h-3 w-3" /> Showroom — Integrações Premium
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Conecte sua operação ao ecossistema todo
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Mais de 60 integrações oficiais com sandbox, SLA e ativação em 1 clique. Filtre por
              nicho e categoria, e veja recomendações inteligentes.
            </p>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conectores disponíveis</span>
              <Plug className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">{stats.total}+</div>
            <div className="text-xs text-muted-foreground">{stats.premium} premium</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instalados (demo)</span>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">{stats.installedCount}</div>
            <Progress value={stats.coverage} className="mt-2 h-1.5" />
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SLA médio</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">99,93%</div>
            <div className="text-xs text-muted-foreground">últimos 90 dias</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tempo de ativação</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">~4min</div>
            <div className="text-xs text-muted-foreground">OAuth + teste guiado</div>
          </Card>
        </div>
      </section>

      {/* Filtros */}
      <section className="container mx-auto px-4 py-4">
        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar integração…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Button
              size="sm"
              variant={category === "todas" ? "default" : "outline"}
              onClick={() => setCategory("todas")}
            >
              Todas as categorias
            </Button>
            {CATEGORIES.map((c) => (
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
        </Card>
      </section>

      {/* Grid de integrações */}
      <section className="container mx-auto px-4 py-6">
        <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {list.length} resultado{list.length === 1 ? "" : "s"}
          </span>
          {niche !== "todos" && (
            <span className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> Recomendações para {niche}
            </span>
          )}
        </div>

        {list.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhuma integração encontrada com os filtros atuais.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((i) => {
              const Icon = i.icon;
              const isInstalled = installed.has(i.name);
              return (
                <Card key={i.name} className="flex flex-col p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {i.premium && (
                      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
                        <Star className="mr-1 h-3 w-3" /> Premium
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{i.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{i.category}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{i.desc}</p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {i.rating}
                    </span>
                    <span>· {i.installs} instalações</span>
                    <span className="ml-auto flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> {i.sla}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      variant={isInstalled ? "outline" : "default"}
                      onClick={() => toggle(i.name)}
                    >
                      {isInstalled ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Instalado
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" /> Conectar
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

      {/* Como funciona */}
      <section className="container mx-auto px-4 py-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-8">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Zap className="h-3 w-3" /> Ativação em 1 clique
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                OAuth, sandbox e teste guiado — sem código
              </h3>
              <ol className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Escolha o conector</div>
                    <div className="text-xs text-muted-foreground">
                      Filtre por nicho ou categoria.
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Autorize via OAuth</div>
                    <div className="text-xs text-muted-foreground">
                      Sem copiar token; permissões mínimas necessárias.
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Teste em sandbox</div>
                    <div className="text-xs text-muted-foreground">
                      Dispara um evento de exemplo e valida resposta antes de ir ao ar.
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    4
                  </div>
                  <div>
                    <div className="font-medium">Monitore SLA e custos</div>
                    <div className="text-xs text-muted-foreground">
                      Health-check, retries automáticos e alerta de divergência.
                    </div>
                  </div>
                </li>
              </ol>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/showroom/automacoes">
                    Combinar com automações <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/showroom">Voltar ao hub</Link>
                </Button>
              </div>
            </div>

            <div className="border-t bg-muted/30 p-8 md:border-l md:border-t-0">
              <div className="text-sm font-semibold">Garantias da plataforma</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Tokens criptografados em cofre dedicado (AES-256)
                </li>
                <li className="flex items-start gap-2">
                  <Activity className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Health-check a cada 60s + retry exponencial
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Logs detalhados com retenção de 90 dias
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Versionamento de webhooks com rollback
                </li>
              </ul>

              <div className="mt-6 rounded-lg border bg-background p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Não encontrou seu sistema?
                </div>
                <p className="mt-1 text-sm">
                  Construímos conectores sob demanda em até{" "}
                  <span className="font-semibold">10 dias úteis</span> via nosso programa
                  Integrations-as-a-Service.
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
