import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Sparkles,
  Globe,
  Layout,
  Image as ImageIcon,
  Star,
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  CheckCircle2,
  Smartphone,
  Monitor,
  Plus,
  GripVertical,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/showroom/site")({
  head: () => ({
    meta: [
      { title: "Mini construtor de site por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Monte um site/landing pronto para o seu nicho: hero, serviços, agenda, depoimentos, mapa, formulário e CTA — tudo integrado ao ecossistema Impulsionando.",
      },
      {
        property: "og:title",
        content: "Construtor de site por nicho — Showroom Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Seções pré-prontas, dados realistas e preview ao vivo de um site profissional por segmento.",
      },
    ],
  }),
  component: ShowroomSite,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type SectionKey =
  | "hero"
  | "services"
  | "gallery"
  | "agenda"
  | "menu"
  | "testimonials"
  | "map"
  | "form"
  | "cta";

type Section = {
  key: SectionKey;
  label: string;
  enabled: boolean;
};

type Cfg = {
  brand: string;
  tagline: string;
  primary: string;
  hero: { eyebrow: string; title: string; sub: string; cta: string; img: string };
  services: { name: string; desc: string; price: string }[];
  gallery: string[];
  testimonials: { name: string; text: string; rating: number }[];
  contact: { phone: string; address: string; hours: string };
  defaultSections: Section[];
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brand: "Clínica Vitalis",
    tagline: "Saúde integrada, cuidado humano",
    primary: "from-emerald-500 to-teal-600",
    hero: {
      eyebrow: "Clínica multidisciplinar",
      title: "Cuidado que transforma sua qualidade de vida",
      sub: "Mais de 18 especialidades, agenda online 24h e atendimento humanizado em um só lugar.",
      cta: "Agendar consulta",
      img: "linear-gradient(135deg,#10b981,#0d9488)",
    },
    services: [
      { name: "Cardiologia", desc: "Check-ups, ecocardiograma, holter", price: "R$ 280" },
      { name: "Dermatologia", desc: "Clínica, estética e cirúrgica", price: "R$ 320" },
      { name: "Nutrição", desc: "Acompanhamento e bioimpedância", price: "R$ 240" },
      { name: "Psicologia", desc: "TCC, casal e infantil", price: "R$ 220" },
    ],
    gallery: [
      "linear-gradient(135deg,#a7f3d0,#34d399)",
      "linear-gradient(135deg,#bae6fd,#38bdf8)",
      "linear-gradient(135deg,#fde68a,#fbbf24)",
      "linear-gradient(135deg,#fbcfe8,#f472b6)",
    ],
    testimonials: [
      { name: "Mariana A.", text: "Atendimento impecável e agenda online muito prática.", rating: 5 },
      { name: "Rafael S.", text: "Equipe atenciosa, recebi resultados pelo WhatsApp em horas.", rating: 5 },
      { name: "Patrícia L.", text: "Estrutura moderna e protocolos de segurança rigorosos.", rating: 5 },
    ],
    contact: {
      phone: "(11) 4002-8922",
      address: "Av. Paulista, 1.578 — Bela Vista, SP",
      hours: "Seg–Sex 7h–21h • Sáb 8h–14h",
    },
    defaultSections: [
      { key: "hero", label: "Hero", enabled: true },
      { key: "services", label: "Especialidades", enabled: true },
      { key: "agenda", label: "Agendamento", enabled: true },
      { key: "testimonials", label: "Depoimentos", enabled: true },
      { key: "gallery", label: "Estrutura", enabled: true },
      { key: "map", label: "Localização", enabled: true },
      { key: "form", label: "Contato", enabled: true },
      { key: "cta", label: "CTA final", enabled: true },
      { key: "menu", label: "Cardápio", enabled: false },
    ],
  },
  bares: {
    brand: "Bar do Rei",
    tagline: "Chopp gelado, música boa e galera certa",
    primary: "from-amber-500 to-orange-600",
    hero: {
      eyebrow: "Bar & música ao vivo",
      title: "Onde a sexta começa às quintas",
      sub: "Chopp artesanal, drinks autorais e shows ao vivo de quinta a sábado.",
      cta: "Reservar mesa",
      img: "linear-gradient(135deg,#f59e0b,#ea580c)",
    },
    services: [
      { name: "Reserva de mesa", desc: "Sem fila, com confirmação no WhatsApp", price: "Grátis" },
      { name: "Aniversários", desc: "Decoração + bolo + brinde", price: "A partir R$ 390" },
      { name: "Open bar", desc: "Pacote 3h com 4 chopps + drinks", price: "R$ 99/pessoa" },
      { name: "Reserva camarote", desc: "Vista pro palco, atendimento exclusivo", price: "R$ 600" },
    ],
    gallery: [
      "linear-gradient(135deg,#fde047,#f59e0b)",
      "linear-gradient(135deg,#fdba74,#ea580c)",
      "linear-gradient(135deg,#fca5a5,#dc2626)",
      "linear-gradient(135deg,#fcd34d,#d97706)",
    ],
    testimonials: [
      { name: "Lucas P.", text: "Melhor chopp da região, atendimento rápido!", rating: 5 },
      { name: "Camila R.", text: "Reservei pelo site, foi tudo perfeito no aniversário.", rating: 5 },
      { name: "Diego M.", text: "Som ao vivo top, ambiente animado mas confortável.", rating: 4 },
    ],
    contact: {
      phone: "(11) 95555-0042",
      address: "R. Aspicuelta, 412 — Vila Madalena, SP",
      hours: "Qui–Sáb 18h–02h • Dom 16h–23h",
    },
    defaultSections: [
      { key: "hero", label: "Hero", enabled: true },
      { key: "menu", label: "Cardápio", enabled: true },
      { key: "agenda", label: "Reservas", enabled: true },
      { key: "gallery", label: "Galeria", enabled: true },
      { key: "testimonials", label: "Depoimentos", enabled: true },
      { key: "map", label: "Como chegar", enabled: true },
      { key: "form", label: "Eventos", enabled: true },
      { key: "cta", label: "CTA final", enabled: true },
      { key: "services", label: "Pacotes", enabled: true },
    ],
  },
  cervejarias: {
    brand: "Hops & Co.",
    tagline: "Cervejaria artesanal independente",
    primary: "from-yellow-500 to-amber-700",
    hero: {
      eyebrow: "Brewpub & taproom",
      title: "Da panela à sua taça, em 7 dias",
      sub: "12 torneiras rotativas, brew tours guiados e clube de assinatura de cervejas raras.",
      cta: "Reservar tour",
      img: "linear-gradient(135deg,#eab308,#b45309)",
    },
    services: [
      { name: "Brew Tour", desc: "Visita guiada + degustação de 5 rótulos", price: "R$ 89" },
      { name: "Clube Hops", desc: "6 cervejas exclusivas/mês na sua casa", price: "R$ 159/mês" },
      { name: "Taproom", desc: "12 torneiras com flight de 4 doses", price: "R$ 42" },
      { name: "Brassagem coletiva", desc: "Faça sua cerveja com nosso mestre", price: "R$ 320" },
    ],
    gallery: [
      "linear-gradient(135deg,#fcd34d,#b45309)",
      "linear-gradient(135deg,#fde68a,#92400e)",
      "linear-gradient(135deg,#fed7aa,#c2410c)",
      "linear-gradient(135deg,#facc15,#a16207)",
    ],
    testimonials: [
      { name: "André B.", text: "Tour incrível, mestre cervejeiro super didático.", rating: 5 },
      { name: "Renata F.", text: "Assinatura do clube é o melhor presente que me dei.", rating: 5 },
      { name: "Tiago O.", text: "IPAs surpreendentes, voltarei toda semana.", rating: 5 },
    ],
    contact: {
      phone: "(48) 3025-7700",
      address: "R. Bocaiúva, 2.345 — Centro, Florianópolis",
      hours: "Ter–Dom 16h–24h",
    },
    defaultSections: [
      { key: "hero", label: "Hero", enabled: true },
      { key: "menu", label: "Rótulos na torneira", enabled: true },
      { key: "services", label: "Tours & Clube", enabled: true },
      { key: "agenda", label: "Reserva de tour", enabled: true },
      { key: "gallery", label: "A fábrica", enabled: true },
      { key: "testimonials", label: "Depoimentos", enabled: true },
      { key: "map", label: "Localização", enabled: true },
      { key: "form", label: "Eventos & corporativo", enabled: true },
      { key: "cta", label: "CTA final", enabled: true },
    ],
  },
  servicos: {
    brand: "FixPro Serviços",
    tagline: "Reformas e manutenção sem dor de cabeça",
    primary: "from-blue-500 to-indigo-700",
    hero: {
      eyebrow: "Reformas, elétrica & hidráulica",
      title: "Orçamento em 1 hora. Serviço com garantia.",
      sub: "Equipe própria, técnicos certificados e garantia escrita de 12 meses em todo serviço.",
      cta: "Pedir orçamento",
      img: "linear-gradient(135deg,#3b82f6,#4338ca)",
    },
    services: [
      { name: "Elétrica residencial", desc: "Quadros, tomadas, iluminação", price: "Sob medida" },
      { name: "Hidráulica", desc: "Vazamentos, trocas, novas instalações", price: "Sob medida" },
      { name: "Pintura completa", desc: "Interna e externa, com material", price: "R$ 28/m²" },
      { name: "Reforma de cozinha", desc: "Projeto + execução turn-key", price: "Sob projeto" },
    ],
    gallery: [
      "linear-gradient(135deg,#bfdbfe,#3b82f6)",
      "linear-gradient(135deg,#c7d2fe,#6366f1)",
      "linear-gradient(135deg,#ddd6fe,#7c3aed)",
      "linear-gradient(135deg,#bae6fd,#0284c7)",
    ],
    testimonials: [
      { name: "Família Costa", text: "Reforma entregue antes do prazo e dentro do orçamento.", rating: 5 },
      { name: "Edif. Aurora", text: "Atende prédios inteiros com agilidade incrível.", rating: 5 },
      { name: "Joana P.", text: "Voltaram para um ajuste sem cobrar, garantia funciona!", rating: 5 },
    ],
    contact: {
      phone: "0800 123 4567",
      address: "Atendimento em toda a Grande SP",
      hours: "Seg–Sáb 7h–20h • Plantão 24h",
    },
    defaultSections: [
      { key: "hero", label: "Hero", enabled: true },
      { key: "services", label: "Serviços", enabled: true },
      { key: "gallery", label: "Antes & depois", enabled: true },
      { key: "form", label: "Orçamento", enabled: true },
      { key: "testimonials", label: "Depoimentos", enabled: true },
      { key: "agenda", label: "Agendamento de visita", enabled: true },
      { key: "map", label: "Área de atendimento", enabled: true },
      { key: "cta", label: "CTA final", enabled: true },
      { key: "menu", label: "Tabela", enabled: false },
    ],
  },
  ecommerce: {
    brand: "Loja Norte",
    tagline: "Moda autoral feita no Brasil",
    primary: "from-pink-500 to-rose-600",
    hero: {
      eyebrow: "E-commerce + retirada na loja",
      title: "Peças únicas, entrega em 24h na capital",
      sub: "Coleção limitada, frete grátis acima de R$ 250 e troca fácil em 30 dias.",
      cta: "Comprar agora",
      img: "linear-gradient(135deg,#ec4899,#e11d48)",
    },
    services: [
      { name: "Drop semanal", desc: "Novidades toda quinta às 19h", price: "Receber alertas" },
      { name: "Clube Norte", desc: "10% off vitalício + frete grátis", price: "R$ 19/mês" },
      { name: "Personal shopper", desc: "Curadoria por WhatsApp", price: "Grátis" },
      { name: "Retirada em loja", desc: "Em 2h após o pedido", price: "Sem custo" },
    ],
    gallery: [
      "linear-gradient(135deg,#fbcfe8,#ec4899)",
      "linear-gradient(135deg,#fecdd3,#e11d48)",
      "linear-gradient(135deg,#fde68a,#f59e0b)",
      "linear-gradient(135deg,#ddd6fe,#8b5cf6)",
    ],
    testimonials: [
      { name: "Bruna L.", text: "Chegou no dia seguinte e a qualidade é absurda.", rating: 5 },
      { name: "Marina T.", text: "Personal shopper acertou tudo, virei cliente fiel.", rating: 5 },
      { name: "Helena R.", text: "Troca foi resolvida em 1 mensagem. Amei!", rating: 5 },
    ],
    contact: {
      phone: "(11) 3030-1212",
      address: "R. Oscar Freire, 909 — Jardins, SP",
      hours: "Seg–Sáb 10h–20h • Dom 12h–18h",
    },
    defaultSections: [
      { key: "hero", label: "Hero", enabled: true },
      { key: "gallery", label: "Coleção destaque", enabled: true },
      { key: "services", label: "Benefícios", enabled: true },
      { key: "testimonials", label: "Avaliações", enabled: true },
      { key: "form", label: "Newsletter", enabled: true },
      { key: "map", label: "Loja física", enabled: true },
      { key: "cta", label: "CTA final", enabled: true },
      { key: "agenda", label: "Agendar provador", enabled: false },
      { key: "menu", label: "Catálogo", enabled: false },
    ],
  },
};

