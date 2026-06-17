import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  ArrowRight,
  Sparkles,
  Calendar,
  Trophy,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/showroom/equipe")({
  head: () => ({
    meta: [
      { title: "Gestão de equipe por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Escalas, comissões, metas e permissões por papel — gestão completa de equipe por nicho no ecossistema Impulsionando.",
      },
      {
        property: "og:title",
        content: "Equipe & comissões — Showroom Impulsionando",
      },
      {
        property: "og:description",
        content:
          "Demonstração navegável de gestão de equipe: escalas semanais, metas, comissões e permissões granulares.",
      },
    ],
  }),
  component: ShowroomEquipe,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Role = "Owner" | "Gerente" | "Operador" | "Atendente" | "Financeiro";

type Member = {
  id: string;
  name: string;
  role: Role;
  job: string;
  goal: number;
  achieved: number;
  commission: number;
  rating: number;
  shift: string;
  status: "ativo" | "ferias" | "folga";
};

type Cfg = {
  label: string;
  goalLabel: string;
  unit: string;
  commissionLabel: string;
  members: Member[];
  schedule: { day: string; opens: string; closes: string; staff: number }[];
  permissions: { area: string; Owner: boolean; Gerente: boolean; Operador: boolean; Atendente: boolean; Financeiro: boolean }[];
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas & Saúde",
    goalLabel: "Atendimentos no mês",
    unit: "atend.",
    commissionLabel: "Comissão (10% do procedimento)",
    members: [
      { id: "1", name: "Dra. Helena Costa", role: "Gerente", job: "Cardiologista", goal: 80, achieved: 72, commission: 8400, rating: 4.9, shift: "Seg–Sex 8h–17h", status: "ativo" },
      { id: "2", name: "Dr. Rafael Lima", role: "Operador", job: "Dermatologista", goal: 90, achieved: 95, commission: 11200, rating: 4.8, shift: "Ter–Sáb 9h–18h", status: "ativo" },
      { id: "3", name: "Patrícia Souza", role: "Atendente", job: "Recepção", goal: 600, achieved: 540, commission: 1800, rating: 4.7, shift: "Seg–Sex 7h–16h", status: "ativo" },
      { id: "4", name: "Marcos Vieira", role: "Operador", job: "Nutricionista", goal: 60, achieved: 18, commission: 2100, rating: 4.6, shift: "Em férias", status: "ferias" },
      { id: "5", name: "Júlia Pereira", role: "Financeiro", job: "Faturamento", goal: 100, achieved: 92, commission: 0, rating: 4.8, shift: "Seg–Sex 9h–18h", status: "ativo" },
    ],
    schedule: [
      { day: "Seg", opens: "07:00", closes: "21:00", staff: 12 },
      { day: "Ter", opens: "07:00", closes: "21:00", staff: 12 },
      { day: "Qua", opens: "07:00", closes: "21:00", staff: 11 },
      { day: "Qui", opens: "07:00", closes: "21:00", staff: 12 },
      { day: "Sex", opens: "07:00", closes: "21:00", staff: 12 },
      { day: "Sáb", opens: "08:00", closes: "14:00", staff: 6 },
      { day: "Dom", opens: "Fechado", closes: "—", staff: 0 },
    ],
    permissions: [
      { area: "Agenda", Owner: true, Gerente: true, Operador: true, Atendente: true, Financeiro: false },
      { area: "Prontuário", Owner: true, Gerente: true, Operador: true, Atendente: false, Financeiro: false },
      { area: "Financeiro", Owner: true, Gerente: true, Operador: false, Atendente: false, Financeiro: true },
      { area: "Configurações", Owner: true, Gerente: false, Operador: false, Atendente: false, Financeiro: false },
    ],
  },
  bares: {
    label: "Bares & Restaurantes",
    goalLabel: "Vendas no mês",
    unit: "tickets",
    commissionLabel: "Comissão (5% sobre vendas)",
    members: [
      { id: "1", name: "Rafael Reis", role: "Gerente", job: "Gerente de salão", goal: 1200, achieved: 1140, commission: 4200, rating: 4.8, shift: "Qui–Dom 17h–02h", status: "ativo" },
      { id: "2", name: "Beatriz Lopes", role: "Operador", job: "Bartender chefe", goal: 900, achieved: 980, commission: 3650, rating: 4.9, shift: "Qua–Sáb 18h–02h", status: "ativo" },
      { id: "3", name: "Diego Martins", role: "Atendente", job: "Garçom", goal: 700, achieved: 612, commission: 2480, rating: 4.6, shift: "Qui–Sáb 18h–02h", status: "ativo" },
      { id: "4", name: "Carolina Brito", role: "Atendente", job: "Hostess", goal: 450, achieved: 422, commission: 1100, rating: 4.7, shift: "Qui–Sáb 17h–01h", status: "ativo" },
      { id: "5", name: "Lucas Pinto", role: "Operador", job: "Cozinheiro", goal: 800, achieved: 0, commission: 0, rating: 4.5, shift: "Folga programada", status: "folga" },
    ],
    schedule: [
      { day: "Seg", opens: "Fechado", closes: "—", staff: 0 },
      { day: "Ter", opens: "Fechado", closes: "—", staff: 0 },
      { day: "Qua", opens: "18:00", closes: "00:00", staff: 6 },
      { day: "Qui", opens: "18:00", closes: "02:00", staff: 9 },
      { day: "Sex", opens: "18:00", closes: "03:00", staff: 12 },
      { day: "Sáb", opens: "17:00", closes: "03:00", staff: 14 },
      { day: "Dom", opens: "16:00", closes: "23:00", staff: 7 },
    ],
    permissions: [
      { area: "PDV", Owner: true, Gerente: true, Operador: true, Atendente: true, Financeiro: false },
      { area: "Estoque", Owner: true, Gerente: true, Operador: true, Atendente: false, Financeiro: false },
      { area: "Caixa & sangrias", Owner: true, Gerente: true, Operador: false, Atendente: false, Financeiro: true },
      { area: "Cardápio digital", Owner: true, Gerente: true, Operador: false, Atendente: false, Financeiro: false },
    ],
  },
  cervejarias: {
    label: "Microcervejarias",
    goalLabel: "Lotes/tours no mês",
    unit: "lotes",
    commissionLabel: "Comissão por evento corporativo",
    members: [
      { id: "1", name: "Bruno Werner", role: "Gerente", job: "Mestre cervejeiro", goal: 12, achieved: 11, commission: 5800, rating: 4.9, shift: "Seg–Sex 8h–17h", status: "ativo" },
      { id: "2", name: "Larissa Hoffmann", role: "Operador", job: "Brewer assistente", goal: 12, achieved: 12, commission: 2400, rating: 4.8, shift: "Seg–Sex 8h–17h", status: "ativo" },
      { id: "3", name: "Felipe Ramos", role: "Atendente", job: "Guia de tour", goal: 36, achieved: 41, commission: 3200, rating: 4.9, shift: "Qui–Dom 14h–22h", status: "ativo" },
      { id: "4", name: "Marina Schmidt", role: "Operador", job: "Taproom", goal: 600, achieved: 540, commission: 1900, rating: 4.7, shift: "Ter–Sáb 16h–24h", status: "ativo" },
      { id: "5", name: "Otávio Reis", role: "Financeiro", job: "Controller", goal: 100, achieved: 96, commission: 0, rating: 4.8, shift: "Seg–Sex 9h–18h", status: "ativo" },
    ],
    schedule: [
      { day: "Seg", opens: "08:00", closes: "17:00", staff: 5 },
      { day: "Ter", opens: "08:00", closes: "24:00", staff: 8 },
      { day: "Qua", opens: "08:00", closes: "24:00", staff: 8 },
      { day: "Qui", opens: "08:00", closes: "24:00", staff: 10 },
      { day: "Sex", opens: "08:00", closes: "01:00", staff: 12 },
      { day: "Sáb", opens: "12:00", closes: "01:00", staff: 12 },
      { day: "Dom", opens: "12:00", closes: "20:00", staff: 8 },
    ],
    permissions: [
      { area: "Produção (lotes)", Owner: true, Gerente: true, Operador: true, Atendente: false, Financeiro: false },
      { area: "Taproom / PDV", Owner: true, Gerente: true, Operador: true, Atendente: true, Financeiro: false },
      { area: "Clube de assinatura", Owner: true, Gerente: true, Operador: false, Atendente: false, Financeiro: true },
      { area: "Custos & receita", Owner: true, Gerente: true, Operador: false, Atendente: false, Financeiro: true },
    ],
  },
  servicos: {
    label: "Serviços & Reformas",
    goalLabel: "OS concluídas no mês",
    unit: "OS",
    commissionLabel: "Comissão (8% da OS)",
    members: [
      { id: "1", name: "Eduardo Nunes", role: "Gerente", job: "Coordenador técnico", goal: 60, achieved: 58, commission: 5400, rating: 4.8, shift: "Seg–Sex 7h–17h", status: "ativo" },
      { id: "2", name: "André Cardoso", role: "Operador", job: "Eletricista sênior", goal: 45, achieved: 49, commission: 4900, rating: 4.9, shift: "Seg–Sáb 7h–17h", status: "ativo" },
      { id: "3", name: "Vinícius Tomé", role: "Operador", job: "Encanador", goal: 40, achieved: 32, commission: 2800, rating: 4.6, shift: "Seg–Sex 8h–18h", status: "ativo" },
      { id: "4", name: "Ana Beatriz", role: "Atendente", job: "Orçamentos", goal: 200, achieved: 184, commission: 1500, rating: 4.7, shift: "Seg–Sex 9h–18h", status: "ativo" },
      { id: "5", name: "Renato Silveira", role: "Operador", job: "Pintor", goal: 35, achieved: 0, commission: 0, rating: 4.5, shift: "Em férias", status: "ferias" },
    ],
    schedule: [
      { day: "Seg", opens: "07:00", closes: "18:00", staff: 9 },
      { day: "Ter", opens: "07:00", closes: "18:00", staff: 9 },
      { day: "Qua", opens: "07:00", closes: "18:00", staff: 9 },
      { day: "Qui", opens: "07:00", closes: "18:00", staff: 9 },
      { day: "Sex", opens: "07:00", closes: "18:00", staff: 9 },
      { day: "Sáb", opens: "08:00", closes: "14:00", staff: 5 },
      { day: "Dom", opens: "Plantão 24h", closes: "—", staff: 2 },
    ],
    permissions: [
      { area: "Ordens de serviço", Owner: true, Gerente: true, Operador: true, Atendente: true, Financeiro: false },
      { area: "Orçamentos", Owner: true, Gerente: true, Operador: false, Atendente: true, Financeiro: false },
      { area: "Recebimentos", Owner: true, Gerente: true, Operador: false, Atendente: false, Financeiro: true },
      { area: "Cadastro de clientes", Owner: true, Gerente: true, Operador: true, Atendente: true, Financeiro: false },
    ],
  },
  ecommerce: {
    label: "E-commerce & Varejo",
    goalLabel: "Pedidos no mês",
    unit: "pedidos",
    commissionLabel: "Comissão (3% da venda)",
    members: [
      { id: "1", name: "Camila Duarte", role: "Gerente", job: "Gerente de loja", goal: 1800, achieved: 1720, commission: 6200, rating: 4.8, shift: "Seg–Sáb 10h–20h", status: "ativo" },
      { id: "2", name: "Pedro Marques", role: "Operador", job: "Personal shopper", goal: 250, achieved: 281, commission: 3800, rating: 4.9, shift: "Ter–Sáb 11h–20h", status: "ativo" },
      { id: "3", name: "Sofia Mendes", role: "Atendente", job: "Atendimento omnichannel", goal: 900, achieved: 820, commission: 1900, rating: 4.7, shift: "Seg–Sex 9h–18h", status: "ativo" },
      { id: "4", name: "Henrique Alves", role: "Operador", job: "Estoque & expedição", goal: 2000, achieved: 1980, commission: 2100, rating: 4.6, shift: "Seg–Sáb 8h–17h", status: "ativo" },
      { id: "5", name: "Beatriz Nóbrega", role: "Financeiro", job: "Tesouraria", goal: 100, achieved: 94, commission: 0, rating: 4.8, shift: "Seg–Sex 9h–18h", status: "ativo" },
    ],
    schedule: [
      { day: "Seg", opens: "10:00", closes: "20:00", staff: 8 },
      { day: "Ter", opens: "10:00", closes: "20:00", staff: 8 },
      { day: "Qua", opens: "10:00", closes: "20:00", staff: 8 },
      { day: "Qui", opens: "10:00", closes: "20:00", staff: 9 },
      { day: "Sex", opens: "10:00", closes: "21:00", staff: 10 },
      { day: "Sáb", opens: "10:00", closes: "20:00", staff: 10 },
      { day: "Dom", opens: "12:00", closes: "18:00", staff: 6 },
    ],
    permissions: [
      { area: "Catálogo", Owner: true, Gerente: true, Operador: true, Atendente: false, Financeiro: false },
      { area: "Pedidos & SAC", Owner: true, Gerente: true, Operador: true, Atendente: true, Financeiro: false },
      { area: "Estoque & expedição", Owner: true, Gerente: true, Operador: true, Atendente: false, Financeiro: false },
      { area: "Cupons & antifraude", Owner: true, Gerente: true, Operador: false, Atendente: false, Financeiro: true },
    ],
  },
};

