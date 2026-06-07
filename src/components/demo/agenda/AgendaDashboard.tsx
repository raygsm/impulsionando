import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Download, Calendar, Users, Briefcase, Wallet, Bell, ListChecks, FileText } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { AgendaLog } from "@/lib/agendaLogs";
import { loadAgendaResources } from "@/lib/agendaResources";
import { loadAgendaFluxos } from "@/lib/agendaFluxos";
import { loadComunicacao } from "@/lib/agendaComunicacao";
import { labelsFor } from "@/lib/agendaNichos";

type Agendamento = {
  id: string; profId: string; servicoId: string; cliente: string; telefone: string;
  data: string; hora: string; status: "confirmado" | "pendente" | "cancelado" | "concluido";
};
type Profissional = { id: string; nome: string; especialidade: string; cor: string };
type Servico = { id: string; nome: string; duracao: number; preco: number };

const STATUS_COLORS: Record<string, string> = {
  confirmado: "#10b981",
  pendente: "#f59e0b",
  cancelado: "#ef4444",
  concluido: "#3b82f6",
};

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function startOfWeek(d: Date) {
  const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x;
}
function startOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function inRange(iso: string, from: Date, to: Date) { const d = new Date(iso + "T00:00:00"); return d >= from && d <= to; }

export function AgendaDashboard({
  nicho,
  onGoTab,
}: {
  nicho: string;
  onGoTab: (aba: string) => void;
}) {
  const labels = labelsFor(nicho);
  const [tick, setTick] = useState(0);
  const refresh = () => { setTick((t) => t + 1); AgendaLog.dashboardAtualizado(); toast.success("Dashboard atualizado."); };
  const [periodo, setPeriodo] = useState<"hoje" | "semana" | "mes">("hoje");
  const [filtroProf, setFiltroProf] = useState<string>("__all");
  const [filtroServ, setFiltroServ] = useState<string>("__all");
  const [filtroStatus, setFiltroStatus] = useState<string>("__all");

  const data = useMemo(() => {
    const profs = loadJson<Profissional[]>("imp.demo.ag.profs", []);
    const servs = loadJson<Servico[]>("imp.demo.ag.servs", []);
    const agds = loadJson<Agendamento[]>("imp.demo.ag.agds", []);
    const espera = loadJson<unknown[]>("imp.demo.ag.espera", []);
    const recursos = loadAgendaResources();
    const fluxos = loadAgendaFluxos();
    const comm = loadComunicacao();
    return { profs, servs, agds, espera, recursos, fluxos, comm };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const semIni = startOfWeek(hoje); const semFim = new Date(semIni); semFim.setDate(semFim.getDate()+6);
  const mesIni = startOfMonth(hoje); const mesFim = new Date(mesIni); mesFim.setMonth(mesFim.getMonth()+1); mesFim.setDate(0);

  const filt = useMemo(() => {
    const { agds } = data;
    return agds.filter((a) =>
      (filtroProf === "__all" || a.profId === filtroProf) &&
      (filtroServ === "__all" || a.servicoId === filtroServ) &&
      (filtroStatus === "__all" || a.status === filtroStatus));
  }, [data, filtroProf, filtroServ, filtroStatus]);

  const hojeISO = hoje.toISOString().slice(0,10);
  const noDia = filt.filter((a) => a.data === hojeISO);
  const naSemana = filt.filter((a) => inRange(a.data, semIni, semFim));
  const noMes = filt.filter((a) => inRange(a.data, mesIni, mesFim));

  const baseSet = periodo === "hoje" ? noDia : periodo === "semana" ? naSemana : noMes;
  const total = baseSet.length;
  const confirmados = baseSet.filter((a) => a.status === "confirmado").length;
  const pendentes = baseSet.filter((a) => a.status === "pendente").length;
  const cancelados = baseSet.filter((a) => a.status === "cancelado").length;
  const concluidos = baseSet.filter((a) => a.status === "concluido").length;
  const taxaConfirmacao = total ? Math.round((confirmados / total) * 100) : 0;
  const taxaCancelamento = total ? Math.round((cancelados / total) * 100) : 0;

  const pagamentos = data.fluxos.pagamentos ?? [];
  const aguardandoPag = pagamentos.filter((p) => p.status === "aguardando").length;
  const pagosDemo = pagamentos.filter((p) => p.status === "pago_demo" || p.status === "PAGO_DEMO" || p.status === "pago").length;
  const qrCodes = pagamentos.length;

  const envios = data.comm.envios ?? [];
  const enviosWhats = envios.filter((e) => e.canal === "whatsapp").length;
  const enviosEmail = envios.filter((e) => e.canal === "email").length;
  const enviosSms = envios.filter((e) => e.canal === "sms").length;
  const totalLembretes = envios.length;

  const fila = (data.fluxos.fila ?? []).length;
  const encaixes = (data.fluxos.encaixes ?? []).length;
  const retornos = (data.fluxos.retornos ?? []).length;
  const noShows = baseSet.filter((a) => a.status === "cancelado" && /no.?show/i.test((a as { motivo?: string }).motivo ?? "")).length;

  const horariosBloqueados = (data.recursos.bloqueios ?? []).length;
  const horariosLivres = Math.max(0, data.profs.length * 8 - noDia.length); // aproximação

  // gráficos
  const statusData = [
    { name: "Confirmado", value: confirmados, color: STATUS_COLORS.confirmado },
    { name: "Pendente", value: pendentes, color: STATUS_COLORS.pendente },
    { name: "Cancelado", value: cancelados, color: STATUS_COLORS.cancelado },
    { name: "Concluído", value: concluidos, color: STATUS_COLORS.concluido },
  ];
  const porProfissional = data.profs.map((p) => ({
    nome: p.nome, total: baseSet.filter((a) => a.profId === p.id).length,
  }));
  const porServico = data.servs.map((s) => ({
    nome: s.nome, total: baseSet.filter((a) => a.servicoId === s.id).length,
  }));
  const porHora = (() => {
    const map: Record<string, number> = {};
    baseSet.forEach((a) => { map[a.hora] = (map[a.hora] ?? 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([hora, total]) => ({ hora, total }));
  })();
  const ocupacaoPorDia = (() => {
    const map: Record<string, number> = {};
    naSemana.forEach((a) => { map[a.data] = (map[a.data] ?? 0) + 1; });
    return Object.entries(map).sort().map(([dia, total]) => ({ dia: dia.slice(5), total }));
  })();
  const lembretesPorCanal = [
    { canal: "WhatsApp", total: enviosWhats },
    { canal: "E-mail", total: enviosEmail },
    { canal: "SMS", total: enviosSms },
  ];

  function exportar() {
    AgendaLog.ctaClicado("exportar_demo");
    toast.message("Exportação preparada para próxima fase técnica.");
  }

  useEffect(() => { /* refresh on mount */ }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-lg">Dashboard da Agenda Online</div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            O dashboard mostra a operação em tempo real: horários ocupados, confirmações, cancelamentos,
            no-show, pagamentos simulados, fila de espera, comunicações e desempenho por profissional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">DEMONSTRAÇÃO — VERSÃO TESTE</Badge>
          <Button size="sm" variant="outline" onClick={refresh}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar</Button>
          <Button size="sm" variant="ghost" onClick={exportar}><Download className="w-3.5 h-3.5 mr-1" /> Exportar demo</Button>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-3 flex flex-wrap items-end gap-2 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">Período</div>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as typeof periodo)}>
            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">{labels.profissional}</div>
          <Select value={filtroProf} onValueChange={setFiltroProf}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              {data.profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">{labels.servico}</div>
          <Select value={filtroServ} onValueChange={setFiltroServ}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              {data.servs.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Status</div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-muted-foreground">Ambiente: DEMO</div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <KPI label="Hoje" value={noDia.length} icon={<Calendar className="w-3.5 h-3.5" />} />
        <KPI label="Semana" value={naSemana.length} />
        <KPI label="Mês" value={noMes.length} />
        <KPI label="Confirmados" value={confirmados} accent />
        <KPI label="Aguardando confirmação" value={pendentes} />
        <KPI label="Aguardando pagamento" value={aguardandoPag} />
        <KPI label="PAGO — DEMO" value={pagosDemo} accent />
        <KPI label="Cancelados" value={cancelados} />
        <KPI label="Reagendados" value={baseSet.filter((a) => a.status === "pendente" && /reag/i.test(a.cliente)).length} />
        <KPI label="No-show" value={noShows} />
        <KPI label="Atendidos" value={concluidos} />
        <KPI label="Retornos programados" value={retornos} />
        <KPI label="Fila de espera" value={fila} />
        <KPI label="Encaixes" value={encaixes} />
        <KPI label="Horários livres" value={horariosLivres} />
        <KPI label="Horários bloqueados" value={horariosBloqueados} />
        <KPI label="QR Codes demo" value={qrCodes} />
        <KPI label="Pagamentos simulados" value={pagamentos.length} />
        <KPI label="Lembretes enviados" value={totalLembretes} />
        <KPI label="WhatsApps simulados" value={enviosWhats} />
        <KPI label="E-mails simulados" value={enviosEmail} />
        <KPI label="Tx. confirmação" value={`${taxaConfirmacao}%`} />
        <KPI label="Tx. cancelamento" value={`${taxaCancelamento}%`} />
        <KPI label="Tx. no-show" value={`${total ? Math.round((noShows / total) * 100) : 0}%`} />
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Agenda por status</div>
          <ChartBox>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70} label>
                {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartBox>
        </Card>
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Por {labels.profissional.toLowerCase()}</div>
          <ChartBox>
            <BarChart data={porProfissional}>
              <XAxis dataKey="nome" hide /><YAxis /><Tooltip />
              <Bar dataKey="total" fill="hsl(var(--primary))" />
            </BarChart>
          </ChartBox>
        </Card>
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Por {labels.servico.toLowerCase()}</div>
          <ChartBox>
            <BarChart data={porServico}>
              <XAxis dataKey="nome" hide /><YAxis /><Tooltip />
              <Bar dataKey="total" fill="#10b981" />
            </BarChart>
          </ChartBox>
        </Card>
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Ocupação por dia (semana)</div>
          <ChartBox>
            <LineChart data={ocupacaoPorDia}>
              <XAxis dataKey="dia" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" />
            </LineChart>
          </ChartBox>
        </Card>
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Horários mais procurados</div>
          <ChartBox>
            <BarChart data={porHora}>
              <XAxis dataKey="hora" /><YAxis /><Tooltip />
              <Bar dataKey="total" fill="#f59e0b" />
            </BarChart>
          </ChartBox>
        </Card>
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Lembretes por canal</div>
          <ChartBox>
            <BarChart data={lembretesPorCanal}>
              <XAxis dataKey="canal" /><YAxis /><Tooltip />
              <Bar dataKey="total" fill="#8b5cf6" />
            </BarChart>
          </ChartBox>
        </Card>
      </div>

      {/* Top serviços / profissionais */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Top {labels.servicoPlural.toLowerCase()} mais agendados</div>
          <Table>
            <TableHeader><TableRow><TableHead>{labels.servico}</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...porServico].sort((a, b) => b.total - a.total).slice(0, 5).map((s) => (
                <TableRow key={s.nome}><TableCell>{s.nome}</TableCell><TableCell className="text-right">{s.total}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Top {labels.profissionalPlural.toLowerCase()} mais demandados</div>
          <Table>
            <TableHeader><TableRow><TableHead>{labels.profissional}</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...porProfissional].sort((a, b) => b.total - a.total).slice(0, 5).map((p) => (
                <TableRow key={p.nome}><TableCell>{p.nome}</TableCell><TableCell className="text-right">{p.total}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Atalhos */}
      <Card className="p-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onGoTab("grade")}><Calendar className="w-3.5 h-3.5 mr-1" /> Ver agendamentos</Button>
        <Button size="sm" variant="outline" onClick={() => onGoTab("profs")}><Briefcase className="w-3.5 h-3.5 mr-1" /> Ver {labels.profissionalPlural.toLowerCase()}</Button>
        <Button size="sm" variant="outline" onClick={() => onGoTab("fluxos")}><Wallet className="w-3.5 h-3.5 mr-1" /> Ver pagamentos</Button>
        <Button size="sm" variant="outline" onClick={() => onGoTab("fluxos")}><Users className="w-3.5 h-3.5 mr-1" /> Ver fila de espera</Button>
        <Button size="sm" variant="outline" onClick={() => onGoTab("grade")}><ListChecks className="w-3.5 h-3.5 mr-1" /> Ver no-show</Button>
        <Button size="sm" variant="outline" onClick={() => onGoTab("logs")}><FileText className="w-3.5 h-3.5 mr-1" /> Ver logs</Button>
        <Button size="sm" variant="ghost" onClick={() => onGoTab("comunicacao")}><Bell className="w-3.5 h-3.5 mr-1" /> Comunicação</Button>
      </Card>
    </div>
  );
}

function KPI({ label, value, accent, icon }: { label: string; value: number | string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <Card className={`p-3 ${accent ? "border-primary/40" : ""}`}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}{label}
      </div>
      <div className={`text-xl font-bold mt-0.5 ${accent ? "text-primary" : ""}`}>{value}</div>
    </Card>
  );
}

function ChartBox({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}
