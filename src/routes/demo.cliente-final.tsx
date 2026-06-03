import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DemoShell,
  useDemoStore,
  DemoSelect,
  StatGrid,
  SectionHeader,
  type DemoNavItem,
} from "@/components/demo/DemoShell";
import { DemoWelcome } from "@/components/demo/DemoWelcome";
import { Calendar as CalIcon, ShoppingCart as CartIcon, Wallet as WalletIcon, BarChart3 as BIIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Calendar,
  KanbanSquare,
  ShoppingCart,
  Package,
  Wallet,
  BarChart3,
  Users,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/cliente-final")({
  head: () => ({
    meta: [
      { title: "DEMO Cliente Final — Impulsionando" },
      {
        name: "description",
        content:
          "Demonstração interativa: agenda, CRM, vendas, estoque, financeiro, setores, usuários e BI funcionando ponta a ponta.",
      },
    ],
  }),
  component: ClienteFinalDemo,
});

const STORAGE = "imp.demo.cf";

const NAV: DemoNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, help: "Visão geral do dia." },
  { id: "agenda", label: "Agenda", icon: Calendar, group: "Operação", help: "Agendamentos por profissional, serviços, fila de espera." },
  { id: "crm", label: "CRM", icon: KanbanSquare, group: "Operação", help: "Leads, oportunidades e funil." },
  { id: "vendas", label: "Vendas / PDV", icon: ShoppingCart, group: "Operação", help: "Pedidos, métodos de pagamento e caixa." },
  { id: "estoque", label: "Estoque", icon: Package, group: "Operação", help: "Produtos, fornecedores e movimentações." },
  { id: "financeiro", label: "Financeiro", icon: Wallet, group: "Gestão", help: "Receitas, despesas, contas e comissões." },
  { id: "setores", label: "Setores", icon: Layers, group: "Gestão", help: "Áreas internas para roteamento e permissão." },
  { id: "usuarios", label: "Usuários & Perfis", icon: Users, group: "Gestão", help: "Time, perfis e status." },
  { id: "bi", label: "BI & Relatórios", icon: BarChart3, group: "Inteligência", help: "Indicadores consolidados." },
];

/* =========================================================
 * Tipos & dados-semente
 * ========================================================= */

interface Appointment { id: string; date: string; time: string; client: string; pro: string; service: string; status: string }
interface Lead { id: string; name: string; channel: string; stage: string; value: number; owner: string }
interface SaleItem { id: string; product: string; qty: number; price: number }
interface Sale { id: string; date: string; customer: string; method: string; status: string; items: SaleItem[] }
interface Product { id: string; name: string; sku: string; category: string; supplier: string; stock: number; min: number; price: number }
interface StockMove { id: string; date: string; product: string; kind: string; qty: number; reason: string }
interface FinTx { id: string; date: string; kind: string; category: string; method: string; amount: number; status: string; description: string }
interface SectorRow { id: string; name: string; manager: string; users: number; active: boolean }
interface UserRow { id: string; name: string; sector: string; profile: string; status: string }

const PROS = ["Dra. Helena", "Carlos Lima", "Marina Souza", "Bruno Alves"] as const;
const SERVICES = ["Consulta clínica", "Corte de cabelo", "Manicure", "Massagem", "Avaliação inicial"] as const;
const APP_STATUS = ["Confirmado", "Pendente", "Concluído", "Cancelado"] as const;
const CHANNELS = ["Indicação", "Instagram", "Google Ads", "WhatsApp", "Site"] as const;
const STAGES = ["Novo lead", "Qualificado", "Proposta enviada", "Negociação", "Ganho", "Perdido"] as const;
const OWNERS = ["Marina Souza", "Carlos Lima", "Bruno Alves"] as const;
const PAY_METHODS = ["Dinheiro", "Pix", "Cartão de crédito", "Cartão de débito", "Boleto"] as const;
const SALE_STATUS = ["Confirmada", "Aguardando pagamento", "Cancelada"] as const;
const CATEGORIES = ["Bebidas", "Cosméticos", "Insumos", "Serviços", "Equipamentos"] as const;
const SUPPLIERS = ["Distribuidora ABC", "Beleza & Cia", "Importadora Vita", "Atacado Sul"] as const;
const MOVE_KINDS = ["Entrada", "Saída", "Ajuste"] as const;
const MOVE_REASONS = ["Compra de fornecedor", "Venda no PDV", "Perda/Quebra", "Inventário", "Devolução"] as const;
const FIN_KIND = ["Receita", "Despesa"] as const;
const FIN_CATEGORIES = ["Vendas", "Serviços prestados", "Folha de pagamento", "Aluguel", "Marketing", "Fornecedores", "Impostos"] as const;
const FIN_STATUS = ["Pago", "A pagar", "A receber", "Vencido"] as const;
const SECTORS = ["Atendimento", "Vendas / PDV", "Agenda", "Financeiro", "Estoque", "Gerência"] as const;
const PROFILES = ["Administrador", "Gerente", "Operador de Caixa", "Atendente", "Profissional", "Somente leitura"] as const;
const USER_STATUS = ["Ativo", "Convite enviado", "Inativo"] as const;

