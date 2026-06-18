/**
 * /torre/restaurantes-demo — Dashboard executivo do nicho Bar & Restaurante (demo).
 *
 * Recursos:
 *  - KPIs agregados e funil principal
 *  - Drill-down por restaurante (cenário) e por tipo de QR
 *  - Funil por QR específico
 *  - Export CSV e PDF (print) do funil + KPIs
 *  - Alertas configuráveis quando a conversão entre etapas cai abaixo do limite
 *  - Atalho para tela de auditoria detalhada
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QrCode, Users, ShoppingBag, CreditCard, Gift, Receipt, RefreshCw,
  ArrowRight, Sparkles, BarChart3, Download, Printer, AlertTriangle, Bell, FileSearch,
} from "lucide-react";
import {
  fetchDemoRestauranteDashboard,
  listDemoRestauranteScenarios,
} from "@/lib/demo-restaurante.functions";

export const Route = createFileRoute("/_authenticated/torre/restaurantes-demo")({
  component: TorreRestaurantesDemoPage,
});

const DEFAULT_SCENARIO = "boteco-aurora";
const BRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const KIND_LABEL: Record<string, string> = {
  mesa: "Mesa", delivery: "Delivery", evento: "Evento", pesquisa: "Pesquisa", clube: "Clube",
};
const FAV_LABEL: Record<string, string> = {
  chopp: "Chopp & cerveja", petiscos: "Petiscos", drinks: "Drinks", massas: "Massas", sobremesas: "Sobremesas",
};
const FREQ_LABEL: Record<string, string> = {
  primeira: "Primeira vez", mensal: "Mensal", quinzenal: "Quinzenal", semanal: "Semanal",
};
const COMPANY_LABEL: Record<string, string> = {
  sozinho: "Sozinho", casal: "Casal", amigos: "Amigos", familia: "Família", trabalho: "Trabalho",
};
const INTEREST_LABEL: Record<string, string> = {
  eventos: "Eventos", clube: "Clube", delivery: "Delivery", happy_hour: "Happy hour", private: "Evento privado",
};

// ───────── Alertas (limites configuráveis em localStorage) ─────────
type AlertThresholds = {
  scanToMenu: number;
  menuToCheckout: number;
  checkoutToPaid: number;
  paidToSurvey: number;
};
const DEFAULT_THRESHOLDS: AlertThresholds = {
  scanToMenu: 35, menuToCheckout: 50, checkoutToPaid: 70, paidToSurvey: 30,
};
const THRESH_KEY = "torre-resto-demo:thresholds";
function loadThresholds(): AlertThresholds {
  try {
    if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
    const raw = window.localStorage.getItem(THRESH_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    return { ...DEFAULT_THRESHOLDS, ...(JSON.parse(raw) as Partial<AlertThresholds>) };
  } catch { return DEFAULT_THRESHOLDS; }
}

function pct(num: number, denom: number) {
  return denom > 0 ? Math.round((num / denom) * 100) : 0;
}

// ───────── CSV helper ─────────
function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function Kpi({
  icon: Icon, label, value, sub,
}: {
  icon: typeof Users; label: string; value: string | number; sub?: string;
}) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function FunnelStep({ label, value, base }: { label: string; value: number; base: number }) {
  const p = pct(value, base);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} · {p}%</span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function CountList({
  items, labelMap, empty,
}: {
  items: Array<{ key: string; count: number }>;
  labelMap?: Record<string, string>;
  empty?: string;
}) {
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty ?? "Sem dados ainda."}</p>;
  const max = items[0].count;
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.key} className="text-xs">
          <div className="flex justify-between">
            <span>{labelMap?.[i.key] ?? i.key}</span>
            <span className="text-muted-foreground">{i.count}</span>
          </div>
          <div className="h-1.5 mt-0.5 rounded bg-muted overflow-hidden">
            <div className="h-full bg-primary/70" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function AlertsPanel({
  thresholds, onChange, breaches,
}: {
  thresholds: AlertThresholds;
  onChange: (t: AlertThresholds) => void;
  breaches: Array<{ key: string; label: string; current: number; threshold: number }>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-4 space-y-3 print:hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <h2 className="text-sm font-semibold">Alertas de conversão</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Fechar" : "Configurar limites"}
        </Button>
      </div>
      {breaches.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todas as etapas estão acima dos limites configurados. Nenhum alerta.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {breaches.map((b) => (
            <li
              key={b.key}
              className="flex items-start gap-2 text-xs rounded-md border border-destructive/30 bg-destructive/5 p-2"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{b.label}</p>
                <p className="text-muted-foreground">
                  Atual {b.current}% · limite mínimo {b.threshold}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
          {[
            ["scanToMenu", "Scan → Cardápio"],
            ["menuToCheckout", "Cardápio → Checkout"],
            ["checkoutToPaid", "Checkout → Pago"],
            ["paidToSurvey", "Pago → Pesquisa"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label} (mínimo %)</Label>
              <Input
                type="number" min={0} max={100}
                value={thresholds[key as keyof AlertThresholds]}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  const next = { ...thresholds, [key]: v };
                  onChange(next);
                  try { window.localStorage.setItem(THRESH_KEY, JSON.stringify(next)); } catch { /* ignore */ }
                }}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TorreRestaurantesDemoPage() {
  const fetchDash = useServerFn(fetchDemoRestauranteDashboard);
  const fetchScenarios = useServerFn(listDemoRestauranteScenarios);
  const [scenarioSlug, setScenarioSlug] = useState(DEFAULT_SCENARIO);
  const [windowHours, setWindow] = useState(24 * 7);
  const [qrKind, setQrKind] = useState<string>("all");
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => { setThresholds(loadThresholds()); }, []);

  const scenariosQ = useQuery({
    queryKey: ["torre-resto-scenarios"],
    queryFn: () => fetchScenarios(),
    staleTime: 60_000,
  });

  const q = useQuery({
    queryKey: ["torre-restaurantes-demo", scenarioSlug, windowHours, qrKind],
    queryFn: () => fetchDash({
      data: {
        scenarioSlug,
        sinceHours: windowHours,
        qrKind: qrKind === "all" ? undefined : (qrKind as "mesa"),
      },
    }),
    refetchInterval: 15_000,
  });

  const breaches = useMemo(() => {
    if (!q.data) return [];
    const c = q.data.conversion;
    const checks = [
      { key: "scanToMenu", label: "Scan → Cardápio", current: pct(c.menuActive, c.scans), threshold: thresholds.scanToMenu, base: c.scans },
      { key: "menuToCheckout", label: "Cardápio → Checkout", current: pct(c.checkoutAttempts, c.menuActive), threshold: thresholds.menuToCheckout, base: c.menuActive },
      { key: "checkoutToPaid", label: "Checkout → Pago", current: pct(c.checkoutDone, c.checkoutAttempts), threshold: thresholds.checkoutToPaid, base: c.checkoutAttempts },
      { key: "paidToSurvey", label: "Pago → Pesquisa", current: pct(c.surveysSubmitted, c.checkoutDone), threshold: thresholds.paidToSurvey, base: c.checkoutDone },
    ];
    return checks.filter((c) => c.base >= 3 && c.current < c.threshold);
  }, [q.data, thresholds]);

  if (q.isLoading) {
    return <main className="p-6 text-sm text-muted-foreground">Carregando torre…</main>;
  }
  if (q.error || !q.data) {
    return (
      <main className="p-6">
        <Card className="p-4 text-sm">
          Não foi possível carregar a torre. {String((q.error as Error | undefined)?.message ?? "")}
        </Card>
      </main>
    );
  }

  const d = q.data;
  const conv = d.conversion;
  const totalPay = d.paymentMix.pix + d.paymentMix.card + d.paymentMix.on_delivery;

  const exportKpisCsv = () => {
    const rows: Array<Array<string | number>> = [
      ["Métrica", "Valor"],
      ["Cenário", d.scenario.name],
      ["Janela (horas)", windowHours],
      ["Filtro QR", qrKind === "all" ? "Todos" : (KIND_LABEL[qrKind] ?? qrKind)],
      ["Scans", conv.scans],
      ["Sessões distintas", d.totals.distinctSessions],
      ["Carrinho ativo", conv.menuActive],
      ["Tentativas de checkout", conv.checkoutAttempts],
      ["Checkouts simulados", conv.checkoutDone],
      ["Pesquisas enviadas", conv.surveysSubmitted],
      ["Leads", d.totals.leads],
      ["Receita simulada (R$)", (d.totals.simulatedRevenueCents / 100).toFixed(2)],
      ["Ticket médio (R$)", (d.totals.avgTicketCents / 100).toFixed(2)],
      [],
      ["Funil — Etapa", "Sessões", "% sobre scans"],
      ["Scans", conv.scans, "100%"],
      ["Cardápio (adicionou)", conv.menuActive, `${pct(conv.menuActive, conv.scans)}%`],
      ["Tentou checkout", conv.checkoutAttempts, `${pct(conv.checkoutAttempts, conv.scans)}%`],
      ["Simulou pagamento", conv.checkoutDone, `${pct(conv.checkoutDone, conv.scans)}%`],
      ["Respondeu pesquisa", conv.surveysSubmitted, `${pct(conv.surveysSubmitted, conv.scans)}%`],
      [],
      ["Funil por tipo de QR", "Scans", "Cardápio", "Checkout", "Pago", "Pesquisa"],
      ...d.funnelByKind.map((k) => [
        KIND_LABEL[k.kind] ?? k.kind, k.scans, k.menuActive, k.checkoutAttempts, k.checkoutDone, k.surveysSubmitted,
      ]),
      [],
      ["Funil por QR específico", "Scans", "Cardápio", "Checkout", "Pago", "Pesquisa"],
      ...d.funnelByQr.map((row) => {
        const meta = d.topQrs.find((t) => t.slug === row.slug);
        return [meta?.title ?? row.slug, row.scans, row.menuActive, row.checkoutAttempts, row.checkoutDone, row.surveysSubmitted];
      }),
    ];
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    downloadCsv(`torre-restaurantes-${scenarioSlug}-${stamp}.csv`, rows);
  };

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto print:max-w-none print:p-0">
      <style>{`@media print { .print\\:hidden{display:none!important} body{background:#fff} }`}</style>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="w-3.5 h-3.5" /> Torre de Controle · Bar & Restaurante (demo)
          </div>
          <h1 className="text-2xl font-bold leading-tight">{d.scenario.name}</h1>
          <p className="text-sm text-muted-foreground">{d.scenario.tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {scenariosQ.data && scenariosQ.data.length > 1 && (
            <Select value={scenarioSlug} onValueChange={setScenarioSlug}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {scenariosQ.data.map((s) => (
                  <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={qrKind} onValueChange={setQrKind}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os QR</SelectItem>
              {Object.entries(KIND_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(windowHours)} onValueChange={(v) => setWindow(Number(v))}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="72">Últimos 3 dias</SelectItem>
              <SelectItem value="168">Últimos 7 dias</SelectItem>
              <SelectItem value="720">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => q.refetch()} aria-label="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportKpisCsv}>
            <Download className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1" /> PDF
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/torre/restaurantes-demo/auditoria" search={{ scenarioSlug, sinceHours: windowHours }}>
              <FileSearch className="w-3.5 h-3.5 mr-1" /> Auditoria
            </Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link to="/showroom/restaurante">
              Showroom <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      <AlertsPanel thresholds={thresholds} onChange={setThresholds} breaches={breaches} />

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={QrCode} label="Scans" value={conv.scans} sub={`${d.totals.distinctSessions} sessões`} />
        <Kpi icon={ShoppingBag} label="Carrinho ativo" value={conv.menuActive} sub={`${d.topItems.length} itens diferentes`} />
        <Kpi icon={CreditCard} label="Checkouts simulados" value={conv.checkoutDone} sub={`${conv.checkoutAttempts} tentativas`} />
        <Kpi icon={Receipt} label="Receita simulada" value={BRL(d.totals.simulatedRevenueCents)} sub={`Ticket médio ${BRL(d.totals.avgTicketCents)}`} />
        <Kpi icon={Gift} label="Leads + Vouchers" value={`${d.totals.leads} / ${conv.surveysSubmitted}`} sub="Pesquisas enviadas" />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Funil da demonstração</h2>
            <Badge variant="outline" className="text-[10px]">
              {qrKind === "all" ? `Janela ${windowHours}h` : `${KIND_LABEL[qrKind]} · ${windowHours}h`}
            </Badge>
          </div>
          <FunnelStep label="Scans" value={conv.scans} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Abriu cardápio (adicionou)" value={conv.menuActive} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Tentou checkout" value={conv.checkoutAttempts} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Simulou pagamento" value={conv.checkoutDone} base={Math.max(conv.scans, 1)} />
          <FunnelStep label="Respondeu pesquisa" value={conv.surveysSubmitted} base={Math.max(conv.scans, 1)} />
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Mix de pagamento simulado</h2>
          {totalPay === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum pagamento simulado ainda.</p>
          ) : (
            <div className="space-y-2">
              {(["pix", "card", "on_delivery"] as const).map((m) => {
                const v = d.paymentMix[m];
                const p = pct(v, totalPay);
                const lbl = m === "pix" ? "Pix" : m === "card" ? "Cartão" : "Na entrega";
                return (
                  <div key={m}>
                    <div className="flex justify-between text-xs">
                      <span>{lbl}</span>
                      <span className="text-muted-foreground">{v} · {p}%</span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="border-t pt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Scans por tipo</p>
              <CountList items={d.scanByKind} labelMap={KIND_LABEL} />
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">QRs mais escaneados</p>
              {d.topQrs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem scans ainda.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {d.topQrs.slice(0, 5).map((qr) => (
                    <li key={qr.slug} className="flex justify-between gap-2">
                      <button
                        type="button"
                        className="truncate text-left hover:underline"
                        onClick={() => setQrKind(qr.kind)}
                        title={`Filtrar por ${qr.kind}`}
                      >
                        {qr.title}
                      </button>
                      <span className="text-muted-foreground">{qr.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Drill-down: funil por tipo de QR */}
      <section>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-semibold">Drill-down · Funil por tipo de QR</h2>
            <p className="text-xs text-muted-foreground">
              Clique no tipo para filtrar a torre inteira.
            </p>
          </div>
          {d.funnelByKind.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados na janela atual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">Tipo</th>
                    <th className="text-right py-2 pr-3">Scans</th>
                    <th className="text-right py-2 pr-3">Cardápio</th>
                    <th className="text-right py-2 pr-3">Checkout</th>
                    <th className="text-right py-2 pr-3">Pago</th>
                    <th className="text-right py-2">Pesquisa</th>
                  </tr>
                </thead>
                <tbody>
                  {d.funnelByKind.map((k) => (
                    <tr
                      key={k.kind}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/40"
                      onClick={() => setQrKind(k.kind)}
                    >
                      <td className="py-2 pr-3 font-medium">{KIND_LABEL[k.kind] ?? k.kind}</td>
                      <td className="py-2 pr-3 text-right">{k.scans}</td>
                      <td className="py-2 pr-3 text-right">{k.menuActive} <span className="text-muted-foreground">({pct(k.menuActive, k.scans)}%)</span></td>
                      <td className="py-2 pr-3 text-right">{k.checkoutAttempts} <span className="text-muted-foreground">({pct(k.checkoutAttempts, k.scans)}%)</span></td>
                      <td className="py-2 pr-3 text-right">{k.checkoutDone} <span className="text-muted-foreground">({pct(k.checkoutDone, k.scans)}%)</span></td>
                      <td className="py-2 text-right">{k.surveysSubmitted} <span className="text-muted-foreground">({pct(k.surveysSubmitted, k.scans)}%)</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* Drill-down: funil por QR específico */}
      <section>
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Drill-down · Funil por QR específico</h2>
          {d.funnelByQr.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados na janela atual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">QR</th>
                    <th className="text-right py-2 pr-3">Scans</th>
                    <th className="text-right py-2 pr-3">Cardápio</th>
                    <th className="text-right py-2 pr-3">Checkout</th>
                    <th className="text-right py-2 pr-3">Pago</th>
                    <th className="text-right py-2">Pesquisa</th>
                  </tr>
                </thead>
                <tbody>
                  {d.funnelByQr.map((row) => {
                    const meta = d.topQrs.find((t) => t.slug === row.slug);
                    return (
                      <tr key={row.slug} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{meta?.title ?? row.slug}</div>
                          <div className="text-[10px] text-muted-foreground">{KIND_LABEL[meta?.kind ?? ""] ?? meta?.kind}</div>
                        </td>
                        <td className="py-2 pr-3 text-right">{row.scans}</td>
                        <td className="py-2 pr-3 text-right">{row.menuActive}</td>
                        <td className="py-2 pr-3 text-right">{row.checkoutAttempts}</td>
                        <td className="py-2 pr-3 text-right">{row.checkoutDone}</td>
                        <td className="py-2 text-right">{row.surveysSubmitted}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Top itens adicionados
          </h2>
          {d.topItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum item adicionado ainda.</p>
          ) : (
            <ul className="divide-y">
              {d.topItems.map((it) => (
                <li key={it.name} className="py-2 flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{it.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {it.qty}× · {BRL(it.revenueCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Gift className="w-4 h-4" /> Vouchers emitidos
          </h2>
          {d.vouchers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Catálogo de vouchers vazio.</p>
          ) : (
            <ul className="space-y-2">
              {d.vouchers.map((v) => (
                <li key={v.code} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-semibold">{v.code}</p>
                    <p className="text-muted-foreground">{v.name} · {v.audience ?? "geral"}</p>
                  </div>
                  <Badge variant={v.emitted > 0 ? "default" : "outline"}>{v.emitted} emitidos</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Categoria favorita</h3>
          <CountList items={d.preferences.favorites} labelMap={FAV_LABEL} empty="Sem pesquisas." />
        </Card>
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Frequência</h3>
          <CountList items={d.preferences.frequency} labelMap={FREQ_LABEL} empty="Sem pesquisas." />
        </Card>
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Companhia</h3>
          <CountList items={d.preferences.company} labelMap={COMPANY_LABEL} empty="Sem pesquisas." />
        </Card>
        <Card className="p-4 space-y-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Interesses</h3>
          <CountList items={d.preferences.interests} labelMap={INTEREST_LABEL} empty="Sem pesquisas." />
        </Card>
      </section>

      <section>
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Últimos leads
          </h2>
          {d.recentLeads.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma pesquisa enviada na janela atual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">Nome (mascarado)</th>
                    <th className="text-left py-2 pr-3">WhatsApp</th>
                    <th className="text-left py-2 pr-3">Favorito</th>
                    <th className="text-left py-2 pr-3">Voucher</th>
                    <th className="text-right py-2">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentLeads.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{l.name}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground font-mono">{l.whatsapp}</td>
                      <td className="py-2 pr-3 text-xs">{l.favorite ? FAV_LABEL[l.favorite] ?? l.favorite : "—"}</td>
                      <td className="py-2 pr-3">{l.voucher ? <Badge className="font-mono">{l.voucher}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="py-2 text-right text-xs text-muted-foreground">
                        {new Date(l.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <p className="text-[11px] text-muted-foreground text-center">
        Todos os números acima vêm de sessões marcadas como <code>is_demo=true</code>. Nenhum dado é
        sincronizado com produção.
      </p>
    </main>
  );
}
