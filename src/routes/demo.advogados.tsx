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
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
  Mail,
  Bot,
  Activity,
  Plug,
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
type IntegracaoStatus =
  | "nao_configurada"
  | "aguardando_credenciais"
  | "em_analise"
  | "ativa"
  | "pausada"
  | "erro_auth"
  | "erro_sync"
  | "aguardando_autorizacao"
  | "desativada";
type Integracao = {
  id: string;
  nome: string;
  tipo: string;
  status: IntegracaoStatus;
  escritorioVinculado: string;
  responsavel: string;
  ultimaSync: string | null;
  proximaSync: string | null;
  processosMonitorados: number;
  errosSync: number;
  observacao: string;
};
type MovimentacaoTipo =
  | "publicacao" | "intimacao" | "despacho" | "decisao" | "sentenca" | "acordao"
  | "certidao" | "peticao_juntada" | "prazo_aberto" | "audiencia_designada"
  | "audiencia_remarcada" | "audiencia_cancelada" | "pericia_designada"
  | "expedicao_documento" | "arquivamento" | "baixa" | "acordo" | "execucao" | "outro";
type MovimentacaoStatusRevisao =
  | "nova" | "aguardando_revisao" | "revisada" | "aprovada_envio"
  | "enviada_cliente" | "ocultada_cliente" | "requer_acao" | "prazo_criado" | "arquivada";