/* =========================================================
 * Componente principal
 * ========================================================= */

function ClienteFinalDemo() {
  const [active, setActive] = useState("dashboard");

  return (
    <DemoShell
      trackLabel="Cliente Final"
      trackTagline="Visão completa de bar, restaurante, clínica, salão ou negócio operacional."
      storageKey={STORAGE}
      nav={NAV}
      activeId={active}
      onSelect={setActive}
    >
      <DemoWelcome
        storageKey={STORAGE}
        trackLabel="Cliente Final"
        intro="Esta demonstração reproduz fielmente o sistema que seu negócio receberá: agenda, CRM, vendas, estoque, financeiro, comissões e BI já populados e funcionando ponta a ponta. Tudo opera como em produção — você navega, cadastra, filtra e gera relatórios."
        loginEmail="seu-email@empresa.com.br"
        loginPassword="senha definida no convite"
        accessNote="No sistema real, cada usuário recebe convite por e-mail, define a senha e acessa apenas os módulos liberados para seu perfil dentro da sua empresa."
        highlights={[
          { icon: CalIcon, title: "Agenda inteligente", text: "Bloqueio de conflitos, fila de espera e visão por profissional." },
          { icon: CartIcon, title: "PDV completo", text: "Pedidos, formas de pagamento, comandas e fechamento de caixa." },
          { icon: WalletIcon, title: "Financeiro integrado", text: "Contas, categorias, comissões e fluxo de caixa em tempo real." },
          { icon: BIIcon, title: "BI operacional", text: "KPIs consolidados de todos os módulos em um único painel." },
        ]}
        flows={[
          "Venda no PDV → baixa de estoque → lançamento financeiro automático",
          "Agendamento → notificação ao profissional → conclusão gera comissão",
          "Lead no CRM → qualificação → conversão em cliente e venda",
          "Estoque mínimo → alerta in-app → ordem de compra ao fornecedor",
        ]}
        integrations={[
          "WhatsApp para confirmação de agendamentos e atendimento",
          "Pix, cartões (crédito/débito), dinheiro e boleto no PDV",
          "Emissão de comprovantes e relatórios PDF/Excel",
          "Notificações in-app por categoria (agenda, vendas, estoque)",
        ]}
      />
      {active === "dashboard" && <DashboardSection />}
      {active === "agenda" && <AgendaSection />}
      {active === "crm" && <CRMSection />}
      {active === "vendas" && <VendasSection />}
      {active === "estoque" && <EstoqueSection />}
      {active === "financeiro" && <FinanceiroSection />}
      {active === "setores" && <SetoresSection />}
      {active === "usuarios" && <UsuariosSection />}
      {active === "bi" && <BISection />}
    </DemoShell>
  );
}

/* =========================================================
 * Dashboard (lê dados dos outros módulos)
 * ========================================================= */

