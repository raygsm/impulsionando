import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, MessageCircle, Sparkles, CheckCircle2,
  Calendar, Bot, Users, Share2, Globe, CreditCard, FileText, ShieldCheck,
  BarChart3, Cog, Plug, ShoppingCart, Boxes, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=Ol%C3%A1%2C%20quero%20conhecer%20os%20m%C3%B3dulos%20da%20Impulsionando.";

export const Route = createFileRoute("/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos — Agenda, CRM, WhatsApp, PDV, Pagamentos e BI | Impulsionando Tecnologia" },
      { name: "description", content: "Catálogo completo de módulos: agenda online, WhatsApp, CRM, PDV, estoque, pagamentos, financeiro, emissão fiscal, sites, afiliados, BI e integrações." },
      { property: "og:title", content: "Módulos — Impulsionando Tecnologia" },
      { property: "og:description", content: "Monte seu sistema combinando apenas os módulos que você precisa." },
      { property: "og:url", content: "https://sistemas.impulsionando.com.br/modulos" },
    ],
    links: [{ rel: "canonical", href: "https://sistemas.impulsionando.com.br/modulos" }],
  }),
  component: ModulosPage,
});

type Mod = {
  id: string;
  category: "Atendimento" | "Vendas & Caixa" | "Marketing & Crescimento" | "Gestão & Operação";
  icon: typeof Calendar;
  title: string;
  pitch: string;
  features: string[];
  integrates: string[];
};

const MODULES: Mod[] = [
  {
    id: "agenda",
    category: "Atendimento",
    icon: Calendar,
    title: "Agenda Online",
    pitch: "Agendamento profissional com confirmação, pagamento e lembretes automáticos.",
    features: [
      "Multi-profissional e multi-unidade",
      "Bloqueios, intervalos e regras por serviço",
      "Confirmação por WhatsApp e e-mail",
      "Pré-pagamento opcional",
      "Histórico do cliente",
    ],
    integrates: ["WhatsApp", "Pagamentos", "CRM"],
  },
  {
    id: "whatsapp",
    category: "Atendimento",
    icon: Bot,
    title: "WhatsApp e Agente Virtual",
    pitch: "Atendimento 24/7 com IA, triagem automática e transferência para humano.",
    features: [
      "Agente virtual treinado no seu negócio",
      "Fila inteligente por setor",
      "Respostas rápidas e templates",
      "Histórico unificado por cliente",
      "Etiquetas e indicadores de SLA",
    ],
    integrates: ["CRM", "Agenda", "PDV"],
  },
  {
    id: "crm",
    category: "Marketing & Crescimento",
    icon: Users,
    title: "CRM e Automação",
    pitch: "Funil visual, automações de follow-up e jornada do lead sem cair em planilha.",
    features: [
      "Funis personalizáveis (Kanban)",
      "Automação de e-mail e WhatsApp",
      "Tags, origem e atribuição",
      "Reativação automática",
      "Notas e tarefas por contato",
    ],
    integrates: ["WhatsApp", "Sites", "BI"],
  },
  {
    id: "afiliados",
    category: "Marketing & Crescimento",
    icon: Share2,
    title: "Afiliados e Parceiros",
    pitch: "Programa de indicação com links rastreáveis, comissão automática e painel próprio.",
    features: [
      "Links e cupons únicos",
      "Comissões por venda ou cadastro",
      "Painel do afiliado",
      "Aprovação e pagamento em lote",
    ],
    integrates: ["Pagamentos", "Sites", "CRM"],
  },
  {
    id: "sites",
    category: "Marketing & Crescimento",
    icon: Globe,
    title: "Sites e Landing Pages",
    pitch: "Páginas rápidas, otimizadas para SEO e conectadas ao seu CRM e tráfego pago.",
    features: [
      "Templates por segmento",
      "Formulários integrados ao CRM",
      "Pixel do Meta, Google Tag Manager",
      "Páginas A/B test",
      "Domínio próprio",
    ],
    integrates: ["CRM", "Afiliados", "BI"],
  },
  {
    id: "pdv",
    category: "Vendas & Caixa",
    icon: ShoppingCart,
    title: "PDV / Vendas",
    pitch: "Frente de caixa rápido para balcão, salão, restaurante e prestador de serviço.",
    features: [
      "Pix, cartão, dinheiro e link",
      "Comandas, mesas e delivery",
      "Comissão de vendedor",
      "Cupom não fiscal e SAT/NFC-e",
      "Atalhos por teclado",
    ],
    integrates: ["Estoque", "Financeiro", "Emissão Fiscal"],
  },
  {
    id: "estoque",
    category: "Vendas & Caixa",
    icon: Boxes,
    title: "Estoque",
    pitch: "Entradas, saídas, transferência entre unidades e alertas de mínimo.",
    features: [
      "Curva ABC e giro",
      "Inventário e contagens",
      "Lotes e validade",
      "Custo médio",
      "Alertas de reposição",
    ],
    integrates: ["PDV", "Emissão Fiscal", "BI"],
  },
  {
    id: "pagamentos",
    category: "Vendas & Caixa",
    icon: CreditCard,
    title: "Pagamentos e Baixa Automática",
    pitch: "Pix, cartão, link e assinaturas com confirmação automática no caixa.",
    features: [
      "Gateways nacionais integrados",
      "Assinaturas recorrentes",
      "Split de pagamento",
      "Conciliação automática",
      "Antifraude",
    ],
    integrates: ["PDV", "Financeiro", "Agenda"],
  },
  {
    id: "financeiro",
    category: "Gestão & Operação",
    icon: Wallet,
    title: "Financeiro",
    pitch: "Contas a pagar e receber, fluxo de caixa, DRE simplificado e conciliação.",
    features: [
      "Categorias e centros de custo",
      "Conciliação bancária",
      "Recorrências",
      "DRE gerencial",
      "Exportação contábil",
    ],
    integrates: ["PDV", "Pagamentos", "BI"],
  },
  {
    id: "fiscal",
    category: "Gestão & Operação",
    icon: FileText,
    title: "Emissão Fiscal",
    pitch: "NF-e, NFC-e e NFS-e com regras por município e estado.",
    features: [
      "Emissão automática pós-venda",
      "Regimes Simples e Lucro",
      "Cancelamento e carta de correção",
      "Backup XML",
    ],
    integrates: ["PDV", "Estoque", "Financeiro"],
  },
  {
    id: "usuarios",
    category: "Gestão & Operação",
    icon: ShieldCheck,
    title: "Usuários e Permissões",
    pitch: "Hierarquia, perfis, setores e auditoria para qualquer tamanho de equipe.",
    features: [
      "Perfis e papéis (RBAC)",
      "Permissões por módulo/ação",
      "Multi-unidade",
      "Log de auditoria",
      "SSO opcional",
    ],
    integrates: ["Todos os módulos"],
  },
  {
    id: "bi",
    category: "Gestão & Operação",
    icon: BarChart3,
    title: "Relatórios e BI",
    pitch: "Dashboards prontos e relatórios customizáveis para decisão em tempo real.",
    features: [
      "KPIs por área",
      "Filtros por unidade/equipe/período",
      "Exportação CSV/Excel",
      "Alertas por meta",
    ],
    integrates: ["Todos os módulos"],
  },
  {
    id: "custom",
    category: "Gestão & Operação",
    icon: Cog,
    title: "Sistemas Personalizados",
    pitch: "Quando o padrão não basta: construímos sob medida sobre a mesma base.",
    features: [
      "Levantamento e UX dedicados",
      "Regras de negócio próprias",
      "Roadmap evolutivo",
      "SLA contratual",
    ],
    integrates: ["Qualquer módulo + APIs externas"],
  },
  {
    id: "integracoes",
    category: "Gestão & Operação",
    icon: Plug,
    title: "Integrações",
    pitch: "APIs, webhooks e conectores para ERPs, gateways, marketplaces e ferramentas externas.",
    features: [
      "REST e webhooks",
      "ERPs e contabilidades",
      "Gateways e bancos",
      "WhatsApp Cloud API",
      "Zapier / n8n",
    ],
    integrates: ["Qualquer sistema externo"],
  },
];

