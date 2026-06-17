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
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  CheckCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/showroom/financeiro")({
  head: () => ({
    meta: [
      { title: "Showroom Financeiro — Fluxo de caixa por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "Fluxo de caixa, contas a receber/pagar, DRE simples e conciliação automática com MercadoPago e InfinitePay por nicho.",
      },
      { property: "og:title", content: "Financeiro — Impulsionando" },
      {
        property: "og:description",
        content: "Recebíveis, conciliação e DRE em tempo real, por nicho.",
      },
    ],
  }),
  component: ShowroomFinanceiro,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços (Oficinas, Estética)",
  ecommerce: "E-commerce & Delivery",
};

type Receivable = {
  client: string;
  desc: string;
  due: string;
  amount: number;
  status: "paid" | "open" | "late";
  method: "pix" | "card" | "boleto" | "infinitepay" | "mercadopago";
};

type CashRow = { day: string; in: number; out: number };

type NicheData = {
  mrr: number;
  receivableTotal: number;
  ticket: number;
  margin: number;
  cash: CashRow[];
  receivables: Receivable[];
  reconciliation: { gateway: string; matched: number; pending: number; divergent: number }[];
};

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const DATA: Record<NicheSlug, NicheData> = {
  clinicas: {
    mrr: 78400,
    receivableTotal: 42180,
    ticket: 320,
    margin: 0.42,
    cash: [
      { day: "Seg", in: 6200, out: 2800 },
      { day: "Ter", in: 8800, out: 3100 },
      { day: "Qua", in: 7400, out: 2400 },
      { day: "Qui", in: 9100, out: 3600 },
      { day: "Sex", in: 11200, out: 4100 },
      { day: "Sáb", in: 4800, out: 1200 },
    ],
    receivables: [
      { client: "Marina S.", desc: "Pacote dermato 6x", due: "18/06", amount: 480, status: "paid", method: "pix" },
      { client: "Renata L.", desc: "Sessão laser", due: "19/06", amount: 320, status: "open", method: "card" },
      { client: "Lucas P.", desc: "Consulta", due: "12/06", amount: 280, status: "late", method: "boleto" },
      { client: "Convênio Bradesco", desc: "Repasse maio", due: "25/06", amount: 18400, status: "open", method: "boleto" },
    ],
    reconciliation: [
      { gateway: "MercadoPago", matched: 124, pending: 3, divergent: 0 },
      { gateway: "InfinitePay", matched: 58, pending: 1, divergent: 0 },
    ],
  },
  bares: {
    mrr: 142000,
    receivableTotal: 28900,
    ticket: 96,
    margin: 0.28,
    cash: [
      { day: "Seg", in: 3200, out: 4100 },
      { day: "Ter", in: 4800, out: 3800 },
      { day: "Qua", in: 7100, out: 4200 },
      { day: "Qui", in: 12400, out: 5100 },
      { day: "Sex", in: 28900, out: 7800 },
      { day: "Sáb", in: 36400, out: 8600 },
    ],
    receivables: [
      { client: "Rafa A.", desc: "Reserva sábado", due: "21/06", amount: 480, status: "paid", method: "pix" },
      { client: "Time Acme", desc: "Confra 12 pax", due: "22/06", amount: 2880, status: "open", method: "infinitepay" },
      { client: "Boda Mendes", desc: "Privê 30 pax", due: "21/06", amount: 9600, status: "paid", method: "infinitepay" },
      { client: "iFood", desc: "Repasse semanal", due: "23/06", amount: 8400, status: "open", method: "boleto" },
    ],
    reconciliation: [
      { gateway: "InfinitePay (maquininhas)", matched: 412, pending: 5, divergent: 1 },
      { gateway: "MercadoPago Pix", matched: 218, pending: 0, divergent: 0 },
    ],
  },
  microcervejarias: {
    mrr: 96000,
    receivableTotal: 53400,
    ticket: 280,
    margin: 0.36,
    cash: [
      { day: "Seg", in: 1800, out: 5200 },
      { day: "Ter", in: 2400, out: 2100 },
      { day: "Qua", in: 3100, out: 4800 },
      { day: "Qui", in: 4200, out: 2600 },
      { day: "Sex", in: 9800, out: 3400 },
      { day: "Sáb", in: 18600, out: 4100 },
    ],
    receivables: [
      { client: "Clube Lúpulo (412 sócios)", desc: "Cobrança junho", due: "10/06", amount: 61788, status: "paid", method: "mercadopago" },
      { client: "Tap House", desc: "Lote #248 · 3 barris", due: "27/06", amount: 2890, status: "open", method: "boleto" },
      { client: "Empório Norte", desc: "Pedido B2B", due: "15/06", amount: 4200, status: "late", method: "boleto" },
    ],
    reconciliation: [
      { gateway: "MercadoPago (assinatura)", matched: 412, pending: 2, divergent: 0 },
      { gateway: "Boleto B2B", matched: 38, pending: 4, divergent: 1 },
    ],
  },
  servicos: {
    mrr: 88200,
    receivableTotal: 31200,
    ticket: 540,
    margin: 0.34,
    cash: [
      { day: "Seg", in: 4800, out: 2100 },
      { day: "Ter", in: 6200, out: 2800 },
      { day: "Qua", in: 7400, out: 3100 },
      { day: "Qui", in: 8800, out: 3400 },
      { day: "Sex", in: 9600, out: 3900 },
      { day: "Sáb", in: 5400, out: 1800 },
    ],
    receivables: [
      { client: "Pedro G.", desc: "OS #4421", due: "17/06", amount: 720, status: "paid", method: "pix" },
      { client: "Civic 2019", desc: "OS #4438", due: "19/06", amount: 1840, status: "open", method: "infinitepay" },
      { client: "Frota Logix", desc: "Contrato mensal", due: "10/06", amount: 8800, status: "late", method: "boleto" },
    ],
    reconciliation: [
      { gateway: "InfinitePay", matched: 86, pending: 2, divergent: 0 },
      { gateway: "Pix MercadoPago", matched: 142, pending: 1, divergent: 0 },
    ],
  },
  ecommerce: {
    mrr: 218000,
    receivableTotal: 64200,
    ticket: 189,
    margin: 0.22,
    cash: [
      { day: "Seg", in: 12800, out: 4200 },
      { day: "Ter", in: 14400, out: 5100 },
      { day: "Qua", in: 16200, out: 4800 },
      { day: "Qui", in: 18800, out: 5400 },
      { day: "Sex", in: 26400, out: 7100 },
      { day: "Sáb", in: 22100, out: 6300 },
    ],
    receivables: [
      { client: "Carla Origem", desc: "Pedido #7821", due: "17/06", amount: 389, status: "paid", method: "card" },
      { client: "MercadoPago D+1", desc: "Repasse 18/06", due: "18/06", amount: 18400, status: "open", method: "mercadopago" },
      { client: "InfinitePay parcelado", desc: "Antecipação", due: "20/06", amount: 9800, status: "open", method: "infinitepay" },
      { client: "Bruno T.", desc: "Pedido #7790 (troca)", due: "—", amount: -120, status: "open", method: "card" },
    ],
    reconciliation: [
      { gateway: "MercadoPago Checkout", matched: 1284, pending: 12, divergent: 2 },
      { gateway: "InfinitePay link", matched: 318, pending: 3, divergent: 0 },
    ],
  },
};

