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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard, Building2, Tags, Boxes, KeyRound, Users, FileSearch, BarChart3, SlidersHorizontal,
  HelpCircle, Plus, Trash2, Palette, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/white-label")({
  head: () => ({
    meta: [
      { title: "DEMO White-label — Impulsionando" },
      { name: "description", content: "Ambiente de revenda completo: clientes, nichos, módulos liberados, perfis, equipe, auditoria, BI consolidado e branding." },
    ],
  }),
  component: WhiteLabelDemo,
});

const STORAGE = "imp.demo.wl";

const NAV: DemoNavItem[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, help: "Resumo executivo: MRR, clientes ativos, módulos liberados, NPS." },
  { id: "clients", label: "Clientes (empresas)", icon: Building2, group: "Operação", help: "Empresas contratantes que usam o sistema com a sua marca." },
  { id: "niches", label: "Nichos", icon: Tags, group: "Operação", help: "Categorias de negócio para comparar BI e templates." },
  { id: "modules", label: "Módulos liberados", icon: Boxes, group: "Operação", help: "Quais módulos cada cliente acessa." },
  { id: "profiles", label: "Perfis & permissões", icon: KeyRound, group: "Segurança", help: "Modelos de acesso reutilizáveis." },
  { id: "team", label: "Equipe interna", icon: Users, group: "Segurança", help: "Seu time de suporte, financeiro, comercial." },
  { id: "audit", label: "Auditoria", icon: FileSearch, group: "Segurança", help: "Histórico de criação, alteração e remoção." },
  { id: "bi", label: "BI consolidado", icon: BarChart3, group: "Analytics", help: "Comparativos entre clientes, nichos e planos." },
  { id: "brand", label: "Configurações de marca", icon: SlidersHorizontal, group: "Marca", help: "Logotipo, cores, domínio e e-mails." },
];

/* ---------------- Tipos ---------------- */
interface ClientRow { id: string; name: string; niche: string; plan: string; status: string; modules: number; mrr: number; nps: number }
interface NicheRow { id: string; name: string; clients: number; template: string }
interface ModuleAssignment { clientId: string; module: string; enabled: boolean }
interface ProfileRow { id: string; name: string; permissions: string[]; users: number }
interface TeamRow { id: string; name: string; role: string; status: string }
interface AuditRow { id: string; at: string; actor: string; action: string; target: string }

const NICHES = ["Bar/Restaurante", "Clínica de Saúde", "Salão de Beleza", "Profissional Autônomo", "Estúdio/Academia", "Comércio Geral"] as const;
const PLANS = ["Essencial", "Profissional", "Enterprise", "White-label Custom"] as const;
const STATUSES = ["Ativa", "Trial", "Suspensa", "Encerrada"] as const;
const TEMPLATES = ["Bar/Restaurante padrão", "Clínica padrão", "Salão padrão", "Comércio padrão"] as const;
const ALL_MODULES = ["Agenda", "CRM", "Vendas/PDV", "Estoque", "Financeiro", "Comissões", "BI", "WhatsApp", "Marketing"] as const;
const PERMS = ["dashboard.read", "agenda.write", "crm.write", "vendas.write", "estoque.write", "financeiro.write", "bi.read", "admin.all"] as const;
const TEAM_ROLES = ["Suporte N1", "Suporte N2", "CSM", "Financeiro", "Comercial", "Admin"] as const;
const TEAM_STATUS = ["Ativo", "Convite enviado", "Inativo"] as const;

/* ---------------- Componente principal ---------------- */
function WhiteLabelDemo() {
  const [active, setActive] = useState("overview");
  return (
    <DemoShell
      trackLabel="White-label"
      trackTagline="Visão do operador que revende o sistema."
      storageKey={STORAGE}
      nav={NAV}
      activeId={active}
      onSelect={setActive}
    >
      {active === "overview" && <OverviewSection />}
      {active === "clients" && <ClientsSection />}
      {active === "niches" && <NichesSection />}
      {active === "modules" && <ModulesSection />}
      {active === "profiles" && <ProfilesSection />}
      {active === "team" && <TeamSection />}
      {active === "audit" && <AuditSection />}
      {active === "bi" && <BISection />}
      {active === "brand" && <BrandSection />}
    </DemoShell>
  );
}

