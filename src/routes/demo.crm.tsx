import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { DemoModuleSwitcher } from "@/components/demo/DemoModuleSwitcher";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Plus, Trash2, RotateCcw, Sparkles, Users, KanbanSquare, Activity, FileText, Workflow, ArrowRight,
  MessageSquare, Calendar, Building2, Tag, Megaphone, BookOpen, Send, ScrollText, ShieldCheck, Layers,
  Briefcase, Clock, GitBranch, ListChecks, Compass, Package,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid } from "@/lib/demoSandbox";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
import { useDemoContracted } from "@/lib/demoContracting";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { gotoWhatsapp, gotoAgenda } from "@/lib/demoCrossLink";
import { createCrmMock, CRM_DEFAULT_PARAMS, type CrmParams } from "@/lib/demoModuleMocks";
import { HelpTip } from "@/components/demo/HelpTip";
import { LeadsPanel } from "@/components/demo/crm/LeadsPanel";
import { ClientesPanel } from "@/components/demo/crm/ClientesPanel";
import { EmpresasPanel, ProdutosPanel, PlanosPanel, ServicosPanel } from "@/components/demo/crm/CrudPanels";
import { PrazosPanel, RegrasPanel, FunisPanel, EtapasPanel, TagsPanel, OrigensPanel, CampanhasPanel, FollowupsPanel, AutomacoesPanel, UsuariosPanel, PermissoesPanel, SimularPerfilPanel } from "@/components/demo/crm/ConfigPanels";
import { makeDemoLog, type DemoLogInput } from "@/lib/demoCrmCrud";
import { DashboardPanel, ComunicacaoPanel, ModelosPanel, LogsPanel, JornadaGuiadaDialog, CrmCtaBar, seedModelosCrm, type ModeloMsg, type LogRich } from "@/components/demo/crm/FaseH";