const NICHE_LABELS: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  cervejarias: "Microcervejarias",
  servicos: "Serviços & Reformas",
  ecommerce: "E-commerce & Varejo",
};

function ShowroomSite() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const cfg = DATA[niche];
  const [sections, setSections] = useState<Section[]>(cfg.defaultSections);

  // Reset section state when niche changes
  useMemo(() => {
    setSections(DATA[niche].defaultSections);
  }, [niche]);

  const enabled = sections.filter((s) => s.enabled);

  const toggle = (key: SectionKey) =>
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s)),
    );

  const move = (idx: number, dir: -1 | 1) =>
    setSections((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Globe className="h-3 w-3" /> Mini construtor de site
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                Seu site profissional, pronto em minutos
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">
                Escolha um nicho, organize as seções e veja o preview ao vivo. Tudo já integrado a
                agenda, WhatsApp, pagamentos e CRM da Impulsionando.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={niche} onValueChange={(v) => setNiche(v as NicheSlug)}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(NICHE_LABELS) as NicheSlug[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {NICHE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex rounded-md border p-1">
                <Button
                  size="sm"
                  variant={device === "desktop" ? "default" : "ghost"}
                  onClick={() => setDevice("desktop")}
                  className="gap-1"
                >
                  <Monitor className="h-4 w-4" /> Desktop
                </Button>
                <Button
                  size="sm"
                  variant={device === "mobile" ? "default" : "ghost"}
                  onClick={() => setDevice("mobile")}
                  className="gap-1"
                >
                  <Smartphone className="h-4 w-4" /> Mobile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Builder + Preview */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar: seções */}
          <Card className="h-fit p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Seções da página</h3>
              <Badge variant="outline">{enabled.length} ativas</Badge>
            </div>
            <ul className="space-y-2">
              {sections.map((s, idx) => (
                <li
                  key={s.key}
                  className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                    s.enabled ? "bg-background" : "bg-muted/40 opacity-70"
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{s.label}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => move(idx, -1)}
                    aria-label="Subir"
                  >
                    ↑
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => move(idx, 1)}
                    aria-label="Descer"
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant={s.enabled ? "secondary" : "outline"}
                    className="h-7 px-2"
                    onClick={() => toggle(s.key)}
                  >
                    {s.enabled ? "On" : "Off"}
                  </Button>
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full gap-1" variant="outline" disabled>
              <Plus className="h-4 w-4" /> Adicionar seção (em breve)
            </Button>

            <div className="mt-6 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Pronto para publicar</p>
              <p className="mt-1">
                Domínio próprio, SSL, SEO técnico e performance Lighthouse 95+ inclusos em todos os
                planos.
              </p>
            </div>
          </Card>

          {/* Preview frame */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                Preview ao vivo •{" "}
                <span className="font-medium text-foreground">{cfg.brand}</span>
              </div>
              <div className="hidden gap-2 sm:flex">
                <Button asChild size="sm" variant="outline">
                  <Link to="/showroom">← Voltar ao hub</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/contato">
                    Quero meu site <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-muted/30 p-4">
              <div
                className={`mx-auto overflow-hidden rounded-lg bg-background shadow-xl transition-all ${
                  device === "mobile" ? "max-w-[380px]" : "max-w-full"
                }`}
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <div className="ml-3 flex-1 truncate rounded bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    https://{cfg.brand.toLowerCase().replace(/[^a-z0-9]/g, "")}.com.br
                  </div>
                </div>

                {/* Site preview */}
                <div className="max-h-[78vh] overflow-y-auto">
                  <SiteHeader cfg={cfg} />
                  {enabled.map((s) => (
                    <SectionRenderer key={s.key} k={s.key} cfg={cfg} device={device} />
                  ))}
                  <SiteFooter cfg={cfg} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Site, agenda, pagamento e WhatsApp no mesmo lugar
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Toda lead capturada cai direto no CRM, agendamentos sincronizam com a equipe e o
            checkout libera o serviço automaticamente. Zero retrabalho.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Quero meu site</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom">Ver outros showrooms</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function SiteHeader({ cfg }: { cfg: Cfg }) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded bg-gradient-to-br ${cfg.primary}`} />
        <span className="text-sm font-semibold">{cfg.brand}</span>
      </div>
      <nav className="hidden gap-4 text-xs text-muted-foreground md:flex">
        <span>Início</span>
        <span>Serviços</span>
        <span>Sobre</span>
        <span>Contato</span>
      </nav>
      <button
        className={`rounded-md bg-gradient-to-r ${cfg.primary} px-3 py-1.5 text-xs font-medium text-white`}
      >
        {cfg.hero.cta}
      </button>
    </header>
  );
}

function SiteFooter({ cfg }: { cfg: Cfg }) {
  return (
    <footer className="border-t bg-muted/40 px-6 py-6 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          © {new Date().getFullYear()} {cfg.brand}. Todos os direitos reservados.
        </span>
        <span className="flex items-center gap-1">
          Site feito com <Sparkles className="h-3 w-3" /> Impulsionando
        </span>
      </div>
    </footer>
  );
}

function SectionRenderer({
  k,
  cfg,
  device,
}: {
  k: SectionKey;
  cfg: Cfg;
  device: "desktop" | "mobile";
}) {
  switch (k) {
    case "hero":
      return (
        <section
          className="px-6 py-12 text-white"
          style={{ background: cfg.hero.img }}
        >
          <p className="text-xs uppercase tracking-widest opacity-90">{cfg.hero.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight md:text-4xl">{cfg.hero.title}</h2>
          <p className="mt-3 max-w-xl text-sm opacity-95 md:text-base">{cfg.hero.sub}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-foreground">
              {cfg.hero.cta}
            </button>
            <button className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white">
              Falar no WhatsApp
            </button>
          </div>
        </section>
      );
    case "services":
      return (
        <section className="px-6 py-10">
          <h3 className="text-lg font-semibold md:text-xl">Nossos serviços</h3>
          <div
            className={`mt-4 grid gap-3 ${
              device === "mobile" ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {cfg.services.map((s) => (
              <div key={s.name} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <Badge variant="secondary">{s.price}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "gallery":
      return (
        <section className="px-6 py-10">
          <h3 className="text-lg font-semibold md:text-xl">Galeria</h3>
          <div
            className={`mt-4 grid gap-2 ${
              device === "mobile" ? "grid-cols-2" : "grid-cols-4"
            }`}
          >
            {cfg.gallery.map((g, i) => (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{ background: g }}
                aria-hidden
              />
            ))}
          </div>
        </section>
      );
    case "agenda":
      return (
        <section className="bg-muted/40 px-6 py-10">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h3 className="text-lg font-semibold md:text-xl">Agende em segundos</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o serviço, o horário e receba a confirmação no WhatsApp.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs sm:grid-cols-7">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
              <div
                key={d}
                className={`rounded-md border p-2 ${
                  i === 2 ? "border-foreground bg-background font-semibold" : "bg-background/60"
                }`}
              >
                <p className="text-muted-foreground">{d}</p>
                <p className="mt-1">{10 + i}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["09:00", "10:30", "13:00", "15:00", "17:30", "19:00"].map((h, i) => (
              <span
                key={h}
                className={`rounded border px-2 py-1 text-xs ${
                  i === 2 ? "bg-foreground text-background" : "bg-background"
                }`}
              >
                {h}
              </span>
            ))}
          </div>
        </section>
      );
    case "menu":
      return (
        <section className="px-6 py-10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h3 className="text-lg font-semibold md:text-xl">Cardápio em destaque</h3>
          </div>
          <ul className="mt-4 divide-y rounded-lg border">
            {cfg.services.slice(0, 4).map((s) => (
              <li key={s.name} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <span className="text-sm font-semibold">{s.price}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    case "testimonials":
      return (
        <section className="px-6 py-10">
          <h3 className="text-lg font-semibold md:text-xl">O que nossos clientes dizem</h3>
          <div
            className={`mt-4 grid gap-3 ${
              device === "mobile" ? "grid-cols-1" : "grid-cols-3"
            }`}
          >
            {cfg.testimonials.map((t) => (
              <div key={t.name} className="rounded-lg border p-4">
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-2 text-sm">"{t.text}"</p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">— {t.name}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "map":
      return (
        <section className="px-6 py-10">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h3 className="text-lg font-semibold md:text-xl">Onde estamos</h3>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div
              className="h-44 rounded-lg border bg-[linear-gradient(135deg,#dbeafe,#bfdbfe)]"
              aria-hidden
            >
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Mapa interativo
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> {cfg.contact.address}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> {cfg.contact.phone}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> {cfg.contact.hours}
              </p>
            </div>
          </div>
        </section>
      );
    case "form":
      return (
        <section className="bg-muted/40 px-6 py-10">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold md:text-xl">Fale com a gente</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Nome" className="bg-background" />
            <Input placeholder="WhatsApp" className="bg-background" />
            <Input placeholder="E-mail" className="bg-background md:col-span-2" />
            <Textarea
              placeholder="Conte rapidamente o que você precisa"
              className="bg-background md:col-span-2"
              rows={3}
            />
          </div>
          <Button className="mt-3 gap-1">
            Enviar mensagem <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      );
    case "cta":
      return (
        <section
          className={`bg-gradient-to-r ${cfg.primary} px-6 py-10 text-center text-white`}
        >
          <h3 className="text-xl font-bold md:text-2xl">{cfg.tagline}</h3>
          <p className="mt-1 text-sm opacity-95">
            Comece agora mesmo — atendimento humano em até 5 minutos.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-foreground">
              {cfg.hero.cta}
            </button>
            <button className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white">
              Ligar agora
            </button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs opacity-90">
            <CheckCircle2 className="h-3 w-3" /> Garantia de satisfação
          </p>
        </section>
      );
    default:
      return (
        <section className="px-6 py-10">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Seção em construção. Em breve no construtor visual.
          </p>
        </section>
      );
  }
}

export default ShowroomSite;
