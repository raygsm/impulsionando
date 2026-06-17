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
  User,
  CalendarDays,
  FileSignature,
  Package,
  Gift,
  Wallet,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  MessageCircle,
  Sparkles,
  Star,
  ArrowRight,
  CreditCard,
  MapPin,
  Heart,
  Truck,
} from "lucide-react";

export const Route = createFileRoute("/showroom/portal-cliente")({
  head: () => ({
    meta: [
      { title: "Portal do Cliente por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Área logada do cliente final: agendamentos, contratos, pedidos, fidelidade e carteira — adaptada por nicho.",
      },
      { property: "og:title", content: "Portal do Cliente — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Demo navegável do portal do cliente: histórico, contratos, pedidos, pontos e suporte direto pelo WhatsApp.",
      },
    ],
  }),
  component: ShowroomPortal,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";
type Tab = "overview" | "agendamentos" | "contratos" | "pedidos" | "fidelidade" | "carteira";

type Appt = { id: string; title: string; date: string; pro: string; status: "confirmado" | "concluido" | "pendente" };
type Contract = { id: string; title: string; date: string; status: "assinado" | "pendente" | "expirado"; amount: string };
type Order = { id: string; title: string; date: string; status: "entregue" | "em transporte" | "preparando" | "cancelado"; total: string };
type Reward = { id: string; title: string; points: number; available: boolean };
type Tx = { id: string; desc: string; date: string; amount: number; kind: "credit" | "debit" };

type Cfg = {
  brand: string;
  customer: { name: string; tier: string; since: string; ltv: string };
  pointsBalance: number;
  pointsTier: { current: string; next: string; pct: number };
  walletBalance: string;
  appts: Appt[];
  contracts: Contract[];
  orders: Order[];
  rewards: Reward[];
  txs: Tx[];
  apptLabel: string;
  orderLabel: string;
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brand: "Clínica Aurora",
    customer: { name: "Marina Costa", tier: "Ouro", since: "Mar/2024", ltv: "R$ 14.820" },
    pointsBalance: 2480,
    pointsTier: { current: "Ouro", next: "Diamante", pct: 64 },
    walletBalance: "R$ 320,00",
    apptLabel: "Consultas & procedimentos",
    orderLabel: "Compras de produtos",
    appts: [
      { id: "A-201", title: "Limpeza de pele profunda", date: "22/06 · 14:00", pro: "Dra. Helena Reis", status: "confirmado" },
      { id: "A-200", title: "Avaliação harmonização", date: "08/06 · 10:30", pro: "Dra. Helena Reis", status: "concluido" },
      { id: "A-199", title: "Retorno botox", date: "28/06 · 16:00", pro: "Dr. Marcos Lima", status: "pendente" },
    ],
    contracts: [
      { id: "C-1042", title: "Termo de Consentimento — Harmonização", date: "10/06", status: "assinado", amount: "R$ 4.800" },
      { id: "C-1015", title: "Plano Estético Anual", date: "Mar/2024", status: "assinado", amount: "R$ 12.400" },
      { id: "C-1098", title: "Termo LGPD — Atualização", date: "12/06", status: "pendente", amount: "—" },
    ],
    orders: [
      { id: "P-3201", title: "Sérum vitamina C + protetor", date: "11/06", status: "entregue", total: "R$ 289,00" },
      { id: "P-3198", title: "Kit pós-procedimento", date: "08/06", status: "em transporte", total: "R$ 174,90" },
    ],
    rewards: [
      { id: "r1", title: "Sessão de drenagem cortesia", points: 1800, available: true },
      { id: "r2", title: "Upgrade para Diamante por 30 dias", points: 2400, available: true },
      { id: "r3", title: "Kit skincare exclusivo", points: 3200, available: false },
    ],
    txs: [
      { id: "t1", desc: "Cashback consulta", date: "10/06", amount: 96, kind: "credit" },
      { id: "t2", desc: "Resgate — desconto produto", date: "08/06", amount: -50, kind: "debit" },
      { id: "t3", desc: "Saldo Pix sinal não utilizado", date: "01/06", amount: 200, kind: "credit" },
    ],
  },
  bares: {
    brand: "Bar Esquina 47",
    customer: { name: "Pedro Almeida", tier: "Prata", since: "Set/2024", ltv: "R$ 3.640" },
    pointsBalance: 980,
    pointsTier: { current: "Prata", next: "Ouro", pct: 48 },
    walletBalance: "R$ 80,00",
    apptLabel: "Reservas",
    orderLabel: "Comandas",
    appts: [
      { id: "A-501", title: "Reserva mesa 8 · 6 pessoas", date: "19/06 · 21:00", pro: "Salão principal", status: "confirmado" },
      { id: "A-500", title: "Mesa 4 · happy hour", date: "07/06 · 19:30", pro: "Varanda", status: "concluido" },
      { id: "A-499", title: "Evento privado — 30 anos", date: "18/07 · 20:00", pro: "Mezanino", status: "pendente" },
    ],
    contracts: [
      { id: "C-0212", title: "Contrato evento privado 30 anos", date: "12/06", status: "pendente", amount: "R$ 7.200" },
      { id: "C-0180", title: "Termo open bar — última visita", date: "02/06", status: "assinado", amount: "R$ 1.890" },
    ],
    orders: [
      { id: "P-9981", title: "Comanda — Sex 07/06", date: "07/06", status: "entregue", total: "R$ 248,00" },
      { id: "P-9970", title: "Delivery — chopp 2L + petiscos", date: "31/05", status: "entregue", total: "R$ 132,00" },
    ],
    rewards: [
      { id: "r1", title: "Chopp em dobro · quinta", points: 600, available: true },
      { id: "r2", title: "Mesa preferencial no fim de semana", points: 900, available: true },
      { id: "r3", title: "Open bar 1h grátis no aniversário", points: 1500, available: false },
    ],
    txs: [
      { id: "t1", desc: "Pontos comanda 07/06", date: "07/06", amount: 248, kind: "credit" },
      { id: "t2", desc: "Resgate — couvert artístico", date: "02/06", amount: -120, kind: "debit" },
    ],
  },
  cervejarias: {
    brand: "Cervejaria Lúpulo Norte",
    customer: { name: "Empório Beer SP", tier: "Distribuidor Gold", since: "Jan/2023", ltv: "R$ 198.400" },
    pointsBalance: 8420,
    pointsTier: { current: "Gold", next: "Platinum", pct: 72 },
    walletBalance: "R$ 1.240,00",
    apptLabel: "Visitas técnicas",
    orderLabel: "Pedidos de barril e garrafa",
    appts: [
      { id: "A-77", title: "Visita técnica — instalação chopeira", date: "21/06 · 09:00", pro: "Téc. Bruno", status: "confirmado" },
      { id: "A-76", title: "Degustação novo lote Stout", date: "30/06 · 15:00", pro: "Mestre cervejeiro", status: "pendente" },
    ],
    contracts: [
      { id: "C-0078", title: "Revenda Autorizada — renovação", date: "Mar/2026", status: "assinado", amount: "R$ 3.500/mês" },
      { id: "C-0091", title: "Comodato Chopeira #14", date: "10/06", status: "pendente", amount: "—" },
    ],
    orders: [
      { id: "P-2241", title: "Barril 50L IPA + Pilsen", date: "12/06", status: "em transporte", total: "R$ 1.840" },
      { id: "P-2233", title: "Caixa 24 long necks Stout", date: "05/06", status: "entregue", total: "R$ 612" },
      { id: "P-2228", title: "Pedido teste novo lote", date: "01/06", status: "preparando", total: "R$ 480" },
    ],
    rewards: [
      { id: "r1", title: "Frete grátis próximo pedido", points: 3000, available: true },
      { id: "r2", title: "Lote exclusivo edição limitada", points: 6000, available: true },
      { id: "r3", title: "Treinamento de equipe — in loco", points: 9000, available: false },
    ],
    txs: [
      { id: "t1", desc: "Bônus volume Maio", date: "01/06", amount: 1200, kind: "credit" },
      { id: "t2", desc: "Resgate — degustação privada", date: "20/05", amount: -800, kind: "debit" },
    ],
  },
  servicos: {
    brand: "Studio Forma",
    customer: { name: "Sofia Ribeiro", tier: "Prata", since: "Jul/2024", ltv: "R$ 8.420" },
    pointsBalance: 1640,
    pointsTier: { current: "Prata", next: "Ouro", pct: 58 },
    walletBalance: "R$ 145,00",
    apptLabel: "Sessões agendadas",
    orderLabel: "Pacotes contratados",
    appts: [
      { id: "A-331", title: "Treino — Personal Carlos", date: "Hoje · 18:30", pro: "Carlos Mendes", status: "confirmado" },
      { id: "A-330", title: "Avaliação física trimestral", date: "20/06 · 10:00", pro: "Time técnico", status: "pendente" },
      { id: "A-329", title: "Sessão Pilates", date: "10/06 · 19:00", pro: "Profa. Renata", status: "concluido" },
    ],
    contracts: [
      { id: "C-0331", title: "Plano Personal Mensal", date: "01/06", status: "assinado", amount: "R$ 980/mês" },
      { id: "C-0298", title: "Termo de Avaliação Física", date: "01/06", status: "assinado", amount: "—" },
    ],
    orders: [
      { id: "P-7701", title: "Pacote 10 sessões Pilates", date: "10/06", status: "entregue", total: "R$ 780,00" },
      { id: "P-7690", title: "Suplemento — whey 1kg", date: "04/06", status: "em transporte", total: "R$ 189,00" },
    ],
    rewards: [
      { id: "r1", title: "1 sessão Pilates cortesia", points: 800, available: true },
      { id: "r2", title: "Avaliação postural premium", points: 1500, available: true },
      { id: "r3", title: "Mês de personal + nutri grátis", points: 4000, available: false },
    ],
    txs: [
      { id: "t1", desc: "Cashback mensalidade", date: "05/06", amount: 49, kind: "credit" },
      { id: "t2", desc: "Resgate — garrafa térmica", date: "28/05", amount: -200, kind: "debit" },
    ],
  },
  ecommerce: {
    brand: "Loja Origem",
    customer: { name: "Júlia Mendes", tier: "Ouro", since: "Nov/2023", ltv: "R$ 6.940" },
    pointsBalance: 3120,
    pointsTier: { current: "Ouro", next: "Diamante", pct: 41 },
    walletBalance: "R$ 210,00",
    apptLabel: "Agendamentos de retirada",
    orderLabel: "Meus pedidos",
    appts: [
      { id: "A-441", title: "Retirada em loja — Shopping SP", date: "19/06 · 15:00", pro: "Balcão 3", status: "confirmado" },
      { id: "A-440", title: "Provador exclusivo lançamento", date: "25/06 · 11:00", pro: "Personal shopper", status: "pendente" },
    ],
    contracts: [
      { id: "C-2210", title: "Termo de troca/devolução", date: "01/06", status: "assinado", amount: "—" },
    ],
    orders: [
      { id: "P-8821", title: "Vestido midi + sandália", date: "12/06", status: "em transporte", total: "R$ 489,00" },
      { id: "P-8810", title: "Kit beauty completo", date: "05/06", status: "entregue", total: "R$ 312,00" },
      { id: "P-8798", title: "Bolsa coleção verão", date: "29/05", status: "entregue", total: "R$ 720,00" },
      { id: "P-8780", title: "Devolução — calça jeans", date: "20/05", status: "cancelado", total: "R$ 0" },
    ],
    rewards: [
      { id: "r1", title: "Frete grátis nas próximas 3 compras", points: 1200, available: true },
      { id: "r2", title: "Cupom 15% OFF coleção nova", points: 2000, available: true },
      { id: "r3", title: "Early access — lançamento", points: 5000, available: false },
    ],
    txs: [
      { id: "t1", desc: "Cashback pedido P-8821", date: "12/06", amount: 24, kind: "credit" },
      { id: "t2", desc: "Resgate cupom 10%", date: "01/06", amount: -300, kind: "debit" },
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

const STATUS_COLOR: Record<string, string> = {
  confirmado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  concluido: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  pendente: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  assinado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  expirado: "bg-red-500/15 text-red-600 dark:text-red-400",
  entregue: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "em transporte": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  preparando: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  cancelado: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function ShowroomPortal() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [tab, setTab] = useState<Tab>("overview");
  const cfg = DATA[niche];

  const initials = useMemo(
    () =>
      cfg.customer.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [cfg.customer.name],
  );

  const nextAppt = cfg.appts.find((a) => a.status === "confirmado") ?? cfg.appts[0];
  const pendingContracts = cfg.contracts.filter((c) => c.status === "pendente").length;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero / seletor */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <User className="h-3 w-3" /> Showroom · Portal do Cliente
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              A área logada que seu cliente final ama acessar
            </h1>
            <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
              Agendamentos, contratos, pedidos, pontos e suporte — tudo em um portal próprio,
              adaptado ao seu segmento e à sua marca.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(Object.keys(NICHE_LABELS) as NicheSlug[]).map((slug) => (
                <Button
                  key={slug}
                  size="sm"
                  variant={niche === slug ? "default" : "outline"}
                  onClick={() => {
                    setNiche(slug);
                    setTab("overview");
                  }}
                >
                  {NICHE_LABELS[slug]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cabeçalho do portal */}
      <section className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          <div className="flex flex-col items-start gap-4 border-b bg-muted/40 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/15 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{cfg.customer.name}</h2>
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3" /> {cfg.customer.tier}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cliente {cfg.brand} desde {cfg.customer.since} · LTV {cfg.customer.ltv}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Bell className="mr-1 h-3.5 w-3.5" /> Notificações
              </Button>
              <Button size="sm">
                <MessageCircle className="mr-1 h-3.5 w-3.5" /> Falar com a equipe
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b p-2">
            {(
              [
                { id: "overview", label: "Visão geral", icon: <Sparkles className="h-3.5 w-3.5" /> },
                { id: "agendamentos", label: cfg.apptLabel, icon: <CalendarDays className="h-3.5 w-3.5" /> },
                { id: "contratos", label: "Contratos", icon: <FileSignature className="h-3.5 w-3.5" /> },
                { id: "pedidos", label: cfg.orderLabel, icon: <Package className="h-3.5 w-3.5" /> },
                { id: "fidelidade", label: "Fidelidade", icon: <Gift className="h-3.5 w-3.5" /> },
                { id: "carteira", label: "Carteira", icon: <Wallet className="h-3.5 w-3.5" /> },
              ] as { id: Tab; label: string; icon: React.ReactNode }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6">
            {tab === "overview" && (
              <div className="grid gap-5 lg:grid-cols-3">
                {/* Próximo compromisso */}
                <Card className="border-primary/30 bg-primary/5 p-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="h-4 w-4 text-primary" /> Próximo compromisso
                    </div>
                    <Badge className={STATUS_COLOR[nextAppt.status]}>{nextAppt.status}</Badge>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{nextAppt.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {nextAppt.date} · {nextAppt.pro}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm">Confirmar presença</Button>
                    <Button size="sm" variant="outline">
                      <MapPin className="mr-1 h-3.5 w-3.5" /> Como chegar
                    </Button>
                    <Button size="sm" variant="ghost">
                      Reagendar
                    </Button>
                  </div>
                </Card>

                {/* Mini KPIs */}
                <div className="grid gap-3">
                  <MiniStat
                    icon={<Gift className="h-4 w-4" />}
                    label="Pontos disponíveis"
                    value={cfg.pointsBalance.toLocaleString("pt-BR")}
                    hint={`Tier ${cfg.pointsTier.current} → ${cfg.pointsTier.next}`}
                    progress={cfg.pointsTier.pct}
                  />
                  <MiniStat
                    icon={<Wallet className="h-4 w-4" />}
                    label="Saldo na carteira"
                    value={cfg.walletBalance}
                    hint="Pode ser usado em qualquer compra"
                  />
                  <MiniStat
                    icon={<FileSignature className="h-4 w-4" />}
                    label="Contratos pendentes"
                    value={`${pendingContracts}`}
                    hint={pendingContracts > 0 ? "Ação necessária" : "Tudo certo"}
                    warning={pendingContracts > 0}
                  />
                </div>

                {/* Recomendações */}
                <Card className="p-4 lg:col-span-3">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" /> Recomendações para você
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {cfg.rewards.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start justify-between gap-3 rounded-lg border p-3"
                      >
                        <div>
                          <div className="text-sm font-medium leading-tight">{r.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {r.points.toLocaleString("pt-BR")} pts
                          </div>
                        </div>
                        <Button size="sm" variant={r.available ? "default" : "outline"} disabled={!r.available}>
                          {r.available ? "Resgatar" : "Em breve"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {tab === "agendamentos" && (
              <div className="space-y-3">
                {cfg.appts.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 text-primary">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{a.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {a.date} · {a.pro}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOR[a.status]}>{a.status}</Badge>
                      <Button size="sm" variant="outline">
                        Detalhes <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button asChild className="w-full md:w-auto">
                  <Link to="/showroom/agendamentos-online">
                    <CalendarDays className="mr-2 h-4 w-4" /> Novo agendamento
                  </Link>
                </Button>
              </div>
            )}

            {tab === "contratos" && (
              <div className="space-y-3">
                {cfg.contracts.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 text-primary">
                        <FileSignature className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{c.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {c.id} · {c.date} · {c.amount}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOR[c.status]}>{c.status}</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-3.5 w-3.5" /> PDF
                      </Button>
                      {c.status === "pendente" && (
                        <Button size="sm">Assinar agora</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "pedidos" && (
              <div className="space-y-3">
                {cfg.orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 text-primary">
                        {o.status === "em transporte" ? (
                          <Truck className="h-4 w-4" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{o.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {o.id} · {o.date} · {o.total}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOR[o.status]}>{o.status}</Badge>
                      <Button size="sm" variant="outline">
                        Rastrear <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "fidelidade" && (
              <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                <Card className="p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Saldo
                  </div>
                  <div className="mt-1 text-4xl font-bold tracking-tight">
                    {cfg.pointsBalance.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs text-muted-foreground">pontos</div>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>
                        {cfg.pointsTier.current} → {cfg.pointsTier.next}
                      </span>
                      <span className="font-medium">{cfg.pointsTier.pct}%</span>
                    </div>
                    <Progress value={cfg.pointsTier.pct} className="h-2" />
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Continue acumulando para destravar novos benefícios.
                  </div>
                </Card>
                <div className="grid gap-3 sm:grid-cols-2">
                  {cfg.rewards.map((r) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{r.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {r.points.toLocaleString("pt-BR")} pts
                          </div>
                        </div>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button
                        className="mt-4 w-full"
                        size="sm"
                        variant={r.available ? "default" : "outline"}
                        disabled={!r.available}
                      >
                        {r.available ? "Resgatar" : `Faltam ${(r.points - cfg.pointsBalance).toLocaleString("pt-BR")} pts`}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {tab === "carteira" && (
              <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                <Card className="bg-gradient-to-br from-primary/15 via-primary/5 to-background p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="h-4 w-4" /> Carteira {cfg.brand}
                  </div>
                  <div className="mt-2 text-3xl font-bold tracking-tight">
                    {cfg.walletBalance}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Disponível para uso imediato
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm">Adicionar saldo</Button>
                    <Button size="sm" variant="outline">
                      Transferir
                    </Button>
                  </div>
                </Card>
                <Card className="p-0">
                  <div className="border-b p-4 text-sm font-medium">Histórico de transações</div>
                  <ul className="divide-y">
                    {cfg.txs.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-md p-2 ${
                              t.kind === "credit"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-red-500/15 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {t.kind === "credit" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{t.desc}</div>
                            <div className="text-xs text-muted-foreground">{t.date}</div>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-semibold tabular-nums ${
                            t.kind === "credit" ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {t.kind === "credit" ? "+" : "−"}R$ {Math.abs(t.amount).toFixed(2).replace(".", ",")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Um portal para fidelizar o seu cliente
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Branding próprio, login social, app PWA, push e WhatsApp integrado. Plug-and-play
                  com agenda, contratos, pedidos e fidelidade.
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

function MiniStat({
  icon,
  label,
  value,
  hint,
  progress,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  progress?: number;
  warning?: boolean;
}) {
  return (
    <Card className={`p-4 ${warning ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {typeof progress === "number" && <Progress value={progress} className="mt-2 h-1.5" />}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
