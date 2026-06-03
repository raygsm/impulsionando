import { createFileRoute } from "@tanstack/react-router";
import { DemoShell, useDemoStore, type DemoNavItem } from "@/components/demo/DemoShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LayoutDashboard, Calendar, KanbanSquare, ShoppingCart, Package, Wallet, BarChart3, Users, Layers,
  HelpCircle, Plus, Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/cliente-final")({
  head: () => ({
    meta: [
      { title: "DEMO Cliente Final — Impulsionando" },
      { name: "description", content: "Demonstração do sistema operacional Impulsionando para o cliente final: agenda, CRM, vendas, estoque, financeiro e BI." },
    ],
  }),
  component: ClienteFinalDemo,
});

const STORAGE = "imp.demo.cf";

const NAV: DemoNavItem[] = [
  { to: "/demo/cliente-final", label: "Dashboard", icon: LayoutDashboard, help: "Visão geral do dia: agenda, vendas, ticket médio e financeiro." },
  { to: "/demo/cliente-final", label: "Agenda", icon: Calendar, group: "Operação", help: "Agendamentos, profissionais, serviços, horários e fila de espera." },
  { to: "/demo/cliente-final", label: "CRM", icon: KanbanSquare, group: "Operação", help: "Leads, oportunidades, kanban por funil e atividades." },
  { to: "/demo/cliente-final", label: "Vendas / PDV", icon: ShoppingCart, group: "Operação", help: "Pedidos, ponto de venda e fechamento de caixa." },
  { to: "/demo/cliente-final", label: "Estoque", icon: Package, group: "Operação", help: "Produtos, movimentações, fornecedores e categorias." },
  { to: "/demo/cliente-final", label: "Financeiro", icon: Wallet, group: "Gestão", help: "Lançamentos, contas, métodos de pagamento e comissões." },
  { to: "/demo/cliente-final", label: "Setores", icon: Layers, group: "Gestão", help: "Áreas internas (atendimento, financeiro, cozinha...) para roteamento e permissão." },
  { to: "/demo/cliente-final", label: "Usuários & permissões", icon: Users, group: "Gestão", help: "Time, perfis pré-definidos e permissões granulares por módulo." },
  { to: "/demo/cliente-final", label: "BI & Relatórios", icon: BarChart3, group: "Inteligência", help: "Indicadores operacionais, vendas, agenda e financeiro." },
];

interface UserRow { id: string; name: string; sector: string; profile: string; status: string }

const SECTORS = ["Atendimento", "Vendas / PDV", "Agenda", "Financeiro", "Estoque", "Gerência"];
const PROFILES = ["Administrador", "Gerente", "Operador de Caixa", "Atendente", "Profissional", "Somente leitura"];
const USER_STATUS = ["Ativo", "Convite enviado", "Inativo"];

function ClienteFinalDemo() {
  return (
    <DemoShell
      trackLabel="Cliente Final"
      trackTagline="Visão do bar, restaurante, clínica, salão ou negócio operacional."
      storageKey={STORAGE}
      nav={NAV}
      activePath="/demo/cliente-final"
    >
      <Overview />
      <UsersManager />
    </DemoShell>
  );
}

function Overview() {
  const stats = [
    { label: "Agendamentos hoje", value: "18", help: "Total confirmado para o dia atual." },
    { label: "Vendas hoje", value: "R$ 2.480", help: "Soma das vendas confirmadas no PDV." },
    { label: "Ticket médio", value: "R$ 138", help: "Valor médio por pedido confirmado." },
    { label: "Caixa aberto", value: "R$ 540", help: "Saldo atual da sessão de caixa em andamento." },
  ];
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">{s.label}</span>
            <Tooltip>
              <TooltipTrigger asChild><button><HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground" /></button></TooltipTrigger>
              <TooltipContent>{s.help}</TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-2 text-2xl font-bold">{s.value}</div>
        </Card>
      ))}
    </div>
  );
}

function UsersManager() {
  const [rows, setRows] = useDemoStore<UserRow[]>(`${STORAGE}.users`, [
    { id: "u1", name: "Marina Souza", sector: "Atendimento", profile: "Atendente", status: "Ativo" },
    { id: "u2", name: "Carlos Lima", sector: "Vendas / PDV", profile: "Operador de Caixa", status: "Ativo" },
    { id: "u3", name: "Dra. Helena", sector: "Agenda", profile: "Profissional", status: "Convite enviado" },
  ]);

  const [form, setForm] = useState({ name: "", sector: "", profile: "", status: "" });

  function add() {
    if (!form.name.trim() || !form.sector || !form.profile || !form.status) {
      toast.error("Preencha todos os campos (use as listas suspensas).");
      return;
    }
    setRows([...rows, { id: crypto.randomUUID(), ...form }]);
    setForm({ name: "", sector: "", profile: "", status: "" });
    toast.success("Usuário adicionado ao DEMO.");
  }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }

  return (
    <Card className="shadow-card">
      <div className="p-5 border-b flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Usuários & Permissões
            <Tooltip>
              <TooltipTrigger asChild><button><HelpCircle className="w-4 h-4 text-muted-foreground" /></button></TooltipTrigger>
              <TooltipContent className="max-w-xs">Cada usuário pertence a um setor e recebe um perfil de acesso pré-definido. Use listas suspensas para garantir padronização.</TooltipContent>
            </Tooltip>
          </h3>
          <p className="text-xs text-muted-foreground">Setor, perfil e status são listas controladas — sem texto livre.</p>
        </div>
        <Badge variant="outline">{rows.length} usuários</Badge>
      </div>

      <div className="p-5 grid md:grid-cols-5 gap-3 border-b bg-muted/20">
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs">Nome completo</Label>
          <Input placeholder="Ex.: Marina Souza" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <DemoSelect label="Setor" value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} options={SECTORS} />
        <DemoSelect label="Perfil de acesso" value={form.profile} onChange={(v) => setForm({ ...form, profile: v })} options={PROFILES} />
        <DemoSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={USER_STATUS} />
        <div className="md:col-span-5">
          <Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" />Adicionar usuário</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead><TableHead>Setor</TableHead><TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead><TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell><Badge variant="outline">{r.sector}</Badge></TableCell>
              <TableCell>{r.profile}</TableCell>
              <TableCell>
                <Badge variant={r.status === "Ativo" ? "default" : "outline"} className={r.status === "Ativo" ? "bg-success text-success-foreground" : ""}>{r.status}</Badge>
              </TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum usuário cadastrado neste DEMO.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function DemoSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1">
        {label}
        <Tooltip>
          <TooltipTrigger asChild><button><HelpCircle className="w-3 h-3 text-muted-foreground" /></button></TooltipTrigger>
          <TooltipContent>Use a lista suspensa — campos críticos não aceitam texto livre.</TooltipContent>
        </Tooltip>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
