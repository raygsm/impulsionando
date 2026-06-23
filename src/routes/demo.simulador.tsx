import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useState } from "react";
import { z } from "zod";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight, Sparkles, Lock, CheckCircle2, ShoppingCart, Package, DollarSign,
  Users, Calendar, MessageSquare, BarChart3, Lightbulb,
} from "lucide-react";
import { NICHE_MODULE_SLUGS, type RecLevel } from "@/data/nicheRecommendations";
import { toast } from "sonner";

const SearchSchema = z.object({
  niche: z.string().min(1),
  plan: z.enum(["essencial", "ideal", "full"]),
});

export const Route = createFileRoute("/demo/simulador")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Simulador integrado — Demo Impulsionando" },
      { name: "description", content: "Navegue e simule todos os módulos da Impulsionando com impacto em tempo real entre Vendas, Estoque, Financeiro, CRM e mais." },
      { property: "og:title", content: "Simulador integrado — Impulsionando" },
      { property: "og:description", content: "Veja em tempo real como cada módulo afeta os outros: pedidos, estoque, fatura, CRM e marketing." },
    ],
  }),
  component: DemoSimulador,
});

// ---------- STORE ----------

type EventLog = { id: string; ts: number; module: string; message: string };
type Product = { sku: string; name: string; price: number; stock: number };
type Order = { id: string; customer: string; sku: string; qty: number; total: number; ts: number; paid: boolean };
type Lead = { id: string; name: string; phone: string; stage: "novo" | "contatado" | "ganho"; ts: number };
type Appointment = { id: string; customer: string; service: string; when: string; status: "agendado" | "confirmado" | "concluido" };
type Invoice = { id: string; orderId: string; amount: number; paid: boolean; ts: number };
type Campaign = { id: string; channel: "whatsapp" | "email"; reach: number; ts: number };

interface State {
  products: Product[];
  orders: Order[];
  leads: Lead[];
  appointments: Appointment[];
  invoices: Invoice[];
  campaigns: Campaign[];
  log: EventLog[];
}

type Action =
  | { type: "CREATE_ORDER"; customer: string; sku: string; qty: number }
  | { type: "PAY_INVOICE"; invoiceId: string }
  | { type: "ADD_LEAD"; name: string; phone: string }
  | { type: "ADVANCE_LEAD"; leadId: string }
  | { type: "BOOK_APPOINTMENT"; customer: string; service: string; when: string }
  | { type: "CONFIRM_APPOINTMENT"; id: string }
  | { type: "SEND_CAMPAIGN"; channel: "whatsapp" | "email" }
  | { type: "RESTOCK"; sku: string; qty: number };

const SEED: State = {
  products: [
    { sku: "SKU-A", name: "Produto A", price: 120, stock: 24 },
    { sku: "SKU-B", name: "Produto B", price: 350, stock: 8 },
    { sku: "SKU-C", name: "Produto C", price: 80, stock: 50 },
  ],
  orders: [],
  leads: [
    { id: "L-001", name: "Marina Costa", phone: "(11) 98888-1111", stage: "novo", ts: Date.now() },
  ],
  appointments: [],
  invoices: [],
  campaigns: [],
  log: [{ id: "evt-0", ts: Date.now(), module: "Sistema", message: "Ambiente de simulação inicializado." }],
};

