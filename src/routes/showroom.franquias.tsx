import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Store,
  MapPin,
  Coins,
  BookOpen,
  ClipboardCheck,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSignature,
  Users,
  ArrowRight,
  Network,
  GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/showroom/franquias")({
  head: () => ({
    meta: [
      { title: "Plataforma para franquias por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Portal do franqueador + franqueado: royalties, manual, auditoria, expansão e marketing local — adaptado por nicho.",
      },
      { property: "og:title", content: "Franquias — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Demo navegável: royalties em tempo real, conformidade com manual, pipeline de expansão e fundo de propaganda.",
      },
    ],
  }),
  component: ShowroomFranquias,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";
type Persona = "franqueador" | "franqueado";

type Franchisee = {
  id: string;
  name: string;
  owner: string;
  city: string;
  opened: string;
  revenue: number;
  royalties: number;
  status: "ok" | "warn" | "atrasado";
  complianceScore: number;
  marketingFund: number;
};

type LeadStage = "prospect" | "qualificacao" | "diligencia" | "contrato" | "implantacao";
type Lead = { id: string; name: string; city: string; stage: LeadStage; potential: string; updated: string };

type Audit = { id: string; topic: string; weight: number; score: number };

type Cfg = {
  brand: string;
  hero: string;
  royaltyPct: number;
  fundPct: number;
  unitInvestment: string;
  payback: string;
  franchisees: Franchisee[];
  leads: Lead[];
  audits: Audit[];
  playbook: { id: string; title: string; chapter: string; status: "atualizado" | "revisao" }[];
  campaigns: { id: string; title: string; reach: number; investment: number; status: "ativa" | "agendada" | "pausada" }[];
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brand: "Rede Aurora Franchising",
    hero: "Franquia de clínicas com playbook clínico, marketing local e auditoria de qualidade.",
    royaltyPct: 6,
    fundPct: 2,
    unitInvestment: "R$ 420mil – R$ 680mil",
    payback: "26–34 meses",
    franchisees: [
      { id: "f1", name: "Aurora Goiânia", owner: "Família Carvalho", city: "Goiânia · GO", opened: "Mar/2023", revenue: 184200, royalties: 11052, status: "ok", complianceScore: 94, marketingFund: 3684 },
      { id: "f2", name: "Aurora Recife", owner: "Grupo MedNor", city: "Recife · PE", opened: "Ago/2023", revenue: 142800, royalties: 8568, status: "ok", complianceScore: 91, marketingFund: 2856 },
      { id: "f3", name: "Aurora Vitória", owner: "Dra. Patrícia Lemos", city: "Vitória · ES", opened: "Jan/2024", revenue: 98400, royalties: 5904, status: "warn", complianceScore: 82, marketingFund: 1968 },
      { id: "f4", name: "Aurora Manaus", owner: "Holding Norte Saúde", city: "Manaus · AM", opened: "Mai/2024", revenue: 64200, royalties: 0, status: "atrasado", complianceScore: 71, marketingFund: 0 },
    ],
    leads: [
      { id: "l1", name: "Dr. Eduardo Tavares", city: "Fortaleza · CE", stage: "diligencia", potential: "R$ 540k", updated: "há 2d" },
      { id: "l2", name: "Investidora MedSP", city: "Campinas · SP", stage: "contrato", potential: "R$ 620k", updated: "ontem" },
      { id: "l3", name: "Grupo Bem-Estar", city: "Florianópolis · SC", stage: "qualificacao", potential: "R$ 480k", updated: "hoje" },
      { id: "l4", name: "Dra. Joana Prado", city: "Brasília · DF", stage: "prospect", potential: "R$ 500k", updated: "há 5d" },
      { id: "l5", name: "Aurora Niterói", city: "Niterói · RJ", stage: "implantacao", potential: "R$ 580k", updated: "ontem" },
    ],
    audits: [
      { id: "a1", topic: "Protocolos clínicos", weight: 25, score: 92 },
      { id: "a2", topic: "Limpeza e biossegurança", weight: 20, score: 95 },
      { id: "a3", topic: "Atendimento e NPS", weight: 20, score: 88 },
      { id: "a4", topic: "Padrão visual da marca", weight: 15, score: 86 },
      { id: "a5", topic: "Financeiro e royalties em dia", weight: 20, score: 90 },
    ],
    playbook: [
      { id: "p1", title: "Manual clínico — procedimentos estéticos", chapter: "Operações", status: "atualizado" },
      { id: "p2", title: "Padrão visual e identidade", chapter: "Marca", status: "atualizado" },
      { id: "p3", title: "Roteiros de venda e conversão", chapter: "Comercial", status: "revisao" },
      { id: "p4", title: "Treinamento Aurora Academy", chapter: "Pessoas", status: "atualizado" },
    ],
    campaigns: [
      { id: "c1", title: "Mês da harmonização", reach: 184000, investment: 18400, status: "ativa" },
      { id: "c2", title: "Lançamento Aurora Niterói", reach: 92000, investment: 12600, status: "agendada" },
      { id: "c3", title: "Skincare de inverno", reach: 142000, investment: 9800, status: "pausada" },
    ],
  },
  bares: {
    brand: "Esquina 47 Franchising",
    hero: "Franquia de bares com receitas padronizadas, sommelier de chopp e marketing de bairro.",
    royaltyPct: 7,
    fundPct: 2.5,
    unitInvestment: "R$ 380mil – R$ 720mil",
    payback: "22–30 meses",
    franchisees: [
      { id: "f1", name: "Esquina Curitiba Batel", owner: "Sócios Sul", city: "Curitiba · PR", opened: "Out/2022", revenue: 268900, royalties: 18823, status: "ok", complianceScore: 92, marketingFund: 6722 },
      { id: "f2", name: "Esquina BH Savassi", owner: "Grupo Pampulha", city: "Belo Horizonte · MG", opened: "Mai/2023", revenue: 312800, royalties: 21896, status: "ok", complianceScore: 89, marketingFund: 7820 },
      { id: "f3", name: "Esquina Goiânia", owner: "Hermanos Silva", city: "Goiânia · GO", opened: "Set/2023", revenue: 198400, royalties: 13888, status: "warn", complianceScore: 81, marketingFund: 4960 },
      { id: "f4", name: "Esquina Fortaleza Beach", owner: "Beach Holdings", city: "Fortaleza · CE", opened: "Fev/2024", revenue: 108600, royalties: 0, status: "atrasado", complianceScore: 74, marketingFund: 0 },
    ],
    leads: [
      { id: "l1", name: "Grupo NightSP", city: "São Paulo · SP", stage: "contrato", potential: "R$ 640k", updated: "hoje" },
      { id: "l2", name: "Família Beltrão", city: "Salvador · BA", stage: "diligencia", potential: "R$ 520k", updated: "há 3d" },
      { id: "l3", name: "Esquina Manaus", city: "Manaus · AM", stage: "implantacao", potential: "R$ 580k", updated: "ontem" },
      { id: "l4", name: "Lúcia & Co.", city: "Florianópolis · SC", stage: "qualificacao", potential: "R$ 460k", updated: "há 1d" },
    ],
    audits: [
      { id: "a1", topic: "Padrão de receitas e ficha técnica", weight: 25, score: 91 },
      { id: "a2", topic: "Limpeza e vigilância sanitária", weight: 20, score: 88 },
      { id: "a3", topic: "Atendimento, ambientação e NPS", weight: 20, score: 90 },
      { id: "a4", topic: "Padrão visual e uniforme", weight: 15, score: 84 },
      { id: "a5", topic: "Repasse de royalties e DRE", weight: 20, score: 87 },
    ],
    playbook: [
      { id: "p1", title: "Manual de bar — fichas e mixologia", chapter: "Operações", status: "atualizado" },
      { id: "p2", title: "Atendimento de salão", chapter: "Pessoas", status: "atualizado" },
      { id: "p3", title: "Curadoria de cardápio sazonal", chapter: "Produto", status: "revisao" },
      { id: "p4", title: "Marketing local e influencers", chapter: "Marca", status: "atualizado" },
    ],
    campaigns: [
      { id: "c1", title: "Happy hour nacional", reach: 412000, investment: 38400, status: "ativa" },
      { id: "c2", title: "Festival de chopp BH", reach: 124000, investment: 14800, status: "agendada" },
      { id: "c3", title: "Tributo aos clássicos", reach: 96000, investment: 6800, status: "pausada" },
    ],
  },
  cervejarias: {
    brand: "Lúpulo Norte Franchising",
    hero: "Franquia de taprooms e centros de distribuição com produto da fábrica matriz.",
    royaltyPct: 5,
    fundPct: 1.5,
    unitInvestment: "R$ 280mil – R$ 1.2mi",
    payback: "18–28 meses",
    franchisees: [
      { id: "f1", name: "Taproom Brasília", owner: "Grupo Cerrado", city: "Brasília · DF", opened: "Abr/2023", revenue: 168400, royalties: 8420, status: "ok", complianceScore: 93, marketingFund: 2526 },
      { id: "f2", name: "CD Nordeste — Recife", owner: "Distrib. NE", city: "Recife · PE", opened: "Jul/2023", revenue: 612000, royalties: 30600, status: "ok", complianceScore: 90, marketingFund: 9180 },
      { id: "f3", name: "Taproom Curitiba", owner: "Lúpulo Sul", city: "Curitiba · PR", opened: "Nov/2023", revenue: 132000, royalties: 6600, status: "warn", complianceScore: 82, marketingFund: 1980 },
      { id: "f4", name: "CD Norte — Belém", owner: "Amazônia Bev.", city: "Belém · PA", opened: "Fev/2024", revenue: 198400, royalties: 0, status: "atrasado", complianceScore: 70, marketingFund: 0 },
    ],
    leads: [
      { id: "l1", name: "Vinícola Vale Bier", city: "Bento Gonçalves · RS", stage: "contrato", potential: "R$ 980k", updated: "ontem" },
      { id: "l2", name: "Grupo Beerlandia", city: "Belo Horizonte · MG", stage: "diligencia", potential: "R$ 520k", updated: "há 2d" },
      { id: "l3", name: "Tropical Hops", city: "Maceió · AL", stage: "qualificacao", potential: "R$ 380k", updated: "há 4d" },
    ],
    audits: [
      { id: "a1", topic: "Conservação do chopp (linha gelada)", weight: 30, score: 95 },
      { id: "a2", topic: "Qualidade do atendimento no taproom", weight: 20, score: 88 },
      { id: "a3", topic: "Padrão visual e merchandising", weight: 15, score: 86 },
      { id: "a4", topic: "Conformidade fiscal (IPI/MAPA)", weight: 20, score: 92 },
      { id: "a5", topic: "Repasse de royalties e fundo", weight: 15, score: 89 },
    ],
    playbook: [
      { id: "p1", title: "Manual técnico de chopp e estilos", chapter: "Produto", status: "atualizado" },
      { id: "p2", title: "Operação de taproom", chapter: "Operações", status: "atualizado" },
      { id: "p3", title: "Logística refrigerada", chapter: "Cadeia", status: "revisao" },
      { id: "p4", title: "Treinamento de sommelier de cerveja", chapter: "Pessoas", status: "atualizado" },
    ],
    campaigns: [
      { id: "c1", title: "Lúpulo Fest nacional", reach: 612000, investment: 86400, status: "agendada" },
      { id: "c2", title: "Tap Takeover BH", reach: 88000, investment: 12400, status: "ativa" },
      { id: "c3", title: "Edição limitada Imperial Stout", reach: 142000, investment: 9800, status: "ativa" },
    ],
  },
  servicos: {
    brand: "Studio Forma Franchising",
    hero: "Franquia de studios fitness/wellness com método proprietário e CRM unificado.",
    royaltyPct: 8,
    fundPct: 2,
    unitInvestment: "R$ 180mil – R$ 380mil",
    payback: "16–24 meses",
    franchisees: [
      { id: "f1", name: "Forma Campinas", owner: "Família Souto", city: "Campinas · SP", opened: "Jun/2022", revenue: 132400, royalties: 10592, status: "ok", complianceScore: 95, marketingFund: 2648 },
      { id: "f2", name: "Forma Salvador", owner: "Coach BA Ltda", city: "Salvador · BA", opened: "Out/2022", revenue: 118400, royalties: 9472, status: "ok", complianceScore: 92, marketingFund: 2368 },
      { id: "f3", name: "Forma Joinville", owner: "Studio Sul", city: "Joinville · SC", opened: "Mar/2023", revenue: 86200, royalties: 6896, status: "warn", complianceScore: 80, marketingFund: 1724 },
      { id: "f4", name: "Forma Natal", owner: "Coach Litoral", city: "Natal · RN", opened: "Jul/2023", revenue: 52400, royalties: 0, status: "atrasado", complianceScore: 68, marketingFund: 0 },
    ],
    leads: [
      { id: "l1", name: "Personal Hub SP", city: "São Paulo · SP", stage: "implantacao", potential: "R$ 280k", updated: "hoje" },
      { id: "l2", name: "Wellness MG", city: "Uberlândia · MG", stage: "contrato", potential: "R$ 220k", updated: "há 1d" },
      { id: "l3", name: "Studio do Norte", city: "Manaus · AM", stage: "diligencia", potential: "R$ 240k", updated: "há 3d" },
      { id: "l4", name: "Forma Caxias", city: "Caxias do Sul · RS", stage: "qualificacao", potential: "R$ 200k", updated: "ontem" },
    ],
    audits: [
      { id: "a1", topic: "Aderência ao método Forma", weight: 30, score: 92 },
      { id: "a2", topic: "Qualificação dos professores", weight: 20, score: 90 },
      { id: "a3", topic: "Higiene e equipamentos", weight: 15, score: 88 },
      { id: "a4", topic: "NPS e retenção", weight: 20, score: 86 },
      { id: "a5", topic: "Padrão visual e marca", weight: 15, score: 84 },
    ],
    playbook: [
      { id: "p1", title: "Método Forma — apostila técnica", chapter: "Produto", status: "atualizado" },
      { id: "p2", title: "Onboarding de aluno em 7 dias", chapter: "Operações", status: "atualizado" },
      { id: "p3", title: "Comercial — venda consultiva", chapter: "Comercial", status: "revisao" },
      { id: "p4", title: "Forma Academy (LMS)", chapter: "Pessoas", status: "atualizado" },
    ],
    campaigns: [
      { id: "c1", title: "Verão Forma", reach: 312000, investment: 24800, status: "ativa" },
      { id: "c2", title: "Trial gratuito setembro", reach: 184000, investment: 18400, status: "agendada" },
      { id: "c3", title: "Indique e ganhe", reach: 96000, investment: 6400, status: "ativa" },
    ],
  },
  ecommerce: {
    brand: "Origem Franchising Omnichannel",
    hero: "Franquia omnichannel com lojas físicas, hubs de retirada e canal digital unificado.",
    royaltyPct: 5,
    fundPct: 2,
    unitInvestment: "R$ 220mil – R$ 480mil",
    payback: "20–28 meses",
    franchisees: [
      { id: "f1", name: "Origem Shopping POA", owner: "Grupo Sul Retail", city: "Porto Alegre · RS", opened: "Mar/2023", revenue: 318400, royalties: 15920, status: "ok", complianceScore: 93, marketingFund: 6368 },
      { id: "f2", name: "Origem Shopping CWB", owner: "Família Krieger", city: "Curitiba · PR", opened: "Jun/2023", revenue: 268900, royalties: 13445, status: "ok", complianceScore: 90, marketingFund: 5378 },
      { id: "f3", name: "Origem Goiânia Flamboyant", owner: "Centro-Oeste Retail", city: "Goiânia · GO", opened: "Out/2023", revenue: 162400, royalties: 8120, status: "warn", complianceScore: 82, marketingFund: 3248 },
      { id: "f4", name: "Origem Manaus", owner: "Norte Trade", city: "Manaus · AM", opened: "Mar/2024", revenue: 88600, royalties: 0, status: "atrasado", complianceScore: 71, marketingFund: 0 },
    ],
    leads: [
      { id: "l1", name: "Mall Holding NE", city: "Recife · PE", stage: "contrato", potential: "R$ 420k", updated: "ontem" },
      { id: "l2", name: "Família Origem CE", city: "Fortaleza · CE", stage: "diligencia", potential: "R$ 380k", updated: "há 2d" },
      { id: "l3", name: "Grupo Litoral SP", city: "Santos · SP", stage: "qualificacao", potential: "R$ 320k", updated: "há 4d" },
    ],
    audits: [
      { id: "a1", topic: "Vitrine e visual merchandising", weight: 25, score: 92 },
      { id: "a2", topic: "Integração omnichannel (estoque)", weight: 25, score: 88 },
      { id: "a3", topic: "Atendimento e conversão", weight: 20, score: 86 },
      { id: "a4", topic: "Logística e SLA", weight: 15, score: 90 },
      { id: "a5", topic: "Royalties e fundo em dia", weight: 15, score: 87 },
    ],
    playbook: [
      { id: "p1", title: "Manual de vitrine sazonal", chapter: "Marca", status: "atualizado" },
      { id: "p2", title: "Integração omnichannel", chapter: "Operações", status: "atualizado" },
      { id: "p3", title: "Comercial — clienteling", chapter: "Comercial", status: "revisao" },
      { id: "p4", title: "Origem Academy (treinamento de loja)", chapter: "Pessoas", status: "atualizado" },
    ],
    campaigns: [
      { id: "c1", title: "Coleção Verão Origem", reach: 612000, investment: 84200, status: "ativa" },
      { id: "c2", title: "Black Origem", reach: 1240000, investment: 184000, status: "agendada" },
      { id: "c3", title: "Outlet local POA", reach: 124000, investment: 12400, status: "ativa" },
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

const STAGE_LABELS: Record<LeadStage, string> = {
  prospect: "Prospect",
  qualificacao: "Qualificação",
  diligencia: "Diligência",
  contrato: "Contrato",
  implantacao: "Implantação",
};

const STATUS_STYLES: Record<Franchisee["status"], { label: string; cls: string }> = {
  ok: { label: "Em dia", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  warn: { label: "Atenção", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  atrasado: { label: "Royalty atrasado", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

const CAMPAIGN_STYLES: Record<string, string> = {
  ativa: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  agendada: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  pausada: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ShowroomFranquias() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [persona, setPersona] = useState<Persona>("franqueador");
  const cfg = DATA[niche];

  const totals = useMemo(() => {
    const revenue = cfg.franchisees.reduce((a, f) => a + f.revenue, 0);
    const royalties = cfg.franchisees.reduce((a, f) => a + f.royalties, 0);
    const fund = cfg.franchisees.reduce((a, f) => a + f.marketingFund, 0);
    const compliance = Math.round(
      cfg.franchisees.reduce((a, f) => a + f.complianceScore, 0) / cfg.franchisees.length,
    );
    return { revenue, royalties, fund, compliance };
  }, [cfg]);

  const pipeline = useMemo(() => {
    const stages: LeadStage[] = ["prospect", "qualificacao", "diligencia", "contrato", "implantacao"];
    return stages.map((s) => ({
      stage: s,
      leads: cfg.leads.filter((l) => l.stage === s),
    }));
  }, [cfg]);

  const overallAudit = useMemo(() => {
    const total = cfg.audits.reduce((a, x) => a + x.weight, 0);
    const sum = cfg.audits.reduce((a, x) => a + (x.score * x.weight) / total, 0);
    return Math.round(sum);
  }, [cfg]);

  // dados específicos do franqueado (escolhe o primeiro como "minha unidade")
  const mine = cfg.franchisees[0];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Crown className="h-3 w-3" /> Showroom · Plataforma para franquias
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Franqueador e franqueado no mesmo ecossistema
            </h1>
            <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
              Royalties, manual, auditoria de padrão, fundo de propaganda e pipeline de expansão —
              tudo em um portal por nicho.
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
            {(["franqueador", "franqueado"] as Persona[]).map((p) => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  persona === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {p === "franqueador" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" /> Visão do Franqueador
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" /> Visão do Franqueado
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {persona === "franqueador" ? (
        <FranqueadorView
          cfg={cfg}
          totals={totals}
          pipeline={pipeline}
          overallAudit={overallAudit}
        />
      ) : (
        <FranqueadoView cfg={cfg} mine={mine} />
      )}

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Estruture sua franquia de ponta a ponta
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Royalties automáticos, manual versionado, auditoria de loja, fundo de propaganda
                  e pipeline de expansão. Pronto para crescer em escala nacional.
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

function FranqueadorView({
  cfg,
  totals,
  pipeline,
  overallAudit,
}: {
  cfg: Cfg;
  totals: { revenue: number; royalties: number; fund: number; compliance: number };
  pipeline: { stage: LeadStage; leads: Lead[] }[];
  overallAudit: number;
}) {
  return (
    <>
      {/* KPIs */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-3 md:grid-cols-5">
            <KPI icon={<Store className="h-4 w-4" />} label="Franqueados ativos" value={`${cfg.franchisees.length}`} hint={`+${pipeline.find((p) => p.stage === "implantacao")?.leads.length ?? 0} em implantação`} />
            <KPI icon={<TrendingUp className="h-4 w-4" />} label="GMV da rede" value={brl(totals.revenue)} hint="mês corrente" />
            <KPI icon={<Coins className="h-4 w-4" />} label="Royalties do mês" value={brl(totals.royalties)} hint={`${cfg.royaltyPct}% sobre vendas`} />
            <KPI icon={<Megaphone className="h-4 w-4" />} label="Fundo de propaganda" value={brl(totals.fund)} hint={`${cfg.fundPct}% sobre vendas`} />
            <KPI icon={<ClipboardCheck className="h-4 w-4" />} label="Conformidade média" value={`${totals.compliance}/100`} hint="auditoria padrão" warning={totals.compliance < 85} />
          </div>
        </div>
      </section>

      {/* Lista de franqueados */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Franqueados</h2>
            <p className="text-sm text-muted-foreground">Royalties, conformidade e fundo por unidade.</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Network className="h-3 w-3" /> Modelo de royalties: {cfg.royaltyPct}% + {cfg.fundPct}% fundo
          </Badge>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Franqueado</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Vendas</th>
                  <th className="px-4 py-3">Royalty</th>
                  <th className="px-4 py-3">Fundo</th>
                  <th className="px-4 py-3">Conformidade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cfg.franchisees.map((f) => {
                  const st = STATUS_STYLES[f.status];
                  return (
                    <tr key={f.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.owner} · desde {f.opened}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {f.city}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{brl(f.revenue)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium">{brl(f.royalties)}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{brl(f.marketingFund)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${f.complianceScore >= 90 ? "bg-emerald-500" : f.complianceScore >= 80 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${f.complianceScore}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums">{f.complianceScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge className={st.cls}>{st.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost">
                          Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Pipeline de expansão */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Pipeline de expansão</h2>
            <p className="text-sm text-muted-foreground">
              Investimento por unidade: <strong>{cfg.unitInvestment}</strong> · Payback médio:{" "}
              <strong>{cfg.payback}</strong>
            </p>
          </div>
          <Button size="sm">
            <Users className="mr-1 h-3.5 w-3.5" /> Novo candidato
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {pipeline.map((col) => (
            <Card key={col.stage} className="flex flex-col p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {STAGE_LABELS[col.stage]}
                </span>
                <Badge variant="secondary" className="text-xs">{col.leads.length}</Badge>
              </div>
              <div className="space-y-2">
                {col.leads.length === 0 && (
                  <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                    Sem candidatos
                  </div>
                )}
                {col.leads.map((l) => (
                  <div key={l.id} className="rounded-md border bg-card p-3">
                    <div className="text-sm font-medium leading-tight">{l.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{l.city}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-primary">{l.potential}</span>
                      <span className="text-muted-foreground">{l.updated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Auditoria + Manual */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Auditoria de padrão</h3>
              </div>
              <Badge variant="outline">Score geral: <strong className="ml-1">{overallAudit}/100</strong></Badge>
            </div>
            <ul className="space-y-3">
              {cfg.audits.map((a) => (
                <li key={a.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{a.topic}</span>
                    <span className="text-xs text-muted-foreground">
                      peso {a.weight}% · <strong className="text-foreground">{a.score}</strong>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${a.score >= 90 ? "bg-emerald-500" : a.score >= 80 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${a.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Manual da franquia</h3>
              </div>
              <Badge variant="outline">v2.4 · Jun/2026</Badge>
            </div>
            <ul className="space-y-2">
              {cfg.playbook.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.chapter}</div>
                  </div>
                  <Badge
                    className={
                      p.status === "atualizado"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }
                  >
                    {p.status === "atualizado" ? (
                      <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> atualizado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> em revisão</span>
                    )}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Marketing nacional */}
      <section className="container mx-auto px-4 py-8 pb-4">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Fundo de propaganda</h2>
            <p className="text-sm text-muted-foreground">
              Campanhas nacionais financiadas pelos {cfg.fundPct}% do fundo de marketing.
            </p>
          </div>
          <Button size="sm" variant="outline">
            <Megaphone className="mr-1 h-3.5 w-3.5" /> Nova campanha
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {cfg.campaigns.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight">{c.title}</h4>
                <Badge className={CAMPAIGN_STYLES[c.status]}>{c.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Investimento</div>
                  <div className="font-semibold">{brl(c.investment)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Alcance</div>
                  <div className="font-semibold">{c.reach.toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function FranqueadoView({ cfg, mine }: { cfg: Cfg; mine: Franchisee }) {
  const st = STATUS_STYLES[mine.status];
  return (
    <>
      <section className="container mx-auto px-4 py-8">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Minha unidade</div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{mine.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {mine.city} · operação desde {mine.opened}
              </div>
            </div>
            <Badge className={st.cls}>{st.label}</Badge>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Mini label="Vendas do mês" value={brl(mine.revenue)} icon={<TrendingUp className="h-4 w-4" />} />
            <Mini label={`Royalty (${cfg.royaltyPct}%)`} value={brl(mine.royalties)} icon={<Coins className="h-4 w-4" />} />
            <Mini label={`Fundo (${cfg.fundPct}%)`} value={brl(mine.marketingFund)} icon={<Megaphone className="h-4 w-4" />} />
            <Mini
              label="Score de padrão"
              value={`${mine.complianceScore}/100`}
              icon={<ClipboardCheck className="h-4 w-4" />}
              progress={mine.complianceScore}
            />
          </div>
        </Card>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Tarefas e obrigações abertas</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {mine.status === "atrasado" ? (
                <li className="flex items-center justify-between rounded-md border border-red-500/40 bg-red-500/5 p-3">
                  <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Royalty do mês em atraso</span>
                  <Button size="sm">Quitar agora</Button>
                </li>
              ) : (
                <li className="flex items-center justify-between rounded-md border p-3">
                  <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Royalty do mês quitado</span>
                  <Badge variant="outline">em dia</Badge>
                </li>
              )}
              <li className="flex items-center justify-between rounded-md border p-3">
                <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> Confirmar leitura: novo capítulo do manual (v2.4)</span>
                <Button size="sm" variant="outline">Abrir manual</Button>
              </li>
              <li className="flex items-center justify-between rounded-md border p-3">
                <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /> Treinamento obrigatório da equipe (LMS)</span>
                <Button size="sm" variant="outline">Iniciar</Button>
              </li>
              <li className="flex items-center justify-between rounded-md border p-3">
                <span className="inline-flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-muted-foreground" /> Visita de auditoria — agendar para julho</span>
                <Button size="sm" variant="outline">Agendar</Button>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Campanhas disponíveis</h3>
            </div>
            <ul className="space-y-2">
              {cfg.campaigns.map((c) => (
                <li key={c.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">{c.title}</span>
                    <Badge className={CAMPAIGN_STYLES[c.status]}>{c.status}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Material aprovado · alcance estimado {c.reach.toLocaleString("pt-BR")}
                  </div>
                  <Button size="sm" variant="ghost" className="mt-2 h-7 px-0 text-primary">
                    Ativar localmente <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-4 pb-4">
        <Card className="border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              A IA da plataforma cruza o seu desempenho com a média da rede e sugere ações
              personalizadas (ex.: ajuste de horários, mix de cardápio/serviços, campanhas locais)
              respeitando 100% do padrão da franquia.
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}

function KPI({
  icon,
  label,
  value,
  hint,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  warning?: boolean;
}) {
  return (
    <Card className={`p-4 ${warning ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function Mini({
  icon,
  label,
  value,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress?: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight">{value}</div>
      {typeof progress === "number" && <Progress value={progress} className="mt-2 h-1.5" />}
    </Card>
  );
}