/* ---------------- Seed ---------------- */
const SEED_CLIENTS: ClientRow[] = [
  { id: "c1", name: "Bar do Léo", niche: "Bar/Restaurante", plan: "Profissional", status: "Ativa", modules: 8, mrr: 549, nps: 72 },
  { id: "c2", name: "Clínica Vitalis", niche: "Clínica de Saúde", plan: "Enterprise", status: "Ativa", modules: 12, mrr: 1290, nps: 81 },
  { id: "c3", name: "Studio Beleza Pura", niche: "Salão de Beleza", plan: "Essencial", status: "Trial", modules: 5, mrr: 199, nps: 65 },
  { id: "c4", name: "Padaria Pão Quente", niche: "Comércio Geral", plan: "Profissional", status: "Ativa", modules: 7, mrr: 449, nps: 70 },
];

/* ---------------- Overview ---------------- */
function OverviewSection() {
  const [clients] = useDemoStore<ClientRow[]>(`${STORAGE}.clients`, SEED_CLIENTS);
  const active = clients.filter((c) => c.status === "Ativa").length;
  const trial = clients.filter((c) => c.status === "Trial").length;
  const mrr = clients.filter((c) => c.status === "Ativa").reduce((a, c) => a + c.mrr, 0);
  const modules = clients.reduce((a, c) => a + c.modules, 0);
  const nps = clients.length ? Math.round(clients.reduce((a, c) => a + c.nps, 0) / clients.length) : 0;

  return (
    <>
      <SectionHeader title="Visão geral" description="Resumo executivo da operação white-label." />
      <StatGrid
        stats={[
          { label: "Clientes ativos", value: String(active), tone: "success", help: "Empresas pagantes." },
          { label: "Em trial", value: String(trial), help: "Em período de teste." },
          { label: "MRR estimado", value: brl(mrr), tone: "success", help: "Receita recorrente mensal." },
          { label: "NPS médio", value: String(nps), tone: nps >= 70 ? "success" : "warn", help: "Média ponderada do NPS dos clientes." },
        ]}
      />
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top clientes por MRR</h3>
        <div className="space-y-2">
          {[...clients].sort((a, b) => b.mrr - a.mrr).slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.niche} • {c.plan} • {c.modules} módulos</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{brl(c.mrr)}</div>
                <div className="text-xs text-muted-foreground">NPS {c.nps}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 mt-4 bg-primary/5 border-primary/30">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-primary" /> {modules} módulos liberados no total entre todos os clientes.
        </div>
      </Card>
    </>
  );
}

