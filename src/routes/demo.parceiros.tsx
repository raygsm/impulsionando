/**
 * Demo — Prestação de Serviços com Parceiros (WMP — Wagner Miller Produções).
 *
 * Módulo demonstrativo, frontend-only, com persistência em localStorage via
 * useDemoState. Reaproveita: PublicHeader, PublicFooter, DemoModeBanner,
 * DemoContractCTA, RoiSimulator, ui kit (Card, Tabs, Table, Badge, etc.).
 *
 * Cobre todo o checklist: cadastro/aprovação de parceiros, eventos pontuais
 * e recorrentes, agenda integrada, contratos, regras de cancelamento (72h),
 * multa de 10%, saldo negativo, dedução em repasse, cobrança em 30 dias,
 * reputação, pontos, bonificação após N eventos, regras editáveis, log de
 * auditoria, avisos automáticos (WhatsApp/e-mail) e painéis WMP + parceiro.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus, CheckCircle2, XCircle, Calendar, FileSignature, AlertTriangle, Trophy,
  RotateCcw, Sparkles, Bell, MessageSquare, DollarSign, ShieldCheck, Settings2, Award,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid, brl } from "@/lib/demoSandbox";
import { createParceirosMock } from "@/lib/demoModuleMocks";

export const Route = createFileRoute("/demo/parceiros")({
  head: () => ({
    meta: [
      { title: "Demo — Prestação de Serviços com Parceiros (WMP) — Impulsionando" },
      { name: "description", content: "Demonstração do módulo WMP: cadastro de parceiros, eventos, agenda, contratos, cancelamentos, multas, reputação e bonificação." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/parceiros" }],
  }),
  component: DemoParceiros,
});

// ===================== TIPOS =====================

type Parceiro = {
  id: string;
  nomeArtistico: string;
  nomeCompleto: string;
  cpf: string;
  cnpj?: string;
  mei: boolean;
  emiteNF: boolean;
  whatsapp: string;
  email: string;
  estado: string;
  cidade: string;
  bairro: string;
  raioKm: number;
  aceitaDeslocamento: boolean;
  aceitaViagem: boolean;
  cacheMinimo: number;
  estilos: string[];
  equipamentos: string[];
  status:
    | "Aguardando aprovação"
    | "Pendente de documentação"
    | "Aprovado"
    | "Reprovado"
    | "Suspenso"
    | "Bloqueado";
  nivel: "Iniciante" | "Aprovado" | "Preferencial" | "Premium" | "Restrito" | "Suspenso";
  pontosPos: number;
  pontosNeg: number;
  eventosRealizados: number;
  eventosSemCancelamento: number;
  saldoNegativo: number;
  observacoesInternas?: string;
};

type Evento = {
  id: string;
  nome: string;
  cliente: string;
  tipo: "pontual" | "recorrente";
  data: string; // ISO
  horaChegada: string;
  horaInicio: string;
  horaFim: string;
  cidade: string;
  bairro: string;
  publico: number;
  estilo: string;
  equipamentos: string[];
  valorTotal: number;
  percentualWMP: number;
  parceiroId?: string;
  status:
    | "Aberto"
    | "Aviso enviado"
    | "Aceito"
    | "Em substituição"
    | "Realizado"
    | "Cancelado pelo parceiro"
    | "Cancelado WMP";
  contratoAceito: boolean;
  cancelamento?: {
    quando: string;
    horasAntes: number;
    motivo: string;
    comMulta: boolean;
    valorMulta: number;
  };
};

type Contrato = {
  id: string;
  eventoId: string;
  parceiroId: string;
  tipo: "Evento pontual" | "Mensal/recorrente" | "Termo geral de parceria";
  status: "Gerado" | "Pendente de aceite" | "Aceito" | "Recusado" | "Encerrado";
  geradoEm: string;
  aceiteEm?: string;
};

type Multa = {
  id: string;
  parceiroId: string;
  eventoId: string;
  valorContrato: number;
  percentual: number;
  valor: number;
  geradaEm: string;
  horasFaltantes: number;
  motivo: string;
  status: "Gerada" | "Pendente" | "Deduzida em repasse" | "Cobrança emitida" | "Paga" | "Cancelada";
  prazoCobranca: string; // ISO +30d
};

type Aviso = {
  id: string;
  canal: "WhatsApp" | "E-mail" | "Interno";
  para: string;
  assunto: string;
  corpo: string;
  quando: string;
};

type LogRegra = {
  id: string;
  quando: string;
  usuario: string;
  regra: string;
  de: string;
  para: string;
};

type Regras = {
  horasSemMulta: number;
  percentualMulta: number;
  eventosBonificacao: number;
  percentualBonificacao: number;
  prazoCobrancaDias: number;
  whatsAppAtivo: boolean;
  emailAtivo: boolean;
  quemPegarPrimeiro: boolean;
};

// ===================== CONSTANTES =====================

const ESTILOS = ["House", "Sertanejo", "Eletrônica", "Pop", "Funk", "Open Format", "Pagode"];
const EQUIPAMENTOS_OPC = ["CDJs", "Mixer", "PA pequeno", "PA grande", "Iluminação básica", "Iluminação cênica", "Notebook backup"];

const DEMO_PREFIX = "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE";

function horasAte(dataISO: string): number {
  return (new Date(dataISO).getTime() - Date.now()) / 36e5;
}

function addDays(date: Date, d: number) {
  const x = new Date(date);
  x.setDate(x.getDate() + d);
  return x;
}

// ===================== COMPONENTE =====================

function DemoParceiros() {
  const [parceiros, setParceiros, resetParceiros] = useDemoState<Parceiro[]>("wmp.parceiros", []);
  const [eventos, setEventos, resetEventos] = useDemoState<Evento[]>("wmp.eventos", []);
  const [contratos, setContratos, resetContratos] = useDemoState<Contrato[]>("wmp.contratos", []);
  const [multas, setMultas, resetMultas] = useDemoState<Multa[]>("wmp.multas", []);
  const [avisos, setAvisos, resetAvisos] = useDemoState<Aviso[]>("wmp.avisos", []);
  const [logs, setLogs, resetLogs] = useDemoState<LogRegra[]>("wmp.logs", []);
  const [regras, setRegras, resetRegras] = useDemoState<Regras>("wmp.regras", {
    horasSemMulta: 72,
    percentualMulta: 10,
    eventosBonificacao: 10,
    percentualBonificacao: 5,
    prazoCobrancaDias: 30,
    whatsAppAtivo: true,
    emailAtivo: true,
    quemPegarPrimeiro: true,
  });
  const [view, setView] = useState<"wmp" | "parceiro">("wmp");
  const [parceiroAtivoId, setParceiroAtivoId] = useState<string>("");

  useEffect(() => {
    const marker = typeof window === "undefined" ? "parceiros:v2" : window.localStorage.getItem("imp.demo.mock.parceiros");
    if (marker === "parceiros:v2") return;
    const mock = createParceirosMock();
    setParceiros(mock.parceiros);
    setParceiroAtivoId(mock.parceiros[0]?.id ?? "");
    setEventos(mock.eventos);
    setContratos(mock.contratos);
    setMultas(mock.multas);
    setAvisos(mock.avisos);
    setLogs(mock.logs);
    if (typeof window !== "undefined") window.localStorage.setItem("imp.demo.mock.parceiros", "parceiros:v2");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parceiroAtivo = useMemo(
    () => parceiros.find((p) => p.id === parceiroAtivoId),
    [parceiros, parceiroAtivoId]
  );

  // ---------- helpers de avisos ----------
  function enviarAviso(canal: Aviso["canal"], para: string, assunto: string, corpo: string) {
    if (canal === "WhatsApp" && !regras.whatsAppAtivo) return;
    if (canal === "E-mail" && !regras.emailAtivo) return;
    const a: Aviso = {
      id: uid("av"),
      canal,
      para,
      assunto: `${DEMO_PREFIX} — ${assunto}`,
      corpo: `${DEMO_PREFIX}\n\n${corpo}`,
      quando: new Date().toISOString(),
    };
    setAvisos((arr) => [a, ...arr].slice(0, 200));
  }

  function logRegra(regra: string, de: string, para: string) {
    setLogs((arr) =>
      [
        { id: uid("lg"), quando: new Date().toISOString(), usuario: "Gestão WMP", regra, de, para },
        ...arr,
      ].slice(0, 200)
    );
  }

  // ---------- seed ----------
  function seedTudo() {
    const mock = createParceirosMock();
    setParceiros(mock.parceiros);
    setParceiroAtivoId(mock.parceiros[0]?.id ?? "");
    setEventos(mock.eventos);
    setContratos(mock.contratos);
    setMultas(mock.multas);
    setAvisos(mock.avisos);
    setLogs(mock.logs);
    toast.success("Dados fictícios específicos do WMP/Parceiros criados.");
  }

  function resetarTudo() {
    resetParceiros();
    resetEventos();
    resetContratos();
    resetMultas();
    resetAvisos();
    resetLogs();
    resetRegras();
    setParceiroAtivoId("");
    toast.success("Demonstração reiniciada.");
  }

  // ---------- ações WMP ----------
  function aprovarParceiro(id: string) {
    setParceiros((arr) =>
      arr.map((p) =>
        p.id === id ? { ...p, status: "Aprovado", nivel: p.nivel === "Iniciante" ? "Aprovado" : p.nivel } : p
      )
    );
    const p = parceiros.find((x) => x.id === id);
    if (p) {
      enviarAviso(
        "WhatsApp",
        p.whatsapp,
        "Cadastro aprovado pela WMP",
        `Olá ${p.nomeArtistico}, seu cadastro foi aprovado. A partir de agora você receberá oportunidades compatíveis com seu perfil, agenda, localização e equipamentos.`
      );
      enviarAviso("E-mail", p.email, "Cadastro aprovado", "Seu cadastro foi aprovado pela gestão WMP.");
    }
    toast.success("Parceiro aprovado.");
  }

  function suspender(id: string) {
    setParceiros((arr) => arr.map((p) => (p.id === id ? { ...p, status: "Suspenso", nivel: "Suspenso" } : p)));
    toast.message("Parceiro suspenso.");
  }

  function buscarCompativeis(ev: Evento): Parceiro[] {
    return parceiros.filter(
      (p) =>
        p.status === "Aprovado" &&
        (p.cidade === ev.cidade || p.aceitaDeslocamento) &&
        p.cacheMinimo <= ev.valorTotal * (1 - ev.percentualWMP / 100) &&
        (p.estilos.includes(ev.estilo) || p.estilos.includes("Open Format"))
    );
  }

  function liberarEvento(eventoId: string) {
    const ev = eventos.find((e) => e.id === eventoId);
    if (!ev) return;
    const compativeis = buscarCompativeis(ev);
    if (compativeis.length === 0) {
      toast.error("Nenhum parceiro compatível encontrado.");
      return;
    }
    compativeis.forEach((p) => {
      enviarAviso(
        "WhatsApp",
        p.whatsapp,
        `Oportunidade WMP — ${ev.nome}`,
        `Uma agenda foi liberada para evento WMP em ${ev.cidade} no dia ${new Date(ev.data).toLocaleDateString("pt-BR")}. Valor parceiro: ${brl(ev.valorTotal * (1 - ev.percentualWMP / 100))}. Reveja contrato e regras antes de aceitar.`
      );
      enviarAviso("E-mail", p.email, `Oportunidade WMP — ${ev.nome}`, "Oportunidade disponível no painel do parceiro.");
    });
    setEventos((arr) => arr.map((e) => (e.id === eventoId ? { ...e, status: "Aviso enviado" } : e)));
    toast.success(`${compativeis.length} parceiro(s) notificados.`);
  }

  // ---------- ações Parceiro ----------
  function aceitarEvento(eventoId: string, parceiroId: string) {
    const ev = eventos.find((e) => e.id === eventoId);
    const p = parceiros.find((x) => x.id === parceiroId);
    if (!ev || !p) return;
    // conflito de agenda
    const conflito = eventos.some(
      (x) => x.parceiroId === parceiroId && x.status === "Aceito" && x.data.slice(0, 10) === ev.data.slice(0, 10)
    );
    if (conflito) {
      toast.error("Conflito de agenda nesse dia.");
      return;
    }
    setEventos((arr) =>
      arr.map((e) => (e.id === eventoId ? { ...e, parceiroId, status: "Aceito", contratoAceito: true } : e))
    );
    const c: Contrato = {
      id: uid("ct"),
      eventoId,
      parceiroId,
      tipo: ev.tipo === "recorrente" ? "Mensal/recorrente" : "Evento pontual",
      status: "Aceito",
      geradoEm: new Date().toISOString(),
      aceiteEm: new Date().toISOString(),
    };
    setContratos((arr) => [c, ...arr]);
    enviarAviso("WhatsApp", p.whatsapp, "Agenda confirmada", `Agenda bloqueada para ${ev.nome} em ${new Date(ev.data).toLocaleDateString("pt-BR")}.`);
    enviarAviso("E-mail", p.email, "Contrato aceito", "Seu contrato foi gerado e aceite registrado.");
    toast.success("Evento aceito, contrato gerado e agenda bloqueada.");
  }

  function cancelarPeloParceiro(eventoId: string, motivo: string) {
    const ev = eventos.find((e) => e.id === eventoId);
    if (!ev || !ev.parceiroId) return;
    const horas = Math.max(0, Math.round(horasAte(ev.data)));
    const comMulta = horas < regras.horasSemMulta;
    const valorMulta = comMulta ? +(ev.valorTotal * (regras.percentualMulta / 100)).toFixed(2) : 0;

    setEventos((arr) =>
      arr.map((e) =>
        e.id === eventoId
          ? {
              ...e,
              status: "Cancelado pelo parceiro",
              cancelamento: { quando: new Date().toISOString(), horasAntes: horas, motivo, comMulta, valorMulta },
            }
          : e
      )
    );

    setParceiros((arr) =>
      arr.map((p) =>
        p.id === ev.parceiroId
          ? {
              ...p,
              pontosNeg: p.pontosNeg + 1,
              eventosSemCancelamento: 0,
              saldoNegativo: p.saldoNegativo + valorMulta,
            }
          : p
      )
    );

    const p = parceiros.find((x) => x.id === ev.parceiroId);
    if (p) {
      if (comMulta) {
        const multa: Multa = {
          id: uid("mu"),
          parceiroId: p.id,
          eventoId: ev.id,
          valorContrato: ev.valorTotal,
          percentual: regras.percentualMulta,
          valor: valorMulta,
          geradaEm: new Date().toISOString(),
          horasFaltantes: horas,
          motivo,
          status: "Pendente",
          prazoCobranca: addDays(new Date(), regras.prazoCobrancaDias).toISOString(),
        };
        setMultas((arr) => [multa, ...arr]);
        enviarAviso(
          "WhatsApp",
          p.whatsapp,
          "Advertência WMP — Cancelamento com multa",
          `Cancelamento registrado com menos de ${regras.horasSemMulta}h. Multa de ${regras.percentualMulta}% (${brl(valorMulta)}) ficará como saldo negativo e poderá ser deduzida do próximo repasse. Caso não haja repasse, cobrança em até ${regras.prazoCobrancaDias} dias.`
        );
        enviarAviso("E-mail", p.email, "Advertência WMP — Cancelamento com multa", "Detalhes da multa disponíveis no painel.");
      } else {
        enviarAviso(
          "WhatsApp",
          p.whatsapp,
          "Advertência WMP — Cancelamento sem multa",
          `Cancelamento dentro do prazo de ${regras.horasSemMulta}h. Sem multa financeira, porém com 1 ponto negativo na sua reputação.`
        );
        enviarAviso("E-mail", p.email, "Advertência WMP — Cancelamento de participação", "Ponto negativo registrado.");
      }
    }

    // libera agenda e aciona substituição
    setEventos((arr) =>
      arr.map((e) => (e.id === eventoId ? { ...e, parceiroId: undefined, status: "Em substituição" } : e))
    );
    setTimeout(() => liberarEvento(eventoId), 50);
    toast.message(comMulta ? `Multa de ${brl(valorMulta)} gerada.` : "Cancelamento sem multa. Ponto negativo registrado.");
  }

  function marcarRealizado(eventoId: string) {
    const ev = eventos.find((e) => e.id === eventoId);
    if (!ev || !ev.parceiroId) return;
    setEventos((arr) => arr.map((e) => (e.id === eventoId ? { ...e, status: "Realizado" } : e)));
    setParceiros((arr) =>
      arr.map((p) =>
        p.id === ev.parceiroId
          ? {
              ...p,
              pontosPos: p.pontosPos + 1,
              eventosRealizados: p.eventosRealizados + 1,
              eventosSemCancelamento: p.eventosSemCancelamento + 1,
            }
          : p
      )
    );
    toast.success("Evento marcado como realizado. +1 ponto positivo.");
  }

  function deduzirMulta(multaId: string) {
    const m = multas.find((x) => x.id === multaId);
    if (!m) return;
    setMultas((arr) => arr.map((x) => (x.id === multaId ? { ...x, status: "Deduzida em repasse" } : x)));
    setParceiros((arr) =>
      arr.map((p) => (p.id === m.parceiroId ? { ...p, saldoNegativo: Math.max(0, p.saldoNegativo - m.valor) } : p))
    );
    toast.success("Multa deduzida do próximo repasse simulado.");
  }

  function emitirCobranca(multaId: string) {
    setMultas((arr) => arr.map((x) => (x.id === multaId ? { ...x, status: "Cobrança emitida" } : x)));
    toast.success(`Cobrança emitida em até ${regras.prazoCobrancaDias} dias.`);
  }

  // ---------- regras editáveis ----------
  function alterarRegra<K extends keyof Regras>(k: K, v: Regras[K], rotulo: string) {
    const de = String(regras[k]);
    setRegras({ ...regras, [k]: v });
    logRegra(rotulo, de, String(v));
  }

  // ---------- dashboards ----------
  const dash = useMemo(() => {
    const pendentes = parceiros.filter((p) => p.status === "Aguardando aprovação").length;
    const aprovados = parceiros.filter((p) => p.status === "Aprovado").length;
    const semParceiro = eventos.filter((e) => !e.parceiroId && e.status !== "Realizado").length;
    const preenchidos = eventos.filter((e) => e.status === "Aceito").length;
    const realizados = eventos.filter((e) => e.status === "Realizado").length;
    const canceladosCom = eventos.filter((e) => e.cancelamento?.comMulta).length;
    const canceladosSem = eventos.filter((e) => e.cancelamento && !e.cancelamento.comMulta).length;
    const multasPend = multas.filter((m) => m.status === "Pendente").length;
    return { pendentes, aprovados, semParceiro, preenchidos, realizados, canceladosCom, canceladosSem, multasPend };
  }, [parceiros, eventos, multas]);

  const parceiroEventos = useMemo(
    () => (parceiroAtivo ? eventos.filter((e) => e.parceiroId === parceiroAtivo.id) : []),
    [eventos, parceiroAtivo]
  );
  const parceiroMultas = useMemo(
    () => (parceiroAtivo ? multas.filter((m) => m.parceiroId === parceiroAtivo.id) : []),
    [multas, parceiroAtivo]
  );
  const parceiroContratos = useMemo(
    () => (parceiroAtivo ? contratos.filter((c) => c.parceiroId === parceiroAtivo.id) : []),
    [contratos, parceiroAtivo]
  );
  const eventosDisponiveis = useMemo(
    () =>
      parceiroAtivo && parceiroAtivo.status === "Aprovado"
        ? eventos.filter(
            (e) =>
              !e.parceiroId &&
              (e.status === "Aberto" || e.status === "Aviso enviado" || e.status === "Em substituição")
          )
        : [],
    [eventos, parceiroAtivo]
  );

  const faltamBonificacao = parceiroAtivo
    ? Math.max(0, regras.eventosBonificacao - parceiroAtivo.eventosSemCancelamento)
    : regras.eventosBonificacao;

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="container max-w-6xl mx-auto px-4 pt-10">
          <DemoModeBanner current="parceiros" />
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <Badge variant="outline" className="mb-2">Módulo demonstrativo — WMP</Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Prestação de Serviços com Parceiros
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Empresa teste: <strong>Wagner Miller Produções (WMP)</strong>. A WMP vende, fatura, emite nota
                fiscal e se responsabiliza pela entrega. A execução vai para uma rede de parceiros aprovados,
                com contratos, agenda, repasses, reputação e regras de cancelamento.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={seedTudo}>
                <Sparkles className="w-4 h-4 mr-1" /> Carregar cenário WMP
              </Button>
              <Button variant="ghost" size="sm" onClick={resetarTudo}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
              </Button>
              <DemoContractCTA
                slug="parceiros"
                moduleName="Prestação de Serviços com Parceiros"
                moduleDescription="Rede de parceiros, eventos, contratos, agenda, multas, reputação e bonificações para empresas como a WMP."
                amountReference={397}
                features={[
                  "Cadastro e aprovação de parceiros",
                  "Eventos pontuais e recorrentes",
                  "Contratos e aceite eletrônico",
                  "Agenda integrada e regra dos 72h",
                  "Multa automática, saldo negativo e cobrança",
                  "Reputação, pontos e bonificação progressiva",
                  "Avisos automáticos por WhatsApp e e-mail",
                ]}
                testRoute="/demo/parceiros"
              />
            </div>
          </div>

          {/* alternância de visão */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={view === "wmp" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("wmp")}
            >
              <ShieldCheck className="w-4 h-4 mr-1" /> Painel Gestão WMP
            </Button>
            <Button
              variant={view === "parceiro" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("parceiro")}
            >
              <UserPlus className="w-4 h-4 mr-1" /> Painel do Parceiro
            </Button>
            {view === "parceiro" && (
              <Select value={parceiroAtivoId} onValueChange={setParceiroAtivoId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Escolher parceiro" />
                </SelectTrigger>
                <SelectContent>
                  {parceiros.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nomeArtistico} — {p.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </section>

        {/* PAINEL WMP */}
        {view === "wmp" && (
          <section className="container max-w-6xl mx-auto px-4 pb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat label="Aprovações pendentes" value={dash.pendentes} />
              <Stat label="Parceiros aprovados" value={dash.aprovados} />
              <Stat label="Eventos sem parceiro" value={dash.semParceiro} />
              <Stat label="Eventos preenchidos" value={dash.preenchidos} />
              <Stat label="Eventos realizados" value={dash.realizados} />
              <Stat label="Cancelamentos s/ multa" value={dash.canceladosSem} />
              <Stat label="Cancelamentos c/ multa" value={dash.canceladosCom} />
              <Stat label="Multas pendentes" value={dash.multasPend} />
            </div>

            <Tabs defaultValue="parceiros">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                <TabsTrigger value="contratos">Contratos</TabsTrigger>
                <TabsTrigger value="multas">Multas / Cobranças</TabsTrigger>
                <TabsTrigger value="avisos">Avisos</TabsTrigger>
                <TabsTrigger value="config">Configurações</TabsTrigger>
              </TabsList>

              {/* PARCEIROS */}
              <TabsContent value="parceiros" className="mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Aprovações e rede de parceiros
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Estilos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Reputação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parceiros.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="font-medium">{p.nomeArtistico}</div>
                            <div className="text-xs text-muted-foreground">{p.email}</div>
                          </TableCell>
                          <TableCell>{p.cidade}</TableCell>
                          <TableCell className="text-xs">{p.estilos.join(", ")}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === "Aprovado" ? "default" : "secondary"}>{p.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.nivel}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            +{p.pontosPos} / −{p.pontosNeg}
                            {p.saldoNegativo > 0 && (
                              <div className="text-destructive">Saldo: −{brl(p.saldoNegativo)}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {p.status !== "Aprovado" && (
                              <Button size="sm" onClick={() => aprovarParceiro(p.id)}>Aprovar</Button>
                            )}
                            {p.status === "Aprovado" && (
                              <Button size="sm" variant="outline" onClick={() => suspender(p.id)}>
                                Suspender
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {parceiros.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhum parceiro. Carregue o cenário WMP para começar.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>

                <NovoParceiroForm
                  onCriar={(novo) => {
                    setParceiros((arr) => [novo, ...arr]);
                    enviarAviso(
                      "E-mail",
                      novo.email,
                      "Cadastro recebido",
                      "Recebemos seu cadastro. Ele será analisado pela gestão WMP."
                    );
                    toast.success("Cadastro enviado para aprovação.");
                  }}
                />
              </TabsContent>

              {/* EVENTOS */}
              <TabsContent value="eventos" className="mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Eventos pontuais e recorrentes
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Estilo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventos.map((e) => {
                        const p = parceiros.find((x) => x.id === e.parceiroId);
                        const valParceiro = e.valorTotal * (1 - e.percentualWMP / 100);
                        return (
                          <TableRow key={e.id}>
                            <TableCell>
                              <div className="font-medium">{e.nome}</div>
                              <div className="text-xs text-muted-foreground">{e.cliente}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{e.tipo}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(e.data).toLocaleDateString("pt-BR")}
                              <div className="text-muted-foreground">{e.horaInicio}–{e.horaFim}</div>
                            </TableCell>
                            <TableCell className="text-xs">{e.cidade} / {e.bairro}</TableCell>
                            <TableCell className="text-xs">{e.estilo}</TableCell>
                            <TableCell className="text-xs">
                              {brl(e.valorTotal)}
                              <div className="text-muted-foreground">
                                Parceiro: {brl(valParceiro)}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{p?.nomeArtistico ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{e.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              {!e.parceiroId && (
                                <Button size="sm" variant="outline" onClick={() => liberarEvento(e.id)}>
                                  Liberar p/ parceiros
                                </Button>
                              )}
                              {e.status === "Aceito" && (
                                <Button size="sm" onClick={() => marcarRealizado(e.id)}>
                                  Marcar realizado
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {eventos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                            Sem eventos. Carregue o cenário WMP.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>

                <NovoEventoForm
                  onCriar={(ev) => {
                    setEventos((arr) => [ev, ...arr]);
                    toast.success("Evento criado.");
                  }}
                />
              </TabsContent>

              {/* CONTRATOS */}
              <TabsContent value="contratos" className="mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileSignature className="w-4 h-4" /> Contratos gerados
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aceite</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contratos.map((c) => {
                        const p = parceiros.find((x) => x.id === c.parceiroId);
                        const e = eventos.find((x) => x.id === c.eventoId);
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono text-xs">{c.id}</TableCell>
                            <TableCell>{c.tipo}</TableCell>
                            <TableCell>{p?.nomeArtistico ?? "—"}</TableCell>
                            <TableCell>{e?.nome ?? "—"}</TableCell>
                            <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                            <TableCell className="text-xs">
                              {c.aceiteEm ? new Date(c.aceiteEm).toLocaleString("pt-BR") : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {contratos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum contrato gerado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* MULTAS */}
              <TabsContent value="multas" className="mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Multas, saldo negativo e cobranças
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cancelamentos abaixo de {regras.horasSemMulta}h aplicam {regras.percentualMulta}% sobre o
                    valor total do contrato. Caso não exista próximo repasse, a WMP emite cobrança em até{" "}
                    {regras.prazoCobrancaDias} dias.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parceiro</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Valor multa</TableHead>
                        <TableHead>Horas antes</TableHead>
                        <TableHead>Prazo cobrança</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {multas.map((m) => {
                        const p = parceiros.find((x) => x.id === m.parceiroId);
                        const e = eventos.find((x) => x.id === m.eventoId);
                        return (
                          <TableRow key={m.id}>
                            <TableCell>{p?.nomeArtistico ?? "—"}</TableCell>
                            <TableCell className="text-xs">{e?.nome ?? "—"}</TableCell>
                            <TableCell>
                              {brl(m.valor)}
                              <div className="text-xs text-muted-foreground">
                                {m.percentual}% de {brl(m.valorContrato)}
                              </div>
                            </TableCell>
                            <TableCell>{m.horasFaltantes}h</TableCell>
                            <TableCell className="text-xs">
                              {new Date(m.prazoCobranca).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                            <TableCell className="text-right space-x-1">
                              {m.status === "Pendente" && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => deduzirMulta(m.id)}>
                                    Deduzir no repasse
                                  </Button>
                                  <Button size="sm" onClick={() => emitirCobranca(m.id)}>
                                    Emitir cobrança
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {multas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhuma multa gerada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* AVISOS */}
              <TabsContent value="avisos" className="mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Comunicação automática
                  </h3>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {avisos.map((a) => (
                      <div key={a.id} className="border rounded-md p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{a.canal}</Badge>
                            <span className="text-xs text-muted-foreground">{a.para}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.quando).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="font-medium text-xs">{a.assunto}</div>
                        <div className="text-xs text-muted-foreground whitespace-pre-line">{a.corpo}</div>
                      </div>
                    ))}
                    {avisos.length === 0 && (
                      <div className="text-center text-muted-foreground py-8 text-sm">
                        Nenhum aviso enviado ainda.
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* CONFIG */}
              <TabsContent value="config" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Settings2 className="w-4 h-4" /> Regras editáveis pela gestão WMP
                    </h3>
                    <div className="space-y-3">
                      <NumberRow
                        label="Prazo sem multa (horas)"
                        value={regras.horasSemMulta}
                        onChange={(v) => alterarRegra("horasSemMulta", v, "horas sem multa")}
                      />
                      <NumberRow
                        label="Percentual da multa (%)"
                        value={regras.percentualMulta}
                        onChange={(v) => alterarRegra("percentualMulta", v, "percentual da multa")}
                      />
                      <NumberRow
                        label="Eventos para bonificação"
                        value={regras.eventosBonificacao}
                        onChange={(v) => alterarRegra("eventosBonificacao", v, "eventos p/ bonificação")}
                      />
                      <NumberRow
                        label="Percentual da bonificação (%)"
                        value={regras.percentualBonificacao}
                        onChange={(v) => alterarRegra("percentualBonificacao", v, "percentual de bonificação")}
                      />
                      <NumberRow
                        label="Prazo de cobrança (dias)"
                        value={regras.prazoCobrancaDias}
                        onChange={(v) => alterarRegra("prazoCobrancaDias", v, "prazo de cobrança")}
                      />
                      <div className="flex items-center justify-between">
                        <Label>Avisos por WhatsApp</Label>
                        <Switch
                          checked={regras.whatsAppAtivo}
                          onCheckedChange={(v) => alterarRegra("whatsAppAtivo", v, "WhatsApp ativo")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Avisos por e-mail</Label>
                        <Switch
                          checked={regras.emailAtivo}
                          onCheckedChange={(v) => alterarRegra("emailAtivo", v, "e-mail ativo")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Regra "quem pegar primeiro"</Label>
                        <Switch
                          checked={regras.quemPegarPrimeiro}
                          onCheckedChange={(v) => alterarRegra("quemPegarPrimeiro", v, "quem pegar primeiro")}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Log de alterações</h3>
                    <div className="space-y-2 max-h-[420px] overflow-y-auto text-sm">
                      {logs.map((l) => (
                        <div key={l.id} className="border rounded-md p-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(l.quando).toLocaleString("pt-BR")} — {l.usuario}
                          </div>
                          <div>
                            <strong>{l.regra}:</strong> {l.de} → {l.para}
                          </div>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className="text-muted-foreground text-center py-6">Nenhuma alteração registrada.</div>
                      )}
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        )}

        {/* PAINEL DO PARCEIRO */}
        {view === "parceiro" && (
          <section className="container max-w-6xl mx-auto px-4 pb-12">
            {!parceiroAtivo ? (
              <Card className="p-8 text-center text-muted-foreground">
                Selecione um parceiro acima para visualizar o painel dele.
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <Stat label="Eventos disponíveis" value={eventosDisponiveis.length} />
                  <Stat label="Próximos eventos" value={parceiroEventos.filter((e) => e.status === "Aceito").length} />
                  <Stat label="Realizados" value={parceiroAtivo.eventosRealizados} />
                  <Stat label="Sem cancelar (seq.)" value={parceiroAtivo.eventosSemCancelamento} />
                  <Stat label="Pontos positivos" value={`+${parceiroAtivo.pontosPos}`} />
                  <Stat label="Pontos negativos" value={`−${parceiroAtivo.pontosNeg}`} />
                  <Stat
                    label="Saldo negativo"
                    value={brl(parceiroAtivo.saldoNegativo)}
                    accent={parceiroAtivo.saldoNegativo > 0}
                  />
                  <Stat label="Nível" value={parceiroAtivo.nivel} />
                </div>

                {/* Contagem regressiva da bonificação */}
                <Card className="p-4 mb-6 bg-gradient-primary/10 border-primary/30">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Bonificação WMP</h4>
                      {faltamBonificacao > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Faltam <strong>{faltamBonificacao}</strong> evento(s) realizados sem cancelamento para
                          seu repasse aumentar em <strong>{regras.percentualBonificacao}%</strong>. Regra atual
                          definida pela gestão WMP (editável).
                        </p>
                      ) : (
                        <p className="text-sm">
                          <Award className="inline w-4 h-4 mr-1 text-primary" />
                          Meta atingida! Sua bonificação de {regras.percentualBonificacao}% está disponível
                          conforme regras vigentes.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                <Tabs defaultValue="disponiveis">
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="disponiveis">Eventos disponíveis</TabsTrigger>
                    <TabsTrigger value="meus">Meus eventos</TabsTrigger>
                    <TabsTrigger value="contratos">Contratos</TabsTrigger>
                    <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                    <TabsTrigger value="reputacao">Reputação</TabsTrigger>
                  </TabsList>

                  <TabsContent value="disponiveis" className="mt-4 space-y-3">
                    {eventosDisponiveis.map((e) => (
                      <EventoDisponivelCard
                        key={e.id}
                        evento={e}
                        regras={regras}
                        onAceitar={() => aceitarEvento(e.id, parceiroAtivo.id)}
                      />
                    ))}
                    {eventosDisponiveis.length === 0 && (
                      <Card className="p-8 text-center text-muted-foreground">
                        Nenhuma oportunidade disponível agora.
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="meus" className="mt-4">
                    <Card className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor parceiro</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parceiroEventos.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell>{e.nome}</TableCell>
                              <TableCell className="text-xs">
                                {new Date(e.data).toLocaleString("pt-BR")}
                                <div className="text-muted-foreground">
                                  faltam {Math.max(0, Math.round(horasAte(e.data)))}h
                                </div>
                              </TableCell>
                              <TableCell>{brl(e.valorTotal * (1 - e.percentualWMP / 100))}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{e.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {e.status === "Aceito" && (
                                  <CancelarBotao
                                    horasAntes={Math.round(horasAte(e.data))}
                                    horasSemMulta={regras.horasSemMulta}
                                    percentualMulta={regras.percentualMulta}
                                    onConfirm={(motivo) => cancelarPeloParceiro(e.id, motivo)}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {parceiroEventos.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                Você ainda não aceitou eventos.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contratos" className="mt-4">
                    <Card className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Contrato</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aceite</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parceiroContratos.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-mono text-xs">{c.id}</TableCell>
                              <TableCell>{c.tipo}</TableCell>
                              <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                              <TableCell className="text-xs">
                                {c.aceiteEm ? new Date(c.aceiteEm).toLocaleString("pt-BR") : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                          {parceiroContratos.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                Nenhum contrato ainda.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="financeiro" className="mt-4 space-y-3">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Saldo e multas
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Saldo negativo atual:{" "}
                        <strong className={parceiroAtivo.saldoNegativo > 0 ? "text-destructive" : ""}>
                          {brl(parceiroAtivo.saldoNegativo)}
                        </strong>
                        . Pode ser deduzido do próximo repasse. Caso não haja repasse, a WMP poderá emitir
                        cobrança em até {regras.prazoCobrancaDias} dias.
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Prazo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parceiroMultas.map((m) => {
                            const e = eventos.find((x) => x.id === m.eventoId);
                            return (
                              <TableRow key={m.id}>
                                <TableCell className="text-xs">{e?.nome ?? "—"}</TableCell>
                                <TableCell>{brl(m.valor)}</TableCell>
                                <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                                <TableCell className="text-xs">
                                  {new Date(m.prazoCobranca).toLocaleDateString("pt-BR")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {parceiroMultas.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                Sem multas. Continue assim!
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reputacao" className="mt-4">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Sua reputação WMP
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sua reputação representa seu histórico de confiabilidade, presença, pontualidade,
                        cumprimento de contratos e avaliações recebidas. Quanto melhor, mais oportunidades e
                        bonificações.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Stat label="Pontos positivos" value={`+${parceiroAtivo.pontosPos}`} />
                        <Stat label="Pontos negativos" value={`−${parceiroAtivo.pontosNeg}`} />
                        <Stat label="Realizados" value={parceiroAtivo.eventosRealizados} />
                        <Stat label="Sem cancelar (seq.)" value={parceiroAtivo.eventosSemCancelamento} />
                        <Stat label="Nível" value={parceiroAtivo.nivel} />
                        <Stat label="Faltam p/ bônus" value={faltamBonificacao} />
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

// ===================== AUX UI =====================

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${accent ? "text-destructive" : ""}`}>{value}</div>
    </Card>
  );
}

function NumberRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="flex-1">{label}</Label>
      <Input
        type="number"
        className="w-24"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function NovoParceiroForm({ onCriar }: { onCriar: (p: Parceiro) => void }) {
  const [open, setOpen] = useState(false);
  const [nomeArt, setNomeArt] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("Rio de Janeiro");
  const [estilos, setEstilos] = useState<string[]>([]);
  return (
    <Card className="p-4 mt-4">
      <button className="font-semibold flex items-center gap-2" onClick={() => setOpen((v) => !v)}>
        <UserPlus className="w-4 h-4" /> {open ? "Fechar cadastro" : "Cadastrar novo parceiro"}
      </button>
      {open && (
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <div>
            <Label>Nome artístico</Label>
            <Input value={nomeArt} onChange={(e) => setNomeArt(e.target.value)} />
          </div>
          <div>
            <Label>Nome completo</Label>
            <Input value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={whats} onChange={(e) => setWhats(e.target.value)} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div>
            <Label>Estilos</Label>
            <Select onValueChange={(v) => setEstilos((arr) => (arr.includes(v) ? arr : [...arr, v]))}>
              <SelectTrigger><SelectValue placeholder="Adicionar estilo" /></SelectTrigger>
              <SelectContent>
                {ESTILOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1 mt-1">
              {estilos.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button
              className="w-full"
              onClick={() => {
                if (!nomeArt || !email) {
                  toast.error("Informe ao menos nome artístico e e-mail.");
                  return;
                }
                onCriar({
                  id: uid("pa"),
                  nomeArtistico: nomeArt,
                  nomeCompleto: nomeCompleto || nomeArt,
                  cpf: "000.000.000-00",
                  mei: false,
                  emiteNF: false,
                  whatsapp: whats,
                  email,
                  estado: "RJ",
                  cidade,
                  bairro: "—",
                  raioKm: 30,
                  aceitaDeslocamento: true,
                  aceitaViagem: false,
                  cacheMinimo: 1000,
                  estilos: estilos.length ? estilos : ["Open Format"],
                  equipamentos: ["CDJs", "Mixer"],
                  status: "Aguardando aprovação",
                  nivel: "Iniciante",
                  pontosPos: 0,
                  pontosNeg: 0,
                  eventosRealizados: 0,
                  eventosSemCancelamento: 0,
                  saldoNegativo: 0,
                });
                setNomeArt(""); setNomeCompleto(""); setWhats(""); setEmail(""); setEstilos([]);
                setOpen(false);
              }}
            >
              Enviar cadastro para aprovação WMP
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function NovoEventoForm({ onCriar }: { onCriar: (e: Evento) => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [tipo, setTipo] = useState<"pontual" | "recorrente">("pontual");
  const [diasAFrente, setDiasAFrente] = useState(7);
  const [cidade, setCidade] = useState("Rio de Janeiro");
  const [bairro, setBairro] = useState("Centro");
  const [estilo, setEstilo] = useState("Open Format");
  const [valor, setValor] = useState(5000);
  const [perc, setPerc] = useState(30);
  return (
    <Card className="p-4 mt-4">
      <button className="font-semibold flex items-center gap-2" onClick={() => setOpen((v) => !v)}>
        <Calendar className="w-4 h-4" /> {open ? "Fechar evento" : "Criar novo evento"}
      </button>
      {open && (
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <div>
            <Label>Nome do evento</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label>Cliente contratante</Label>
            <Input value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "pontual" | "recorrente")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pontual">Pontual</SelectItem>
                <SelectItem value="recorrente">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Daqui a quantos dias</Label>
            <Input type="number" value={diasAFrente} onChange={(e) => setDiasAFrente(Number(e.target.value))} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </div>
          <div>
            <Label>Estilo</Label>
            <Select value={estilo} onValueChange={setEstilo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTILOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor total (R$)</Label>
            <Input type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
          </div>
          <div>
            <Label>% WMP</Label>
            <Input type="number" value={perc} onChange={(e) => setPerc(Number(e.target.value))} />
          </div>
          <div className="md:col-span-2">
            <Button
              className="w-full"
              onClick={() => {
                if (!nome || !cliente) {
                  toast.error("Informe nome e cliente.");
                  return;
                }
                onCriar({
                  id: uid("ev"),
                  nome,
                  cliente,
                  tipo,
                  data: addDays(new Date(), diasAFrente).toISOString(),
                  horaChegada: "18:00",
                  horaInicio: "20:00",
                  horaFim: "01:00",
                  cidade,
                  bairro,
                  publico: 120,
                  estilo,
                  equipamentos: EQUIPAMENTOS_OPC.slice(0, 2),
                  valorTotal: valor,
                  percentualWMP: perc,
                  status: "Aberto",
                  contratoAceito: false,
                });
                setNome(""); setCliente("");
                setOpen(false);
              }}
            >
              Criar evento WMP
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function EventoDisponivelCard({
  evento,
  regras,
  onAceitar,
}: {
  evento: Evento;
  regras: Regras;
  onAceitar: () => void;
}) {
  const [aceites, setAceites] = useState<boolean[]>([false, false, false, false, false, false]);
  const valorParceiro = evento.valorTotal * (1 - evento.percentualWMP / 100);
  const allChecked = aceites.every(Boolean);
  const items = [
    "Li e aceito as regras do evento.",
    "Estou ciente da política de cancelamento.",
    `Estou ciente da multa de ${regras.percentualMulta}% por cancelamento com menos de ${regras.horasSemMulta}h.`,
    "Estou ciente de que cancelamentos impactam minha reputação.",
    "Estou ciente das regras de repasse.",
    "Aceito o contrato deste evento.",
  ];
  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{evento.nome}</h4>
            <Badge variant="outline">{evento.tipo}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{evento.cliente} — {evento.cidade}/{evento.bairro}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(evento.data).toLocaleString("pt-BR")} • {evento.horaInicio}–{evento.horaFim} • {evento.estilo}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Valor total</div>
          <div className="font-semibold">{brl(evento.valorTotal)}</div>
          <div className="text-xs text-muted-foreground">
            Seu valor líquido: <strong>{brl(valorParceiro)}</strong>
          </div>
          <div className="text-xs text-muted-foreground">WMP: {evento.percentualWMP}%</div>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {items.map((label, i) => (
          <label key={i} className="flex items-start gap-2 text-xs cursor-pointer">
            <Checkbox
              checked={aceites[i]}
              onCheckedChange={(v) =>
                setAceites((arr) => arr.map((x, idx) => (idx === i ? Boolean(v) : x)))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={!allChecked} onClick={onAceitar}>
          <CheckCircle2 className="w-4 h-4 mr-1" /> Aceitar evento e assinar contrato
        </Button>
      </div>
    </Card>
  );
}

function CancelarBotao({
  horasAntes,
  horasSemMulta,
  percentualMulta,
  onConfirm,
}: {
  horasAntes: number;
  horasSemMulta: number;
  percentualMulta: number;
  onConfirm: (motivo: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const comMulta = horasAntes < horasSemMulta;
  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <XCircle className="w-4 h-4 mr-1" /> Cancelar
      </Button>
    );
  }
  return (
    <div className="space-y-2 text-left max-w-sm ml-auto">
      <div className={`text-xs ${comMulta ? "text-destructive" : "text-muted-foreground"}`}>
        {comMulta
          ? `Atenção: cancelamento com menos de ${horasSemMulta}h gera multa de ${percentualMulta}% sobre o valor total + ponto negativo.`
          : `Cancelamento dentro do prazo: sem multa, porém com 1 ponto negativo na reputação.`}
      </div>
      <Textarea placeholder="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Voltar</Button>
        <Button
          size="sm"
          variant={comMulta ? "destructive" : "default"}
          onClick={() => {
            onConfirm(motivo || "Não informado");
            setOpen(false);
            setMotivo("");
          }}
        >
          Confirmar cancelamento
        </Button>
      </div>
    </div>
  );
}
