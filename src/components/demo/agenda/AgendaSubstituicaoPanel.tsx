/**
 * 18.1 — Substituição automática de profissional (DEMO).
 *
 * Fluxo testável:
 *   1) Selecionar profissional com agenda ocupada
 *   2) Cancelar agenda do profissional → identifica horários afetados
 *   3) Buscar substitutos → filtra profissionais aptos
 *   4) Avisar profissionais compatíveis → simula WhatsApp/e-mail
 *   5) Simular aceite do substituto → primeiro aceite assume
 *   6) Confirmar substituição → atualiza profId do agendamento
 *
 * Todas as mensagens DEMO levam o selo TESTE — DEMONSTRAÇÃO — VERSÃO TESTE.
 * Nada real é tocado; toda persistência é localStorage (useDemoState).
 */

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCog, Users, Send, CheckCircle2, AlertTriangle, RefreshCw, ScrollText, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { AgendaLog } from "@/lib/agendaLogs";
import { useDemoState, uid } from "@/lib/demoSandbox";

type Profissional = { id: string; nome: string; especialidade: string; cor: string };
type Servico = { id: string; nome: string; duracao: number; preco: number };
type Agendamento = {
  id: string;
  profId: string;
  servicoId: string;
  cliente: string;
  telefone: string;
  data: string;
  hora: string;
  status: "confirmado" | "pendente" | "cancelado" | "concluido";
};

export type SubstStatus =
  | "buscando"
  | "aviso_enviado"
  | "aguardando_aceite"
  | "substituto_confirmado"
  | "cliente_avisado"
  | "gestao_avisada"
  | "sem_substituto"
  | "cancelado"
  | "concluido";

export type SubstHistEntry = {
  id: string;
  data: string;
  hora: string;
  servico: string;
  cliente: string;
  profOriginal: string;
  novoProf?: string;
  status: SubstStatus;
  tempoAceiteSeg?: number;
  clienteAvisado: boolean;
  gestaoAvisada: boolean;
  iniciadoEm: string;
  finalizadoEm?: string;
};

const STATUS_LABEL: Record<SubstStatus, string> = {
  buscando: "Buscando substituto",
  aviso_enviado: "Aviso enviado aos profissionais",
  aguardando_aceite: "Aguardando aceite",
  substituto_confirmado: "Substituto confirmado",
  cliente_avisado: "Cliente avisado",
  gestao_avisada: "Gestão avisada",
  sem_substituto: "Sem substituto disponível",
  cancelado: "Cancelado por falta de substituto",
  concluido: "Concluído",
};

const SELO = "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE";

interface Props {
  profs: Profissional[];
  servs: Servico[];
  agds: Agendamento[];
  onUpdateAgds: (next: Agendamento[]) => void;
  avisarCliente: boolean;
  primeiroAceitar: boolean;
  filaSemSub: boolean;
  tarefaSemSub: boolean;
}

