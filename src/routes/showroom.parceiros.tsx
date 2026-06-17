import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Handshake,
  Link2,
  Copy,
  Coins,
  TrendingUp,
  Users,
  Trophy,
  Megaphone,
  Crown,
  Star,
  Download,
  Sparkles,
  CheckCircle2,
  Clock,
  Share2,
  ArrowRight,
  BadgeCheck,
  Gift,
} from "lucide-react";

export const Route = createFileRoute("/showroom/parceiros")({
  head: () => ({
    meta: [
      { title: "Programa de parceiros por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Programa de parceiros, afiliados e indicações: comissões recorrentes, materiais prontos e ranking — adaptado por nicho.",
      },
      { property: "og:title", content: "Parceiros — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Demo navegável: links de indicação, comissões em tempo real, ranking, materiais e portal do parceiro.",
      },
    ],
  }),
  component: ShowroomParceiros,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";
type Persona = "gestor" | "parceiro";

type PartnerRow = {
  id: string;
  name: string;
  segment: string;
  tier: "Bronze" | "Prata" | "Ouro" | "Platinum";
  referrals: number;
  conversion: number; // %
  commission: number; // R$
  status: "ativo" | "pendente" | "pausado";
};

type Tx = { id: string; date: string; partner: string; type: "indicacao" | "recorrente" | "bônus"; amount: number; status: "pago" | "aprovado" | "pendente" };

type Material = { id: string; title: string; kind: "Banner" | "E-book" | "Vídeo" | "E-mail" | "Apresentação"; size: string };

type TierCfg = { name: string; min: number; pct: number; perks: string[] };

type Cfg = {
  brand: string;
  hero: string;
  segmentLabel: string;
  partnerLabel: string;
  baseCommissionPct: number;
  recurringMonths: number;
  partners: PartnerRow[];
  txs: Tx[];
  materials: Material[];
  tiers: TierCfg[];
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brand: "Aurora Partners",
    hero: "Indicação de clínicas, dentistas e profissionais de estética — comissão recorrente por 12 meses.",
    segmentLabel: "Profissionais de saúde, contadores e consultores clínicos",
    partnerLabel: "Profissionais indicadores",
    baseCommissionPct: 15,
    recurringMonths: 12,
    partners: [
      { id: "p1", name: "Dra. Camila Sá", segment: "Dermatologista", tier: "Platinum", referrals: 24, conversion: 62, commission: 18420, status: "ativo" },
      { id: "p2", name: "Consultoria MedFin", segment: "Consultor clínico", tier: "Ouro", referrals: 14, conversion: 48, commission: 9840, status: "ativo" },
      { id: "p3", name: "Dr. Eduardo Tavares", segment: "Cirurgião plástico", tier: "Prata", referrals: 6, conversion: 38, commission: 3120, status: "ativo" },
      { id: "p4", name: "Contábil SaúdeMais", segment: "Contador", tier: "Bronze", referrals: 2, conversion: 22, commission: 640, status: "pendente" },
    ],
    txs: [
      { id: "t1", date: "12/06", partner: "Dra. Camila Sá", type: "recorrente", amount: 1240, status: "pago" },
      { id: "t2", date: "10/06", partner: "Consultoria MedFin", type: "indicacao", amount: 1840, status: "aprovado" },
      { id: "t3", date: "08/06", partner: "Dr. Eduardo Tavares", type: "bônus", amount: 500, status: "pago" },
      { id: "t4", date: "05/06", partner: "Contábil SaúdeMais", type: "indicacao", amount: 320, status: "pendente" },
    ],
    materials: [
      { id: "m1", title: "Banner — Aurora para clínicas", kind: "Banner", size: "1080x1080" },
      { id: "m2", title: "E-book: Gestão clínica em 7 passos", kind: "E-book", size: "PDF · 32p" },
      { id: "m3", title: "Vídeo demo de 90s", kind: "Vídeo", size: "MP4 · 24MB" },
      { id: "m4", title: "Sequência de e-mails (4)", kind: "E-mail", size: "HTML" },
    ],
    tiers: [
      { name: "Bronze", min: 0, pct: 10, perks: ["Link de indicação", "Materiais básicos"] },
      { name: "Prata", min: 5, pct: 12, perks: ["Suporte prioritário", "Comissão recorrente 6m"] },
      { name: "Ouro", min: 12, pct: 15, perks: ["Co-marketing", "Recorrente 12m", "Eventos VIP"] },
      { name: "Platinum", min: 20, pct: 20, perks: ["Account manager", "Recorrente vitalícia", "Cases destacados"] },
    ],
  },
  bares: {
    brand: "Esquina Partners",
    hero: "Indicação de bares, restaurantes e casas noturnas — comissão por unidade ativada.",
    segmentLabel: "Distribuidores, fornecedores e consultores de food service",
    partnerLabel: "Parceiros de food service",
    baseCommissionPct: 12,
    recurringMonths: 8,
    partners: [
      { id: "p1", name: "Distribuidora BarTech", segment: "Distribuidora", tier: "Platinum", referrals: 38, conversion: 58, commission: 22400, status: "ativo" },
      { id: "p2", name: "Sommelier Lab", segment: "Consultoria", tier: "Ouro", referrals: 18, conversion: 44, commission: 8420, status: "ativo" },
      { id: "p3", name: "Equipamentos Cozinha+", segment: "Fornecedor", tier: "Prata", referrals: 7, conversion: 35, commission: 2240, status: "ativo" },
      { id: "p4", name: "Influencer FoodLover", segment: "Creator", tier: "Bronze", referrals: 3, conversion: 28, commission: 720, status: "pausado" },
    ],
    txs: [
      { id: "t1", date: "13/06", partner: "Distribuidora BarTech", type: "indicacao", amount: 3200, status: "pago" },
      { id: "t2", date: "11/06", partner: "Sommelier Lab", type: "recorrente", amount: 980, status: "aprovado" },
      { id: "t3", date: "09/06", partner: "Equipamentos Cozinha+", type: "indicacao", amount: 1280, status: "pendente" },
      { id: "t4", date: "01/06", partner: "Influencer FoodLover", type: "bônus", amount: 300, status: "pago" },
    ],
    materials: [
      { id: "m1", title: "Reel — open bar inteligente", kind: "Vídeo", size: "MP4 · 18MB" },
      { id: "m2", title: "Banner stories", kind: "Banner", size: "1080x1920" },
      { id: "m3", title: "Apresentação comercial", kind: "Apresentação", size: "PDF · 14p" },
      { id: "m4", title: "E-mail frio para bares", kind: "E-mail", size: "HTML" },
    ],
    tiers: [
      { name: "Bronze", min: 0, pct: 8, perks: ["Link de indicação", "Kit de materiais"] },
      { name: "Prata", min: 5, pct: 10, perks: ["Spiff por ativação", "Suporte prioritário"] },
      { name: "Ouro", min: 15, pct: 12, perks: ["Recorrente 8m", "Co-marketing regional"] },
      { name: "Platinum", min: 30, pct: 18, perks: ["Account manager", "Eventos VIP nacionais"] },
    ],
  },
  cervejarias: {
    brand: "Lúpulo Partners",
    hero: "Indicação de distribuidores, taprooms e revendedores autorizados.",
    segmentLabel: "Revendedores, distribuidores e influenciadores cervejeiros",
    partnerLabel: "Parceiros do trade cervejeiro",
    baseCommissionPct: 10,
    recurringMonths: 12,
    partners: [
      { id: "p1", name: "Hub Cervejeiro SP", segment: "Distribuidor", tier: "Platinum", referrals: 18, conversion: 66, commission: 38400, status: "ativo" },
      { id: "p2", name: "BeerInfluencer", segment: "Creator", tier: "Ouro", referrals: 12, conversion: 38, commission: 7200, status: "ativo" },
      { id: "p3", name: "Sommelier Pro", segment: "Consultoria", tier: "Prata", referrals: 5, conversion: 40, commission: 2400, status: "ativo" },
      { id: "p4", name: "Equipamentos Lúpulo+", segment: "Fornecedor B2B", tier: "Bronze", referrals: 2, conversion: 30, commission: 800, status: "pendente" },
    ],
    txs: [
      { id: "t1", date: "12/06", partner: "Hub Cervejeiro SP", type: "indicacao", amount: 5400, status: "pago" },
      { id: "t2", date: "10/06", partner: "BeerInfluencer", type: "recorrente", amount: 1240, status: "aprovado" },
      { id: "t3", date: "07/06", partner: "Sommelier Pro", type: "bônus", amount: 600, status: "pago" },
      { id: "t4", date: "02/06", partner: "Equipamentos Lúpulo+", type: "indicacao", amount: 400, status: "pendente" },
    ],
    materials: [
      { id: "m1", title: "Catálogo trade B2B 2026", kind: "Apresentação", size: "PDF · 22p" },
      { id: "m2", title: "Reel — Tap Takeover", kind: "Vídeo", size: "MP4 · 16MB" },
      { id: "m3", title: "Tabela de descontos por volume", kind: "E-book", size: "PDF · 4p" },
      { id: "m4", title: "Banner Lúpulo Fest", kind: "Banner", size: "1080x1080" },
    ],
    tiers: [
      { name: "Bronze", min: 0, pct: 6, perks: ["Link B2B", "Catálogo digital"] },
      { name: "Prata", min: 5, pct: 8, perks: ["Frete subsidiado", "Suporte prioritário"] },
      { name: "Ouro", min: 10, pct: 10, perks: ["Recorrente 12m", "Edições limitadas"] },
      { name: "Platinum", min: 18, pct: 14, perks: ["Account manager", "Acesso à fábrica", "Co-criação de rótulo"] },
    ],
  },
  servicos: {
    brand: "Forma Affiliates",
    hero: "Programa de afiliados para personals, nutricionistas e consultores wellness.",
    segmentLabel: "Personals, nutricionistas, fisioterapeutas e coaches",
    partnerLabel: "Profissionais wellness",
    baseCommissionPct: 20,
    recurringMonths: 12,
    partners: [
      { id: "p1", name: "Carlos Mendes (Personal)", segment: "Personal trainer", tier: "Platinum", referrals: 42, conversion: 54, commission: 14820, status: "ativo" },
      { id: "p2", name: "Nutri Sofia Lima", segment: "Nutricionista", tier: "Ouro", referrals: 22, conversion: 48, commission: 7240, status: "ativo" },
      { id: "p3", name: "Fisio Reset", segment: "Fisioterapeuta", tier: "Prata", referrals: 9, conversion: 36, commission: 2640, status: "ativo" },
      { id: "p4", name: "Coach LifePlus", segment: "Coach", tier: "Bronze", referrals: 3, conversion: 24, commission: 520, status: "pendente" },
    ],
    txs: [
      { id: "t1", date: "14/06", partner: "Carlos Mendes", type: "recorrente", amount: 1820, status: "pago" },
      { id: "t2", date: "12/06", partner: "Nutri Sofia Lima", type: "indicacao", amount: 980, status: "aprovado" },
      { id: "t3", date: "09/06", partner: "Fisio Reset", type: "indicacao", amount: 540, status: "pago" },
      { id: "t4", date: "03/06", partner: "Coach LifePlus", type: "bônus", amount: 200, status: "pendente" },
    ],
    materials: [
      { id: "m1", title: "Reel — Resultados em 30 dias", kind: "Vídeo", size: "MP4 · 12MB" },
      { id: "m2", title: "E-book de adesão saudável", kind: "E-book", size: "PDF · 18p" },
      { id: "m3", title: "Kit stories para Instagram", kind: "Banner", size: "1080x1920" },
      { id: "m4", title: "Sequência de WhatsApp (3 mensagens)", kind: "E-mail", size: "TXT" },
    ],
    tiers: [
      { name: "Bronze", min: 0, pct: 15, perks: ["Link de afiliado", "Materiais essenciais"] },
      { name: "Prata", min: 5, pct: 18, perks: ["Suporte prioritário", "Webinars exclusivos"] },
      { name: "Ouro", min: 15, pct: 22, perks: ["Recorrente 12m", "Page de afiliado branded"] },
      { name: "Platinum", min: 30, pct: 28, perks: ["Account manager", "Eventos presenciais", "Co-branding"] },
    ],
  },
  ecommerce: {
    brand: "Origem Affiliates",
    hero: "Programa de afiliados, creators e mídia performance para o marketplace Origem.",
    segmentLabel: "Creators, mídia performance, agências e cupom hunters",
    partnerLabel: "Afiliados e creators",
    baseCommissionPct: 18,
    recurringMonths: 0,
    partners: [
      { id: "p1", name: "@modaorigem", segment: "Creator fashion", tier: "Platinum", referrals: 1284, conversion: 4.8, commission: 24820, status: "ativo" },
      { id: "p2", name: "Cashback Universo", segment: "Cashback", tier: "Ouro", referrals: 612, conversion: 3.2, commission: 9840, status: "ativo" },
      { id: "p3", name: "Agência PerformaSP", segment: "Mídia perf.", tier: "Prata", referrals: 218, conversion: 2.4, commission: 3120, status: "ativo" },
      { id: "p4", name: "Blog ChicHoje", segment: "Blogueira", tier: "Bronze", referrals: 84, conversion: 1.8, commission: 560, status: "pausado" },
    ],
    txs: [
      { id: "t1", date: "13/06", partner: "@modaorigem", type: "indicacao", amount: 2840, status: "pago" },
      { id: "t2", date: "12/06", partner: "Cashback Universo", type: "indicacao", amount: 1240, status: "aprovado" },
      { id: "t3", date: "10/06", partner: "Agência PerformaSP", type: "indicacao", amount: 920, status: "pago" },
      { id: "t4", date: "05/06", partner: "Blog ChicHoje", type: "bônus", amount: 180, status: "pendente" },
    ],
    materials: [
      { id: "m1", title: "Catálogo de produtos top — JSON", kind: "E-book", size: "JSON" },
      { id: "m2", title: "Reels da coleção verão", kind: "Vídeo", size: "MP4 · 24MB" },
      { id: "m3", title: "Banners para campanhas pagas", kind: "Banner", size: "Multi-size" },
      { id: "m4", title: "Cupons exclusivos por parceiro", kind: "E-mail", size: "API" },
    ],
    tiers: [
      { name: "Bronze", min: 0, pct: 8, perks: ["Link de afiliado", "Cupons básicos"] },
      { name: "Prata", min: 100, pct: 12, perks: ["Catálogo via API", "Suporte prioritário"] },
      { name: "Ouro", min: 500, pct: 16, perks: ["Cupons exclusivos", "Mídia gratuita semanal"] },
      { name: "Platinum", min: 1000, pct: 22, perks: ["Account manager", "Co-criação de coleção", "Press kit"] },
    ],
  },
};

const NICHE_LABELS: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Estética",
  bares: "Bares & Restaurantes",
  cervejarias: "Cervejarias",
  servicos: "Serviços & Studios",
  ecommerce: "E-commerce",
};