/* ---------------- Clients ---------------- */
function ClientsSection() {
  const [rows, setRows] = useDemoStore<ClientRow[]>(`${STORAGE}.clients`, SEED_CLIENTS);
  const [form, setForm] = useState({ name: "", niche: "", plan: "", status: "", modules: "5", mrr: "299" });
  const [fNiche, setFNiche] = useState("");
  const [fStatus, setFStatus] = useState("");

  function add() {
    if (!form.name || !form.niche || !form.plan || !form.status) { toast.error("Preencha todos os campos."); return; }
    setRows([...rows, { id: crypto.randomUUID(), name: form.name, niche: form.niche, plan: form.plan, status: form.status, modules: Number(form.modules) || 0, mrr: Number(form.mrr) || 0, nps: 70 }]);
    setForm({ name: "", niche: "", plan: "", status: "", modules: "5", mrr: "299" });
    toast.success("Cliente cadastrado.");
  }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }
  function setStatus(id: string, status: string) { setRows(rows.map((r) => (r.id === id ? { ...r, status } : r))); }

  const filtered = rows.filter((r) => (!fNiche || r.niche === fNiche) && (!fStatus || r.status === fStatus));

  return (
    <>
      <SectionHeader title="Clientes (empresas)" badge={<Badge variant="outline">{rows.length} cadastrados</Badge>} description="Cada cliente é uma empresa contratante isolada com seus próprios usuários, módulos e dados." />

      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2 space-y-1"><Label className="text-xs">Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <DemoSelect label="Nicho" value={form.niche} onChange={(v) => setForm({ ...form, niche: v })} options={NICHES} />
          <DemoSelect label="Plano" value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} options={PLANS} />
          <DemoSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} />
          <div className="space-y-1"><Label className="text-xs">MRR (R$)</Label><Input type="number" value={form.mrr} onChange={(e) => setForm({ ...form, mrr: e.target.value })} /></div>
          <div className="md:col-span-6"><Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Cadastrar</Button></div>
        </div>
      </Card>

      <div className="flex gap-3 flex-wrap mb-3">
        <DemoSelect label="Filtrar por nicho" value={fNiche} onChange={setFNiche} options={NICHES} />
        <DemoSelect label="Filtrar por status" value={fStatus} onChange={setFStatus} options={STATUSES} />
        {(fNiche || fStatus) && <Button size="sm" variant="ghost" onClick={() => { setFNiche(""); setFStatus(""); }}>Limpar</Button>}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Cliente</TableHead><TableHead>Nicho</TableHead><TableHead>Plano</TableHead><TableHead>MRR</TableHead><TableHead>Módulos</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><Badge variant="outline">{r.niche}</Badge></TableCell>
                <TableCell>{r.plan}</TableCell>
                <TableCell className="font-semibold">{brl(r.mrr)}</TableCell>
                <TableCell>{r.modules}</TableCell>
                <TableCell>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="h-7 border rounded text-xs px-1 bg-background">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
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

