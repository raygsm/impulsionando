import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, Plus, Trash2, RotateCcw, Sparkles, ListChecks, Bell, Briefcase, MessageSquare, User, LayoutDashboard, Sliders, Layers, FileText, Map, UserCog } from "lucide-react";
import { AgendaRecursos } from "@/components/demo/agenda/AgendaRecursos";
import { AgendaFluxosPanel } from "@/components/demo/agenda/AgendaFluxosPanel";
import { AgendaComunicacaoPanel } from "@/components/demo/agenda/AgendaComunicacaoPanel";
import { AgendaDashboard } from "@/components/demo/agenda/AgendaDashboard";
import { AgendaJornadaGuiada } from "@/components/demo/agenda/AgendaJornadaGuiada";
import { AgendaCtaStrip } from "@/components/demo/agenda/AgendaCtaStrip";
import { OutrosModulosDialog } from "@/components/demo/agenda/OutrosModulosDialog";
import { AgendaSubstituicaoPanel, SubstAtalhos } from "@/components/demo/agenda/AgendaSubstituicaoPanel";
import { NICHO_OPTIONS, labelsFor } from "@/lib/agendaNichos";
import { AgendaLog, listAgendaLogs, clearAgendaLogs, type AgendaLogEntry } from "@/lib/agendaLogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDemoState, uid, brl } from "@/lib/demoSandbox";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { gotoCrm, gotoWhatsapp } from "@/lib/demoCrossLink";
import { validateAgendamento, findConflicts, formatConflictMessage, type ConflictAgd } from "@/lib/agendaConflict.functions";
import { useServerFn } from "@tanstack/react-start";
import { createAgendaMock, getAgendaMockConfig } from "@/lib/demoModuleMocks";
import { LeadDemoCapture, getCapturedLead, type LeadDemoInfo } from "@/components/demo/LeadDemoCapture";
import {
  AGENDA_PARAM_DEFS,
  AREAS_AGENDA,
  loadAgendaParams,
  saveAgendaParams,
  type AgendaParams,
  type AgendaParamKey,
} from "@/lib/agendaDemoConfig";

