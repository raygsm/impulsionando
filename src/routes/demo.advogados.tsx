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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import {
  Scale,
  Gavel,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Users,
  Briefcase,
  Wallet,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid } from "@/lib/demoSandbox";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import {
  createAdvogadosMock,
  safeMock,
  type AdvogadosProcessoStatus,
  type AdvogadosAudienciaTipo,
  type AdvogadosTarefaPrioridade,
} from "@/lib/demoModuleMocks";

export const Route = createFileRoute("/demo/advogados")({
  head: () => ({
    meta: [
      { title: "Demo — Advogados & Escritórios Jurídicos — Impulsionando" },
      {
        name: "description",
        content:
          "Teste a gestão de processos, prazos, audiências, contratos, honorários e portal do cliente para escritórios jurídicos com dados fictícios.",
      },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/advogados" }],
  }),
  component: DemoAdvogados,
});

type Advogado = { id: string; nome: string; oab: string; area: string; taxaHora: number };
type Cliente = { id: string; tipo: "PF" | "PJ"; nome: string; documento: string; email: string; telefone: string; segmento: string };
type Processo = {
  id: string;
  numero: string;
  clienteId: string;
  advogadoId: string;
  area: string;
  vara: string;
  objeto: string;
  valorCausa: number;
  status: AdvogadosProcessoStatus;
  faseAtual: string;
  proximoPrazo: string;
  sigiloso: boolean;
  criadoEm: string;
};
type Audiencia = { id: string; processoId: string; tipo: AdvogadosAudienciaTipo; data: string; local: string; responsavelId: string; confirmado: boolean };
type Prazo = { id: string; processoId: string; descricao: string; vencimento: string; prioridade: AdvogadosTarefaPrioridade; concluido: boolean; responsavelId: string };
type Contrato = { id: string; clienteId: string; tipo: string; valorFixo: number; percentualExito: number; status: string; assinadoEm: string };
type Honorario = { id: string; processoId: string; descricao: string; valor: number; vencimento: string; status: "pago" | "pendente" | "previsto" | "atrasado" };
type Documento = { id: string; processoId: string; nome: string; tipo: string; tamanhoKb: number };
type Params = {
  lembretePrazo48h: boolean;
  lembretePrazo24h: boolean;
  bloqueioPrazoVencido: boolean;
  sigiloPorPapel: boolean;
  timesheetObrigatorio: boolean;
  integraTribunais: boolean;
  lgpd: boolean;
  portalCliente: boolean;
};

const FALLBACK = createAdvogadosMock();

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DemoAdvogados() {
  const [advogados, setAdvogados, resetAdv] = useDemoState<Advogado[]>("adv.advogados", []);
  const [clientes, setClientes, resetCli] = useDemoState<Cliente[]>("adv.clientes", []);
  const [processos, setProcessos, resetProc] = useDemoState<Processo[]>("adv.processos", []);
  const [audiencias, setAudiencias, resetAud] = useDemoState<Audiencia[]>("adv.audiencias", []);
  const [prazos, setPrazos, resetPraz] = useDemoState<Prazo[]>("adv.prazos", []);
  const [contratos, setContratos, resetCon] = useDemoState<Contrato[]>("adv.contratos", []);
  const [honorarios, setHonorarios, resetHon] = useDemoState<Honorario[]>("adv.honorarios", []);
  const [documentos, setDocumentos, resetDoc] = useDemoState<Documento[]>("adv.documentos", []);
  const [params, setParams, resetParams] = useDemoState<Params>("adv.params", FALLBACK.params);
  const [aba, setAba] = useState("dashboard");

  useEffect(() => {
    const marker = "advogados:v1";
    const current = typeof window === "undefined" ? marker : window.localStorage.getItem("imp.demo.mock.advogados");
    if (current === marker) return;
    const mock = safeMock(() => createAdvogadosMock(), FALLBACK, "advogados");
    setAdvogados(mock.advogados);
    setClientes(mock.clientes);
    setProcessos(mock.processos);
    setAudiencias(mock.audiencias);
    setPrazos(mock.prazos);
    setContratos(mock.contratos);
    setHonorarios(mock.honorarios);
    setDocumentos(mock.documentos);
    setParams(mock.params);
    if (typeof window !== "undefined") window.localStorage.setItem("imp.demo.mock.advogados", marker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dash = useMemo(() => {
    const ativos = processos.filter((p) => p.status === "ativo").length;
    const ganhos = processos.filter((p) => p.status === "ganho").length;
    const valorCarteira = processos.reduce((s, p) => s + p.valorCausa, 0);
    const prazos48h = prazos.filter((p) => {
      if (p.concluido) return false;
      const diff = (new Date(p.vencimento).getTime() - Date.now()) / 36e5;
      return diff <= 48 && diff >= -24;
    });
    const audProx = audiencias.filter((a) => new Date(a.data).getTime() >= Date.now() - 36e5).length;
    const honorariosAReceber = honorarios.filter((h) => h.status === "pendente" || h.status === "previsto").reduce((s, h) => s + h.valor, 0);
    return { ativos, ganhos, valorCarteira, prazos48h, audProx, honorariosAReceber, totalProcessos: processos.length };
  }, [processos, prazos, audiencias, honorarios]);

  function seed() {
    const mock = safeMock(() => createAdvogadosMock(), FALLBACK, "advogados");
    setAdvogados(mock.advogados);
    setClientes(mock.clientes);
    setProcessos(mock.processos);
    setAudiencias(mock.audiencias);
    setPrazos(mock.prazos);
    setContratos(mock.contratos);
    setHonorarios(mock.honorarios);
    setDocumentos(mock.documentos);
    setParams(mock.params);
    toast.success("Dados fictícios do escritório carregados.");
  }

  function resetAll() {
    resetAdv(); resetCli(); resetProc(); resetAud(); resetPraz(); resetCon(); resetHon(); resetDoc(); resetParams();
    toast.message("Demonstração zerada.");
  }

  function togglePrazo(id: string) {
    setPrazos((p) => p.map((x) => x.id === id ? { ...x, concluido: !x.concluido } : x));
  }

  function novoProcesso() {
    if (!advogados.length || !clientes.length) {
      toast.error("Cadastre advogados e clientes antes de criar um processo.");
      return;
    }
    const p: Processo = {
      id: uid("pr"),
      numero: `000${Math.floor(Math.random() * 9999)}-00.2025.8.26.0100`,
      clienteId: clientes[0].id,
      advogadoId: advogados[0].id,
      area: "Cível",
      vara: "Vara a definir",
      objeto: "Novo processo (demonstração)",
      valorCausa: 50000,
      status: "ativo",
      faseAtual: "Distribuição",
      proximoPrazo: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
      sigiloso: false,
      criadoEm: new Date().toISOString(),
    };
    setProcessos((arr) => [p, ...arr]);
    toast.success("Processo distribuído (demo).");
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner current="advogados" />
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge className="bg-gradient-primary">Demo interativa • dados fictícios</Badge>
              <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-400">
                DEMONSTRAÇÃO — VERSÃO TESTE
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              <Scale className="w-8 h-8 text-primary" /> Advogados & Escritórios Jurídicos
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Transforme prazos, clientes e honorários em gestão real. Carteira de processos, prazos com
              lembrete e bloqueio automático, audiências, contratos fixo + êxito, honorários, documentos
              sigilosos e portal do cliente — tudo em conformidade com a LGPD.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <DemoContractCTA
              slug="advogados"
              moduleName="Advogados & Escritórios Jurídicos"
              moduleDescription="Organize seu escritório jurídico agora: gestão completa de processos, prazos, audiências, contratos, honorários e portal do cliente."
              amountReference={297}
              features={[
                "Processos por área e vara",
                "Prazos com lembrete e bloqueio",
                "Audiências e calendário forense",
                "Contratos fixo + êxito",
                "Honorários e timesheet",
                "Portal do cliente com sigilo por papel",
              ]}
              testRoute="/demo/advogados"
              size="default"
              variant="default"
            />
            <Button variant="outline" onClick={seed}><Sparkles className="w-4 h-4 mr-1" />Popular demo</Button>
            <Button variant="ghost" onClick={resetAll}><RotateCcw className="w-4 h-4 mr-1" />Zerar dados da DEMO</Button>
          </div>
        </div>

        <Tabs value={aba} onValueChange={setAba} className="mt-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard"><Gavel className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
            <TabsTrigger value="processos"><Briefcase className="w-4 h-4 mr-1" />Processos</TabsTrigger>
            <TabsTrigger value="prazos"><AlertTriangle className="w-4 h-4 mr-1" />Prazos</TabsTrigger>
            <TabsTrigger value="audiencias"><Calendar className="w-4 h-4 mr-1" />Audiências</TabsTrigger>
            <TabsTrigger value="clientes"><Users className="w-4 h-4 mr-1" />Clientes</TabsTrigger>
            <TabsTrigger value="contratos"><FileText className="w-4 h-4 mr-1" />Contratos</TabsTrigger>
            <TabsTrigger value="honorarios"><Wallet className="w-4 h-4 mr-1" />Honorários</TabsTrigger>
            <TabsTrigger value="documentos"><ShieldCheck className="w-4 h-4 mr-1" />Documentos</TabsTrigger>
            <TabsTrigger value="params"><Bell className="w-4 h-4 mr-1" />Parametrização</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Processos ativos</div>
              <div className="text-3xl font-bold mt-1">{dash.ativos}</div>
              <div className="text-xs text-muted-foreground mt-1">{dash.totalProcessos} no total</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Valor da carteira</div>
              <div className="text-3xl font-bold mt-1">{brl(dash.valorCarteira)}</div>
            </Card>
            <Card className="p-4 border-amber-500/40 bg-amber-500/5">
              <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Prazos críticos (48h)
              </div>
              <div className="text-3xl font-bold mt-1">{dash.prazos48h.length}</div>
              <div className="text-xs text-muted-foreground mt-1">com lembrete e bloqueio</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Honorários a receber</div>
              <div className="text-3xl font-bold mt-1">{brl(dash.honorariosAReceber)}</div>
              <div className="text-xs text-muted-foreground mt-1">{dash.audProx} audiências marcadas</div>
            </Card>
          </TabsContent>

          <TabsContent value="processos" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={novoProcesso}><Plus className="w-4 h-4 mr-1" />Distribuir processo</Button>
            </div>
            <Card className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Área / Vara</TableHead>
                    <TableHead>Objeto</TableHead>
                    <TableHead>Valor da causa</TableHead>
                    <TableHead>Próximo prazo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processos.map((p) => {
                    const cli = clientes.find((c) => c.id === p.clienteId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">
                          {p.numero}
                          {p.sigiloso && <Badge variant="outline" className="ml-2 text-[10px]">sigiloso</Badge>}
                        </TableCell>
                        <TableCell>{cli?.nome ?? "—"}</TableCell>
                        <TableCell className="text-xs">{p.area}<br /><span className="text-muted-foreground">{p.vara}</span></TableCell>
                        <TableCell className="text-xs">{p.objeto}</TableCell>
                        <TableCell>{brl(p.valorCausa)}</TableCell>
                        <TableCell className="text-xs">{p.proximoPrazo}</TableCell>
                        <TableCell>
                          <Select value={p.status} onValueChange={(v) => setProcessos((arr) => arr.map((x) => x.id === p.id ? { ...x, status: v as AdvogadosProcessoStatus } : x))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="acordo">Acordo</SelectItem>
                              <SelectItem value="ganho">Ganho</SelectItem>
                              <SelectItem value="perdido">Perdido</SelectItem>
                              <SelectItem value="arquivado">Arquivado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="prazos" className="mt-4 space-y-3">
            <Card className="p-3">
              {prazos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem prazos cadastrados.</p>
              ) : (
                <ul className="divide-y">
                  {prazos.map((p) => {
                    const proc = processos.find((x) => x.id === p.processoId);
                    const advr = advogados.find((a) => a.id === p.responsavelId);
                    const vencido = new Date(p.vencimento).getTime() < Date.now() && !p.concluido;
                    return (
                      <li key={p.id} className="flex items-center gap-3 py-3">
                        <Switch checked={p.concluido} onCheckedChange={() => togglePrazo(p.id)} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${p.concluido ? "line-through text-muted-foreground" : ""}`}>{p.descricao}</div>
                          <div className="text-xs text-muted-foreground">
                            {proc?.numero ?? "—"} • {advr?.nome ?? "—"} • vence {p.vencimento}
                          </div>
                        </div>
                        <Badge variant={vencido ? "destructive" : p.prioridade === "urgente" ? "default" : "outline"} className="text-[10px]">
                          {vencido ? "VENCIDO" : p.prioridade.toUpperCase()}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="audiencias" className="mt-4 space-y-3">
            <Card className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audiencias.map((a) => {
                    const proc = processos.find((p) => p.id === a.processoId);
                    const advr = advogados.find((x) => x.id === a.responsavelId);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{a.data}</TableCell>
                        <TableCell className="capitalize">{a.tipo}</TableCell>
                        <TableCell className="font-mono text-xs">{proc?.numero ?? "—"}</TableCell>
                        <TableCell className="text-xs">{a.local}</TableCell>
                        <TableCell className="text-xs">{advr?.nome ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={a.confirmado ? "default" : "outline"} className="text-[10px]">
                            {a.confirmado ? "confirmada" : "a confirmar"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="clientes" className="mt-4">
            <Card className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Segmento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{c.documento}</TableCell>
                      <TableCell className="text-xs">{c.email}</TableCell>
                      <TableCell className="text-xs">{c.telefone}</TableCell>
                      <TableCell className="text-xs">{c.segmento}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="contratos" className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contratos.map((c) => {
              const cli = clientes.find((x) => x.id === c.clienteId);
              return (
                <Card key={c.id} className="p-4">
                  <div className="text-xs text-muted-foreground">{c.tipo}</div>
                  <div className="font-semibold mt-1">{cli?.nome ?? "—"}</div>
                  <div className="text-sm mt-2">Fixo: <strong>{brl(c.valorFixo)}</strong></div>
                  <div className="text-sm">Êxito: <strong>{c.percentualExito}%</strong></div>
                  <div className="text-xs text-muted-foreground mt-2">Assinado em {c.assinadoEm.slice(0, 10)}</div>
                  <Badge className="mt-2" variant="outline">{c.status}</Badge>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="honorarios" className="mt-4">
            <Card className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {honorarios.map((h) => {
                    const proc = processos.find((p) => p.id === h.processoId);
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs">{h.descricao}</TableCell>
                        <TableCell className="font-mono text-xs">{proc?.numero ?? "—"}</TableCell>
                        <TableCell>{brl(h.valor)}</TableCell>
                        <TableCell className="text-xs">{h.vencimento}</TableCell>
                        <TableCell>
                          <Badge variant={h.status === "pago" ? "default" : h.status === "atrasado" ? "destructive" : "outline"} className="text-[10px] capitalize">
                            {h.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documentos.map((d) => {
              const proc = processos.find((p) => p.id === d.processoId);
              return (
                <Card key={d.id} className="p-4">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{d.nome}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {d.tipo} • {(d.tamanhoKb / 1024).toFixed(2)} MB
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{proc?.numero ?? "—"}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="params" className="mt-4 grid sm:grid-cols-2 gap-3">
            {([
              ["lembretePrazo48h", "Lembrete automático 48h antes do prazo", "Dispara aviso ao responsável 48 horas antes do vencimento — evita perda de prazo processual."],
              ["lembretePrazo24h", "Lembrete automático 24h antes do prazo", "Segundo aviso 24 horas antes do vencimento, com escalonamento ao sócio responsável."],
              ["bloqueioPrazoVencido", "Bloquear edição após prazo vencido", "Após o vencimento, o processo é congelado e exige justificativa registrada para nova alteração."],
              ["sigiloPorPapel", "Sigilo por papel (perfil/grupo)", "Apenas advogados com o papel autorizado visualizam processos sigilosos e documentos restritos."],
              ["timesheetObrigatorio", "Timesheet obrigatório por atividade", "Cada movimentação exige apontamento de horas para cobrança correta de honorários por hora."],
              ["integraTribunais", "Integração com tribunais (consulta processual)", "Sincroniza movimentações e publicações oficiais dos tribunais diretamente no processo."],
              ["lgpd", "Conformidade LGPD nas comunicações", "Comunicações com clientes registram base legal, consentimento e log de acesso a dados pessoais."],
              ["portalCliente", "Portal do cliente com acompanhamento", "Cliente acessa andamento do processo, audiências e honorários com sigilo por papel."],
            ] as const).map(([k, label, help]) => (
              <Card key={k} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    {label}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Ajuda">
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">{help}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{params[k] ? "SIM — ativo" : "NÃO — inativo"}</div>
                </div>
                <Switch checked={params[k]} onCheckedChange={(v) => setParams((p) => ({ ...p, [k]: v }))} />
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-10 rounded-xl border bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold">Organize seu escritório jurídico agora</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Teste a gestão completa do seu escritório: processos, prazos, audiências, contratos e honorários
            em um só lugar, com sigilo por papel e conformidade LGPD.
          </p>
          <div className="mt-5 flex justify-center flex-wrap gap-2">
            <DemoContractCTA
              slug="advogados"
              moduleName="Advogados & Escritórios Jurídicos"
              moduleDescription="Contratar módulo jurídico — gestão completa para escritórios de advocacia."
              amountReference={297}
              features={[
                "Processos por área e vara",
                "Prazos com lembrete e bloqueio",
                "Audiências e calendário forense",
                "Contratos fixo + êxito",
                "Honorários e timesheet",
                "Portal do cliente com sigilo por papel",
              ]}
              testRoute="/demo/advogados"
              size="default"
              variant="default"
            />
          </div>
        </div>

        <div className="mt-10">
          <RoiSimulator />
        </div>

      </main>
      <PublicFooter />
    </div>
    </TooltipProvider>
  );
}