function DashboardSection() {
  const [apps] = useDemoStore<Appointment[]>(`${STORAGE}.agenda`, SEED_APPS);
  const [sales] = useDemoStore<Sale[]>(`${STORAGE}.sales`, SEED_SALES);
  const [products] = useDemoStore<Product[]>(`${STORAGE}.products`, SEED_PRODUCTS);
  const [fin] = useDemoStore<FinTx[]>(`${STORAGE}.fin`, SEED_FIN);

  const today = new Date().toISOString().slice(0, 10);
  const appsToday = apps.filter((a) => a.date === today || a.status === "Confirmado").length;
  const salesTotal = sales
    .filter((s) => s.status === "Confirmada")
    .reduce((acc, s) => acc + s.items.reduce((a, i) => a + i.qty * i.price, 0), 0);
  const ticket = sales.length ? salesTotal / Math.max(1, sales.filter((s) => s.status === "Confirmada").length) : 0;
  const cash = fin
    .filter((t) => t.status === "Pago")
    .reduce((acc, t) => acc + (t.kind === "Receita" ? t.amount : -t.amount), 0);
  const lowStock = products.filter((p) => p.stock <= p.min);

  return (
    <>
      <SectionHeader title="Dashboard operacional" description="KPIs do dia consolidados a partir dos demais módulos." />
      <StatGrid
        stats={[
          { label: "Agendamentos ativos", value: String(appsToday), help: "Soma de confirmados + agendados hoje." },
          { label: "Vendas confirmadas", value: brl(salesTotal), help: "Total vendido com status Confirmada.", tone: "success" },
          { label: "Ticket médio", value: brl(ticket), help: "Valor médio por venda confirmada." },
          { label: "Caixa líquido", value: brl(cash), help: "Receitas pagas menos despesas pagas.", tone: cash >= 0 ? "success" : "warn" },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Próximos atendimentos
          </h3>
          <div className="mt-3 space-y-2">
            {apps.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
                <div>
                  <div className="font-medium">{a.client}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.service} • {a.pro}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs">{a.date} {a.time}</div>
                  <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Estoque crítico
          </h3>
          <div className="mt-3 space-y-2">
            {lowStock.length === 0 && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" /> Nenhum item abaixo do mínimo.
              </div>
            )}
            {lowStock.map((p) => (
              <div key={p.id} className="text-sm flex items-center justify-between border-b border-border/50 pb-2">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">SKU {p.sku} • mínimo {p.min}</div>
                </div>
                <Badge variant="destructive">{p.stock} un</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* =========================================================
 * Agenda
 * ========================================================= */

const SEED_APPS: Appointment[] = [
  { id: "a1", date: today(0), time: "09:00", client: "Ana Beatriz", pro: "Dra. Helena", service: "Consulta clínica", status: "Confirmado" },
  { id: "a2", date: today(0), time: "10:30", client: "Pedro Santos", pro: "Carlos Lima", service: "Corte de cabelo", status: "Confirmado" },
  { id: "a3", date: today(1), time: "14:00", client: "Marina Reis", pro: "Marina Souza", service: "Manicure", status: "Pendente" },
];

function AgendaSection() {
  const [rows, setRows] = useDemoStore<Appointment[]>(`${STORAGE}.agenda`, SEED_APPS);
  const [form, setForm] = useState({ date: today(0), time: "", client: "", pro: "", service: "", status: "Confirmado" });
  const [filterPro, setFilterPro] = useState("");

  function add() {
    if (!form.date || !form.time || !form.client || !form.pro || !form.service) {
      toast.error("Preencha todos os campos do agendamento.");
      return;
    }
    setRows([...rows, { id: crypto.randomUUID(), ...form }]);
    setForm({ date: today(0), time: "", client: "", pro: "", service: "", status: "Confirmado" });
    toast.success("Agendamento criado.");
  }
  function setStatus(id: string, status: string) {
    setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)));
  }
  function remove(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }

  const filtered = filterPro ? rows.filter((r) => r.pro === filterPro) : rows;

  return (
    <>
      <SectionHeader
        title="Agenda"
        description="Crie, filtre e atualize agendamentos. Status, profissional e serviço usam listas controladas."
        badge={<Badge variant="outline">{rows.length} no total</Badge>}
      />

      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-6 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Data</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hora</Label>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Cliente</Label>
            <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Nome do cliente" />
          </div>
          <DemoSelect label="Profissional" value={form.pro} onChange={(v) => setForm({ ...form, pro: v })} options={PROS} />
          <DemoSelect label="Serviço" value={form.service} onChange={(v) => setForm({ ...form, service: v })} options={SERVICES} />
          <DemoSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={APP_STATUS} />
          <div className="md:col-span-5 flex items-end">
            <Button onClick={add} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Agendar
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <DemoSelect label="Filtrar por profissional" value={filterPro} onChange={setFilterPro} options={PROS} />
        {filterPro && (
          <Button size="sm" variant="ghost" onClick={() => setFilterPro("")}>Limpar</Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{r.date} <span className="text-muted-foreground">{r.time}</span></TableCell>
                <TableCell className="font-medium">{r.client}</TableCell>
                <TableCell>{r.pro}</TableCell>
                <TableCell><Badge variant="outline">{r.service}</Badge></TableCell>
                <TableCell>
                  <select
                    value={r.status}
                    onChange={(e) => setStatus(r.id, e.target.value)}
                    className="h-7 rounded border bg-background text-xs px-1"
                  >
                    {APP_STATUS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum agendamento.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* =========================================================
 * CRM (com kanban simples)
 * ========================================================= */

const SEED_LEADS: Lead[] = [
  { id: "l1", name: "João Restaurante", channel: "Indicação", stage: "Novo lead", value: 1200, owner: "Marina Souza" },
  { id: "l2", name: "Clínica Saúde+", channel: "Google Ads", stage: "Qualificado", value: 3500, owner: "Carlos Lima" },
  { id: "l3", name: "Studio Beleza", channel: "Instagram", stage: "Proposta enviada", value: 2400, owner: "Bruno Alves" },
  { id: "l4", name: "Bar do Zé", channel: "Site", stage: "Ganho", value: 1800, owner: "Marina Souza" },
];

function CRMSection() {
  const [leads, setLeads] = useDemoStore<Lead[]>(`${STORAGE}.leads`, SEED_LEADS);
  const [form, setForm] = useState({ name: "", channel: "", stage: "Novo lead", value: "", owner: "" });

  function add() {
    if (!form.name || !form.channel || !form.stage || !form.value || !form.owner) {
      toast.error("Preencha todos os campos do lead.");
      return;
    }
    setLeads([...leads, { id: crypto.randomUUID(), ...form, value: Number(form.value) || 0 }]);
    setForm({ name: "", channel: "", stage: "Novo lead", value: "", owner: "" });
    toast.success("Lead adicionado ao funil.");
  }
  function move(id: string, stage: string) {
    setLeads(leads.map((l) => (l.id === id ? { ...l, stage } : l)));
  }
  function remove(id: string) { setLeads(leads.filter((l) => l.id !== id)); }

  const totalPipe = leads.filter((l) => !["Ganho", "Perdido"].includes(l.stage)).reduce((a, l) => a + l.value, 0);
  const won = leads.filter((l) => l.stage === "Ganho").reduce((a, l) => a + l.value, 0);

  return (
    <>
      <SectionHeader
        title="CRM — Funil de oportunidades"
        description="Cadastre leads, mova entre etapas e acompanhe o valor previsto."
      />

      <StatGrid
        stats={[
          { label: "Leads ativos", value: String(leads.filter((l) => !["Ganho", "Perdido"].includes(l.stage)).length) },
          { label: "Pipeline previsto", value: brl(totalPipe), tone: "success" },
          { label: "Ganhos no mês", value: brl(won), tone: "success" },
          { label: "Taxa de conversão", value: `${leads.length ? Math.round((leads.filter((l) => l.stage === "Ganho").length / leads.length) * 100) : 0}%` },
        ]}
      />

      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-6 gap-3">
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Nome / Empresa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <DemoSelect label="Canal" value={form.channel} onChange={(v) => setForm({ ...form, channel: v })} options={CHANNELS} />
          <DemoSelect label="Etapa" value={form.stage} onChange={(v) => setForm({ ...form, stage: v })} options={STAGES} />
          <div className="space-y-1">
            <Label className="text-xs">Valor previsto (R$)</Label>
            <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <DemoSelect label="Responsável" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} options={OWNERS} />
          <div className="md:col-span-6">
            <Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Adicionar lead</Button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage);
          const total = items.reduce((a, l) => a + l.value, 0);
          return (
            <Card key={stage} className="p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold">{stage}</div>
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground mb-2">{brl(total)}</div>
              <div className="space-y-2">
                {items.map((l) => (
                  <div key={l.id} className="rounded border bg-background p-2 text-xs">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-muted-foreground">{l.channel} • {brl(l.value)}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{l.owner}</div>
                    <div className="mt-2 flex gap-1">
                      <select
                        value={l.stage}
                        onChange={(e) => move(l.id, e.target.value)}
                        className="h-6 rounded border bg-background text-[10px] flex-1"
                      >
                        {STAGES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <button onClick={() => remove(l.id)} aria-label="Excluir" className="text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

/* =========================================================
 * Vendas / PDV
 * ========================================================= */

const SEED_SALES: Sale[] = [
  {
    id: "s1", date: today(0), customer: "Cliente balcão", method: "Pix", status: "Confirmada",
    items: [{ id: "i1", product: "Cerveja Long Neck", qty: 3, price: 12 }, { id: "i2", product: "Porção batata", qty: 1, price: 28 }],
  },
  {
    id: "s2", date: today(0), customer: "Ana Beatriz", method: "Cartão de crédito", status: "Confirmada",
    items: [{ id: "i3", product: "Consulta clínica", qty: 1, price: 220 }],
  },
];

function VendasSection() {
  const [sales, setSales] = useDemoStore<Sale[]>(`${STORAGE}.sales`, SEED_SALES);
  const [products] = useDemoStore<Product[]>(`${STORAGE}.products`, SEED_PRODUCTS);
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState("1");

  const productOptions = useMemo(() => products.map((p) => p.name), [products]);

  function addItem() {
    const p = products.find((x) => x.name === pickProduct);
    if (!p) { toast.error("Selecione um produto."); return; }
    const qty = Number(pickQty) || 1;
    setCart([...cart, { id: crypto.randomUUID(), product: p.name, qty, price: p.price }]);
    setPickProduct(""); setPickQty("1");
  }
  function removeItem(id: string) { setCart(cart.filter((c) => c.id !== id)); }
  function finalize(status: string) {
    if (!customer || !method || cart.length === 0) {
      toast.error("Informe cliente, método e ao menos 1 item.");
      return;
    }
    const sale: Sale = { id: crypto.randomUUID(), date: today(0), customer, method, status, items: cart };
    setSales([sale, ...sales]);
    setCart([]); setCustomer(""); setMethod("");
    toast.success(`Venda ${status.toLowerCase()}.`);
  }
  function cancel(id: string) {
    setSales(sales.map((s) => (s.id === id ? { ...s, status: "Cancelada" } : s)));
  }

  const cartTotal = cart.reduce((a, c) => a + c.qty * c.price, 0);
  const totalConfirmed = sales.filter((s) => s.status === "Confirmada").reduce((a, s) => a + s.items.reduce((b, i) => b + i.qty * i.price, 0), 0);

  return (
    <>
      <SectionHeader title="Vendas / PDV" description="Lance pedidos selecionando produtos do estoque e métodos cadastrados." />

      <StatGrid
        stats={[
          { label: "Vendas confirmadas", value: brl(totalConfirmed), tone: "success" },
          { label: "Pedidos no dia", value: String(sales.filter((s) => s.date === today(0)).length) },
          { label: "Itens no carrinho", value: String(cart.length) },
          { label: "Total carrinho", value: brl(cartTotal), tone: "success" },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" /> Novo pedido</h3>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
              <Label className="text-xs">Cliente</Label>
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nome ou Balcão" />
            </div>
            <DemoSelect label="Método de pagamento" value={method} onChange={setMethod} options={PAY_METHODS} />
          </div>
          <div className="grid md:grid-cols-[1fr_80px_auto] gap-2 mb-3">
            <DemoSelect label="Produto/Serviço" value={pickProduct} onChange={setPickProduct} options={productOptions} />
            <div className="space-y-1">
              <Label className="text-xs">Qtde</Label>
              <Input type="number" min={1} value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
            </div>
            <div className="flex items-end"><Button onClick={addItem} variant="outline"><Plus className="w-4 h-4" /></Button></div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {cart.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                <span>{c.product} × {c.qty}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{brl(c.qty * c.price)}</span>
                  <button onClick={() => removeItem(c.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">Adicione itens.</div>}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <div className="font-semibold">Total: {brl(cartTotal)}</div>
            <div className="flex gap-2">
              <Button onClick={() => finalize("Aguardando pagamento")} variant="outline" size="sm">Aguardando</Button>
              <Button onClick={() => finalize("Confirmada")} size="sm" className="bg-gradient-primary">Confirmar venda</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Últimas vendas</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sales.map((s) => (
              <div key={s.id} className="border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.customer}</span>
                  <Badge variant={s.status === "Confirmada" ? "default" : s.status === "Cancelada" ? "destructive" : "outline"} className={s.status === "Confirmada" ? "bg-success text-success-foreground" : ""}>{s.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{s.date} • {s.method}</div>
                <div className="mt-1 text-xs">
                  {s.items.map((i) => <div key={i.id}>{i.product} × {i.qty} — {brl(i.qty * i.price)}</div>)}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-sm">{brl(s.items.reduce((a, i) => a + i.qty * i.price, 0))}</span>
                  {s.status !== "Cancelada" && (
                    <Button size="sm" variant="ghost" onClick={() => cancel(s.id)}>Cancelar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* =========================================================
 * Estoque
 * ========================================================= */

const SEED_PRODUCTS: Product[] = [
  { id: "p1", name: "Cerveja Long Neck", sku: "BEB-001", category: "Bebidas", supplier: "Distribuidora ABC", stock: 48, min: 24, price: 12 },
  { id: "p2", name: "Porção batata", sku: "ALI-014", category: "Insumos", supplier: "Atacado Sul", stock: 30, min: 10, price: 28 },
  { id: "p3", name: "Consulta clínica", sku: "SRV-001", category: "Serviços", supplier: "—", stock: 999, min: 0, price: 220 },
  { id: "p4", name: "Shampoo profissional", sku: "COS-022", category: "Cosméticos", supplier: "Beleza & Cia", stock: 6, min: 10, price: 85 },
];

function EstoqueSection() {
  const [products, setProducts] = useDemoStore<Product[]>(`${STORAGE}.products`, SEED_PRODUCTS);
  const [moves, setMoves] = useDemoStore<StockMove[]>(`${STORAGE}.stockmoves`, []);
  const [form, setForm] = useState({ name: "", sku: "", category: "", supplier: "", stock: "", min: "", price: "" });
  const [mv, setMv] = useState({ product: "", kind: "Entrada", qty: "", reason: "" });

  function addProduct() {
    if (!form.name || !form.sku || !form.category || !form.supplier) {
      toast.error("Preencha pelo menos nome, SKU, categoria e fornecedor.");
      return;
    }
    setProducts([
      ...products,
      { id: crypto.randomUUID(), name: form.name, sku: form.sku, category: form.category, supplier: form.supplier, stock: Number(form.stock) || 0, min: Number(form.min) || 0, price: Number(form.price) || 0 },
    ]);
    setForm({ name: "", sku: "", category: "", supplier: "", stock: "", min: "", price: "" });
    toast.success("Produto adicionado.");
  }
  function removeProduct(id: string) { setProducts(products.filter((p) => p.id !== id)); }
  function addMove() {
    const p = products.find((x) => x.name === mv.product);
    const qty = Number(mv.qty);
    if (!p || !mv.kind || !mv.reason || !qty) { toast.error("Preencha todos os campos da movimentação."); return; }
    const delta = mv.kind === "Entrada" ? qty : mv.kind === "Saída" ? -qty : 0;
    const adjustTo = mv.kind === "Ajuste" ? qty : p.stock + delta;
    setProducts(products.map((x) => (x.id === p.id ? { ...x, stock: mv.kind === "Ajuste" ? adjustTo : x.stock + delta } : x)));
    setMoves([{ id: crypto.randomUUID(), date: today(0), product: p.name, kind: mv.kind, qty, reason: mv.reason }, ...moves]);
    setMv({ product: "", kind: "Entrada", qty: "", reason: "" });
    toast.success("Movimentação registrada.");
  }

  return (
    <>
      <SectionHeader title="Estoque" description="Cadastre produtos, mantenha o mínimo e registre entradas/saídas." />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Novo produto</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <DemoSelect label="Categoria" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} />
            <DemoSelect label="Fornecedor" value={form.supplier} onChange={(v) => setForm({ ...form, supplier: v })} options={SUPPLIERS} />
            <div className="space-y-1"><Label className="text-xs">Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Mínimo</Label><Input type="number" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} /></div>
            <div className="space-y-1 md:col-span-2"><Label className="text-xs">Preço de venda (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          </div>
          <Button onClick={addProduct} className="mt-3 bg-gradient-primary"><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Nova movimentação</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <DemoSelect label="Produto" value={mv.product} onChange={(v) => setMv({ ...mv, product: v })} options={products.map((p) => p.name)} />
            <DemoSelect label="Tipo" value={mv.kind} onChange={(v) => setMv({ ...mv, kind: v })} options={MOVE_KINDS} />
            <div className="space-y-1"><Label className="text-xs">Quantidade</Label><Input type="number" value={mv.qty} onChange={(e) => setMv({ ...mv, qty: e.target.value })} /></div>
            <DemoSelect label="Motivo" value={mv.reason} onChange={(v) => setMv({ ...mv, reason: v })} options={MOVE_REASONS} />
          </div>
          <Button onClick={addMove} className="mt-3 bg-gradient-primary"><Plus className="w-4 h-4 mr-2" />Registrar</Button>

          <div className="mt-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Últimas movimentações</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {moves.slice(0, 6).map((m) => (
                <div key={m.id} className="text-xs flex justify-between border-b border-border/40 py-1">
                  <span>{m.product}</span>
                  <span className="text-muted-foreground">{m.kind} {m.qty} • {m.reason}</span>
                </div>
              ))}
              {moves.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma movimentação ainda.</div>}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead><TableHead>SKU</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Fornecedor</TableHead><TableHead>Estoque</TableHead><TableHead>Preço</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-xs">{p.sku}</TableCell>
                <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                <TableCell className="text-xs">{p.supplier}</TableCell>
                <TableCell>
                  <span className={p.stock <= p.min ? "text-destructive font-semibold" : ""}>{p.stock}</span>
                  <span className="text-xs text-muted-foreground"> /{p.min}</span>
                </TableCell>
                <TableCell>{brl(p.price)}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => removeProduct(p.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* =========================================================
 * Financeiro
 * ========================================================= */

const SEED_FIN: FinTx[] = [
  { id: "f1", date: today(0), kind: "Receita", category: "Vendas", method: "Pix", amount: 2480, status: "Pago", description: "Faturamento do dia" },
  { id: "f2", date: today(-1), kind: "Despesa", category: "Fornecedores", method: "Boleto", amount: 980, status: "Pago", description: "Distribuidora ABC" },
  { id: "f3", date: today(2), kind: "Despesa", category: "Aluguel", method: "Boleto", amount: 3200, status: "A pagar", description: "Aluguel da loja" },
];

function FinanceiroSection() {
  const [tx, setTx] = useDemoStore<FinTx[]>(`${STORAGE}.fin`, SEED_FIN);
  const [form, setForm] = useState({ date: today(0), kind: "Receita", category: "", method: "", amount: "", status: "Pago", description: "" });
  const [fKind, setFKind] = useState("");
  const [fStatus, setFStatus] = useState("");

  function add() {
    if (!form.date || !form.kind || !form.category || !form.method || !form.amount || !form.status) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setTx([{ id: crypto.randomUUID(), ...form, amount: Number(form.amount) }, ...tx]);
    setForm({ date: today(0), kind: "Receita", category: "", method: "", amount: "", status: "Pago", description: "" });
    toast.success("Lançamento criado.");
  }
  function remove(id: string) { setTx(tx.filter((t) => t.id !== id)); }
  function togglePaid(id: string) {
    setTx(tx.map((t) => (t.id === id ? { ...t, status: t.status === "Pago" ? (t.kind === "Receita" ? "A receber" : "A pagar") : "Pago" } : t)));
  }

  const filtered = tx.filter((t) => (!fKind || t.kind === fKind) && (!fStatus || t.status === fStatus));
  const totalIn = tx.filter((t) => t.kind === "Receita" && t.status === "Pago").reduce((a, t) => a + t.amount, 0);
  const totalOut = tx.filter((t) => t.kind === "Despesa" && t.status === "Pago").reduce((a, t) => a + t.amount, 0);
  const toReceive = tx.filter((t) => t.status === "A receber").reduce((a, t) => a + t.amount, 0);
  const toPay = tx.filter((t) => t.status === "A pagar" || t.status === "Vencido").reduce((a, t) => a + t.amount, 0);

  return (
    <>
      <SectionHeader title="Financeiro" description="Lançamentos, contas a pagar/receber, métodos e categorias." />

      <StatGrid
        stats={[
          { label: "Receitas pagas", value: brl(totalIn), tone: "success" },
          { label: "Despesas pagas", value: brl(totalOut), tone: "warn" },
          { label: "A receber", value: brl(toReceive) },
          { label: "A pagar", value: brl(toPay), tone: "warn" },
        ]}
      />

      <Card className="p-5 mb-6">
        <h3 className="font-semibold mb-3">Novo lançamento</h3>
        <div className="grid md:grid-cols-7 gap-3">
          <div className="space-y-1"><Label className="text-xs">Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <DemoSelect label="Tipo" value={form.kind} onChange={(v) => setForm({ ...form, kind: v })} options={FIN_KIND} />
          <DemoSelect label="Categoria" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={FIN_CATEGORIES} />
          <DemoSelect label="Método" value={form.method} onChange={(v) => setForm({ ...form, method: v })} options={PAY_METHODS} />
          <div className="space-y-1"><Label className="text-xs">Valor (R$)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <DemoSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={FIN_STATUS} />
          <div className="space-y-1"><Label className="text-xs">Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <Button onClick={add} className="mt-3 bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Lançar</Button>
      </Card>

      <div className="flex gap-3 flex-wrap mb-3">
        <DemoSelect label="Filtrar tipo" value={fKind} onChange={setFKind} options={FIN_KIND} />
        <DemoSelect label="Filtrar status" value={fStatus} onChange={setFStatus} options={FIN_STATUS} />
        {(fKind || fStatus) && <Button size="sm" variant="ghost" onClick={() => { setFKind(""); setFStatus(""); }}>Limpar filtros</Button>}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Método</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs">{t.date}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={t.kind === "Receita" ? "text-success border-success/30" : "text-destructive border-destructive/30"}>
                    {t.kind === "Receita" ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />} {t.kind}
                  </Badge>
                </TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell className="text-xs">{t.method}</TableCell>
                <TableCell className="text-xs">{t.description}</TableCell>
                <TableCell className={t.kind === "Receita" ? "text-success font-semibold" : "text-destructive font-semibold"}>{brl(t.amount)}</TableCell>
                <TableCell>
                  <Badge variant={t.status === "Pago" ? "default" : "outline"} className={t.status === "Pago" ? "bg-success text-success-foreground" : ""}>{t.status}</Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => togglePaid(t.id)}>{t.status === "Pago" ? "↺" : "✓"}</Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sem lançamentos.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* =========================================================
 * Setores
 * ========================================================= */

function SetoresSection() {
  const [rows, setRows] = useDemoStore<SectorRow[]>(`${STORAGE}.sectors`, [
    { id: "s1", name: "Atendimento", manager: "Marina Souza", users: 3, active: true },
    { id: "s2", name: "Financeiro", manager: "Carlos Lima", users: 2, active: true },
    { id: "s3", name: "Vendas / PDV", manager: "Bruno Alves", users: 4, active: true },
  ]);
  const [form, setForm] = useState({ name: "", manager: "" });

  function add() {
    if (!form.name || !form.manager) { toast.error("Selecione setor e responsável."); return; }
    setRows([...rows, { id: crypto.randomUUID(), name: form.name, manager: form.manager, users: 0, active: true }]);
    setForm({ name: "", manager: "" });
    toast.success("Setor criado.");
  }
  function toggle(id: string) { setRows(rows.map((r) => (r.id === id ? { ...r, active: !r.active } : r))); }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }

  return (
    <>
      <SectionHeader title="Setores" description="Áreas internas que organizam usuários, permissões e roteamento de tarefas." />
      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-3">
          <DemoSelect label="Setor" value={form.name} onChange={(v) => setForm({ ...form, name: v })} options={SECTORS} />
          <DemoSelect label="Responsável" value={form.manager} onChange={(v) => setForm({ ...form, manager: v })} options={PROS} />
          <div className="flex items-end"><Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button></div>
        </div>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Setor</TableHead><TableHead>Responsável</TableHead><TableHead>Usuários</TableHead><TableHead>Status</TableHead><TableHead className="w-32" /></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.manager}</TableCell>
                <TableCell>{r.users}</TableCell>
                <TableCell><Badge className={r.active ? "bg-success text-success-foreground" : ""} variant={r.active ? "default" : "outline"}>{r.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => toggle(r.id)}>{r.active ? "Desativar" : "Ativar"}</Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* =========================================================
 * Usuários & Perfis
 * ========================================================= */

function UsuariosSection() {
  const [rows, setRows] = useDemoStore<UserRow[]>(`${STORAGE}.users`, [
    { id: "u1", name: "Marina Souza", sector: "Atendimento", profile: "Atendente", status: "Ativo" },
    { id: "u2", name: "Carlos Lima", sector: "Vendas / PDV", profile: "Operador de Caixa", status: "Ativo" },
    { id: "u3", name: "Dra. Helena", sector: "Agenda", profile: "Profissional", status: "Convite enviado" },
  ]);
  const [form, setForm] = useState({ name: "", sector: "", profile: "", status: "" });

  function add() {
    if (!form.name.trim() || !form.sector || !form.profile || !form.status) { toast.error("Preencha todos os campos."); return; }
    setRows([...rows, { id: crypto.randomUUID(), ...form }]);
    setForm({ name: "", sector: "", profile: "", status: "" });
    toast.success("Usuário adicionado.");
  }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }
  function setStatus(id: string, status: string) { setRows(rows.map((r) => (r.id === id ? { ...r, status } : r))); }

  return (
    <>
      <SectionHeader title="Usuários & Perfis" description="Cadastros do time com setor, perfil e status." badge={<Badge variant="outline">{rows.length} usuários</Badge>} />
      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-5 gap-3">
          <div className="space-y-1 md:col-span-2"><Label className="text-xs">Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <DemoSelect label="Setor" value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} options={SECTORS} />
          <DemoSelect label="Perfil" value={form.profile} onChange={(v) => setForm({ ...form, profile: v })} options={PROFILES} />
          <DemoSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={USER_STATUS} />
          <div className="md:col-span-5"><Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button></div>
        </div>
      </Card>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Setor</TableHead><TableHead>Perfil</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><Badge variant="outline">{r.sector}</Badge></TableCell>
                <TableCell>{r.profile}</TableCell>
                <TableCell>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="h-7 border rounded px-1 text-xs bg-background">
                    {USER_STATUS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* =========================================================
 * BI & Relatórios
 * ========================================================= */

function BISection() {
  const [sales] = useDemoStore<Sale[]>(`${STORAGE}.sales`, SEED_SALES);
  const [fin] = useDemoStore<FinTx[]>(`${STORAGE}.fin`, SEED_FIN);
  const [leads] = useDemoStore<Lead[]>(`${STORAGE}.leads`, SEED_LEADS);
  const [apps] = useDemoStore<Appointment[]>(`${STORAGE}.agenda`, SEED_APPS);

  const byMethod = useMemo(() => {
    const m = new Map<string, number>();
    sales.filter((s) => s.status === "Confirmada").forEach((s) => {
      const total = s.items.reduce((a, i) => a + i.qty * i.price, 0);
      m.set(s.method, (m.get(s.method) || 0) + total);
    });
    return [...m.entries()];
  }, [sales]);

  const byChannel = useMemo(() => {
    const m = new Map<string, number>();
    leads.forEach((l) => m.set(l.channel, (m.get(l.channel) || 0) + 1));
    return [...m.entries()];
  }, [leads]);

  const totalSales = byMethod.reduce((a, [, v]) => a + v, 0);
  const totalLeads = byChannel.reduce((a, [, v]) => a + v, 0);
  const profit = fin.filter((t) => t.status === "Pago").reduce((a, t) => a + (t.kind === "Receita" ? t.amount : -t.amount), 0);

  return (
    <>
      <SectionHeader title="BI & Relatórios" description="Indicadores consolidados a partir de Agenda, CRM, Vendas e Financeiro." />

      <StatGrid
        stats={[
          { label: "Faturamento confirmado", value: brl(totalSales), tone: "success" },
          { label: "Resultado financeiro", value: brl(profit), tone: profit >= 0 ? "success" : "warn" },
          { label: "Leads no funil", value: String(leads.length) },
          { label: "Agendamentos", value: String(apps.length) },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Vendas por método de pagamento</h3>
          <div className="space-y-2">
            {byMethod.length === 0 && <div className="text-sm text-muted-foreground">Sem vendas confirmadas.</div>}
            {byMethod.map(([m, v]) => (
              <div key={m}>
                <div className="flex justify-between text-xs"><span>{m}</span><span className="font-medium">{brl(v)}</span></div>
                <Progress value={totalSales ? (v / totalSales) * 100 : 0} className="h-2 mt-1" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Leads por canal de origem</h3>
          <div className="space-y-2">
            {byChannel.length === 0 && <div className="text-sm text-muted-foreground">Sem leads cadastrados.</div>}
            {byChannel.map(([c, v]) => (
              <div key={c}>
                <div className="flex justify-between text-xs"><span>{c}</span><span className="font-medium">{v} leads</span></div>
                <Progress value={totalLeads ? (v / totalLeads) * 100 : 0} className="h-2 mt-1" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* =========================================================
 * Helpers
 * ========================================================= */
function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function today(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