export const Route = createFileRoute("/demo/crm")({
  head: () => ({
    meta: [
      { title: "Demo — CRM completo — Impulsionando" },
      { name: "description", content: "DEMONSTRAÇÃO — VERSÃO TESTE do CRM: leads, clientes, funis, regras, templates, automações, usuários e permissões." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/crm" }],
  }),
  component: DemoCRM,
});

type Lead = { id: string; nome: string; email: string; telefone: string; origem: string; estagio: string; valor: number; score: number; tags: string[]; criadoEm: string; whatsapp?: string; status?: string; nivelInteresse?: string; campanha?: string; canal?: string; interesse?: string; produtoInteresse?: string; proximaAcao?: string; responsavel?: string; proximoContato?: string; observacoes?: string; motivoPerda?: string };
type Atividade = { id: string; leadId: string; tipo: "ligacao" | "email" | "whatsapp" | "tarefa"; titulo: string; data: string; concluida: boolean };
type Template = { id: string; nome: string; canal: "email" | "whatsapp"; corpo: string };
type Automacao = { id: string; nome: string; gatilho: string; acao: string; ativa: boolean };
type Cliente = { id: string; nome: string; documento: string; email: string; telefone: string; produto: string; plano: string; status: string; tipo?: "PF" | "PJ"; cidade?: string; estado?: string; origem?: string; campanha?: string; interesse?: string; produtoInteresse?: string; planoInteresse?: string; servicoInteresse?: string; responsavel?: string; tags?: string[]; observacoes?: string; emailTeste?: string; whatsappTeste?: string };
type Empresa = { id: string; razaoSocial: string; cnpj: string; segmento: string; nomeFantasia?: string; porte?: string; responsavel?: string; whatsapp?: string; email?: string; cidade?: string; estado?: string; modulosInteresse?: string[]; produtosVinculados?: string[]; status?: string; observacoes?: string };
type Produto = { id: string; nome: string; preco: number; descricao: string; categoria?: string; status?: string; prazoConsumoDias?: number; recompraAuto?: boolean; diasAviso1?: number; diasAviso2?: number; mensagemRecompra?: string; tags?: string[]; campanhas?: string[] };
type Plano = { id: string; nome: string; preco: number; ciclo: string; itens: string[]; descricao?: string; valorSetup?: number; recorrencia?: string; contratoMinDias?: number; mensalidadesMinimas?: number; permiteAdicionais?: boolean; valorPorAdicional?: number; produtosIncluidos?: string[]; status?: string; observacoes?: string };
type Servico = { id: string; nome: string; preco: number; duracao: string; descricao?: string; prazoEntregaDias?: number; produtoRelacionado?: string; planoRelacionado?: string; responsavel?: string; ativo?: boolean; observacoes?: string };
type Prazo = { id: string; nome: string; dias: number; tipo?: string; quando?: string; evento?: string; acao?: string; canal?: string; responsavel?: string; status?: string; ativo?: boolean };
type Funil = { id: string; nome: string; ativo: boolean; descricao?: string; produto?: string; campanha?: string; responsavel?: string; padrao?: boolean };
type Etapa = { id: string; funilId: string; nome: string; ordem: number; cor?: string; prazoMaxDias?: number; aoEntrar?: string; aoSair?: string; descricao?: string; responsavel?: string; ativa?: boolean };
type Regra = { id: string; nome: string; ativa: boolean; quando?: string; entao?: string; descricao?: string; impacto?: string; tooltip?: string; dependencia?: string; status?: string };
type TagItem = { id: string; nome: string; cor?: string; categoria?: string; descricao?: string; ativa?: boolean };
type Origem = { id: string; nome: string; tipo?: string; descricao?: string; ativa?: boolean };
type Campanha = { id: string; nome: string; canal: string; status: string; leads: number; origem?: string; produto?: string; funil?: string; dataInicial?: string; dataFinal?: string; investimento?: number; conversoes?: number; receitaPrevista?: number };
type Followup = { id: string; nome?: string; evento?: string; canal?: string; envios?: number; intervaloDias?: number; mensagem1?: string; mensagem2?: string; mensagem3?: string; criarTarefa?: boolean; encerrarSeResponder?: boolean; ativo?: boolean; leadId?: string; descricao?: string; quando?: string; status?: "Pendente" | "Concluído" };
type Usuario = { id: string; nome: string; email: string; papel: string; status: string; whatsapp?: string; cargo?: string; setor?: string; observacoes?: string };
type Permissao = { papel: string; permitido: boolean; acao?: "ver" | "criar" | "editar" | "excluir"; permissao?: string };
type Log = LogRich;

const STAGES = ["Novo lead", "Primeiro contato", "Qualificação", "Proposta enviada", "Aguardando pagamento", "Contratado", "Onboarding", "Reativação"];
const MOCK_MARKER = "crm:v3";

function DemoCRM() {
  const [leads, setLeads] = useDemoState<Lead[]>("crm.leads", []);
  const [atvs, setAtvs] = useDemoState<Atividade[]>("crm.atvs", []);
  const [tpls, setTpls] = useDemoState<Template[]>("crm.tpls", []);
  const [autos, setAutos] = useDemoState<Automacao[]>("crm.autos", []);
  const [params, setParams] = useDemoState<CrmParams>("crm.params", CRM_DEFAULT_PARAMS);
  const [clientes, setClientes] = useDemoState<Cliente[]>("crm.clientes", []);
  const [empresas, setEmpresas] = useDemoState<Empresa[]>("crm.empresas", []);
  const [produtos, setProdutos] = useDemoState<Produto[]>("crm.produtos", []);
  const [planos, setPlanos] = useDemoState<Plano[]>("crm.planos", []);
  const [servicos, setServicos] = useDemoState<Servico[]>("crm.servicos", []);
  const [prazos, setPrazos] = useDemoState<Prazo[]>("crm.prazos", []);
  const [funis, setFunis] = useDemoState<Funil[]>("crm.funis", []);
  const [etapas, setEtapas] = useDemoState<Etapa[]>("crm.etapas", []);
  const [regras, setRegras] = useDemoState<Regra[]>("crm.regras", []);
  const [tags, setTags] = useDemoState<TagItem[]>("crm.tags", []);
  const [origens, setOrigens] = useDemoState<Origem[]>("crm.origens", []);
  const [campanhas, setCampanhas] = useDemoState<Campanha[]>("crm.campanhas", []);
  const [followups, setFollowups] = useDemoState<Followup[]>("crm.followups", []);
  const [usuarios, setUsuarios] = useDemoState<Usuario[]>("crm.usuarios", []);
  const [permissoes, setPermissoes] = useDemoState<Permissao[]>("crm.permissoes", []);
  const [logs, setLogs] = useDemoState<Log[]>("crm.logs", []);
  const [modelos, setModelos] = useDemoState<ModeloMsg[]>("crm.modelos", []);
  const [jornadaOpen, setJornadaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const { isContracted } = useDemoContracted();
  const pagoDemo = isContracted("crm");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const marker = window.localStorage.getItem("imp.demo.mock.crm");
    if (marker === MOCK_MARKER) return;
    seed(true);
    window.localStorage.setItem("imp.demo.mock.crm", MOCK_MARKER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function seed(silent = false) {
    const m = createCrmMock();
    setLeads(m.leads); setAtvs(m.atvs); setTpls(m.tpls); setAutos(m.autos);
    setParams({ ...CRM_DEFAULT_PARAMS, ...m.params });
    setClientes(m.clientes); setEmpresas(m.empresas); setProdutos(m.produtos);
    setPlanos(m.planos); setServicos(m.servicos); setPrazos(m.prazosDias);
    setFunis(m.funis); setEtapas(m.etapas); setRegras(m.regras);
    setTags(m.tags); setOrigens(m.origens); setCampanhas(m.campanhas);
    setFollowups(m.followups); setUsuarios(m.usuarios);
    setPermissoes(m.permissoes); setLogs(m.logs);
    setModelos(seedModelosCrm());
    if (!silent) toast.success("Dados fictícios do CRM (DEMO) populados.");
  }

  function resetCrm() {
    if (typeof window === "undefined") return;
    if (!confirm("Tem certeza que deseja zerar os dados desta demonstração? Apenas os dados fictícios do CRM, neste navegador, serão apagados. Outros usuários não serão afetados.")) return;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("imp.demo.crm."))
      .forEach((k) => window.localStorage.removeItem(k));
    window.localStorage.removeItem("imp.demo.mock.crm");
    // registra log de reset antes do reload
    const resetEntry = makeDemoLog({ area: "Sistema", acao: "Reset local executado", status: "ok", usuario: "sessao-demo" });
    try { window.localStorage.setItem("imp.demo.crm.logs", JSON.stringify([{ ...resetEntry, modulo: "CRM", ambiente: "DEMO" }])); } catch { /* noop */ }
    toast.success("Dados demonstrativos do CRM restaurados para o padrão inicial.");
    setTimeout(() => window.location.reload(), 400);
  }

  function pushLog(input: DemoLogInput) {
    const entry = makeDemoLog({ usuario: "sessao-demo", ...input });
    const rich: Log = {
      id: entry.id,
      quando: entry.quando,
      usuario: entry.usuario,
      acao: `${entry.acao}${entry.registro ? ` — ${entry.registro}` : ""}`,
      area: entry.area,
      modulo: entry.modulo,
      registro: entry.registro,
      status: entry.status,
      ambiente: entry.ambiente,
      canal: entry.canal,
      destinatario: entry.destinatario,
    };
    setLogs((prev) => [rich, ...prev].slice(0, 200));
  }

  function moverEstagio(id: string, dir: 1 | -1) {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const idx = STAGES.indexOf(l.estagio);
      const next = Math.min(STAGES.length - 1, Math.max(0, idx + dir));
      return { ...l, estagio: STAGES[next] };
    }));
  }

  const dash = useMemo(() => {
    const porEstagio = STAGES.map((s) => ({ s, n: leads.filter((l) => l.estagio === s).length, v: leads.filter((l) => l.estagio === s).reduce((a, b) => a + b.valor, 0) }));
    const ganho = leads.filter((l) => l.estagio === "Contratado");
    const conversao = leads.length ? Math.round((ganho.length / leads.length) * 100) : 0;
    const receita = ganho.reduce((a, b) => a + b.valor, 0);
    return { porEstagio, ganho: ganho.length, conversao, receita, total: leads.length };
  }, [leads]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <DemoModeBanner current="crm" />

        {/* Chancela permanente VERSÃO TESTE */}
        <div className="bg-warning/15 border-y border-warning/30 text-warning-foreground">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 text-xs flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold tracking-wide">DEMONSTRAÇÃO — VERSÃO TESTE</span>
            <span className="text-muted-foreground">Toda comunicação simulada exibe o prefixo <strong>TESTE — DEMONSTRAÇÃO — VERSÃO TESTE</strong>.</span>
          </div>
        </div>

        <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-gradient-primary">CRM • Demo contratada</Badge>
                {pagoDemo && <Badge className="bg-emerald-600/15 text-emerald-700 border-emerald-600/30">PAGO — DEMO</Badge>}
                <Badge variant="outline">DEMONSTRAÇÃO — VERSÃO TESTE</Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">CRM completo</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                Você acabou de contratar (na demonstração) o CRM da Impulsionando Tecnologia. Configure leads, clientes, produtos, planos, prazos, regras, automações, usuários e permissões, e teste a comunicação por e-mail e WhatsApp.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <DemoContractCTA
                slug="crm"
                moduleName="CRM completo"
                moduleDescription="Gestão de leads, clientes, funis, automações, usuários, permissões e comunicação."
                amountReference={247}
                features={["Leads ilimitados", "Funis e etapas", "Automações", "Templates e-mail/WhatsApp", "Permissões por papel"]}
                testRoute="/demo/crm"
                size="default"
                variant="default"
              />
              <Button variant="outline" onClick={() => setJornadaOpen(true)}><Compass className="w-4 h-4 mr-1" />Iniciar jornada guiada do CRM</Button>
              <Button variant="outline" onClick={() => seed(false)}><Sparkles className="w-4 h-4 mr-1" />Popular demo</Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="flex-wrap h-auto justify-start">
              <TabsTrigger value="visao"><Compass className="w-4 h-4 mr-1" />Visão Geral</TabsTrigger>
              <TabsTrigger value="dashboard"><Activity className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
              <TabsTrigger value="leads"><Users className="w-4 h-4 mr-1" />Leads</TabsTrigger>
              <TabsTrigger value="clientes"><Users className="w-4 h-4 mr-1" />Clientes</TabsTrigger>
              <TabsTrigger value="empresas"><Building2 className="w-4 h-4 mr-1" />Empresas</TabsTrigger>
              <TabsTrigger value="pipeline"><KanbanSquare className="w-4 h-4 mr-1" />Pipeline</TabsTrigger>
              <TabsTrigger value="atividades"><Activity className="w-4 h-4 mr-1" />Atividades</TabsTrigger>
              <TabsTrigger value="followups"><ListChecks className="w-4 h-4 mr-1" />Follow-ups</TabsTrigger>
              <TabsTrigger value="produtos"><Package className="w-4 h-4 mr-1" />Produtos</TabsTrigger>
              <TabsTrigger value="planos"><Briefcase className="w-4 h-4 mr-1" />Planos</TabsTrigger>
              <TabsTrigger value="servicos"><Briefcase className="w-4 h-4 mr-1" />Serviços</TabsTrigger>
              <TabsTrigger value="prazos"><Clock className="w-4 h-4 mr-1" />Prazos</TabsTrigger>
              <TabsTrigger value="funis"><GitBranch className="w-4 h-4 mr-1" />Funis</TabsTrigger>
              <TabsTrigger value="etapas"><GitBranch className="w-4 h-4 mr-1" />Etapas</TabsTrigger>
              <TabsTrigger value="regras"><Workflow className="w-4 h-4 mr-1" />Regras</TabsTrigger>
              <TabsTrigger value="tags"><Tag className="w-4 h-4 mr-1" />Tags</TabsTrigger>
              <TabsTrigger value="origens"><Tag className="w-4 h-4 mr-1" />Origens</TabsTrigger>
              <TabsTrigger value="campanhas"><Megaphone className="w-4 h-4 mr-1" />Campanhas</TabsTrigger>
              <TabsTrigger value="comunicacao"><Send className="w-4 h-4 mr-1" />Comunicação</TabsTrigger>
              <TabsTrigger value="automacoes"><Workflow className="w-4 h-4 mr-1" />Automações</TabsTrigger>
              <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-1" />Usuários</TabsTrigger>
              <TabsTrigger value="permissoes"><ShieldCheck className="w-4 h-4 mr-1" />Permissões</TabsTrigger>
              <TabsTrigger value="simular"><ShieldCheck className="w-4 h-4 mr-1" />Simular Perfil</TabsTrigger>
              <TabsTrigger value="params"><Sparkles className="w-4 h-4 mr-1" />Parametrizações</TabsTrigger>
              <TabsTrigger value="logs"><ScrollText className="w-4 h-4 mr-1" />Logs</TabsTrigger>
              <TabsTrigger value="jornada"><BookOpen className="w-4 h-4 mr-1" />Jornada Guiada</TabsTrigger>
            </TabsList>

            {/* VISÃO GERAL */}
            <TabsContent value="visao" className="mt-4 space-y-4">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  O CRM organiza leads, clientes, histórico, funis, tarefas, produtos, planos, prazos, automações e comunicações comerciais em uma única jornada.
                </p>
              </Card>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { t: "Leads e oportunidades", d: "Cadastre, qualifique e acompanhe leads desde o primeiro contato até a conversão." },
                  { t: "Clientes e histórico", d: "Centralize dados, interações, interesses, produtos contratados, planos e comunicações." },
                  { t: "Produtos e planos", d: "Vincule produtos, serviços e planos aos clientes para organizar vendas, recompra e relacionamento." },
                  { t: "Prazos e follow-ups", d: "Configure prazos em dias para retornos, propostas, reativação, recompra e cobranças." },
                  { t: "Automações", d: "Crie regras simples: quando algo acontecer, o sistema executa uma ação." },
                  { t: "WhatsApp e e-mail", d: "Teste mensagens automáticas, boas-vindas, follow-ups, propostas, cobranças e pesquisas." },
                  { t: "Dashboard comercial", d: "Acompanhe leads, conversões, origem, propostas, tarefas, clientes e automações." },
                ].map((c) => (
                  <Card key={c.t} className="p-4">
                    <div className="font-semibold text-sm mb-1">{c.t}</div>
                    <div className="text-xs text-muted-foreground">{c.d}</div>
                  </Card>
                ))}
              </div>
              <Card className="p-5 flex gap-3 flex-wrap">
                <Button className="bg-gradient-primary" asChild><Link to="/planos">Configure o CRM agora</Link></Button>
                <Button variant="outline" onClick={() => { const t = document.querySelector('[data-state="inactive"][value="jornada"]') as HTMLElement | null; t?.click(); toast.message("Abrindo jornada guiada"); }}>Testar jornada guiada</Button>
                <Button variant="outline" asChild><Link to="/planos">Contratar CRM real</Link></Button>
              </Card>
            </TabsContent>

            {/* DASHBOARD */}
            <TabsContent value="dashboard" className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
                <KPI label="Leads totais" value={String(dash.total)} />
                <KPI label="Contratados" value={String(dash.ganho)} accent />
                <KPI label="Conversão" value={`${dash.conversao}%`} />
                <KPI label="Receita demo" value={dash.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
              </div>
              <Card className="p-5">
                <h3 className="font-semibold mb-3 text-sm">Funil por etapa</h3>
                <div className="space-y-2">
                  {dash.porEstagio.map((e) => (
                    <div key={e.s} className="flex items-center gap-3">
                      <span className="w-40 text-xs">{e.s}</span>
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

            {/* LEADS */}
            <TabsContent value="leads" className="mt-4 space-y-4">
              <LeadsPanel
                leads={leads}
                setLeads={setLeads}
                origens={origens}
                clientes={clientes}
                setClientes={setClientes}
                onLog={pushLog}
                exigirOrigem={params.exigirOrigem}
                exigirResponsavel={params.exigirResponsavel}
              />
            </TabsContent>

            {/* CLIENTES */}
            <TabsContent value="clientes" className="mt-4 space-y-4">
              <ClientesPanel
                clientes={clientes}
                setClientes={setClientes}
                produtos={produtos}
                planos={planos}
                servicos={servicos}
                origens={origens}
                onLog={pushLog}
                exigirResponsavel={params.exigirResponsavel}
              />
            </TabsContent>


            {/* EMPRESAS */}
            <TabsContent value="empresas" className="mt-4 space-y-4">
              <EmpresasPanel
                empresas={empresas}
                setEmpresas={setEmpresas}
                produtos={produtos}
                onLog={pushLog}
                exigirResponsavel={params.exigirResponsavel}
                podeEditar={params.podeGerirEmpresas}
              />
            </TabsContent>


            {/* PIPELINE */}
            <TabsContent value="pipeline" className="mt-4">
              <div className="grid md:grid-cols-4 lg:grid-cols-8 gap-3">
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

            {/* ATIVIDADES */}
            <TabsContent value="atividades" className="mt-4 space-y-4">
              <Card className="p-5"><NovaAtividade leads={leads} onCreate={(a) => setAtvs((p) => [a, ...p])} /></Card>
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
                          <TableCell><Switch checked={a.concluida} onCheckedChange={(v) => setAtvs((p) => p.map((x) => x.id === a.id ? { ...x, concluida: v } : x))} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            {/* FOLLOW-UPS */}
            <TabsContent value="followups" className="mt-4 space-y-4">
              <FollowupsPanel followups={followups} setFollowups={setFollowups} onLog={pushLog} />
            </TabsContent>

            {/* PRODUTOS */}
            <TabsContent value="produtos" className="mt-4 space-y-4">
              <ProdutosPanel produtos={produtos} setProdutos={setProdutos} onLog={pushLog} podeEditar={params.podeGerirProdutos} />
            </TabsContent>

            {/* PLANOS */}
            <TabsContent value="planos" className="mt-4 space-y-4">
              <PlanosPanel planos={planos} setPlanos={setPlanos} clientes={clientes} produtos={produtos} onLog={pushLog} podeEditar={params.podeGerirPlanos} />
            </TabsContent>

            {/* SERVIÇOS */}
            <TabsContent value="servicos" className="mt-4 space-y-4">
              <ServicosPanel servicos={servicos} setServicos={setServicos} produtos={produtos} planos={planos} onLog={pushLog} exigirResponsavel={params.exigirResponsavel} podeEditar={params.podeGerirServicos} />
            </TabsContent>

            {/* PRAZOS EM DIAS */}
            <TabsContent value="prazos" className="mt-4 space-y-4">
              <PrazosPanel prazos={prazos} setPrazos={setPrazos} onLog={pushLog} />
            </TabsContent>

            {/* FUNIS */}
            <TabsContent value="funis" className="mt-4 space-y-4">
              <FunisPanel funis={funis} setFunis={setFunis} onLog={pushLog} />
            </TabsContent>

            {/* ETAPAS */}
            <TabsContent value="etapas" className="mt-4 space-y-4">
              <EtapasPanel etapas={etapas} setEtapas={setEtapas} funis={funis} onLog={pushLog} />
            </TabsContent>

            {/* REGRAS */}
            <TabsContent value="regras" className="mt-4 space-y-3">
              <RegrasPanel regras={regras} setRegras={setRegras} onLog={pushLog} />
            </TabsContent>

            {/* TAGS */}
            <TabsContent value="tags" className="mt-4 space-y-3">
              <TagsPanel tags={tags} setTags={setTags} onLog={pushLog} />
            </TabsContent>

            {/* ORIGENS */}
            <TabsContent value="origens" className="mt-4 space-y-3">
              <OrigensPanel origens={origens} setOrigens={setOrigens} leads={leads} onLog={pushLog} />
            </TabsContent>

            {/* CAMPANHAS */}
            <TabsContent value="campanhas" className="mt-4 space-y-3">
              <CampanhasPanel campanhas={campanhas} setCampanhas={setCampanhas} origens={origens} onLog={pushLog} />
            </TabsContent>

            {/* COMUNICAÇÃO (templates) */}
            <TabsContent value="comunicacao" className="mt-4 space-y-4">
              <Card className="p-5"><NovoTemplate onCreate={(t) => setTpls((p) => [t, ...p])} /></Card>
              <div className="grid md:grid-cols-2 gap-3">
                {tpls.map((t) => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{t.nome}</div>
                      <Badge variant="outline">{t.canal}</Badge>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-muted/40 p-2 rounded">{t.corpo}</pre>
                    <div className="flex justify-end mt-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => { toast.success(`Mensagem simulada (Enviado — DEMO) — ${t.canal}`); setLogs((p) => [{ id: uid("lg"), quando: new Date().toISOString(), usuario: "Atendimento Demo", acao: `Simulou envio do template ${t.nome}` }, ...p]); }}><Send className="w-3.5 h-3.5 mr-1" />Simular envio</Button>
                      <Button size="sm" variant="ghost" onClick={() => setTpls((p) => p.filter((x) => x.id !== t.id))}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* AUTOMAÇÕES */}
            <TabsContent value="automacoes" className="mt-4 space-y-3">
              <AutomacoesPanel autos={autos} setAutos={setAutos} onLog={pushLog} />
            </TabsContent>

            {/* USUÁRIOS */}
            <TabsContent value="usuarios" className="mt-4 space-y-3">
              <UsuariosPanel usuarios={usuarios} setUsuarios={setUsuarios} onLog={pushLog} />
            </TabsContent>

            {/* PERMISSÕES */}
            <TabsContent value="permissoes" className="mt-4 space-y-3">
              <PermissoesPanel permissoes={permissoes} setPermissoes={setPermissoes} onLog={pushLog} />
            </TabsContent>

            {/* SIMULAR VISÃO POR PERFIL */}
            <TabsContent value="simular" className="mt-4 space-y-3">
              <SimularPerfilPanel permissoes={permissoes} onLog={pushLog} />
            </TabsContent>

            {/* PARAMETRIZAÇÕES (16 toggles) */}
            <TabsContent value="params" className="mt-4 space-y-3">
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">Parametrizações SIM / NÃO <HelpTip k="parametrizacao" /></h3>
                {PARAM_DEFS.map((d) => (
                  <ParamToggle
                    key={d.key}
                    label={d.label}
                    hint={d.hint}
                    value={Boolean((params as Record<string, boolean>)[d.key])}
                    onChange={(v) => setParams({ ...params, [d.key]: v })}
                  />
                ))}
              </Card>
            </TabsContent>

            {/* LOGS */}
            <TabsContent value="logs" className="mt-4 space-y-3">
              <Card className="p-5">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">Logs da DEMO <HelpTip>Histórico das ações realizadas dentro da demonstração.</HelpTip></div>
                <Table>
                  <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Usuário</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
                  <TableBody>{logs.map((lg) => (
                    <TableRow key={lg.id}><TableCell className="text-xs">{new Date(lg.quando).toLocaleString("pt-BR")}</TableCell><TableCell className="text-xs">{lg.usuario}</TableCell><TableCell className="text-xs">{lg.acao}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* JORNADA GUIADA */}
            <TabsContent value="jornada" className="mt-4 space-y-3">
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold text-sm">Jornada guiada — CRM</h3>
                <ol className="text-sm space-y-2 list-decimal pl-5">
                  <li>Confirme suas parametrizações em <strong>Parametrizações</strong> (SIM/NÃO dos 16 itens).</li>
                  <li>Revise <strong>Origens</strong> e <strong>Campanhas</strong> e ajuste tags.</li>
                  <li>Cadastre 1 ou 2 <strong>Leads</strong> e mova-os pelo <strong>Pipeline</strong>.</li>
                  <li>Crie um <strong>Template</strong> em Comunicação e clique em <em>Simular envio</em>.</li>
                  <li>Ative uma <strong>Automação</strong> e configure uma <strong>Regra</strong>.</li>
                  <li>Veja o resultado no <strong>Dashboard</strong> e nos <strong>Logs</strong>.</li>
                  <li>Quando estiver convencido, clique em <strong>Contratar CRM real</strong>.</li>
                </ol>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Rodapé: Outros Módulos / Zerar / CTA contratação real */}
          <div className="mt-10 grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="font-semibold mb-2 text-sm flex items-center gap-2"><Layers className="w-4 h-4" /> Contratar o CRM real</div>
              <p className="text-xs text-muted-foreground mb-3">Pronto para sair da demonstração? Adicione o CRM ao orçamento ou veja os planos completos.</p>
              <div className="flex gap-2 flex-wrap">
                <Button className="bg-gradient-primary" asChild><Link to="/planos">Contratar CRM real</Link></Button>
                <Button variant="outline" asChild><Link to="/planos">Adicionar CRM ao orçamento</Link></Button>
                <Button variant="outline" asChild><Link to="/planos">Ver planos</Link></Button>
                <Button variant="outline" asChild><Link to="/contato">Falar com consultor</Link></Button>
              </div>
            </Card>
            <Card className="p-5">
              <div className="font-semibold mb-2 text-sm">Controles da demonstração</div>
              <p className="text-xs text-muted-foreground mb-3">Trocar para outro módulo demonstrativo ou zerar apenas os dados desta DEMO do CRM neste navegador.</p>
              <div className="flex gap-2 flex-wrap">
                <DemoModuleSwitcher current="crm" size="default" variant="outline" />
                <Button variant="destructive" onClick={resetCrm}><RotateCcw className="w-4 h-4 mr-1" />Zerar dados da DEMO</Button>
              </div>
            </Card>
          </div>
        </main>
        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

// ───────────────────────── helpers ─────────────────────────

const PARAM_DEFS: { key: keyof CrmParams; label: string; hint: string }[] = [
  { key: "ativarFunis", label: "Ativar funis comerciais?", hint: "Quando ativado, os leads passam por etapas definidas em um funil." },
  { key: "ativarTags", label: "Ativar tags?", hint: "Permite categorizar leads e clientes com tags personalizadas." },
  { key: "exigirOrigem", label: "Exigir origem do lead?", hint: "Obriga o cadastro a informar de onde o lead veio." },
  { key: "leadScoring", label: "Ativar lead scoring?", hint: "Cada interação soma pontos no score do lead." },
  { key: "followupAuto", label: "Ativar follow-ups automáticos?", hint: "Dispara mensagem se o lead não responder em X dias." },
  { key: "ativarReativacao", label: "Ativar reativação automática?", hint: "Move leads e clientes inativos para a etapa de Reativação." },
  { key: "boasVindasLead", label: "Enviar boas-vindas para novo lead?", hint: "Dispara template de boas-vindas no cadastro de leads." },
  { key: "boasVindasCliente", label: "Enviar boas-vindas para novo cliente?", hint: "Dispara template de boas-vindas ao virar cliente." },
  { key: "pesquisaPosConversao", label: "Enviar pesquisa após conversão?", hint: "Envia uma pesquisa de satisfação após a conversão." },
  { key: "tarefaAutoNovoLead", label: "Criar tarefa automática para novo lead?", hint: "Cria automaticamente uma tarefa para o responsável." },
  { key: "distribuirAuto", label: "Distribuir leads automaticamente?", hint: "Round-robin entre vendedores ativos." },
  { key: "exigirResponsavel", label: "Exigir responsável para cada lead?", hint: "Impede cadastrar lead sem responsável atribuído." },
  { key: "permitirSemWhats", label: "Permitir lead sem WhatsApp?", hint: "Quando NÃO, exige WhatsApp no cadastro." },
  { key: "permitirSemEmail", label: "Permitir lead sem e-mail?", hint: "Quando NÃO, exige e-mail no cadastro." },
  { key: "registrarLogsComunicacao", label: "Registrar logs de comunicação?", hint: "Salva no histórico cada envio simulado." },
  { key: "registrarHistoricoCliente", label: "Registrar histórico completo do cliente?", hint: "Mantém todo o histórico de interações no cliente." },
  { key: "podeGerirEmpresas", label: "Permitir gerir Empresas?", hint: "Quando desativado, a área Empresas fica somente leitura nesta demonstração." },
  { key: "podeGerirProdutos", label: "Permitir gerir Produtos?", hint: "Quando desativado, a área Produtos fica somente leitura nesta demonstração." },
  { key: "podeGerirPlanos", label: "Permitir gerir Planos?", hint: "Quando desativado, a área Planos fica somente leitura nesta demonstração." },
  { key: "podeGerirServicos", label: "Permitir gerir Serviços?", hint: "Quando desativado, a área Serviços fica somente leitura nesta demonstração." },
];

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
    <div className="flex items-start justify-between gap-3 border-b last:border-0 pb-3 last:pb-0">
      <div className="flex-1">
        <div className="font-medium text-sm flex items-center gap-1">{label} <HelpTip>{hint}</HelpTip></div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function AddByName({ placeholder, onAdd }: { placeholder: string; onAdd: (nome: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2 mt-3">
      <Input placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} />
      <Button onClick={() => { if (!v.trim()) return; onAdd(v.trim()); setV(""); toast.success("Adicionado"); }}><Plus className="w-4 h-4" /></Button>
    </div>
  );
}

function SimpleListPanel<T extends { id: string }>({
  title, items, empty, columns, onAdd, onRemove, placeholder,
}: {
  title: string;
  items: T[];
  empty: string;
  columns: { k: keyof T; h: string; render?: (v: T[keyof T]) => React.ReactNode }[];
  onAdd: (nome: string) => void;
  onRemove: (id: string) => void;
  placeholder: string;
}) {
  return (
    <Card className="p-5 space-y-3">
      <div className="font-semibold text-sm">{title}</div>
      <AddByName placeholder={placeholder} onAdd={onAdd} />
      {items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <Table>
          <TableHeader><TableRow>{columns.map((c) => <TableHead key={String(c.k)}>{c.h}</TableHead>)}<TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                {columns.map((c) => {
                  const raw = it[c.k];
                  const node: React.ReactNode = c.render ? c.render(raw) : String(raw ?? "—");
                  return <TableCell key={String(c.k)}>{node}</TableCell>;
                })}
                <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => onRemove(it.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
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
      <Button className="sm:col-span-6 bg-gradient-primary" disabled={!f.nome} onClick={() => { onCreate({ id: uid("ld"), ...f, estagio: "Novo lead", score: 50, tags: [], criadoEm: new Date().toISOString() }); setF({ nome: "", email: "", telefone: "", origem: "Site", valor: 0 }); toast.success("Lead criado"); }}>
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
      <div /><div className="sm:col-span-3"><Label className="text-xs">Corpo (use {"{nome}"} para personalizar — o prefixo TESTE — DEMONSTRAÇÃO — VERSÃO TESTE é adicionado automaticamente)</Label><Textarea rows={3} value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} /></div>
      <Button className="sm:col-span-3 bg-gradient-primary" disabled={!f.nome || !f.corpo} onClick={() => { const corpo = f.corpo.startsWith("TESTE —") ? f.corpo : `TESTE — DEMONSTRAÇÃO — VERSÃO TESTE\n\n${f.corpo}`; onCreate({ id: uid("tp"), nome: f.nome, canal: f.canal, corpo }); setF({ nome: "", canal: "email", corpo: "" }); toast.success("Template criado"); }}>
        <Plus className="w-4 h-4 mr-1" />Salvar template
      </Button>
    </div>
  );
}

function NovaAutomacao({ onCreate }: { onCreate: (a: Automacao) => void }) {
  const [f, setF] = useState({ nome: "", gatilho: "lead_criado", acao: "enviar_template:Boas-vindas — novo lead" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Gatilho</Label><Input value={f.gatilho} onChange={(e) => setF({ ...f, gatilho: e.target.value })} /></div>
      <div><Label className="text-xs">Ação</Label><Input value={f.acao} onChange={(e) => setF({ ...f, acao: e.target.value })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.nome} onClick={() => { onCreate({ id: uid("au"), ...f, ativa: true }); setF({ nome: "", gatilho: "lead_criado", acao: "enviar_template:Boas-vindas — novo lead" }); }}>
        <Plus className="w-4 h-4 mr-1" />Criar automação
      </Button>
    </div>
  );
}