let _id = 1;
const nid = (p: string) => `${p}-${(_id++).toString().padStart(4, "0")}`;
const logEvt = (state: State, module: string, message: string): EventLog[] => [
  { id: nid("evt"), ts: Date.now(), module, message },
  ...state.log,
].slice(0, 40);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CREATE_ORDER": {
      const p = state.products.find((x) => x.sku === action.sku);
      if (!p || p.stock < action.qty) return { ...state, log: logEvt(state, "Vendas", `Estoque insuficiente para ${action.sku}.`) };
      const total = p.price * action.qty;
      const order: Order = { id: nid("PED"), customer: action.customer, sku: action.sku, qty: action.qty, total, ts: Date.now(), paid: false };
      const invoice: Invoice = { id: nid("FAT"), orderId: order.id, amount: total, paid: false, ts: Date.now() };
      return {
        ...state,
        orders: [order, ...state.orders],
        invoices: [invoice, ...state.invoices],
        products: state.products.map((x) => x.sku === action.sku ? { ...x, stock: x.stock - action.qty } : x),
        log: logEvt(
          { ...state, log: state.log },
          "Vendas",
          `Pedido ${order.id} criado · ${action.customer} · ${action.qty}× ${p.name} · R$ ${total.toFixed(2)} → Estoque -${action.qty} · Fatura ${invoice.id} gerada · WhatsApp enviado`,
        ),
      };
    }
    case "PAY_INVOICE": {
      const inv = state.invoices.find((i) => i.id === action.invoiceId);
      if (!inv || inv.paid) return state;
      return {
        ...state,
        invoices: state.invoices.map((i) => i.id === action.invoiceId ? { ...i, paid: true } : i),
        orders: state.orders.map((o) => o.id === inv.orderId ? { ...o, paid: true } : o),
        log: logEvt(state, "Financeiro", `Fatura ${inv.id} liquidada · R$ ${inv.amount.toFixed(2)} → DRE atualizado · cliente movido para "ganho" no CRM`),
      };
    }
    case "ADD_LEAD": {
      const lead: Lead = { id: nid("LEAD"), name: action.name, phone: action.phone, stage: "novo", ts: Date.now() };
      return {
        ...state,
        leads: [lead, ...state.leads],
        log: logEvt(state, "CRM", `Lead ${lead.name} capturado · disparo automático WhatsApp boas-vindas`),
      };
    }
    case "ADVANCE_LEAD": {
      const lead = state.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const next = lead.stage === "novo" ? "contatado" : "ganho";
      return {
        ...state,
        leads: state.leads.map((l) => l.id === action.leadId ? { ...l, stage: next } : l),
        log: logEvt(state, "CRM", `Lead ${lead.name} avançou para ${next} → BI atualizado`),
      };
    }
    case "BOOK_APPOINTMENT": {
      const appt: Appointment = { id: nid("AGD"), customer: action.customer, service: action.service, when: action.when, status: "agendado" };
      return {
        ...state,
        appointments: [appt, ...state.appointments],
        log: logEvt(state, "Agenda", `Agendamento ${appt.id} criado · ${action.customer} · ${action.service} → confirmação WhatsApp + lembrete D-1`),
      };
    }
    case "CONFIRM_APPOINTMENT": {
      return {
        ...state,
        appointments: state.appointments.map((a) => a.id === action.id ? { ...a, status: "confirmado" } : a),
        log: logEvt(state, "Agenda", `Agendamento ${action.id} confirmado pelo cliente`),
      };
    }
    case "SEND_CAMPAIGN": {
      const reach = Math.floor(50 + Math.random() * 200);
      const c: Campaign = { id: nid("CMP"), channel: action.channel, reach, ts: Date.now() };
      const newLeads = Math.floor(reach * 0.05);
      const generated: Lead[] = Array.from({ length: newLeads }).map((_, i) => ({
        id: nid("LEAD"), name: `Contato ${i + 1}`, phone: "(11) 9XXXX-XXXX", stage: "novo" as const, ts: Date.now(),
      }));
      return {
        ...state,
        campaigns: [c, ...state.campaigns],
        leads: [...generated, ...state.leads],
        log: logEvt(state, "Marketing", `Campanha ${c.id} via ${action.channel} · alcance ${reach} · gerou ${newLeads} leads → CRM atualizado`),
      };
    }
    case "RESTOCK": {
      return {
        ...state,
        products: state.products.map((p) => p.sku === action.sku ? { ...p, stock: p.stock + action.qty } : p),
        log: logEvt(state, "Estoque", `Reposição +${action.qty} em ${action.sku}`),
      };
    }
  }
}

// ---------- MODULE CATALOG ----------

const PLAN_RANK: Record<RecLevel, number> = { essencial: 1, ideal: 2, full: 3 };
const MODULE_MIN_PLAN: Record<string, RecLevel> = {
  pdv: "essencial", crm: "essencial", area_cliente: "essencial", agenda: "essencial",
  automacao: "ideal", commerce: "ideal", fidelizacao: "ideal", saude: "essencial", estoque: "essencial",
  bi: "ideal", eventos: "full", parceiros: "full", erp: "full", white_label: "full",
};

type ModKey = "vendas" | "estoque" | "financeiro" | "crm" | "agenda" | "marketing" | "bi";