const STATUS_LABEL: Record<Member["status"], string> = {
  ativo: "Ativo",
  ferias: "Em férias",
  folga: "Folga",
};

function ShowroomEquipe() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const cfg = DATA[niche];

  const totals = useMemo(() => {
    const goal = cfg.members.reduce((a, m) => a + m.goal, 0);
    const achieved = cfg.members.reduce((a, m) => a + m.achieved, 0);
    const commission = cfg.members.reduce((a, m) => a + m.commission, 0);
    const rating = cfg.members.reduce((a, m) => a + m.rating, 0) / cfg.members.length;
    const active = cfg.members.filter((m) => m.status === "ativo").length;
    return {
      goal,
      achieved,
      pct: goal ? Math.round((achieved / goal) * 100) : 0,
      commission,
      rating,
      active,
    };
  }, [cfg]);

  const top = useMemo(
    () => [...cfg.members].sort((a, b) => b.achieved / b.goal - a.achieved / a.goal).slice(0, 3),
    [cfg],
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Users className="h-3 w-3" /> Gestão de equipe
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                Escalas, metas e comissões em uma tela só
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">
                Veja como a Impulsionando gerencia equipes por nicho — escala semanal, performance
                individual, comissões automáticas e permissões granulares por papel.
              </p>
            </div>
            <Select value={niche} onValueChange={(v) => setNiche(v as NicheSlug)}>
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DATA) as NicheSlug[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {DATA[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Users}
            label="Colaboradores ativos"
            value={`${totals.active} / ${cfg.members.length}`}
            sub="Equipe operacional do mês"
          />
          <KpiCard
            icon={TrendingUp}
            label="Atingimento de meta"
            value={`${totals.pct}%`}
            sub={`${totals.achieved.toLocaleString("pt-BR")} de ${totals.goal.toLocaleString("pt-BR")} ${cfg.unit}`}
          />
          <KpiCard
            icon={DollarSign}
            label="Comissões a pagar"
            value={fmtBRL(totals.commission)}
            sub="Fechamento automático no dia 5"
          />
          <KpiCard
            icon={Trophy}
            label="Avaliação média (NPS)"
            value={totals.rating.toFixed(1)}
            sub="Coletada após cada atendimento"
          />
        </div>
      </section>

      {/* Equipe + Top performers */}
      <section className="container mx-auto px-4 pb-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Equipe & desempenho</h2>
                <p className="text-xs text-muted-foreground">{cfg.commissionLabel}</p>
              </div>
              <Badge variant="outline">{cfg.goalLabel}</Badge>
            </div>

            <ul className="divide-y">
              {cfg.members.map((m) => {
                const pct = Math.min(100, Math.round((m.achieved / m.goal) * 100));
                return (
                  <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-medium">
                          {m.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.job} • {m.role}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {m.shift}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-60">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {m.achieved}/{m.goal} {cfg.unit}
                        </span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <Progress value={pct} />
                    </div>

                    <div className="flex flex-col items-end gap-1 sm:w-40">
                      <span className="text-sm font-semibold">{fmtBRL(m.commission)}</span>
                      <Badge
                        variant={m.status === "ativo" ? "secondary" : "outline"}
                        className="text-[11px]"
                      >
                        {STATUS_LABEL[m.status]}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="h-fit p-5">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">Top performers</h3>
            </div>
            <ol className="space-y-3">
              {top.map((m, i) => {
                const pct = Math.round((m.achieved / m.goal) * 100);
                return (
                  <li key={m.id} className="flex items-center gap-3 rounded-md border p-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-slate-100 text-slate-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{pct}% da meta</p>
                    </div>
                    <span className="text-xs font-semibold">{fmtBRL(m.commission)}</span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 rounded-md border bg-muted/40 p-3 text-xs">
              <p className="font-medium">Gamificação ativa</p>
              <p className="mt-1 text-muted-foreground">
                Top 3 do mês ganham bônus de R$ 500, R$ 300 e R$ 150 — cadastrável em 1 clique.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Escala semanal */}
      <section className="container mx-auto px-4 pb-10">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Escala da semana</h2>
            </div>
            <Badge variant="outline">Sincronizada com WhatsApp</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {cfg.schedule.map((d) => (
              <div key={d.day} className="rounded-lg border p-3 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{d.day}</p>
                <p className="mt-1 text-base font-semibold">
                  {d.opens === "Fechado" || d.opens.startsWith("Plantão")
                    ? d.opens
                    : `${d.opens}–${d.closes}`}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {d.staff} no turno
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Permissões */}
      <section className="container mx-auto px-4 pb-12">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Permissões por papel</h2>
            <Badge variant="outline" className="ml-2 text-[11px]">
              Granular por área
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">Área</th>
                  <th className="px-3 py-2 text-center">Owner</th>
                  <th className="px-3 py-2 text-center">Gerente</th>
                  <th className="px-3 py-2 text-center">Operador</th>
                  <th className="px-3 py-2 text-center">Atendente</th>
                  <th className="px-3 py-2 text-center">Financeiro</th>
                </tr>
              </thead>
              <tbody>
                {cfg.permissions.map((p) => (
                  <tr key={p.area} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{p.area}</td>
                    {(["Owner", "Gerente", "Operador", "Atendente", "Financeiro"] as const).map(
                      (r) => (
                        <td key={r} className="px-3 py-2 text-center">
                          {p[r] ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Equipe alinhada, comissão automática, zero planilha
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Cada venda, OS ou atendimento já entra com o colaborador certo, calcula a comissão e
            libera o pagamento no fechamento do mês.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">
                Falar com especialista <Sparkles className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom">
                Ver outros showrooms <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

export default ShowroomEquipe;