const TIER_STYLES: Record<PartnerRow["tier"], string> = {
  Bronze: "bg-amber-700/15 text-amber-700 dark:text-amber-400",
  Prata: "bg-zinc-400/20 text-zinc-700 dark:text-zinc-300",
  Ouro: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  Platinum: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
};

const STATUS_STYLES: Record<PartnerRow["status"], string> = {
  ativo: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  pendente: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  pausado: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
};

const TX_STATUS: Record<Tx["status"], string> = {
  pago: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  aprovado: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  pendente: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ShowroomParceiros() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [persona, setPersona] = useState<Persona>("gestor");
  const cfg = DATA[niche];

  const totals = useMemo(() => {
    const partners = cfg.partners.length;
    const referrals = cfg.partners.reduce((a, p) => a + p.referrals, 0);
    const commissions = cfg.partners.reduce((a, p) => a + p.commission, 0);
    const avgConv =
      cfg.partners.reduce((a, p) => a + p.conversion, 0) / cfg.partners.length;
    return { partners, referrals, commissions, avgConv: Math.round(avgConv * 10) / 10 };
  }, [cfg]);

  const ranking = useMemo(
    () => [...cfg.partners].sort((a, b) => b.commission - a.commission),
    [cfg],
  );

  // Persona parceiro = top partner como exemplo
  const me = ranking[0];
  const myNextTier = useMemo(() => {
    const idx = cfg.tiers.findIndex((t) => t.name === me.tier);
    return cfg.tiers[idx + 1] ?? cfg.tiers[idx];
  }, [cfg, me]);
  const myPctToNext = useMemo(() => {
    if (myNextTier.name === me.tier) return 100;
    const curMin = cfg.tiers.find((t) => t.name === me.tier)?.min ?? 0;
    return Math.min(100, Math.round(((me.referrals - curMin) / (myNextTier.min - curMin)) * 100));
  }, [cfg, me, myNextTier]);

  const myLink = `https://impulsionando.com.br/r/${niche}-${me.id}`;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Handshake className="h-3 w-3" /> Showroom · Programa de Parceiros
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Cresça com uma rede de indicadores recompensados
            </h1>
            <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
              Comissões recorrentes, tiers progressivos, materiais prontos e portal completo
              para o parceiro — adaptado ao seu nicho.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(Object.keys(NICHE_LABELS) as NicheSlug[]).map((slug) => (
                <Button
                  key={slug}
                  size="sm"
                  variant={niche === slug ? "default" : "outline"}
                  onClick={() => setNiche(slug)}
                >
                  {NICHE_LABELS[slug]}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="text-foreground">{cfg.brand}</strong> · {cfg.hero}
            </p>
          </div>
        </div>
      </section>

      {/* Persona switch */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-4">
          <div className="mx-auto flex max-w-md gap-1 rounded-lg border bg-background p-1">
            {(["gestor", "parceiro"] as Persona[]).map((p) => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  persona === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {p === "gestor" ? (
                  <span className="inline-flex items-center gap-1.5"><Crown className="h-3.5 w-3.5" /> Visão do Gestor</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5"><Handshake className="h-3.5 w-3.5" /> Portal do Parceiro</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {persona === "gestor" ? (
        <GestorView cfg={cfg} totals={totals} ranking={ranking} />
      ) : (
        <ParceiroView cfg={cfg} me={me} link={myLink} nextTier={myNextTier} pctNext={myPctToNext} />
      )}

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Lance seu programa de parceiros em horas
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Tiers, comissões, materiais, antifraude e pagamento automático via Pix. Funciona
                  com indicações, afiliação ou rede B2B.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="lg">
                  <Link to="/trial">Começar grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/showroom">Voltar ao showroom</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function GestorView({
  cfg,
  totals,
  ranking,
}: {
  cfg: Cfg;
  totals: { partners: number; referrals: number; commissions: number; avgConv: number };
  ranking: PartnerRow[];
}) {
  return (
    <>
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-3 md:grid-cols-5">
            <KPI icon={<Users className="h-4 w-4" />} label="Parceiros ativos" value={`${totals.partners}`} hint={cfg.partnerLabel} />
            <KPI icon={<Share2 className="h-4 w-4" />} label="Indicações no mês" value={totals.referrals.toLocaleString("pt-BR")} hint="leads + ativações" />
            <KPI icon={<Coins className="h-4 w-4" />} label="Comissões pagas" value={brl(totals.commissions)} hint={`${cfg.baseCommissionPct}% base + tiers`} />
            <KPI icon={<TrendingUp className="h-4 w-4" />} label="Conversão média" value={`${totals.avgConv}%`} hint="lead → cliente" />
            <KPI icon={<Sparkles className="h-4 w-4" />} label="Recorrência" value={cfg.recurringMonths > 0 ? `${cfg.recurringMonths} meses` : "Single-touch"} hint="modelo do programa" />
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Estrutura de tiers</h2>
            <p className="text-sm text-muted-foreground">
              Comissão progressiva por volume de indicações qualificadas.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <BadgeCheck className="h-3 w-3" /> Antifraude + auditoria automática
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {cfg.tiers.map((t) => (
            <Card key={t.name} className="p-5">
              <div className="flex items-center justify-between">
                <Badge className={TIER_STYLES[t.name as PartnerRow["tier"]]}>{t.name}</Badge>
                <span className="text-2xl font-bold tracking-tight">{t.pct}%</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                A partir de <strong className="text-foreground">{t.min}</strong> indicações ativadas
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Ranking + comissões */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4 text-amber-500" /> Ranking de parceiros
              </div>
              <Badge variant="outline">{cfg.segmentLabel}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Parceiro</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Indicações</th>
                    <th className="px-4 py-3">Conversão</th>
                    <th className="px-4 py-3">Comissão</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ranking.map((p, i) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold tabular-nums text-muted-foreground">
                        {i === 0 && <Crown className="inline h-3.5 w-3.5 text-amber-500" />} #{i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.segment}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={TIER_STYLES[p.tier]}>{p.tier}</Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{p.referrals.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 tabular-nums">{p.conversion}%</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{brl(p.commission)}</td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_STYLES[p.status]}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Pagamentos recentes</h3>
              </div>
              <Button size="sm" variant="outline">Exportar</Button>
            </div>
            <ul className="divide-y">
              {cfg.txs.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{t.partner}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.date} · {t.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">{brl(t.amount)}</span>
                    <Badge className={TX_STATUS[t.status]}>{t.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Materiais */}
      <section className="container mx-auto px-4 py-8 pb-4">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Biblioteca de materiais</h2>
            <p className="text-sm text-muted-foreground">
              Banners, vídeos, e-books e e-mails — atualizados pela equipe central.
            </p>
          </div>
          <Button size="sm">
            <Megaphone className="mr-1 h-3.5 w-3.5" /> Publicar material
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {cfg.materials.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="text-xs">{m.kind}</Badge>
                <span className="text-xs text-muted-foreground">{m.size}</span>
              </div>
              <div className="mt-3 text-sm font-medium leading-tight">{m.title}</div>
              <Button size="sm" variant="outline" className="mt-3 w-full">
                <Download className="mr-1 h-3.5 w-3.5" /> Baixar
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function ParceiroView({
  cfg,
  me,
  link,
  nextTier,
  pctNext,
}: {
  cfg: Cfg;
  me: PartnerRow;
  link: string;
  nextTier: TierCfg;
  pctNext: number;
}) {
  return (
    <>
      <section className="container mx-auto px-4 py-8">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Bem-vindo de volta</div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{me.name}</h2>
              <div className="mt-1 text-sm text-muted-foreground">{me.segment}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={TIER_STYLES[me.tier]}><Star className="mr-1 inline h-3 w-3" /> {me.tier}</Badge>
              <Badge className={STATUS_STYLES[me.status]}>{me.status}</Badge>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Mini icon={<Share2 className="h-4 w-4" />} label="Indicações" value={me.referrals.toLocaleString("pt-BR")} />
            <Mini icon={<TrendingUp className="h-4 w-4" />} label="Conversão" value={`${me.conversion}%`} />
            <Mini icon={<Coins className="h-4 w-4" />} label="Comissão acumulada" value={brl(me.commission)} />
            <Mini icon={<Gift className="h-4 w-4" />} label="Próximo nível" value={nextTier.name} progress={pctNext} hint={`faltam ${Math.max(0, nextTier.min - me.referrals)} indicações`} />
          </div>
        </Card>
      </section>

      <section className="container mx-auto px-4 py-4">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Seu link de indicação</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input readOnly value={link} className="font-mono text-xs" />
            <Button>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
            </Button>
            <Button variant="outline">
              <Share2 className="mr-1 h-3.5 w-3.5" /> Compartilhar
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Toda venda atribuída ao seu link gera comissão{" "}
            {cfg.recurringMonths > 0 ? `recorrente por ${cfg.recurringMonths} meses` : "imediata"}.
            Cookies de atribuição de 30 dias e antifraude integrado.
          </p>
        </Card>
      </section>

      <section className="container mx-auto px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Meus pagamentos</h3>
            </div>
            <ul className="divide-y">
              {cfg.txs.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 ${t.status === "pago" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
                      {t.status === "pago" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium capitalize">{t.type}</div>
                      <div className="text-xs text-muted-foreground">{t.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{brl(t.amount)}</span>
                    <Badge className={TX_STATUS[t.status]}>{t.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" className="mt-3 w-full">
              Solicitar saque via Pix
            </Button>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Materiais prontos</h3>
            </div>
            <ul className="space-y-2">
              {cfg.materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium leading-tight">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.kind} · {m.size}</div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 pb-4">
        <Card className="border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              A IA do programa sugere os melhores produtos/serviços para sua audiência e ajuda a
              redigir posts, e-mails e mensagens — aumentando sua conversão em até 38%.
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}

function KPI({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function Mini({
  icon, label, value, progress, hint,
}: { icon: React.ReactNode; label: string; value: string; progress?: number; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight">{value}</div>
      {typeof progress === "number" && <Progress value={progress} className="mt-2 h-1.5" />}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