const CATEGORIES = ["Atendimento", "Vendas & Caixa", "Marketing & Crescimento", "Gestão & Operação"] as const;

function ModulosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Catálogo de módulos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Tudo que sua operação precisa,<br />em módulos que conversam.
            </h1>
            <p className="text-lg text-white/85 max-w-2xl leading-relaxed">
              Contrate apenas o que faz sentido hoje. Adicione novos módulos quando precisar — sem
              migração, sem perder histórico, sem retrabalho.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento">Montar meu sistema <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Tirar dúvidas
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK NAV */}
      <section className="border-b border-border bg-card sticky top-16 z-30 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <a
              key={c}
              href={`#${slug(c)}`}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary hover:text-primary transition-colors"
            >
              {c}
            </a>
          ))}
        </div>
      </section>

      {/* MODULES BY CATEGORY */}
      {CATEGORIES.map((cat) => {
        const items = MODULES.filter((m) => m.category === cat);
        return (
          <section key={cat} id={slug(cat)} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 scroll-mt-32">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-primary font-semibold">{cat}</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                {labelFor(cat)}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {items.map((m) => (
                <Card key={m.id} className="p-6 hover:shadow-elegant transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                      <m.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold tracking-tight text-lg">{m.title}</div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{m.pitch}</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {m.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Integra com</span>
                    {m.integrates.map((i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px]">
                        {i}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {/* COMBOS */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Combinações que mais funcionam</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Pontos de partida testados em centenas de operações. Você pode customizar à vontade.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: "Combo Atendimento", mods: ["Agenda", "WhatsApp", "CRM"], d: "Cuidar do cliente do primeiro contato à recompra." },
              { t: "Combo Vendas", mods: ["PDV", "Estoque", "Pagamentos"], d: "Operação de balcão pronta para escalar." },
              { t: "Combo Crescimento", mods: ["Sites", "CRM", "Afiliados", "BI"], d: "Estrutura de marketing e indicação com indicadores." },
            ].map((c) => (
              <Card key={c.t} className="p-6 flex flex-col">
                <div className="font-semibold tracking-tight">{c.t}</div>
                <p className="text-sm text-muted-foreground mt-1.5 flex-1 leading-relaxed">{c.d}</p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {c.mods.map((m) => (
                    <span key={m} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">{m}</span>
                  ))}
                </div>
                <Button asChild size="sm" variant="outline" className="mt-5 w-full">
                  <Link to="/orcamento">Quero esse combo</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <Card className="p-10 lg:p-14 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-3xl space-y-5">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Não sabe por onde começar? Nosso briefing decide por você.
            </h2>
            <p className="text-white/85 leading-relaxed">
              Em menos de 1 minuto recomendamos os módulos certos e o plano ideal para a sua operação.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                <Link to="/orcamento">Fazer briefing agora <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link to="/planos">Ver planos e preços</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/&/g, "e").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function labelFor(cat: string) {
  switch (cat) {
    case "Atendimento": return "Atendimento e Relacionamento";
    case "Vendas & Caixa": return "Vendas, Caixa e Operação Comercial";
    case "Marketing & Crescimento": return "Marketing, Aquisição e Crescimento";
    case "Gestão & Operação": return "Gestão, Operação e Plataforma";
    default: return cat;
  }
}