const STATUS: Record<Receivable["status"], { label: string; cls: string }> = {
  paid: { label: "pago", cls: "bg-emerald-100 text-emerald-700" },
  open: { label: "aberto", cls: "bg-sky-100 text-sky-700" },
  late: { label: "atrasado", cls: "bg-rose-100 text-rose-700" },
};

const METHOD_LABEL: Record<Receivable["method"], string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  infinitepay: "InfinitePay",
  mercadopago: "MercadoPago",
};

function ShowroomFinanceiro() {
  const [nicho, setNicho] = useState<NicheSlug>("clinicas");
  const d = DATA[nicho];

  const totals = useMemo(() => {
    const inSum = d.cash.reduce((a, c) => a + c.in, 0);
    const outSum = d.cash.reduce((a, c) => a + c.out, 0);
    const net = inSum - outSum;
    const max = Math.max(...d.cash.map((c) => Math.max(c.in, c.out)));
    return { inSum, outSum, net, max };
  }, [d]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Wallet className="h-3 w-3" /> Showroom Financeiro
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Caixa, recebíveis e conciliação no mesmo lugar
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Fluxo de caixa diário, contas a receber, DRE simples e conciliação automática com
              MercadoPago e InfinitePay — adaptado ao seu nicho.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Painel financeiro</h2>
            <p className="mt-1 text-muted-foreground">Semana corrente · valores simulados</p>
          </div>
          <div className="w-full sm:w-80">
            <Select value={nicho} onValueChange={(v) => setNicho(v as NicheSlug)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHO_LABEL) as NicheSlug[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {NICHO_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CircleDollarSign className="h-3 w-3" /> Faturamento mensal
            </p>
            <p className="mt-1 text-2xl font-bold">{fmt(d.mrr)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> A receber (30d)
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(d.receivableTotal)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" /> Ticket médio
            </p>
            <p className="mt-1 text-2xl font-bold">{fmt(d.ticket)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Margem operacional
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {Math.round(d.margin * 100)}%
            </p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Fluxo de caixa */}
          <Card className="p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-semibold">Fluxo de caixa semanal</h3>
                <p className="text-xs text-muted-foreground">
                  Entradas vs saídas · saldo {fmt(totals.net)}
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500" /> entradas
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-rose-400" /> saídas
                </span>
              </div>
            </div>
            <div className="flex h-56 items-end gap-3">
              {d.cash.map((c) => (
                <div key={c.day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-full w-full items-end gap-1">
                    <div
                      className="flex-1 rounded-t bg-emerald-500/80"
                      style={{ height: `${(c.in / totals.max) * 100}%` }}
                      title={`Entrada: ${fmt(c.in)}`}
                    />
                    <div
                      className="flex-1 rounded-t bg-rose-400/80"
                      style={{ height: `${(c.out / totals.max) * 100}%` }}
                      title={`Saída: ${fmt(c.out)}`}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{c.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="font-semibold text-emerald-600">{fmt(totals.inSum)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="font-semibold text-rose-600">{fmt(totals.outSum)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="font-semibold">{fmt(totals.net)}</p>
              </div>
            </div>
          </Card>

          {/* Conciliação */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold">Conciliação automática</h3>
            <p className="text-xs text-muted-foreground">
              Webhooks dos gateways batem com vendas em tempo real.
            </p>
            <ul className="mt-4 space-y-3">
              {d.reconciliation.map((r) => (
                <li key={r.gateway} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{r.gateway}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded bg-emerald-50 py-1 text-emerald-700">
                      <p className="font-bold">{r.matched}</p>
                      <p>conciliados</p>
                    </div>
                    <div className="rounded bg-amber-50 py-1 text-amber-700">
                      <p className="font-bold">{r.pending}</p>
                      <p>pendentes</p>
                    </div>
                    <div
                      className={`rounded py-1 ${
                        r.divergent > 0 ? "bg-rose-50 text-rose-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <p className="font-bold">{r.divergent}</p>
                      <p>divergentes</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              Divergências viram tarefa automática para o financeiro com link da venda.
            </p>
          </Card>
        </div>

        {/* Recebíveis */}
        <Card className="mt-6 overflow-hidden">
          <div className="border-b px-5 py-4">
            <h3 className="text-lg font-semibold">Contas a receber</h3>
            <p className="text-xs text-muted-foreground">
              Próximos vencimentos · cobrança automática via WhatsApp + Pix.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Descrição</th>
                  <th className="px-4 py-2 text-left">Método</th>
                  <th className="px-4 py-2 text-left">Vencimento</th>
                  <th className="px-4 py-2 text-right">Valor</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.receivables.map((r, i) => {
                  const st = STATUS[r.status];
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 font-medium">{r.client}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.desc}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{METHOD_LABEL[r.method]}</Badge>
                      </td>
                      <td className="px-4 py-3">{r.due}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {fmt(r.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${st.cls}`}>
                          {r.status === "paid" ? (
                            <CheckCheck className="mr-0.5 inline h-3 w-3" />
                          ) : r.status === "late" ? (
                            <AlertCircle className="mr-0.5 inline h-3 w-3" />
                          ) : null}
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Financeiro sem planilha</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Cobrança, conciliação, DRE e antecipação rodando junto com a operação — pronto para
            seu nicho desde o dia 1.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/integracoes">Ver integrações</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