/* ---------------- Niches ---------------- */
function NichesSection() {
  const [clients] = useDemoStore<ClientRow[]>(`${STORAGE}.clients`, SEED_CLIENTS);
  const [rows, setRows] = useDemoStore<NicheRow[]>(`${STORAGE}.niches`, NICHES.map((n, i) => ({ id: `n${i}`, name: n, clients: 0, template: TEMPLATES[i % TEMPLATES.length] })));
  const [form, setForm] = useState({ name: "", template: "" });

  // sincroniza contagem
  const enriched = rows.map((n) => ({ ...n, clients: clients.filter((c) => c.niche === n.name).length }));

  function add() {
    if (!form.name || !form.template) { toast.error("Selecione nicho e template."); return; }
    if (rows.some((r) => r.name === form.name)) { toast.error("Este nicho já existe."); return; }
    setRows([...rows, { id: crypto.randomUUID(), name: form.name, template: form.template, clients: 0 }]);
    setForm({ name: "", template: "" });
    toast.success("Nicho criado.");
  }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }

  return (
    <>
      <SectionHeader title="Nichos" description="Categorias de negócio que organizam clientes, templates e comparativos de BI." />
      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-3">
          <DemoSelect label="Nicho" value={form.name} onChange={(v) => setForm({ ...form, name: v })} options={NICHES} />
          <DemoSelect label="Template padrão" value={form.template} onChange={(v) => setForm({ ...form, template: v })} options={TEMPLATES} />
          <div className="flex items-end"><Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button></div>
        </div>
      </Card>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Nicho</TableHead><TableHead>Template</TableHead><TableHead>Clientes</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {enriched.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><Badge variant="outline">{r.template}</Badge></TableCell>
                <TableCell>{r.clients}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* ---------------- Modules per client ---------------- */
function ModulesSection() {
  const [clients] = useDemoStore<ClientRow[]>(`${STORAGE}.clients`, SEED_CLIENTS);
  const initial: ModuleAssignment[] = clients.flatMap((c) =>
    ALL_MODULES.map((m, i) => ({ clientId: c.id, module: m, enabled: i < c.modules })),
  );
  const [assignments, setAssignments] = useDemoStore<ModuleAssignment[]>(`${STORAGE}.assignments`, initial);
  const [clientId, setClientId] = useState(clients[0]?.id || "");

  const current = clients.find((c) => c.id === clientId);
  const map = new Map(assignments.filter((a) => a.clientId === clientId).map((a) => [a.module, a.enabled]));

  function toggle(module: string) {
    const exists = assignments.find((a) => a.clientId === clientId && a.module === module);
    if (exists) {
      setAssignments(assignments.map((a) => (a.clientId === clientId && a.module === module ? { ...a, enabled: !a.enabled } : a)));
    } else {
      setAssignments([...assignments, { clientId, module, enabled: true }]);
    }
  }

  return (
    <>
      <SectionHeader title="Módulos liberados por cliente" description="Controle granular do que cada empresa contratante pode acessar." />
      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-2 gap-3">
          <DemoSelect label="Cliente" value={clientId} onChange={setClientId} options={clients.map((c) => c.id)} />
          {current && <div className="text-sm pt-6">Selecionado: <strong>{current.name}</strong> — {current.plan}</div>}
        </div>
      </Card>
      <Card className="p-5">
        <div className="grid md:grid-cols-3 gap-4">
          {ALL_MODULES.map((m) => {
            const enabled = map.get(m) ?? false;
            return (
              <div key={m} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{m}</div>
                  <div className="text-[10px] text-muted-foreground">{enabled ? "Liberado" : "Bloqueado"}</div>
                </div>
                <Switch checked={enabled} onCheckedChange={() => toggle(m)} />
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/* ---------------- Profiles ---------------- */
function ProfilesSection() {
  const [rows, setRows] = useDemoStore<ProfileRow[]>(`${STORAGE}.profiles`, [
    { id: "p1", name: "Administrador", permissions: ["admin.all"], users: 2 },
    { id: "p2", name: "Gerente", permissions: ["dashboard.read", "bi.read", "agenda.write", "vendas.write"], users: 4 },
    { id: "p3", name: "Operador de Caixa", permissions: ["vendas.write"], users: 8 },
  ]);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  function add() {
    if (!name || picked.length === 0) { toast.error("Informe nome e ao menos 1 permissão."); return; }
    setRows([...rows, { id: crypto.randomUUID(), name, permissions: picked, users: 0 }]);
    setName(""); setPicked([]);
    toast.success("Perfil criado.");
  }
  function togglePerm(p: string) { setPicked(picked.includes(p) ? picked.filter((x) => x !== p) : [...picked, p]); }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }

  return (
    <>
      <SectionHeader title="Perfis & permissões" description="Modelos de acesso reutilizáveis aplicados aos usuários dos clientes e da equipe." />
      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1"><Label className="text-xs">Nome do perfil</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="md:col-span-2">
            <Label className="text-xs">Permissões</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {PERMS.map((p) => (
                <button key={p} type="button" onClick={() => togglePerm(p)}
                  className={"text-xs px-2 py-1 rounded border " + (picked.includes(p) ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={add} className="mt-3 bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Criar perfil</Button>
      </Card>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Perfil</TableHead><TableHead>Permissões</TableHead><TableHead>Usuários</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p) => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>{r.users}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* ---------------- Team ---------------- */
function TeamSection() {
  const [rows, setRows] = useDemoStore<TeamRow[]>(`${STORAGE}.team`, [
    { id: "t1", name: "Ana Suporte", role: "Suporte N1", status: "Ativo" },
    { id: "t2", name: "Rafael CSM", role: "CSM", status: "Ativo" },
    { id: "t3", name: "Júlia Comercial", role: "Comercial", status: "Convite enviado" },
  ]);
  const [form, setForm] = useState({ name: "", role: "", status: "" });

  function add() {
    if (!form.name || !form.role || !form.status) { toast.error("Preencha todos os campos."); return; }
    setRows([...rows, { id: crypto.randomUUID(), ...form }]);
    setForm({ name: "", role: "", status: "" });
    toast.success("Membro adicionado.");
  }
  function remove(id: string) { setRows(rows.filter((r) => r.id !== id)); }

  return (
    <>
      <SectionHeader title="Equipe interna" description="Time da operação white-label que dá suporte, vende e administra os clientes." />
      <Card className="p-5 mb-6">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2 space-y-1"><Label className="text-xs">Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <DemoSelect label="Função" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={TEAM_ROLES} />
          <DemoSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={TEAM_STATUS} />
          <div className="md:col-span-4"><Button onClick={add} className="bg-gradient-primary"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button></div>
        </div>
      </Card>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Função</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><Badge variant="outline">{r.role}</Badge></TableCell>
                <TableCell><Badge className={r.status === "Ativo" ? "bg-success text-success-foreground" : ""} variant={r.status === "Ativo" ? "default" : "outline"}>{r.status}</Badge></TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* ---------------- Audit ---------------- */
function AuditSection() {
  const [rows] = useDemoStore<AuditRow[]>(`${STORAGE}.audit`, [
    { id: "a1", at: nowIso(0), actor: "Ana Suporte", action: "criou cliente", target: "Bar do Léo" },
    { id: "a2", at: nowIso(-2), actor: "Rafael CSM", action: "ativou módulo", target: "BI → Clínica Vitalis" },
    { id: "a3", at: nowIso(-5), actor: "Júlia Comercial", action: "atualizou plano", target: "Studio Beleza Pura: Essencial → Profissional" },
    { id: "a4", at: nowIso(-12), actor: "Sistema", action: "gerou cobrança", target: "MRR Janeiro/2026" },
  ]);
  const [fActor, setFActor] = useState("");
  const filtered = rows.filter((r) => !fActor || r.actor === fActor);
  const actors = Array.from(new Set(rows.map((r) => r.actor)));

  return (
    <>
      <SectionHeader title="Auditoria" description="Histórico cronológico de criações, alterações e remoções. Imutável." />
      <div className="flex gap-3 mb-3">
        <DemoSelect label="Filtrar por autor" value={fActor} onChange={setFActor} options={actors} />
        {fActor && <Button size="sm" variant="ghost" onClick={() => setFActor("")}>Limpar</Button>}
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Autor</TableHead><TableHead>Ação</TableHead><TableHead>Alvo</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs whitespace-nowrap">{r.at}</TableCell>
                <TableCell><Badge variant="outline">{r.actor}</Badge></TableCell>
                <TableCell className="text-sm">{r.action}</TableCell>
                <TableCell className="text-sm font-medium">{r.target}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

/* ---------------- BI ---------------- */
function BISection() {
  const [clients] = useDemoStore<ClientRow[]>(`${STORAGE}.clients`, SEED_CLIENTS);

  const byNiche = useMemo(() => {
    const m = new Map<string, { count: number; mrr: number }>();
    clients.forEach((c) => {
      const cur = m.get(c.niche) || { count: 0, mrr: 0 };
      m.set(c.niche, { count: cur.count + 1, mrr: cur.mrr + (c.status === "Ativa" ? c.mrr : 0) });
    });
    return [...m.entries()];
  }, [clients]);

  const byPlan = useMemo(() => {
    const m = new Map<string, number>();
    clients.forEach((c) => m.set(c.plan, (m.get(c.plan) || 0) + 1));
    return [...m.entries()];
  }, [clients]);

  const totalMrr = byNiche.reduce((a, [, v]) => a + v.mrr, 0);
  const totalClients = clients.length;

  return (
    <>
      <SectionHeader title="BI consolidado" description="Comparativos entre nichos, planos e cohorts de clientes." />
      <StatGrid stats={[
        { label: "MRR total", value: brl(totalMrr), tone: "success" },
        { label: "Clientes", value: String(totalClients) },
        { label: "Ticket médio", value: brl(totalClients ? totalMrr / Math.max(1, clients.filter((c) => c.status === "Ativa").length) : 0) },
        { label: "Nichos ativos", value: String(byNiche.length) },
      ]} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">MRR por nicho</h3>
          {byNiche.map(([n, v]) => (
            <div key={n} className="mb-2">
              <div className="flex justify-between text-xs"><span>{n}</span><span className="font-medium">{brl(v.mrr)} • {v.count} clientes</span></div>
              <Progress value={totalMrr ? (v.mrr / totalMrr) * 100 : 0} className="h-2 mt-1" />
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Distribuição por plano</h3>
          {byPlan.map(([p, v]) => (
            <div key={p} className="mb-2">
              <div className="flex justify-between text-xs"><span>{p}</span><span className="font-medium">{v}</span></div>
              <Progress value={totalClients ? (v / totalClients) * 100 : 0} className="h-2 mt-1" />
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

/* ---------------- Brand / Configurações ---------------- */
function BrandSection() {
  const [cfg, setCfg] = useDemoStore(`${STORAGE}.brand`, {
    name: "Impulsionando",
    domain: "sistemas.impulsionando.com.br",
    primary: "#5B7CFA",
    accent: "#FF6B6B",
    emailFrom: "no-reply@impulsionando.com.br",
    emailSignature: "Equipe Impulsionando — sistemas que crescem com você.",
  });

  function save() { toast.success("Configurações de marca salvas."); }

  return (
    <>
      <SectionHeader title="Configurações de marca" description="Personalize logotipo, cores, domínio e e-mails transacionais para sua revenda." />
      <Card className="p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1"><Label className="text-xs">Nome do produto</Label><Input value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Domínio personalizado</Label><Input value={cfg.domain} onChange={(e) => setCfg({ ...cfg, domain: e.target.value })} /></div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Palette className="w-3 h-3" /> Cor primária</Label>
            <div className="flex gap-2">
              <Input type="color" value={cfg.primary} onChange={(e) => setCfg({ ...cfg, primary: e.target.value })} className="w-16 p-1" />
              <Input value={cfg.primary} onChange={(e) => setCfg({ ...cfg, primary: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Palette className="w-3 h-3" /> Cor de destaque</Label>
            <div className="flex gap-2">
              <Input type="color" value={cfg.accent} onChange={(e) => setCfg({ ...cfg, accent: e.target.value })} className="w-16 p-1" />
              <Input value={cfg.accent} onChange={(e) => setCfg({ ...cfg, accent: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1"><Label className="text-xs">E-mail remetente</Label><Input value={cfg.emailFrom} onChange={(e) => setCfg({ ...cfg, emailFrom: e.target.value })} /></div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Assinatura padrão</Label>
            <Textarea rows={2} value={cfg.emailSignature} onChange={(e) => setCfg({ ...cfg, emailSignature: e.target.value })} />
          </div>
        </div>
        <Button onClick={save} className="mt-4 bg-gradient-primary">Salvar configurações</Button>

        <div className="mt-6 rounded-lg border p-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Pré-visualização</div>
          <div className="rounded-md p-4 text-white" style={{ background: `linear-gradient(135deg, ${cfg.primary}, ${cfg.accent})` }}>
            <div className="font-bold text-lg">{cfg.name}</div>
            <div className="text-xs opacity-90">{cfg.domain}</div>
          </div>
          <div className="text-xs mt-2 text-muted-foreground">E-mail: {cfg.emailFrom} · {cfg.emailSignature}</div>
        </div>
      </Card>
    </>
  );
}

/* ---------------- Helpers ---------------- */
function brl(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function nowIso(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() + daysAgo);
  return d.toISOString().slice(0, 16).replace("T", " ");
}
