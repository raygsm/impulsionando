import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, RotateCcw, Sparkles, Users, KanbanSquare, Activity, FileText, Workflow, ArrowRight, MessageSquare, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid } from "@/lib/demoSandbox";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { gotoWhatsapp, gotoAgenda } from "@/lib/demoCrossLink";
import { createCrmMock } from "@/lib/demoModuleMocks";

export const Route = createFileRoute("/demo/crm")({
  head: () => ({
    meta: [
      { title: "Demo — CRM completo — Impulsionando" },
      { name: "description", content: "Teste leads, pipeline kanban, atividades, templates e automações com dados fictícios." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/crm" }],
  }),
  component: DemoCRM,
});

type Lead = {
  id: string; nome: string; email: string; telefone: string;
  origem: string; estagio: string; valor: number; score: number; tags: string[]; criadoEm: string;
};
type Atividade = { id: string; leadId: string; tipo: "ligacao" | "email" | "whatsapp" | "tarefa"; titulo: string; data: string; concluida: boolean };
type Template = { id: string; nome: string; canal: "email" | "whatsapp"; corpo: string };
type Automacao = { id: string; nome: string; gatilho: string; acao: string; ativa: boolean };
type Params = { lgpd: boolean; followupAuto: boolean; leadScoring: boolean; roundRobin: boolean };

const STAGES = ["Novo", "Contato feito", "Qualificado", "Proposta", "Negociação", "Ganho", "Perdido"];

function DemoCRM() {
  const [leads, setLeads, resetLeads] = useDemoState<Lead[]>("crm.leads", []);
  const [atvs, setAtvs, resetAtvs] = useDemoState<Atividade[]>("crm.atvs", []);
  const [tpls, setTpls, resetTpls] = useDemoState<Template[]>("crm.tpls", []);
  const [autos, setAutos, resetAutos] = useDemoState<Automacao[]>("crm.autos", []);
  const [params, setParams, resetParams] = useDemoState<Params>("crm.params", {
    lgpd: true, followupAuto: true, leadScoring: true, roundRobin: false,
  });

  const dash = useMemo(() => {
    const porEstagio = STAGES.map((s) => ({ s, n: leads.filter((l) => l.estagio === s).length, v: leads.filter((l) => l.estagio === s).reduce((a, b) => a + b.valor, 0) }));
    const ganho = leads.filter((l) => l.estagio === "Ganho");
    const perdido = leads.filter((l) => l.estagio === "Perdido");
    const conversao = leads.length ? Math.round((ganho.length / leads.length) * 100) : 0;
    const receita = ganho.reduce((a, b) => a + b.valor, 0);
    return { porEstagio, ganho: ganho.length, perdido: perdido.length, conversao, receita, total: leads.length };
  }, [leads]);

  function seed() {
    const mock = createCrmMock();
    setLeads(mock.leads);
    setAtvs(mock.atvs);
    setTpls(mock.tpls);
    setAutos(mock.autos);
    setParams(mock.params);
    toast.success("Dados fictícios específicos do CRM criados.");
  }

  function resetAll() {
    resetLeads(); resetAtvs(); resetTpls(); resetAutos(); resetParams();
    toast.message("Demonstração zerada.");
  }

  function moverEstagio(id: string, dir: 1 | -1) {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const idx = STAGES.indexOf(l.estagio);
      const next = Math.min(STAGES.length - 1, Math.max(0, idx + dir));
      return { ...l, estagio: STAGES[next] };
    }));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner current="crm" />
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Badge className="bg-gradient-primary mb-2">Demo interativa • dados fictícios</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold">CRM completo</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Leads, pipeline kanban, atividades, templates de e-mail/WhatsApp e automações de jornada — tudo em demonstração.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <DemoContractCTA
              slug="crm"
              moduleName="CRM completo"
              moduleDescription="Gestão de leads, pipeline visual, atividades, templates e jornada automatizada."
              amountReference={247}
              features={["Leads ilimitados", "Pipeline kanban", "Templates e-mail/WhatsApp", "Automações de jornada", "Lead scoring"]}
              testRoute="/demo/crm"
              size="default"
              variant="default"
            />
            <Button variant="outline" onClick={seed}><Sparkles className="w-4 h-4 mr-1" />Popular demo</Button>
            <Button variant="ghost" onClick={resetAll}><RotateCcw className="w-4 h-4 mr-1" />Zerar</Button>
          </div>
        </div>

        <Tabs defaultValue="painel" className="mt-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="painel"><Activity className="w-4 h-4 mr-1" />Painel</TabsTrigger>
            <TabsTrigger value="leads"><Users className="w-4 h-4 mr-1" />Leads</TabsTrigger>
            <TabsTrigger value="pipeline"><KanbanSquare className="w-4 h-4 mr-1" />Pipeline</TabsTrigger>
            <TabsTrigger value="atividades"><Activity className="w-4 h-4 mr-1" />Atividades</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-1" />Templates</TabsTrigger>
            <TabsTrigger value="automacoes"><Workflow className="w-4 h-4 mr-1" />Automações</TabsTrigger>
            <TabsTrigger value="params"><Sparkles className="w-4 h-4 mr-1" />Parametrização</TabsTrigger>
          </TabsList>

          <TabsContent value="painel" className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-4 gap-3">
              <KPI label="Leads totais" value={String(dash.total)} />
              <KPI label="Ganhos" value={String(dash.ganho)} accent />
              <KPI label="Conversão" value={`${dash.conversao}%`} />
              <KPI label="Receita demo" value={dash.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
            </div>
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Funil por estágio</h3>
              <div className="space-y-2">
                {dash.porEstagio.map((e) => (
                  <div key={e.s} className="flex items-center gap-3">
                    <span className="w-32 text-sm">{e.s}</span>
                    <div className="flex-1 h-3 bg-muted rounded">
                      <div className="h-3 bg-gradient-primary rounded" style={{ width: `${dash.total ? (e.n / dash.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">{e.n} leads</span>
                  </div>
                ))}
              </div>
            </Card>
            <RoiSimulator presetKey="crm" />
          </TabsContent>

          <TabsContent value="leads" className="mt-4 space-y-4">
            <Card className="p-5">
              <NovoLead onCreate={(l) => setLeads((prev) => [l, ...prev])} />
            </Card>
            <Card className="p-5">
              {leads.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem leads. Use "Popular demo" ou cadastre manualmente.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Estágio</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[200px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="font-medium">{l.nome}</div>
                          <div className="text-xs text-muted-foreground">Score {l.score}</div>
                        </TableCell>
                        <TableCell className="text-xs"><div>{l.email}</div><div className="text-muted-foreground">{l.telefone}</div></TableCell>
                        <TableCell><Badge variant="outline">{l.origem}</Badge></TableCell>
                        <TableCell><Badge>{l.estagio}</Badge></TableCell>
                        <TableCell className="text-right">{l.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" title="Abrir chat no WhatsApp" onClick={() => gotoWhatsapp({ nome: l.nome, telefone: l.telefone, email: l.email }, `Olá ${l.nome}, tudo bem?`)}>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" title="Agendar" onClick={() => gotoAgenda({ nome: l.nome, telefone: l.telefone })}>
                              <Calendar className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Excluir" onClick={() => setLeads((p) => p.filter((x) => x.id !== l.id))}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="mt-4">
            <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-3">
              {STAGES.map((s) => (
                <Card key={s} className="p-3">
                  <div className="text-xs font-semibold mb-2">{s}</div>
                  <div className="space-y-2">
                    {leads.filter((l) => l.estagio === s).map((l) => (
                      <div key={l.id} className="p-2 rounded border bg-muted/30 text-xs">
                        <div className="font-medium">{l.nome}</div>
                        <div className="text-muted-foreground">{l.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                        <div className="flex gap-1 mt-1">
                          <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => moverEstagio(l.id, -1)}>←</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => moverEstagio(l.id, 1)}>→</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="atividades" className="mt-4 space-y-4">
            <Card className="p-5">
              <NovaAtividade leads={leads} onCreate={(a) => setAtvs((p) => [a, ...p])} />
            </Card>
            <Card className="p-5">
              {atvs.length === 0 ? <p className="text-sm text-muted-foreground">Sem atividades.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Lead</TableHead><TableHead>Tipo</TableHead><TableHead>Título</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {atvs.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{leads.find((l) => l.id === a.leadId)?.nome ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline">{a.tipo}</Badge></TableCell>
                        <TableCell>{a.titulo}</TableCell>
                        <TableCell className="text-xs">{new Date(a.data).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <Switch checked={a.concluida} onCheckedChange={(v) => setAtvs((p) => p.map((x) => x.id === a.id ? { ...x, concluida: v } : x))} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-4 space-y-4">
            <Card className="p-5">
              <NovoTemplate onCreate={(t) => setTpls((p) => [t, ...p])} />
            </Card>
            <div className="grid md:grid-cols-2 gap-3">
              {tpls.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{t.nome}</div>
                    <Badge variant="outline">{t.canal}</Badge>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-muted/40 p-2 rounded">{t.corpo}</pre>
                  <div className="flex justify-end mt-2">
                    <Button size="sm" variant="ghost" onClick={() => setTpls((p) => p.filter((x) => x.id !== t.id))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="automacoes" className="mt-4 space-y-4">
            <Card className="p-5">
              <NovaAutomacao onCreate={(a) => setAutos((p) => [a, ...p])} />
            </Card>
            {autos.map((a) => (
              <Card key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.nome}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Badge variant="outline">{a.gatilho}</Badge>
                    <ArrowRight className="w-3 h-3" />
                    <Badge>{a.acao}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Switch checked={a.ativa} onCheckedChange={(v) => setAutos((p) => p.map((x) => x.id === a.id ? { ...x, ativa: v } : x))} />
                  <Button size="sm" variant="ghost" onClick={() => setAutos((p) => p.filter((x) => x.id !== a.id))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="params" className="mt-4 space-y-3">
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold">Parametrização SIM / NÃO</h3>
              <ParamToggle label="Conformidade LGPD" hint="Aceite explícito de contato e opt-out registrado." value={params.lgpd} onChange={(v) => setParams({ ...params, lgpd: v })} />
              <ParamToggle label="Follow-up automático" hint="Dispara mensagem se lead não responder em 3 dias." value={params.followupAuto} onChange={(v) => setParams({ ...params, followupAuto: v })} />
              <ParamToggle label="Lead scoring" hint="Cada interação soma pontos no score do lead." value={params.leadScoring} onChange={(v) => setParams({ ...params, leadScoring: v })} />
              <ParamToggle label="Round-robin de distribuição" hint="Distribui leads automaticamente entre vendedores." value={params.roundRobin} onChange={(v) => setParams({ ...params, roundRobin: v })} />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <PublicFooter />
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? "text-primary" : ""}`}>{value}</div>
    </Card>
  );
}

function ParamToggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function NovoLead({ onCreate }: { onCreate: (l: Lead) => void }) {
  const [f, setF] = useState({ nome: "", email: "", telefone: "", origem: "Site", valor: 0 });
  return (
    <div className="grid sm:grid-cols-6 gap-2 items-end">
      <div className="sm:col-span-2"><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">E-mail</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><Label className="text-xs">Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
      <div><Label className="text-xs">Origem</Label><Input value={f.origem} onChange={(e) => setF({ ...f, origem: e.target.value })} /></div>
      <div><Label className="text-xs">Valor</Label><Input type="number" value={f.valor} onChange={(e) => setF({ ...f, valor: Number(e.target.value) })} /></div>
      <Button className="sm:col-span-6 bg-gradient-primary" disabled={!f.nome} onClick={() => { onCreate({ id: uid("ld"), ...f, estagio: "Novo", score: 50, tags: [], criadoEm: new Date().toISOString() }); setF({ nome: "", email: "", telefone: "", origem: "Site", valor: 0 }); toast.success("Lead criado"); }}>
        <Plus className="w-4 h-4 mr-1" />Adicionar lead
      </Button>
    </div>
  );
}

function NovaAtividade({ leads, onCreate }: { leads: Lead[]; onCreate: (a: Atividade) => void }) {
  const [f, setF] = useState<{ leadId: string; tipo: Atividade["tipo"]; titulo: string }>({ leadId: leads[0]?.id ?? "", tipo: "tarefa", titulo: "" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div>
        <Label className="text-xs">Lead</Label>
        <Select value={f.leadId} onValueChange={(v) => setF({ ...f, leadId: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Tipo</Label>
        <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v as Atividade["tipo"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ligacao">Ligação</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="tarefa">Tarefa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Título</Label><Input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.leadId || !f.titulo} onClick={() => { onCreate({ id: uid("at"), leadId: f.leadId, tipo: f.tipo, titulo: f.titulo, data: new Date().toISOString(), concluida: false }); setF({ ...f, titulo: "" }); }}>
        <Plus className="w-4 h-4 mr-1" />Adicionar
      </Button>
    </div>
  );
}

function NovoTemplate({ onCreate }: { onCreate: (t: Template) => void }) {
  const [f, setF] = useState<{ nome: string; canal: Template["canal"]; corpo: string }>({ nome: "", canal: "email", corpo: "" });
  return (
    <div className="grid sm:grid-cols-3 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div>
        <Label className="text-xs">Canal</Label>
        <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v as Template["canal"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="email">E-mail</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent>
        </Select>
      </div>
      <div /><div className="sm:col-span-3"><Label className="text-xs">Corpo (use {"{nome}"} para personalizar)</Label><Textarea rows={3} value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} /></div>
      <Button className="sm:col-span-3 bg-gradient-primary" disabled={!f.nome || !f.corpo} onClick={() => { onCreate({ id: uid("tp"), ...f }); setF({ nome: "", canal: "email", corpo: "" }); toast.success("Template criado"); }}>
        <Plus className="w-4 h-4 mr-1" />Salvar template
      </Button>
    </div>
  );
}

function NovaAutomacao({ onCreate }: { onCreate: (a: Automacao) => void }) {
  const [f, setF] = useState({ nome: "", gatilho: "lead_criado", acao: "enviar_template:Boas-vindas" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Gatilho</Label><Input value={f.gatilho} onChange={(e) => setF({ ...f, gatilho: e.target.value })} /></div>
      <div><Label className="text-xs">Ação</Label><Input value={f.acao} onChange={(e) => setF({ ...f, acao: e.target.value })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.nome} onClick={() => { onCreate({ id: uid("au"), ...f, ativa: true }); setF({ nome: "", gatilho: "lead_criado", acao: "enviar_template:Boas-vindas" }); }}>
        <Plus className="w-4 h-4 mr-1" />Criar automação
      </Button>
    </div>
  );
}