export function AgendaSubstituicaoPanel({
  profs,
  servs,
  agds,
  onUpdateAgds,
  avisarCliente,
  primeiroAceitar,
  filaSemSub,
  tarefaSemSub,
}: Props) {
  const [hist, setHist] = useDemoState<SubstHistEntry[]>("ag.subst.hist", []);
  const [profSel, setProfSel] = useState<string>("");
  const [busca, setBusca] = useState<{
    profOriginal: Profissional;
    afetados: Agendamento[];
    candidatos: Profissional[];
    avisoEnviado: boolean;
    aceitouId?: string;
    inicio: number;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMsg, setPreviewMsg] = useState<{ titulo: string; corpo: string }>({ titulo: "", corpo: "" });

  // ----- KPIs -----
  const kpi = useMemo(() => {
    const total = hist.length;
    const concluidas = hist.filter((h) => h.status === "concluido" || h.status === "substituto_confirmado").length;
    const abertas = hist.filter((h) => ["buscando", "aviso_enviado", "aguardando_aceite"].includes(h.status)).length;
    const semSub = hist.filter((h) => h.status === "sem_substituto" || h.status === "cancelado").length;
    const temposAceite = hist.map((h) => h.tempoAceiteSeg).filter((n): n is number => typeof n === "number" && n > 0);
    const tempoMedio = temposAceite.length ? Math.round(temposAceite.reduce((a, b) => a + b, 0) / temposAceite.length) : 0;
    const cancelamentosPorProf: Record<string, number> = {};
    const assumidasPorProf: Record<string, number> = {};
    hist.forEach((h) => {
      cancelamentosPorProf[h.profOriginal] = (cancelamentosPorProf[h.profOriginal] ?? 0) + 1;
      if (h.novoProf) assumidasPorProf[h.novoProf] = (assumidasPorProf[h.novoProf] ?? 0) + 1;
    });
    const topAssume = Object.entries(assumidasPorProf).sort((a, b) => b[1] - a[1])[0];
    const topCancela = Object.entries(cancelamentosPorProf).sort((a, b) => b[1] - a[1])[0];
    return { total, concluidas, abertas, semSub, tempoMedio, topAssume, topCancela };
  }, [hist]);

  // ----- Helpers -----
  function profById(id: string) {
    return profs.find((p) => p.id === id);
  }
  function servById(id: string) {
    return servs.find((s) => s.id === id);
  }
  function listarAfetados(profId: string) {
    return agds.filter((a) => a.profId === profId && (a.status === "confirmado" || a.status === "pendente"));
  }
  function candidatosCompativeis(profOriginal: Profissional, afetados: Agendamento[]) {
    // mesmo grupo de especialidade, exclui o original e os que já têm conflito
    return profs.filter((p) => {
      if (p.id === profOriginal.id) return false;
      if (p.especialidade !== profOriginal.especialidade) return false;
      // não pode ter agendamento confirmado no mesmo dia/hora
      const conflito = afetados.some((af) =>
        agds.some((x) => x.profId === p.id && x.data === af.data && x.hora === af.hora && x.status !== "cancelado"),
      );
      return !conflito;
    });
  }

  // ----- Ações -----
  function iniciarCancelamento() {
    if (!profSel) {
      toast.error("Selecione um profissional.");
      return;
    }
    const prof = profById(profSel);
    if (!prof) return;
    const afetados = listarAfetados(profSel);
    if (afetados.length === 0) {
      toast.message(`${prof.nome} não tem agendamentos confirmados.`, {
        description: "Cadastre um agendamento na aba “Novo agendamento” para testar a substituição.",
      });
      return;
    }
    const candidatos = candidatosCompativeis(prof, afetados);
    AgendaLog.substCancelouAgenda(prof.nome);
    AgendaLog.substAfetadosIdentificados(prof.nome, afetados.length);
    AgendaLog.substBuscaIniciada(prof.nome);
    AgendaLog.substCompativeisEncontrados(candidatos.length);
    setBusca({ profOriginal: prof, afetados, candidatos, avisoEnviado: false, inicio: Date.now() });
    toast.success(`${afetados.length} horário(s) afetado(s). ${candidatos.length} substituto(s) compatível(is).`);
  }

  function avisarCompativeis() {
    if (!busca) return;
    if (busca.candidatos.length === 0) {
      toast.error("Nenhum profissional compatível para avisar.");
      return;
    }
    AgendaLog.substAvisoEnviado(busca.candidatos.length, "whatsapp");
    setBusca({ ...busca, avisoEnviado: true });
    toast.success(`Aviso simulado enviado a ${busca.candidatos.length} profissional(is). ${SELO}`);
  }

  function verPreviaAviso() {
    if (!busca) return;
    const ag = busca.afetados[0];
    const serv = servById(ag.servicoId);
    setPreviewMsg({
      titulo: "Aviso aos profissionais compatíveis (WhatsApp/E-mail)",
      corpo:
        `${SELO}. Um horário ficou disponível para substituição: ` +
        `${serv?.nome ?? "serviço"}, em ${ag.data} às ${ag.hora}. ` +
        `O primeiro profissional compatível que aceitar assumirá este atendimento.`,
    });
    setPreviewOpen(true);
  }

  function simularAceite(candidatoId: string) {
    if (!busca) return;
    // se primeiroAceitar=false, simulamos que pode haver corrida; aqui sempre confirma o clicado
    const novo = busca.candidatos.find((p) => p.id === candidatoId);
    if (!novo) return;
    // verifica novamente disponibilidade (no DEMO sempre livre, mas registramos)
    if (busca.aceitouId && busca.aceitouId !== candidatoId && primeiroAceitar) {
      AgendaLog.substHorarioJaAssumido(novo.nome);
      toast.message("Este horário já foi assumido por outro profissional.", { description: SELO });
      return;
    }
    setBusca({ ...busca, aceitouId: candidatoId });
    AgendaLog.substAceito(novo.nome, busca.afetados[0]?.cliente ?? "—");
    toast.success(`${novo.nome} aceitou a substituição. ${SELO}`);
  }

  function confirmarSubstituicao() {
    if (!busca || !busca.aceitouId) {
      toast.error("Selecione um profissional que aceitou para confirmar.");
      return;
    }
    const novo = profById(busca.aceitouId);
    if (!novo) return;
    const tempo = Math.max(1, Math.round((Date.now() - busca.inicio) / 1000));
    // atualiza agendamentos: troca profId pelo novo
    const idsAfetados = new Set(busca.afetados.map((a) => a.id));
    const next = agds.map((a) => (idsAfetados.has(a.id) ? { ...a, profId: novo.id, status: "confirmado" as const } : a));
    onUpdateAgds(next);

    // logs
    busca.afetados.forEach((af) => {
      AgendaLog.substHorarioAssumido(novo.nome, af.cliente);
      if (avisarCliente) AgendaLog.substClienteAvisado(af.cliente, "whatsapp");
      AgendaLog.substGestaoAvisada(af.cliente);
      AgendaLog.substConcluida(af.cliente, novo.nome);
    });

    // histórico
    const novos: SubstHistEntry[] = busca.afetados.map((af) => ({
      id: uid(),
      data: af.data,
      hora: af.hora,
      servico: servById(af.servicoId)?.nome ?? "—",
      cliente: af.cliente,
      profOriginal: busca.profOriginal.nome,
      novoProf: novo.nome,
      status: "concluido",
      tempoAceiteSeg: tempo,
      clienteAvisado: avisarCliente,
      gestaoAvisada: true,
      iniciadoEm: new Date(busca.inicio).toISOString(),
      finalizadoEm: new Date().toISOString(),
    }));
    setHist([...novos, ...hist]);
    AgendaLog.dashboardAtualizado();
    toast.success(`Substituição confirmada para ${busca.afetados.length} horário(s). ${SELO}`);
    setBusca(null);
    setProfSel("");
  }

  function semSubstituto() {
    if (!busca) return;
    busca.afetados.forEach((af) => {
      AgendaLog.substSemSubstituto(af.cliente);
      if (tarefaSemSub) AgendaLog.substTarefaRecepcao(af.cliente);
      if (filaSemSub) AgendaLog.filaAdicionada(af.cliente);
    });
    const novos: SubstHistEntry[] = busca.afetados.map((af) => ({
      id: uid(),
      data: af.data,
      hora: af.hora,
      servico: servById(af.servicoId)?.nome ?? "—",
      cliente: af.cliente,
      profOriginal: busca.profOriginal.nome,
      status: "sem_substituto",
      clienteAvisado: false,
      gestaoAvisada: true,
      iniciadoEm: new Date(busca.inicio).toISOString(),
      finalizadoEm: new Date().toISOString(),
    }));
    setHist([...novos, ...hist]);
    toast.message("Nenhum profissional aceitou. Recepção foi acionada.", { description: SELO });
    setBusca(null);
    setProfSel("");
  }

  function cancelarBusca() {
    setBusca(null);
  }

  // ----- Render -----
  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold">Substituição automática de profissional</div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Quando um profissional cancela a agenda, o sistema identifica os horários afetados, busca substitutos
                aptos, avisa os compatíveis e confirma para o primeiro que aceitar — sem depender da recepção correndo
                atrás manualmente.
              </p>
            </div>
          </div>
          <Badge variant="outline">DEMONSTRAÇÃO — VERSÃO TESTE</Badge>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Substituições abertas" value={String(kpi.abertas)} />
        <KPI label="Substituições concluídas" value={String(kpi.concluidas)} accent />
        <KPI label="Sem substituto" value={String(kpi.semSub)} />
        <KPI label="Tempo médio até aceite" value={kpi.tempoMedio ? `${kpi.tempoMedio}s` : "—"} />
      </div>
      {(kpi.topAssume || kpi.topCancela) && (
        <Card className="p-4 grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Quem mais assume substituições</div>
            <div className="font-medium">{kpi.topAssume ? `${kpi.topAssume[0]} (${kpi.topAssume[1]})` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Quem mais cancela agenda</div>
            <div className="font-medium">{kpi.topCancela ? `${kpi.topCancela[0]} (${kpi.topCancela[1]})` : "—"}</div>
          </div>
        </Card>
      )}

      {/* Simulador */}
      <Card className="p-5 space-y-4">
        <div className="font-medium text-sm">Simular cancelamento de profissional</div>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <Label className="text-xs">Profissional com agenda ocupada</Label>
            <Select value={profSel} onValueChange={setProfSel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {profs.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    Cadastre profissionais primeiro
                  </SelectItem>
                ) : (
                  profs.map((p) => {
                    const qtd = listarAfetados(p.id).length;
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} — {p.especialidade} {qtd > 0 ? `(${qtd} horário(s))` : "(sem agenda)"}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={iniciarCancelamento} disabled={!profSel || !!busca}>
            <AlertTriangle className="w-4 h-4 mr-1" /> Cancelar agenda do profissional
          </Button>
        </div>
      </Card>

      {/* Fluxo ativo */}
      {busca && (
        <Card className="p-5 space-y-4 border-primary/40">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold text-sm">
                Busca por substituto — {busca.profOriginal.nome}
              </div>
              <div className="text-xs text-muted-foreground">
                {busca.afetados.length} horário(s) afetado(s) · {busca.candidatos.length} compatível(is)
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={verPreviaAviso}>
                Ver prévia do aviso
              </Button>
              <Button size="sm" onClick={avisarCompativeis} disabled={busca.avisoEnviado || busca.candidatos.length === 0}>
                <Send className="w-4 h-4 mr-1" />
                {busca.avisoEnviado ? "Aviso enviado" : "Avisar profissionais compatíveis"}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelarBusca}>
                Voltar
              </Button>
            </div>
          </div>

          {/* Horários afetados */}
          <div>
            <div className="text-xs font-medium mb-1">Horários afetados</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {busca.afetados.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.cliente}</TableCell>
                    <TableCell>{servById(a.servicoId)?.nome ?? "—"}</TableCell>
                    <TableCell>{a.data}</TableCell>
                    <TableCell>{a.hora}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Candidatos */}
          <div>
            <div className="text-xs font-medium mb-1">Profissionais compatíveis</div>
            {busca.candidatos.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md">
                Nenhum profissional compatível encontrado para este horário.
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={semSubstituto}>
                    Encerrar como “sem substituto”
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {busca.candidatos.map((p) => {
                    const aceitou = busca.aceitouId === p.id;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: p.cor }} />
                            {p.nome}
                          </span>
                        </TableCell>
                        <TableCell>{p.especialidade}</TableCell>
                        <TableCell>
                          {aceitou ? (
                            <Badge>Aceitou</Badge>
                          ) : busca.aceitouId && primeiroAceitar ? (
                            <Badge variant="outline">Vaga preenchida</Badge>
                          ) : busca.avisoEnviado ? (
                            <Badge variant="outline">Avisado</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                AgendaLog.substRecusado(p.nome);
                                toast.message(`${p.nome} recusou (simulado).`, { description: SELO });
                              }}
                              disabled={aceitou}
                            >
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => simularAceite(p.id)}
                              disabled={!!busca.aceitouId && !aceitou && primeiroAceitar}
                            >
                              {aceitou ? "Aceito" : "Simular aceite"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {busca.aceitouId && (
            <div className="flex justify-end">
              <Button onClick={confirmarSubstituicao}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Confirmar substituição
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Histórico */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-sm">Substituições recentes</div>
          {hist.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setHist([]);
                toast.success("Histórico de substituições limpo.");
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Limpar histórico
            </Button>
          )}
        </div>
        {hist.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma substituição registrada ainda. Simule um cancelamento acima para testar o fluxo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Novo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tempo até aceite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hist.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.data}</TableCell>
                  <TableCell>{h.hora}</TableCell>
                  <TableCell>{h.servico}</TableCell>
                  <TableCell>{h.profOriginal}</TableCell>
                  <TableCell>{h.novoProf ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={h.status === "concluido" ? "default" : "outline"}>{STATUS_LABEL[h.status]}</Badge>
                  </TableCell>
                  <TableCell>{h.tempoAceiteSeg ? `${h.tempoAceiteSeg}s` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal de prévia */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" /> {previewMsg.titulo}
            </DialogTitle>
            <DialogDescription>Ambiente: DEMO · canal: WhatsApp/E-mail · envio simulado</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/40 rounded-md p-3 text-sm whitespace-pre-line">{previewMsg.corpo}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    </Card>
  );
}

// Pequeno facilitador para o atalho de logs/dashboard a partir da aba.
export function SubstAtalhos({ onGoLogs, onGoDashboard }: { onGoLogs: () => void; onGoDashboard: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={onGoLogs}>
        <ScrollText className="w-4 h-4 mr-1" /> Ver logs
      </Button>
      <Button size="sm" variant="outline" onClick={onGoDashboard}>
        <LayoutDashboard className="w-4 h-4 mr-1" /> Ver dashboard
      </Button>
    </div>
  );
}
