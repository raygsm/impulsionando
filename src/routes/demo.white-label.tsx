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
  LayoutDashboard, Building2, Tags, Boxes, KeyRound, Users, FileSearch, BarChart3, SlidersHorizontal,
  HelpCircle, Plus, Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/white-label")({
  head: () => ({
    meta: [
      { title: "DEMO White-label — Impulsionando" },
      { name: "description", content: "Ambiente de demonstração da plataforma white-label da Impulsionando Tecnologia." },
    ],
  }),
  component: WhiteLabelDemo,
});

const STORAGE = "imp.demo.wl";

const NAV: DemoNavItem[] = [
  { to: "/demo/white-label", label: "Visão geral", icon: LayoutDashboard, help: "Resumo executivo do operador white-label: clientes ativos, MRR, módulos liberados." },
  { to: "/demo/white-label", label: "Clientes (empresas)", icon: Building2, group: "Operação", help: "Cada cliente é uma empresa contratante que usa o sistema com a sua marca." },
  { to: "/demo/white-label", label: "Nichos", icon: Tags, group: "Operação", help: "Categorias de negócio (bar, clínica, salão...) usadas para comparar BI." },
  { to: "/demo/white-label", label: "Módulos liberados", icon: Boxes, group: "Operação", help: "Controle quais módulos cada cliente pode acessar — base do upsell." },
  { to: "/demo/white-label", label: "Perfis & permissões", icon: KeyRound, group: "Segurança", help: "Modelos de acesso reutilizáveis e overrides por usuário." },
  { to: "/demo/white-label", label: "Equipe interna", icon: Users, group: "Segurança", help: "Time da sua operação (suporte, financeiro, comercial)." },
  { to: "/demo/white-label", label: "Auditoria", icon: FileSearch, group: "Segurança", help: "Histórico de tudo que foi criado, alterado ou removido." },
  { to: "/demo/white-label", label: "BI consolidado", icon: BarChart3, group: "Analytics", help: "Comparativos entre clientes, nichos e cohorts." },
  { to: "/demo/white-label", label: "Configurações", icon: SlidersHorizontal, group: "Marca", help: "Personalização de logotipo, cores, domínio e e-mails transacionais." },
];

interface ClientRow { id: string; name: string; niche: string; plan: string; status: string; modules: number }

const NICHES = ["Bar/Restaurante", "Clínica de Saúde", "Salão de Beleza", "Profissional Autônomo", "Estúdio/Academia", "Comércio Geral"];
const PLANS = ["Essencial", "Profissional", "Enterprise", "White-label Custom"];
const STATUSES = ["Ativa", "Trial", "Suspensa", "Encerrada"];
const MODULE_COUNTS = ["3", "5", "8", "12", "Todos"];

function WhiteLabelDemo() {
  return (
    <DemoShell
      trackLabel="White-label"
      trackTagline="Visão do operador que revende o sistema com a sua marca."
      storageKey={STORAGE}
      nav={NAV}
      activePath="/demo/white-label"
    >
      <Overview />
      <ClientsManager />
    </DemoShell>
  );
}

function Overview() {
  const stats = [
    { label: "Clientes ativos", value: "24", help: "Empresas pagantes neste mês." },
    { label: "MRR estimado", value: "R$ 18.400", help: "Receita recorrente mensal somando todos os planos." },
    { label: "Módulos liberados", value: "162", help: "Total de módulos ativos somando todos os clientes." },
    { label: "NPS médio", value: "72", help: "Satisfação consolidada dos clientes finais." },
  ];
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">{s.label}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-foreground"><HelpCircle className="w-3.5 h-3.5" /></button>
              </TooltipTrigger>
              <TooltipContent>{s.help}</TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-2 text-2xl font-bold">{s.value}</div>
        </Card>
      ))}
    </div>
  );
}

function ClientsManager() {
  const [rows, setRows] = useDemoStore<ClientRow[]>(`${STORAGE}.clients`, [
    { id: "c1", name: "Bar do Léo", niche: "Bar/Restaurante", plan: "Profissional", status: "Ativa", modules: 8 },
    { id: "c2", name: "Clínica Vitalis", niche: "Clínica de Saúde", plan: "Enterprise", status: "Ativa", modules: 12 },
    { id: "c3", name: "Studio Beleza Pura", niche: "Salão de Beleza", plan: "Essencial", status: "Trial", modules: 5 },
  ]);

  const [form, setForm] = useState({ name: "", niche: "", plan: "", status: "", modules: "" });

  function add() {
    if (!form.name.trim() || !form.niche || !form.plan || !form.status || !form.modules) {
      toast.error("Preencha todos os campos (use as listas suspensas).");
      return;
    }
    setRows([...rows, { id: crypto.randomUUID(), ...form, modules: form.modules === "Todos" ? 99 : Number(form.modules) }]);
    setForm({ name: "", niche: "", plan: "", status: "", modules: "" });
    toast.success("Cliente cadastrado no DEMO.");
  }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }

  return (
    <Card className="shadow-card">
      <div className="p-5 border-b flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Clientes (empresas)
            <Tooltip>
              <TooltipTrigger asChild><button><HelpCircle className="w-4 h-4 text-muted-foreground" /></button></TooltipTrigger>
              <TooltipContent className="max-w-xs">Empresas contratantes que usam o sistema com a sua marca. Cada cliente terá seus próprios usuários, módulos e dados isolados.</TooltipContent>
            </Tooltip>
          </h3>
          <p className="text-xs text-muted-foreground">Cadastros usam apenas listas suspensas para padronizar nicho, plano e status.</p>
        </div>
        <Badge variant="outline">{rows.length} cadastrados</Badge>
      </div>

      <div className="p-5 grid md:grid-cols-6 gap-3 border-b bg-muted/20">
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs">Nome do cliente</Label>
          <Input placeholder="Ex.: Bar do Léo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <DemoSelect label="Nicho" value={form.niche} onChange={(v) => setForm({ ...form, niche: v })} options={NICHES} />
        <DemoSelect label="Plano" value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} options={PLANS} />
        <DemoSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} />
        <DemoSelect label="Módulos" value={form.modules} onChange={(v) => setForm({ ...form, modules: v })} options={MODULE_COUNTS} />
        <div className="md:col-span-6">
          <Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" />Adicionar cliente</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead><TableHead>Nicho</TableHead><TableHead>Plano</TableHead>
            <TableHead>Status</TableHead><TableHead>Módulos</TableHead><TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell><Badge variant="outline">{r.niche}</Badge></TableCell>
              <TableCell>{r.plan}</TableCell>
              <TableCell>
                <Badge className={r.status === "Ativa" ? "bg-success text-success-foreground" : r.status === "Trial" ? "bg-primary/20 text-primary" : ""} variant={r.status === "Ativa" || r.status === "Trial" ? "default" : "outline"}>{r.status}</Badge>
              </TableCell>
              <TableCell>{r.modules === 99 ? "Todos" : r.modules}</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado neste DEMO.</TableCell></TableRow>
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