export const Route = createFileRoute("/demo/agenda")({
  head: () => ({
    meta: [
      { title: "Demo — Agenda & Reservas — Impulsionando" },
      { name: "description", content: "Teste agendamento online, profissionais, serviços, fila de espera e lembretes automáticos com dados fictícios." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/agenda" }],
  }),
  component: DemoAgenda,
});

type Profissional = { id: string; nome: string; especialidade: string; cor: string };
type Servico = { id: string; nome: string; duracao: number; preco: number };
type Agendamento = { id: string; profId: string; servicoId: string; cliente: string; telefone: string; data: string; hora: string; status: "confirmado" | "pendente" | "cancelado" | "concluido" };
type Espera = { id: string; cliente: string; telefone: string; servicoId: string; preferencia: string };
type Params = { lembrete24h: boolean; lembrete1h: boolean; confirmaWhats: boolean; bloqueioFeriado: boolean; reagendamentoAuto: boolean };

const HORAS = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

function DemoAgenda() {
  const [profs, setProfs, resetProfs] = useDemoState<Profissional[]>("ag.profs", []);
  const [servs, setServs, resetServs] = useDemoState<Servico[]>("ag.servs", []);
  const [agds, setAgds, resetAgds] = useDemoState<Agendamento[]>("ag.agds", []);
  const [espera, setEspera, resetEspera] = useDemoState<Espera[]>("ag.espera", []);
  const [params, setParams, resetParams] = useDemoState<Params>("ag.params", {
    lembrete24h: true, lembrete1h: true, confirmaWhats: true, bloqueioFeriado: false, reagendamentoAuto: true,
  });
  const [dataAtual, setDataAtual] = useState(() => new Date().toISOString().slice(0, 10));
  const [aba, setAba] = useState<string>("dashboard");
  const [jornadaOpen, setJornadaOpen] = useState(false);
  const [outrosOpen, setOutrosOpen] = useState(false);
  const [zerarOpen, setZerarOpen] = useState(false);
  const [logsTick, setLogsTick] = useState(0);
  const refreshLogs = () => setLogsTick((t) => t + 1);
  const [prefill, setPrefill] = useState<{ cliente: string; telefone: string } | null>(null);
  const [reagendar, setReagendar] = useState<Agendamento | null>(null);
  const [nichoDemo, setNichoDemo] = useState(() => {
    if (typeof window === "undefined") return "servicos";
    return new URLSearchParams(window.location.search).get("nicho") ?? "servicos";
  });

  // Captura obrigatória do lead antes da demo completa
  const [lead, setLead] = useState<LeadDemoInfo | null>(() => getCapturedLead("agenda"));
  const leadCaptured = !!lead;

  // Parametrizações SIM/NÃO completas (BLOCO 1/5)
  const [fullParams, setFullParams] = useState<AgendaParams>(() => loadAgendaParams());
  function setParam(k: AgendaParamKey, v: boolean) {
    setFullParams((prev) => {
      const next = { ...prev, [k]: v };
      saveAgendaParams(next);
      return next;
    });
  }

  // Deep-link via ?cliente=&telefone= vindo de outros módulos (CRM/WhatsApp)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cliente = params.get("cliente");
    const telefone = params.get("telefone") ?? "";
    const nicho = params.get("nicho");
    if (nicho) setNichoDemo(nicho);
    if (cliente) {
      setPrefill({ cliente, telefone });
      setAba("agendar");
    }
  }, []);

  useEffect(() => {
    const marker = `agenda:${nichoDemo}:v2`;
    const current = typeof window === "undefined" ? marker : window.localStorage.getItem("imp.demo.mock.agenda");
    if (current === marker) return;
    const mock = createAgendaMock(nichoDemo);
    setProfs(mock.profs);
    setServs(mock.servs);
    setAgds(mock.agds);
    setEspera(mock.espera);
    setParams(mock.params);
    setDataAtual(mock.agds[0]?.data ?? new Date().toISOString().slice(0, 10));
    if (typeof window !== "undefined") window.localStorage.setItem("imp.demo.mock.agenda", marker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nichoDemo]);

  const dash = useMemo(() => {
    const confirmados = agds.filter((a) => a.status === "confirmado").length;
    const concluidos = agds.filter((a) => a.status === "concluido");
    const cancelados = agds.filter((a) => a.status === "cancelado").length;
    const receita = concluidos.reduce((s, a) => s + (servs.find((x) => x.id === a.servicoId)?.preco ?? 0), 0);
    const ocupacao = profs.length && HORAS.length ? Math.round((agds.filter((a) => a.data === dataAtual).length / (profs.length * HORAS.length)) * 100) : 0;
    return { confirmados, concluidos: concluidos.length, cancelados, receita, ocupacao, total: agds.length };
  }, [agds, servs, profs, dataAtual]);

  function seed() {
    const mock = createAgendaMock(nichoDemo);
    setProfs(mock.profs);
    setServs(mock.servs);
    setAgds(mock.agds);
    setEspera(mock.espera);
    setParams(mock.params);
    setDataAtual(mock.agds[0]?.data ?? new Date().toISOString().slice(0, 10));
    toast.success(`Dados fictícios criados para ${mock.config.title}.`);
  }

  function resetAll() {
    resetProfs(); resetServs(); resetAgds(); resetEspera(); resetParams();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("agenda.demo.resources.v1");
        localStorage.removeItem("agenda.demo.fluxos.v1");
        localStorage.removeItem("agenda.demo.comunicacao.v1");
        localStorage.removeItem("imp.demo.mock.agenda");
      } catch { /* ignore */ }
    }
    clearAgendaLogs();
    AgendaLog.resetLocal();
    refreshLogs();
    toast.success("Dados demonstrativos da Agenda restaurados para o padrão inicial.");
  }

  function alterarStatus(id: string, status: Agendamento["status"]) {
    setAgds((p) => p.map((a) => a.id === id ? { ...a, status } : a));
    toast.success(`Status atualizado: ${status}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner current="agenda" />
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Badge className="bg-gradient-primary mb-2">Demo interativa • dados fictícios</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold">Agenda & Reservas</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {getAgendaMockConfig(nichoDemo).description}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <DemoContractCTA
              slug="agenda"
              moduleName="Agenda & Reservas"
              moduleDescription="Agendamento online com profissionais, serviços, fila de espera e lembretes automáticos."
              amountReference={197}
              features={["Multi-profissional", "Catálogo de serviços", "Fila de espera", "Lembretes WhatsApp/E-mail", "Confirmação online"]}
              testRoute="/demo/agenda"
              size="default"
              variant="default"
            />
            <Select value={nichoDemo} onValueChange={(v) => { setNichoDemo(v); AgendaLog.nichoAplicado(v); toast.success(`Preset de nicho aplicado: ${v}.`); }}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Nicho" /></SelectTrigger>
              <SelectContent>
                {NICHO_OPTIONS.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setJornadaOpen(true)}><Map className="w-4 h-4 mr-1" />Iniciar jornada guiada</Button>
            <Button variant="outline" onClick={seed}><Sparkles className="w-4 h-4 mr-1" />Popular demo</Button>
            <Button variant="outline" onClick={() => setOutrosOpen(true)}><Layers className="w-4 h-4 mr-1" />Outros módulos</Button>
            <Button variant="ghost" onClick={() => setZerarOpen(true)}><RotateCcw className="w-4 h-4 mr-1" />Zerar dados da DEMO</Button>
          </div>
        </div>

        {/* Captura obrigatória do lead — gate da demo completa */}
        <LeadDemoCapture
          moduleSlug="agenda"
          moduleName="Agenda Online"
          description="Antes de liberar sua demonstração da Agenda Online, informe seu nome e WhatsApp. Assim conseguimos personalizar seu teste e, se fizer sentido, ajudar depois na configuração real."
          onCaptured={(l) => setLead(l)}
        />

        {leadCaptured && lead && (
          <Card className="mt-4 p-3 flex items-center justify-between gap-3 flex-wrap text-xs border-primary/30 bg-primary/5">
            <div>
              Olá, <strong>{lead.name}</strong> — sua demonstração da Agenda Online está liberada como <strong>Lead DEMO</strong>.
            </div>
            <Badge variant="outline">DEMONSTRAÇÃO — VERSÃO TESTE</Badge>
          </Card>
        )}

        <Tabs value={aba} onValueChange={setAba} className="mt-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
            <TabsTrigger value="visao"><LayoutDashboard className="w-4 h-4 mr-1" />Visão Geral</TabsTrigger>
            <TabsTrigger value="grade"><Calendar className="w-4 h-4 mr-1" />Grade</TabsTrigger>
            <TabsTrigger value="profs"><Briefcase className="w-4 h-4 mr-1" />{labelsFor(nichoDemo).profissionalPlural}</TabsTrigger>
            <TabsTrigger value="servs"><ListChecks className="w-4 h-4 mr-1" />{labelsFor(nichoDemo).servicoPlural}</TabsTrigger>
            <TabsTrigger value="agendar"><Plus className="w-4 h-4 mr-1" />Novo agendamento</TabsTrigger>
            <TabsTrigger value="espera"><Users className="w-4 h-4 mr-1" />Fila de espera</TabsTrigger>
            <TabsTrigger value="substituicao"><UserCog className="w-4 h-4 mr-1" />Substituição</TabsTrigger>
            <TabsTrigger value="painel"><Clock className="w-4 h-4 mr-1" />Painel</TabsTrigger>
            <TabsTrigger value="params"><Sliders className="w-4 h-4 mr-1" />Parametrizações</TabsTrigger>
            <TabsTrigger value="recursos"><Layers className="w-4 h-4 mr-1" />Recursos</TabsTrigger>
            <TabsTrigger value="fluxos"><Bell className="w-4 h-4 mr-1" />Fluxos</TabsTrigger>
            <TabsTrigger value="comunicacao"><MessageSquare className="w-4 h-4 mr-1" />Comunicação</TabsTrigger>
            <TabsTrigger value="logs"><FileText className="w-4 h-4 mr-1" />Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="visao" className="mt-4 space-y-3">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold">Visão Geral da Agenda Online</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Áreas previstas no módulo, com o que cada uma faz e o impacto na operação. Tudo o que você
                    fizer aqui está em ambiente <strong>DEMONSTRAÇÃO — VERSÃO TESTE</strong> — nenhum dado real é afetado.
                  </p>
                </div>
                <Badge variant="outline">PAGO — DEMO</Badge>
              </div>
            </Card>
            <div className="grid md:grid-cols-2 gap-2">
              {AREAS_AGENDA.map((a) => (
                <Card key={a.title} className="p-3 text-sm space-y-1">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.what}</div>
                  <div className="text-xs"><span className="text-muted-foreground">Impacto:</span> {a.impact}</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {a.comm && <Badge variant="outline" className="text-[10px]">Dispara comunicação</Badge>}
                    {a.logs && <Badge variant="outline" className="text-[10px]">Gera log</Badge>}
                    {a.dash && <Badge variant="outline" className="text-[10px]">Atualiza dashboard</Badge>}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>


          <TabsContent value="grade" className="mt-4 space-y-3">
            <Card className="p-3 flex items-center gap-3">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={dataAtual} onChange={(e) => setDataAtual(e.target.value)} className="w-48" />
              <span className="text-xs text-muted-foreground">
                {agds.filter((a) => a.data === dataAtual).length} agendamento(s) neste dia
              </span>
            </Card>
            {profs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cadastre profissionais para visualizar a grade.</p>
            ) : (
              <Card className="p-3 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Hora</th>
                      {profs.map((p) => <th key={p.id} className="text-left p-2">{p.nome}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set([
                      ...HORAS,
                      ...agds.filter((a) => a.data === dataAtual).map((a) => a.hora),
                    ])).sort().map((h) => (
                      <tr key={h} className="border-t">
                        <td className="p-2 font-medium">{h}</td>
                        {profs.map((p) => {
                          const matches = agds.filter((x) => x.profId === p.id && x.data === dataAtual && x.hora === h && x.status !== "cancelado");
                          if (matches.length === 0) return <td key={p.id} className="p-2 text-muted-foreground">livre</td>;
                          const conflito = matches.length > 1;
                          return (
                            <td key={p.id} className="p-2 space-y-1">
                              {conflito && (
                                <div
                                  className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 p-1"
                                  title={`Conflito em ${p.nome} • ${dataAtual} ${h}\nClientes: ${matches.map((m) => m.cliente).join(", ")}`}
                                >
                                  <div className="flex items-center gap-1">⚠ Conflito • {p.nome} • {h}</div>
                                  <div className="font-normal text-amber-800 dark:text-amber-200 mt-0.5">
                                    {matches.length} clientes: {matches.map((m) => m.cliente).join(", ")}
                                  </div>
                                </div>
                              )}
                              {matches.map((a) => (
                                <div
                                  key={a.id}
                                  className="rounded p-1.5"
                                  style={{
                                    background: `${p.cor}22`,
                                    borderLeft: `3px solid ${conflito ? "#d97706" : p.cor}`,
                                    outline: conflito ? "1px dashed #d97706" : undefined,
                                  }}
                                >
                                  <div className="font-medium">{a.cliente}</div>
                                  <div className="text-[10px] text-muted-foreground">{servs.find((s) => s.id === a.servicoId)?.nome}</div>
                                  <Badge variant="outline" className="text-[9px] mt-1">{a.status}</Badge>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                  </tbody>
                </table>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="font-semibold mb-3">Agendamentos do dia</h3>
              {agds.filter((a) => a.data === dataAtual).length === 0 ? <p className="text-sm text-muted-foreground">Sem agendamentos.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Cliente</TableHead><TableHead>Profissional</TableHead><TableHead>Serviço</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {agds.filter((a) => a.data === dataAtual).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.hora}</TableCell>
                        <TableCell>{a.cliente}<div className="text-xs text-muted-foreground">{a.telefone}</div></TableCell>
                        <TableCell>{profs.find((p) => p.id === a.profId)?.nome}</TableCell>
                        <TableCell>{servs.find((s) => s.id === a.servicoId)?.nome}</TableCell>
                        <TableCell>
                          <Select value={a.status} onValueChange={(v) => alterarStatus(a.id, v as Agendamento["status"])}>
                            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="confirmado">Confirmado</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" title="Confirmar via WhatsApp" onClick={() => gotoWhatsapp({ nome: a.cliente, telefone: a.telefone }, `Olá ${a.cliente}, confirmando seu agendamento ${a.hora} de ${servs.find((s) => s.id === a.servicoId)?.nome ?? ""}.`)}>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" title="Reagendar" onClick={() => setReagendar(a)}>
                              <Clock className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" title="Ver no CRM" onClick={() => gotoCrm({ nome: a.cliente, telefone: a.telefone })}>
                              <User className="w-3.5 h-3.5" />
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

          <TabsContent value="profs" className="mt-4 space-y-4">
            <Card className="p-5"><NovoProf onCreate={(p) => setProfs((prev) => [...prev, p])} /></Card>
            <Card className="p-5">
              {profs.length === 0 ? <p className="text-sm text-muted-foreground">Sem profissionais.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Especialidade</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {profs.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: p.cor }} />{p.nome}</span></TableCell>
                        <TableCell>{p.especialidade}</TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => setProfs((prev) => prev.filter((x) => x.id !== p.id))}><Trash2 className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="servs" className="mt-4 space-y-4">
            <Card className="p-5"><NovoServ onCreate={(s) => setServs((prev) => [...prev, s])} /></Card>
            <Card className="p-5">
              {servs.length === 0 ? <p className="text-sm text-muted-foreground">Sem serviços.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Duração</TableHead><TableHead className="text-right">Preço</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {servs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.nome}</TableCell>
                        <TableCell className="text-right">{s.duracao} min</TableCell>
                        <TableCell className="text-right">{brl(s.preco)}</TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => setServs((prev) => prev.filter((x) => x.id !== s.id))}><Trash2 className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="agendar" className="mt-4">
            <Card className="p-5">
              <NovoAgendamento
                profs={profs}
                servs={servs}
                prefill={prefill}
                agds={agds}
                onCreate={(a) => {
                  setAgds((p) => [a, ...p]);
                  setDataAtual(a.data);
                  setAba("grade");
                }}
              />
            </Card>
          </TabsContent>



          <TabsContent value="espera" className="mt-4 space-y-4">
            <Card className="p-5"><NovaEspera servs={servs} onCreate={(e) => setEspera((p) => [e, ...p])} /></Card>
            <Card className="p-5">
              {espera.length === 0 ? <p className="text-sm text-muted-foreground">Fila vazia.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Serviço</TableHead><TableHead>Preferência</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {espera.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.cliente}<div className="text-xs text-muted-foreground">{e.telefone}</div></TableCell>
                        <TableCell>{servs.find((s) => s.id === e.servicoId)?.nome ?? "—"}</TableCell>
                        <TableCell>{e.preferencia}</TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => setEspera((p) => p.filter((x) => x.id !== e.id))}><Trash2 className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="painel" className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-4 gap-3">
              <KPI label="Total agendamentos" value={String(dash.total)} />
              <KPI label="Confirmados" value={String(dash.confirmados)} />
              <KPI label="Concluídos" value={String(dash.concluidos)} accent />
              <KPI label="Ocupação do dia" value={`${dash.ocupacao}%`} />
            </div>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground">Receita estimada (concluídos)</div>
              <div className="text-2xl font-bold text-primary">{brl(dash.receita)}</div>
            </Card>
            <RoiSimulator presetKey="agenda" />
          </TabsContent>

          <TabsContent value="params" className="mt-4 space-y-4">
            <Card className="p-4 text-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">Parametrizações SIM/NÃO</div>
                  <p className="text-xs text-muted-foreground max-w-2xl">
                    Ative ou desative cada recurso e veja como a Agenda se adapta. Tudo aqui é DEMO —
                    comunicações enviadas terão a marca "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE".
                  </p>
                </div>
                <Badge variant="outline">DEMONSTRAÇÃO — VERSÃO TESTE</Badge>
              </div>
            </Card>
            {Array.from(new Set(AGENDA_PARAM_DEFS.map((p) => p.group))).map((group) => (
              <Card key={group} className="p-4 space-y-3">
                <div className="font-medium text-sm">{group}</div>
                {AGENDA_PARAM_DEFS.filter((p) => p.group === group).map((p) => (
                  <ParamToggle
                    key={p.key}
                    label={p.label}
                    hint={p.hint}
                    value={fullParams[p.key]}
                    onChange={(v) => setParam(p.key, v)}
                  />
                ))}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recursos" className="mt-4">
            <AgendaRecursos nicho={nichoDemo} />
          </TabsContent>

          <TabsContent value="fluxos" className="mt-4">
            <AgendaFluxosPanel nicho={nichoDemo} />
          </TabsContent>

          <TabsContent value="comunicacao" className="mt-4">
            <AgendaComunicacaoPanel nicho={nichoDemo} />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4 space-y-4">
            <AgendaCtaStrip lead={lead?.name} onOutrosModulos={() => setOutrosOpen(true)} />
            <AgendaDashboard nicho={nichoDemo} onGoTab={setAba} />
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <AgendaLogsPanel tick={logsTick} onClear={() => { clearAgendaLogs(); refreshLogs(); toast.success("Logs locais limpos."); }} />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <AgendaCtaStrip lead={lead?.name} onOutrosModulos={() => setOutrosOpen(true)} />
        </div>

        {/* Jornada guiada */}
        <AgendaJornadaGuiada
          open={jornadaOpen}
          onOpenChange={setJornadaOpen}
          onGoTab={setAba}
          onContratar={() => { if (typeof window !== "undefined") window.location.href = "/planos?modulo=agenda"; }}
          onOutrosModulos={() => { setJornadaOpen(false); setOutrosOpen(true); }}
        />

        {/* Outros módulos */}
        <OutrosModulosDialog open={outrosOpen} onOpenChange={setOutrosOpen} lead={lead?.name} />

        {/* Zerar dados — confirmação obrigatória */}
        <Dialog open={zerarOpen} onOpenChange={setZerarOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zerar dados da DEMO</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja zerar os dados desta demonstração? Apenas os dados fictícios da Agenda,
                neste navegador, serão apagados. Outros usuários não serão afetados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setZerarOpen(false)}>Cancelar</Button>
              <Button className="bg-gradient-primary" onClick={() => { resetAll(); setZerarOpen(false); }}>Zerar dados</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reagendar — confirmação obrigatória (drag-and-drop / mobile) */}
        <ReagendarDialog
          open={!!reagendar}
          original={reagendar}
          profs={profs}
          servs={servs}
          agds={agds}
          onClose={() => setReagendar(null)}
          onConfirm={(updated) => {
            setAgds((p) => p.map((a) => a.id === updated.id ? updated : a));
            toast.success("DEMONSTRAÇÃO — VERSÃO TESTE — Agendamento reagendado. Logs e comunicações simuladas.");
            setReagendar(null);
          }}
        />
      </main>
      <PublicFooter />
    </div>
  );
}

function AgendaLogsPanel({ tick, onClear }: { tick: number; onClear: () => void }) {
  const [filtroStatus, setFiltroStatus] = useState<string>("__all");
  const [filtroArea, setFiltroArea] = useState<string>("__all");
  const logs = useMemo<AgendaLogEntry[]>(() => listAgendaLogs(), [tick]);
  const areas = Array.from(new Set(logs.map((l) => l.area)));
  const filtered = logs.filter((l) =>
    (filtroStatus === "__all" || l.status === filtroStatus) &&
    (filtroArea === "__all" || l.area === filtroArea));

  return (
    <div className="space-y-3">
      <Card className="p-3 text-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="text-muted-foreground">
          Os logs registram cada ação importante realizada na Agenda, permitindo rastreabilidade, auditoria e melhor gestão da operação.
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Select value={filtroArea} onValueChange={setFiltroArea}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Área" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as áreas</SelectItem>
              {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os status</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="simulado_demo">Simulado — DEMO</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="falhou">Falhou</SelectItem>
              <SelectItem value="aguardando_credenciais">Aguardando credenciais</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={onClear}>Limpar logs</Button>
        </div>
      </Card>
      <Card className="p-0 overflow-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            Nenhum log ainda. Execute ações na Agenda (criar, cancelar, simular pagamento, etc.) e os registros aparecem aqui.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(l.dataHora).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs">{l.area}</TableCell>
                  <TableCell className="text-xs">{l.acao}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{l.status}</Badge></TableCell>
                  <TableCell className="text-xs">{l.ambiente}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[l.cliente && `cliente: ${l.cliente}`, l.profissional && `prof: ${l.profissional}`,
                      l.canal && `canal: ${l.canal}`, l.destinatario && `→ ${l.destinatario}`,
                      l.origem && `origem: ${l.origem}`, l.erro && `erro: ${l.erro}`]
                      .filter(Boolean).join(" • ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}


function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <Card className={`p-4 ${accent ? "border-primary/40" : ""}`}><div className="text-xs text-muted-foreground">{label}</div><div className={`text-2xl font-bold mt-1 ${accent ? "text-primary" : ""}`}>{value}</div></Card>;
}
function ParamToggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div><div className="font-medium text-sm">{label}</div><div className="text-xs text-muted-foreground">{hint}</div></div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
function NovoProf({ onCreate }: { onCreate: (p: Profissional) => void }) {
  const [f, setF] = useState({ nome: "", especialidade: "", cor: "#3b82f6" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Especialidade</Label><Input value={f.especialidade} onChange={(e) => setF({ ...f, especialidade: e.target.value })} /></div>
      <div><Label className="text-xs">Cor</Label><Input type="color" value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.nome} onClick={() => { onCreate({ id: uid("pr"), ...f }); setF({ nome: "", especialidade: "", cor: "#3b82f6" }); }}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
    </div>
  );
}
function NovoServ({ onCreate }: { onCreate: (s: Servico) => void }) {
  const [f, setF] = useState({ nome: "", duracao: 60, preco: 0 });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Duração (min)</Label><Input type="number" value={f.duracao} onChange={(e) => setF({ ...f, duracao: Number(e.target.value) })} /></div>
      <div><Label className="text-xs">Preço</Label><Input type="number" value={f.preco} onChange={(e) => setF({ ...f, preco: Number(e.target.value) })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.nome} onClick={() => { onCreate({ id: uid("sv"), ...f }); setF({ nome: "", duracao: 60, preco: 0 }); }}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
    </div>
  );
}
function NovoAgendamento({ profs, servs, onCreate, prefill, agds }: { profs: Profissional[]; servs: Servico[]; onCreate: (a: Agendamento) => void; prefill?: { cliente: string; telefone: string } | null; agds: Agendamento[] }) {
  const [f, setF] = useState({ profId: "", servicoId: "", cliente: "", telefone: "", data: new Date().toISOString().slice(0, 10), hora: "09:00" });
  const validate = useServerFn(validateAgendamento);
  useEffect(() => {
    if (prefill?.cliente) setF((prev) => ({ ...prev, cliente: prefill.cliente, telefone: prefill.telefone ?? "" }));
  }, [prefill?.cliente, prefill?.telefone]);

  const conflitos: ConflictAgd[] = useMemo(() => {
    if (!f.profId) return [];
    return findConflicts(
      agds.map((a) => ({ ...a, servicoNome: servs.find((s) => s.id === a.servicoId)?.nome })),
      f.profId,
      f.data,
      f.hora,
    );
  }, [agds, servs, f.profId, f.data, f.hora]);

  async function handleAgendar() {
    const profNome = profs.find((p) => p.id === f.profId)?.nome ?? "este profissional";
    const payloadAgds: ConflictAgd[] = agds.map((a) => ({ ...a, servicoNome: servs.find((s) => s.id === a.servicoId)?.nome }));

    // 1ª chamada: server function valida e BLOQUEIA double-booking sem confirmação explícita.
    try {
      await validate({ data: { agds: payloadAgds, profId: f.profId, profNome, data: f.data, hora: f.hora } });
    } catch (err: any) {
      const msg: string = err?.message ?? "Conflito de horário.";
      const ok = window.confirm(`${msg}\n\nDeseja agendar mesmo assim (gera double-booking)?`);
      if (!ok) {
        toast.error("Agendamento cancelado por conflito.");
        return;
      }
      // 2ª chamada: confirmação explícita server-side.
      try {
        await validate({ data: { agds: payloadAgds, profId: f.profId, profNome, data: f.data, hora: f.hora, allowDoubleBooking: true } });
        toast.warning("Atenção: double-booking criado e validado pelo servidor.");
      } catch {
        toast.error("Falha na validação do servidor.");
        return;
      }
    }

    onCreate({ id: uid("ag"), ...f, status: "confirmado" });
    setF({ ...f, cliente: "", telefone: "" });
    if (conflitos.length === 0) toast.success("Agendamento criado");
  }

  const profNomeAtual = profs.find((p) => p.id === f.profId)?.nome;

  return (
    <div className="grid sm:grid-cols-3 gap-2 items-end">
      <div><Label className="text-xs">Cliente</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
      <div><Label className="text-xs">Profissional</Label>
        <Select value={f.profId} onValueChange={(v) => setF({ ...f, profId: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>{profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Serviço</Label>
        <Select value={f.servicoId} onValueChange={(v) => setF({ ...f, servicoId: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>{servs.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Data</Label><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
      <div>
        <Label className="text-xs">Hora (qualquer horário)</Label>
        <Input type="time" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} />
      </div>
      {conflitos.length > 0 && f.profId && (
        <div className="sm:col-span-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="font-semibold">⚠ Conflito de horário detectado</div>
          <div><strong>Profissional:</strong> {profNomeAtual}</div>
          <div><strong>Data:</strong> {f.data} • <strong>Horário:</strong> {f.hora}</div>
          <div><strong>Já agendados ({conflitos.length}):</strong></div>
          <ul className="list-disc pl-5 space-y-0.5">
            {conflitos.map((c) => (
              <li key={c.id}>
                {c.cliente}
                {c.servicoNome ? ` — ${c.servicoNome}` : ""}{" "}
                <span className="opacity-70">({c.status})</span>
              </li>
            ))}
          </ul>
          <div className="opacity-80 pt-1">O servidor bloqueará o agendamento; será necessário confirmar explicitamente para gerar double-booking.</div>
        </div>
      )}
      <Button className="sm:col-span-3 bg-gradient-primary" disabled={!f.cliente || !f.profId || !f.servicoId} onClick={handleAgendar}>
        <Plus className="w-4 h-4 mr-1" />Agendar
      </Button>
    </div>
  );
}

function NovaEspera({ servs, onCreate }: { servs: Servico[]; onCreate: (e: Espera) => void }) {
  const [f, setF] = useState({ cliente: "", telefone: "", servicoId: "", preferencia: "" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Cliente</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
      <div><Label className="text-xs">Serviço</Label>
        <Select value={f.servicoId} onValueChange={(v) => setF({ ...f, servicoId: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>{servs.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Preferência</Label><Input value={f.preferencia} onChange={(e) => setF({ ...f, preferencia: e.target.value })} /></div>
      <Button className="sm:col-span-4 bg-gradient-primary" disabled={!f.cliente || !f.servicoId} onClick={() => { onCreate({ id: uid("es"), ...f }); setF({ cliente: "", telefone: "", servicoId: "", preferencia: "" }); }}><Plus className="w-4 h-4 mr-1" />Adicionar à fila</Button>
    </div>
  );
}

function ReagendarDialog({
  open, original, profs, servs, agds, onClose, onConfirm,
}: {
  open: boolean;
  original: Agendamento | null;
  profs: Profissional[];
  servs: Servico[];
  agds: Agendamento[];
  onClose: () => void;
  onConfirm: (a: Agendamento) => void;
}) {
  const [f, setF] = useState<Agendamento | null>(null);
  useEffect(() => { setF(original); }, [original?.id]);
  if (!original || !f) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  const conflitos = agds.filter((a) =>
    a.id !== f.id && a.status !== "cancelado" &&
    a.profId === f.profId && a.data === f.data && a.hora === f.hora);

  const profAntes = profs.find((p) => p.id === original.profId)?.nome;
  const profDepois = profs.find((p) => p.id === f.profId)?.nome;
  const servNome = servs.find((s) => s.id === f.servicoId)?.nome;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmar alteração de horário?</DialogTitle>
          <DialogDescription>DEMONSTRAÇÃO — VERSÃO TESTE — comunicações serão simuladas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div><strong>Cliente:</strong> {f.cliente}</div>
          <div><strong>Serviço:</strong> {servNome ?? "—"}</div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground">Antes</div>
              <div>{original.data} {original.hora}</div>
              <div className="text-xs">{profAntes}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Depois</div>
              <div className="flex gap-1">
                <Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} className="h-8" />
                <Input type="time" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} className="h-8 w-24" />
              </div>
              <Select value={f.profId} onValueChange={(v) => setF({ ...f, profId: v })}>
                <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {conflitos.length > 0 && (
            <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 text-xs">
              ⚠ Este horário possui conflito com outro agendamento ou bloqueio.
              <div className="mt-1">{conflitos.map((c) => c.cliente).join(", ")}</div>
            </div>
          )}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Comunicações que serão enviadas (simulado): cliente, profissional, recepção/gestão.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button className="bg-gradient-primary" onClick={() => onConfirm(f)}>Confirmar alteração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