const MODULES: { key: ModKey; label: string; icon: typeof ShoppingCart; minPlan: RecLevel; category: string }[] = [
  { key: "vendas", label: "Vendas / PDV", icon: ShoppingCart, minPlan: "essencial", category: "Operação" },
  { key: "estoque", label: "Estoque", icon: Package, minPlan: "essencial", category: "Operação" },
  { key: "agenda", label: "Agenda", icon: Calendar, minPlan: "essencial", category: "Operação" },
  { key: "crm", label: "CRM & Funil", icon: Users, minPlan: "essencial", category: "Relacionamento" },
  { key: "marketing", label: "Marketing & WhatsApp", icon: MessageSquare, minPlan: "ideal", category: "Crescimento" },
  { key: "financeiro", label: "Financeiro", icon: DollarSign, minPlan: "ideal", category: "Gestão" },
  { key: "bi", label: "BI & Relatórios", icon: BarChart3, minPlan: "ideal", category: "Gestão" },
];

// ---------- COMPONENT ----------

function DemoSimulador() {
  const { niche, plan } = Route.useSearch();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, SEED);
  const [activeModule, setActiveModule] = useState<ModKey>("vendas");
  const [session, setSession] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("demoSession");
    if (!raw) {
      navigate({ to: "/demo/escolher-nicho", search: {} });
      return;
    }
    try { setSession(JSON.parse(raw)); } catch { /* ignore */ }
  }, [navigate]);

  const kpis = useMemo(() => ({
    receita: state.orders.reduce((s, o) => s + o.total, 0),
    pedidos: state.orders.length,
    leads: state.leads.length,
    leadsGanhos: state.leads.filter((l) => l.stage === "ganho").length,
    agendamentos: state.appointments.length,
    pendente: state.invoices.filter((i) => !i.paid).reduce((s, i) => s + i.amount, 0),
  }), [state]);

  const planRank = PLAN_RANK[plan];
  const isAvailable = (m: ModKey) => PLAN_RANK[MODULES.find((x) => x.key === m)!.minPlan] <= planRank;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <Badge className="bg-gradient-primary mb-2"><Sparkles className="w-3 h-3 mr-1" /> Simulador integrado</Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {session?.name ? `Olá ${session.name.split(" ")[0]}, ` : ""}explore tudo da Impulsionando
            </h1>
            <p className="text-sm text-muted-foreground">
              Nicho <strong>{niche}</strong> · Plano <strong>{plan}</strong> — cada ação afeta os outros módulos em tempo real.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/demo/escolher-nicho" search={{ niche, plan }}>Trocar plano</Link></Button>
            <Button asChild size="sm" className="bg-gradient-primary"><Link to="/planos">Contratar agora <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          <Kpi label="Receita" value={`R$ ${kpis.receita.toFixed(0)}`} />
          <Kpi label="Pedidos" value={String(kpis.pedidos)} />
          <Kpi label="Leads" value={String(kpis.leads)} />
          <Kpi label="Ganhos" value={String(kpis.leadsGanhos)} />
          <Kpi label="Agendas" value={String(kpis.agendamentos)} />
          <Kpi label="A receber" value={`R$ ${kpis.pendente.toFixed(0)}`} />
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          {/* Sidebar */}
          <aside className="space-y-1">
            <div className="text-xs uppercase font-semibold text-muted-foreground px-2 py-1">Módulos</div>
            {MODULES.map((m) => {
              const avail = isAvailable(m.key);
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    if (!avail) { toast.info(`${m.label} está disponível no plano ${m.minPlan}+`); return; }
                    setActiveModule(m.key);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition ${
                    activeModule === m.key ? "bg-primary text-primary-foreground" : avail ? "hover:bg-muted" : "opacity-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{m.label}</span>
                  {!avail && <Lock className="w-3.5 h-3.5" />}
                </button>
              );
            })}
            <div className="text-[11px] text-muted-foreground px-2 pt-2">
              Módulos travados aparecem com cadeado — mude o plano para destravar.
            </div>
          </aside>

          {/* Active module panel */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => { const M = MODULES.find((x) => x.key === activeModule)!; const I = M.icon; return <><I className="w-5 h-5" /> {M.label}</>; })()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeModule === "vendas" && <PanelVendas state={state} dispatch={dispatch} />}
                {activeModule === "estoque" && <PanelEstoque state={state} dispatch={dispatch} />}
                {activeModule === "financeiro" && <PanelFinanceiro state={state} dispatch={dispatch} />}
                {activeModule === "crm" && <PanelCRM state={state} dispatch={dispatch} />}
                {activeModule === "agenda" && <PanelAgenda state={state} dispatch={dispatch} />}
                {activeModule === "marketing" && <PanelMarketing dispatch={dispatch} />}
                {activeModule === "bi" && <PanelBI kpis={kpis} state={state} />}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Cross-impact timeline */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Timeline de impacto cruzado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-auto text-sm">
              {state.log.map((e) => (
                <div key={e.id} className="flex gap-2 border-l-2 border-primary/40 pl-2 py-0.5">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{new Date(e.ts).toLocaleTimeString().slice(0, 5)}</span>
                  <Badge variant="outline" className="h-5 text-[10px]">{e.module}</Badge>
                  <span className="text-foreground/90">{e.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          {(["essencial", "ideal", "full"] as RecLevel[]).map((tier) => (
            <Card key={tier} className={`${tier === plan ? "ring-2 ring-primary" : "opacity-90"}`}>
              <CardContent className="pt-4">
                <div className="font-semibold capitalize">{tier} {tier === plan && <Badge className="ml-1">Atual</Badge>}</div>
                <div className="text-xs text-muted-foreground mt-1 mb-2">
                  {MODULES.filter((m) => PLAN_RANK[m.minPlan] <= PLAN_RANK[tier]).length} módulos · {(NICHE_MODULE_SLUGS[niche]?.[tier] ?? []).length} módulos do nicho
                </div>
                <Button asChild size="sm" variant={tier === plan ? "default" : "outline"} className="w-full">
                  <Link to="/demo/simulador" search={{ niche, plan: tier }}>
                    {tier === plan ? "Plano ativo" : "Simular este plano"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

// ---------- PANELS ----------

function PanelVendas({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [sku, setSku] = useState(state.products[0]?.sku ?? "");
  const [qty, setQty] = useState(1);
  const [customer, setCustomer] = useState("Cliente Demo");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Crie pedidos. Cada venda baixa estoque, gera fatura no financeiro e dispara automações no CRM/WhatsApp.</p>
      <div className="grid sm:grid-cols-4 gap-2">
        <div className="sm:col-span-2"><Label>Cliente</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
        <div>
          <Label>Produto</Label>
          <select className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={sku} onChange={(e) => setSku(e.target.value)}>
            {state.products.map((p) => <option key={p.sku} value={p.sku}>{p.name} (estoque {p.stock})</option>)}
          </select>
        </div>
        <div><Label>Qtd</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} /></div>
      </div>
      <Button onClick={() => dispatch({ type: "CREATE_ORDER", customer, sku, qty })} className="bg-gradient-primary">
        Criar pedido <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
      <div>
        <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Últimos pedidos</div>
        <ul className="space-y-1 text-sm">
          {state.orders.slice(0, 5).map((o) => (
            <li key={o.id} className="flex justify-between border-b py-1">
              <span>{o.id} · {o.customer} · {o.qty}× {o.sku}</span>
              <span className="tabular-nums">R$ {o.total.toFixed(2)} {o.paid && <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-500" />}</span>
            </li>
          ))}
          {state.orders.length === 0 && <li className="text-muted-foreground text-xs">Nenhum pedido ainda — crie o primeiro acima.</li>}
        </ul>
      </div>
    </div>
  );
}

function PanelEstoque({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Cada venda baixa daqui automaticamente. Reponha para ver alertas mudarem no BI.</p>
      <ul className="divide-y border rounded-md">
        {state.products.map((p) => (
          <li key={p.sku} className="flex items-center justify-between p-2 text-sm">
            <div>
              <div className="font-medium">{p.name} <span className="text-muted-foreground text-xs">({p.sku})</span></div>
              <div className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)} · estoque {p.stock} {p.stock < 10 && <Badge variant="destructive" className="ml-1 h-4 text-[10px]">baixo</Badge>}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "RESTOCK", sku: p.sku, qty: 10 })}>+10</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelFinanceiro({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const pendentes = state.invoices.filter((i) => !i.paid);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Faturas vêm direto dos pedidos. Liquidar move o cliente para "ganho" no CRM e atualiza o BI.</p>
      <ul className="divide-y border rounded-md">
        {pendentes.map((i) => (
          <li key={i.id} className="flex items-center justify-between p-2 text-sm">
            <span>{i.id} · pedido {i.orderId} · R$ {i.amount.toFixed(2)}</span>
            <Button size="sm" onClick={() => dispatch({ type: "PAY_INVOICE", invoiceId: i.id })}>Liquidar</Button>
          </li>
        ))}
        {pendentes.length === 0 && <li className="p-3 text-xs text-muted-foreground">Nenhuma fatura pendente. Crie um pedido em Vendas.</li>}
      </ul>
    </div>
  );
}

function PanelCRM({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Capture leads manualmente ou veja os que entram de pedidos e campanhas. Avance no funil para acionar o BI.</p>
      <div className="grid sm:grid-cols-3 gap-2">
        <Input placeholder="Nome do lead" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button onClick={() => { if (name && phone) { dispatch({ type: "ADD_LEAD", name, phone }); setName(""); setPhone(""); } }}>+ Lead</Button>
      </div>
      <ul className="divide-y border rounded-md max-h-64 overflow-auto">
        {state.leads.slice(0, 12).map((l) => (
          <li key={l.id} className="flex items-center justify-between p-2 text-sm">
            <div>
              <div className="font-medium">{l.name}</div>
              <div className="text-xs text-muted-foreground">{l.phone} · <Badge variant="outline" className="h-4 text-[10px]">{l.stage}</Badge></div>
            </div>
            {l.stage !== "ganho" && <Button size="sm" variant="outline" onClick={() => dispatch({ type: "ADVANCE_LEAD", leadId: l.id })}>Avançar</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelAgenda({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [customer, setCustomer] = useState("");
  const [service, setService] = useState("Consulta");
  const [when, setWhen] = useState("Hoje 14:00");
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Agendamentos disparam confirmação por WhatsApp e lembrete D-1 (Marketing/Automação).</p>
      <div className="grid sm:grid-cols-4 gap-2">
        <Input placeholder="Cliente" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        <Input placeholder="Serviço" value={service} onChange={(e) => setService(e.target.value)} />
        <Input placeholder="Quando" value={when} onChange={(e) => setWhen(e.target.value)} />
        <Button onClick={() => { if (customer) dispatch({ type: "BOOK_APPOINTMENT", customer, service, when }); }}>Agendar</Button>
      </div>
      <ul className="divide-y border rounded-md">
        {state.appointments.slice(0, 8).map((a) => (
          <li key={a.id} className="flex items-center justify-between p-2 text-sm">
            <span>{a.id} · {a.customer} · {a.service} · {a.when} · <Badge variant="outline" className="h-4 text-[10px]">{a.status}</Badge></span>
            {a.status === "agendado" && <Button size="sm" variant="outline" onClick={() => dispatch({ type: "CONFIRM_APPOINTMENT", id: a.id })}>Confirmar</Button>}
          </li>
        ))}
        {state.appointments.length === 0 && <li className="p-3 text-xs text-muted-foreground">Nenhum agendamento.</li>}
      </ul>
    </div>
  );
}

function PanelMarketing({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Dispare campanhas e veja leads entrarem no CRM em tempo real.</p>
      <div className="flex gap-2">
        <Button onClick={() => dispatch({ type: "SEND_CAMPAIGN", channel: "whatsapp" })}>
          <MessageSquare className="w-4 h-4 mr-1" /> Campanha WhatsApp
        </Button>
        <Button variant="outline" onClick={() => dispatch({ type: "SEND_CAMPAIGN", channel: "email" })}>
          Campanha E-mail
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Cada campanha tem alcance simulado e gera ~5% de leads novos diretamente no CRM.</p>
    </div>
  );
}

function PanelBI({ kpis, state }: { kpis: { receita: number; pedidos: number; leads: number; leadsGanhos: number; pendente: number }; state: State }) {
  const taxa = kpis.leads > 0 ? ((kpis.leadsGanhos / kpis.leads) * 100).toFixed(1) : "0.0";
  const ticket = kpis.pedidos > 0 ? (kpis.receita / kpis.pedidos).toFixed(2) : "0.00";
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Indicadores consolidados em tempo real de todos os módulos.</p>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <Metric label="Ticket médio" value={`R$ ${ticket}`} />
        <Metric label="Conversão de leads" value={`${taxa}%`} />
        <Metric label="Inadimplência" value={`R$ ${kpis.pendente.toFixed(2)}`} />
        <Metric label="Produtos cadastrados" value={String(state.products.length)} />
        <Metric label="Estoque total" value={String(state.products.reduce((s, p) => s + p.stock, 0))} />
        <Metric label="Campanhas disparadas" value={String(state.campaigns.length)} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