type Movimentacao = {
  id: string;
  processoId: string;
  clienteId: string;
  advogadoId: string;
  dataMovimentacao: string;
  dataCaptura: string;
  fonte: string;
  tipo: MovimentacaoTipo;
  textoOriginal: string;
  resumoInterno: string;
  resumoCliente: string;
  statusRevisao: MovimentacaoStatusRevisao;
  notificarCliente: boolean;
  clienteNotificado: boolean;
  canalNotificacao: null | "whatsapp" | "email";
  dataEnvio: string | null;
  possivelPrazo: boolean;
};
type Alerta = {
  id: string;
  advogadoId: string;
  tipo: "nova_movimentacao" | "sentenca" | "audiencia" | "intimacao" | "revisar";
  mensagem: string;
  criadoEm: string;
  lido: boolean;
};
type Params = {
  lembretePrazo48h: boolean;
  lembretePrazo24h: boolean;
  bloqueioPrazoVencido: boolean;
  sigiloPorPapel: boolean;
  timesheetObrigatorio: boolean;
  integraTribunais: boolean;
  lgpd: boolean;
  portalCliente: boolean;
  integracoesAtivas: boolean;
  integracaoJusbrasil: boolean;
  integracaoPublicacoes: boolean;
  integracaoTribunais: boolean;
  importacaoManual: boolean;
  alertaAdvogado: boolean;
  avisarClienteAuto: boolean;
  exigirRevisaoAdvogado: boolean;
  avisoWhatsapp: boolean;
  avisoEmail: boolean;
  resumoIA: boolean;
  aprovacaoHumanaIA: boolean;
  logComunicacao: boolean;
  exibirMovNaAreaCliente: boolean;
  ocultarMovSensiveis: boolean;
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
  const [integracoes, setIntegracoes, resetInt] = useDemoState<Integracao[]>("adv.integracoes", []);
  const [movimentacoes, setMovimentacoes, resetMov] = useDemoState<Movimentacao[]>("adv.movimentacoes", []);
  const [alertas, setAlertas, resetAlt] = useDemoState<Alerta[]>("adv.alertas", []);
  const [params, setParams, resetParams] = useDemoState<Params>("adv.params", FALLBACK.params);
  const [aba, setAba] = useState("dashboard");

  useEffect(() => {
    const marker = "advogados:v2";
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
    setIntegracoes(mock.integracoes ?? []);
    setMovimentacoes(mock.movimentacoes ?? []);
    setAlertas(mock.alertas ?? []);
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
    const movPendRev = movimentacoes.filter((m) => m.statusRevisao === "aguardando_revisao" || m.statusRevisao === "nova").length;
    const movEnviadas = movimentacoes.filter((m) => m.clienteNotificado).length;
    const movOcultas = movimentacoes.filter((m) => m.statusRevisao === "ocultada_cliente").length;
    const movPrazo = movimentacoes.filter((m) => m.possivelPrazo).length;
    const intErros = integracoes.filter((i) => i.status === "erro_auth" || i.status === "erro_sync").length;
    const ultimaSync = integracoes.map((i) => i.ultimaSync).filter(Boolean).sort().slice(-1)[0] ?? null;
    return {
      ativos, ganhos, valorCarteira, prazos48h, audProx, honorariosAReceber,
      totalProcessos: processos.length,
      movTotal: movimentacoes.length, movPendRev, movEnviadas, movOcultas, movPrazo,
      intErros, ultimaSync,
    };
  }, [processos, prazos, audiencias, honorarios, movimentacoes, integracoes]);

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
    setIntegracoes(mock.integracoes ?? []);
    setMovimentacoes(mock.movimentacoes ?? []);
    setAlertas(mock.alertas ?? []);
    setParams(mock.params);
    toast.success("Dados fictícios do escritório carregados.");
  }

  function resetAll() {
    resetAdv(); resetCli(); resetProc(); resetAud(); resetPraz(); resetCon();
    resetHon(); resetDoc(); resetInt(); resetMov(); resetAlt(); resetParams();
    toast.message("Demonstração zerada.");
  }

  // ===== Ações de Integrações Jurídicas =====
  function testarIntegracao(i: Integracao) {
    if (i.status === "aguardando_credenciais" || i.status === "aguardando_autorizacao") {
      toast.message("Integração preparada — aguardando credenciais externas ou autorização da plataforma jurídica contratada pelo escritório.");
      return;
    }
    toast.success(`Conexão OK com "${i.nome}" (DEMO).`);
  }
  function sincronizarAgora(i: Integracao) {
    if (i.status !== "ativa") {
      toast.message("Integração não está ativa — configure credenciais antes de sincronizar.");
      return;
    }
    const now = new Date().toISOString();
    setIntegracoes((arr) => arr.map((x) => x.id === i.id ? { ...x, ultimaSync: now } : x));
    toast.success(`Sincronização DEMO concluída em "${i.nome}".`);
  }

  // ===== Ações de Movimentações =====
  function gerarResumoIA(m: Movimentacao) {
    if (!params.resumoIA) { toast.error("Resumo por IA está desativado nas parametrizações."); return; }
    const resumo = `Resumo gerado por IA (DEMO) — ${m.textoOriginal.slice(0, 120)}${m.textoOriginal.length > 120 ? "…" : ""}`;
    setMovimentacoes((arr) => arr.map((x) => x.id === m.id ? { ...x, resumoCliente: x.resumoCliente || resumo } : x));
    toast.message("Resumo gerado por IA apenas para apoio interno. O advogado responsável deve revisar antes de liberar ao cliente.");
  }
  function revisarMov(m: Movimentacao) {
    setMovimentacoes((arr) => arr.map((x) => x.id === m.id ? { ...x, statusRevisao: "revisada" } : x));
    toast.success("Movimentação marcada como revisada.");
  }
  function aprovarEnvio(m: Movimentacao) {
    if (params.exigirRevisaoAdvogado && m.statusRevisao === "aguardando_revisao") {
      toast.error("Revisão obrigatória — marque como revisada antes de aprovar o envio.");
      return;
    }
    setMovimentacoes((arr) => arr.map((x) => x.id === m.id ? { ...x, statusRevisao: "aprovada_envio", notificarCliente: true } : x));
    toast.success("Aprovada para envio ao cliente.");
  }
  function ocultarDoCliente(m: Movimentacao) {
    setMovimentacoes((arr) => arr.map((x) => x.id === m.id ? { ...x, statusRevisao: "ocultada_cliente", notificarCliente: false } : x));
    toast.message("Movimentação ocultada do cliente.");
  }
  function enviarAvisoTeste(m: Movimentacao) {
    if (!params.avisarClienteAuto && m.statusRevisao !== "aprovada_envio") {
      toast.message("Envio automático desativado — aprove o envio antes de notificar o cliente.");
      return;
    }
    const canal: "whatsapp" | "email" = params.avisoWhatsapp ? "whatsapp" : params.avisoEmail ? "email" : "whatsapp";
    setMovimentacoes((arr) => arr.map((x) => x.id === m.id ? {
      ...x, clienteNotificado: true, canalNotificacao: canal, dataEnvio: new Date().toISOString(), statusRevisao: "enviada_cliente",
    } : x));
    toast.success("TESTE — DEMONSTRAÇÃO — VERSÃO TESTE. Simulação de aviso processual enviada por " + canal + ".");
  }
  function criarPrazoDaMov(m: Movimentacao) {
    const novo: Prazo = {
      id: uid("pz"),
      processoId: m.processoId,
      descricao: `Prazo gerado a partir de movimentação (${m.tipo})`,
      vencimento: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
      prioridade: "alta",
      concluido: false,
      responsavelId: m.advogadoId,
    };
    setPrazos((arr) => [novo, ...arr]);
    setMovimentacoes((arr) => arr.map((x) => x.id === m.id ? { ...x, statusRevisao: "prazo_criado" } : x));
    toast.success("Prazo criado a partir da movimentação.");
  }
  function marcarAlertaLido(id: string) {
    setAlertas((arr) => arr.map((a) => a.id === id ? { ...a, lido: true } : a));
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
            <TabsTrigger value="integracoes"><Plug className="w-4 h-4 mr-1" />Integrações</TabsTrigger>
            <TabsTrigger value="movimentacoes"><Activity className="w-4 h-4 mr-1" />Movimentações</TabsTrigger>
            <TabsTrigger value="alertas"><Bell className="w-4 h-4 mr-1" />Alertas{alertas.filter((a) => !a.lido).length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[9px]">{alertas.filter((a) => !a.lido).length}</Badge>}</TabsTrigger>
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
            <Card className="p-4 border-primary/30 bg-primary/5">
              <div className="text-xs text-primary flex items-center gap-1"><Activity className="w-3 h-3" /> Movimentações novas</div>
              <div className="text-3xl font-bold mt-1">{dash.movTotal}</div>
              <div className="text-xs text-muted-foreground mt-1">{dash.movPrazo} com possível prazo</div>
            </Card>
            <Card className="p-4 border-amber-500/40 bg-amber-500/5">
              <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Aguardando revisão</div>
              <div className="text-3xl font-bold mt-1">{dash.movPendRev}</div>
              <div className="text-xs text-muted-foreground mt-1">{dash.movOcultas} ocultadas do cliente</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Send className="w-3 h-3" /> Clientes avisados</div>
              <div className="text-3xl font-bold mt-1">{dash.movEnviadas}</div>
              <div className="text-xs text-muted-foreground mt-1">por WhatsApp / e-mail (TESTE)</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Plug className="w-3 h-3" /> Integrações</div>
              <div className="text-3xl font-bold mt-1">{integracoes.filter((i) => i.status === "ativa").length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {dash.intErros > 0 ? `${dash.intErros} com erro` : "sem erros"}
                {dash.ultimaSync ? ` • última sync ${dash.ultimaSync.slice(0, 10)}` : " • aguardando sync"}
              </div>
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
                    const horas = (new Date(p.vencimento).getTime() - Date.now()) / 36e5;
                    const vencido = horas < 0 && !p.concluido;
                    const critico48 = !vencido && !p.concluido && horas <= 48;
                    return (
                      <li
                        key={p.id}
                        className={`flex items-center gap-3 py-3 px-2 -mx-2 rounded-md ${
                          vencido ? "bg-destructive/10 border-l-4 border-destructive" :
                          critico48 ? "bg-amber-500/10 border-l-4 border-amber-500" : ""
                        }`}
                      >
                        <Switch checked={p.concluido} onCheckedChange={() => togglePrazo(p.id)} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${p.concluido ? "line-through text-muted-foreground" : ""}`}>{p.descricao}</div>
                          <div className="text-xs text-muted-foreground">
                            {proc?.numero ?? "—"} • {advr?.nome ?? "—"} • vence {p.vencimento}
                            {critico48 && <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">• {Math.max(0, Math.round(horas))}h restantes</span>}
                          </div>
                        </div>
                        <Badge
                          variant={vencido ? "destructive" : p.prioridade === "urgente" ? "default" : "outline"}
                          className={`text-[10px] ${critico48 && !vencido ? "border-amber-500 text-amber-700 dark:text-amber-400" : ""}`}
                        >
                          {vencido ? "VENCIDO" : critico48 ? "CRÍTICO 48H" : p.prioridade.toUpperCase()}
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

          {/* ===== INTEGRAÇÕES JURÍDICAS ===== */}
          <TabsContent value="integracoes" className="mt-4 space-y-3">
            <Card className="p-4 border-amber-500/40 bg-amber-500/5 text-sm">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Integrações Jurídicas e Andamentos Processuais</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Movimentações processuais podem conter informações sensíveis. O escritório define o que será
                    comunicado ao cliente e quem pode revisar ou liberar cada atualização. Integrações reais
                    dependem de credenciais externas ou autorização da plataforma jurídica contratada.
                  </p>
                </div>
              </div>
            </Card>
            <div className="grid sm:grid-cols-2 gap-3">
              {integracoes.map((i) => {
                const aguarda = i.status === "aguardando_credenciais" || i.status === "aguardando_autorizacao";
                const erro = i.status === "erro_auth" || i.status === "erro_sync";
                return (
                  <Card key={i.id} className={`p-4 ${aguarda ? "border-amber-500/40" : erro ? "border-destructive/40" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold flex items-center gap-2"><Plug className="w-4 h-4 text-primary" /> {i.nome}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{i.tipo} • Resp.: {i.responsavel}</div>
                      </div>
                      <Badge variant={i.status === "ativa" ? "default" : erro ? "destructive" : "outline"} className="text-[10px] whitespace-nowrap">
                        {i.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-xs mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                      <div><span className="text-muted-foreground">Escritório:</span> {i.escritorioVinculado}</div>
                      <div><span className="text-muted-foreground">Processos:</span> {i.processosMonitorados}</div>
                      <div><span className="text-muted-foreground">Última sync:</span> {i.ultimaSync ? i.ultimaSync.slice(0, 16).replace("T", " ") : "—"}</div>
                      <div><span className="text-muted-foreground">Próxima:</span> {i.proximaSync ? i.proximaSync.slice(0, 10) : "—"}</div>
                      <div><span className="text-muted-foreground">Erros:</span> {i.errosSync}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{i.observacao}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => testarIntegracao(i)}><Zap className="w-3 h-3 mr-1" />Testar</Button>
                      <Button size="sm" variant="outline" onClick={() => sincronizarAgora(i)} disabled={i.status !== "ativa"}><RefreshCw className="w-3 h-3 mr-1" />Sincronizar agora</Button>
                      {aguarda && <Badge variant="outline" className="text-[10px] border-amber-500/60 text-amber-700 dark:text-amber-400">Aguardando credenciais externas</Badge>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ===== MOVIMENTAÇÕES PROCESSUAIS ===== */}
          <TabsContent value="movimentacoes" className="mt-4 space-y-3">
            <Card className="p-3 text-xs text-muted-foreground border-primary/30 bg-primary/5">
              <strong className="text-foreground">TESTE — DEMONSTRAÇÃO — VERSÃO TESTE.</strong> Esta é uma simulação
              de aviso processual. Nenhuma movimentação real foi consultada ou enviada. Algumas movimentações podem
              exigir interpretação jurídica — por segurança, o escritório pode exigir revisão do advogado antes de
              avisar o cliente.
            </Card>
            {movimentacoes.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground text-center">Sem movimentações registradas.</Card>
            ) : (
              <div className="space-y-3">
                {movimentacoes.map((m) => {
                  const proc = processos.find((p) => p.id === m.processoId);
                  const cli = clientes.find((c) => c.id === m.clienteId);
                  const adv = advogados.find((a) => a.id === m.advogadoId);
                  const oculta = m.statusRevisao === "ocultada_cliente";
                  const enviada = m.statusRevisao === "enviada_cliente" || m.clienteNotificado;
                  return (
                    <Card key={m.id} className={`p-4 ${oculta ? "opacity-70" : ""} ${m.possivelPrazo ? "border-amber-500/40" : ""}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] capitalize">{m.tipo.replaceAll("_", " ")}</Badge>
                            <Badge className="text-[10px] capitalize" variant={enviada ? "default" : "outline"}>
                              {m.statusRevisao.replaceAll("_", " ")}
                            </Badge>
                            {m.possivelPrazo && (
                              <Badge variant="outline" className="text-[10px] border-amber-500/60 text-amber-700 dark:text-amber-400">
                                possível prazo
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{m.fonte}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 font-mono">{proc?.numero ?? "—"} • {cli?.nome ?? "—"} • {adv?.nome ?? "—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Movimentação: {m.dataMovimentacao.slice(0, 10)} • Capturada: {m.dataCaptura.slice(0, 10)}
                            {m.dataEnvio && <> • Enviada em {m.dataEnvio.slice(0, 10)} ({m.canalNotificacao})</>}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-medium text-foreground mb-1">Texto original</div>
                          <p className="text-muted-foreground whitespace-pre-line">{m.textoOriginal}</p>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="font-medium text-foreground mb-1 flex items-center gap-1"><Bot className="w-3 h-3" /> Resumo interno (IA — apoio)</div>
                            <p className="text-muted-foreground">{m.resumoInterno || <em>Use “Gerar resumo IA”.</em>}</p>
                          </div>
                          <div>
                            <div className="font-medium text-foreground mb-1">Mensagem ao cliente</div>
                            <p className="text-muted-foreground">{m.resumoCliente || <em>Ainda não preparada.</em>}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => gerarResumoIA(m)}><Bot className="w-3 h-3 mr-1" />Gerar resumo IA</Button>
                        <Button size="sm" variant="outline" onClick={() => revisarMov(m)}><CheckCircle2 className="w-3 h-3 mr-1" />Revisar</Button>
                        <Button size="sm" variant="outline" onClick={() => aprovarEnvio(m)}><Send className="w-3 h-3 mr-1" />Aprovar envio</Button>
                        <Button size="sm" variant="outline" onClick={() => ocultarDoCliente(m)}><EyeOff className="w-3 h-3 mr-1" />Ocultar do cliente</Button>
                        <Button size="sm" onClick={() => enviarAvisoTeste(m)}>
                          {params.avisoWhatsapp ? <MessageSquare className="w-3 h-3 mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                          Enviar aviso TESTE
                        </Button>
                        {m.possivelPrazo && (
                          <Button size="sm" variant="outline" onClick={() => criarPrazoDaMov(m)}>
                            <AlertTriangle className="w-3 h-3 mr-1" />Criar prazo
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 italic">
                        Resumo gerado por IA apenas para apoio interno. O advogado responsável deve revisar antes de liberar ao cliente.
                      </p>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pré-visualização da área do cliente */}
            <Card className="p-4 mt-4 border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Atualizações do Processo — Pré-visualização da área do cliente</span>
              </div>
              {!params.exibirMovNaAreaCliente ? (
                <p className="text-xs text-muted-foreground">Exibição de movimentações na área do cliente está desativada nas parametrizações.</p>
              ) : (
                <ul className="text-xs space-y-2">
                  {movimentacoes.filter((m) => m.statusRevisao !== "ocultada_cliente" && m.notificarCliente).map((m) => {
                    const proc = processos.find((p) => p.id === m.processoId);
                    return (
                      <li key={m.id} className="border-l-2 border-primary/40 pl-3">
                        <div className="font-medium capitalize">{m.tipo.replaceAll("_", " ")} — {m.dataMovimentacao.slice(0, 10)}</div>
                        <div className="text-muted-foreground font-mono">{proc?.numero}</div>
                        <div className="text-muted-foreground mt-0.5">{m.resumoCliente || "(resumo não preparado)"}</div>
                      </li>
                    );
                  })}
                  {movimentacoes.filter((m) => m.statusRevisao !== "ocultada_cliente" && m.notificarCliente).length === 0 && (
                    <li className="text-muted-foreground">Nenhuma atualização liberada para o cliente ainda.</li>
                  )}
                </ul>
              )}
            </Card>
          </TabsContent>

          {/* ===== ALERTAS AO ADVOGADO ===== */}
          <TabsContent value="alertas" className="mt-4 space-y-3">
            <Card className="p-3 text-xs text-muted-foreground">
              Nova movimentação identificada no processo. Revise o conteúdo antes de liberar comunicação ao cliente,
              se necessário.
            </Card>
            <Card className="p-3">
              {alertas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem alertas no momento.</p>
              ) : (
                <ul className="divide-y">
                  {alertas.map((a) => {
                    const adv = advogados.find((x) => x.id === a.advogadoId);
                    return (
                      <li key={a.id} className={`flex items-start gap-3 py-3 ${a.lido ? "opacity-60" : ""}`}>
                        <Bell className={`w-4 h-4 mt-0.5 ${a.lido ? "text-muted-foreground" : "text-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">{a.mensagem}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {adv?.nome ?? "—"} • {a.criadoEm.slice(0, 10)} • <span className="capitalize">{a.tipo.replaceAll("_", " ")}</span>
                          </div>
                        </div>
                        {!a.lido && (
                          <Button size="sm" variant="ghost" onClick={() => marcarAlertaLido(a.id)}>Marcar como lido</Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
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
