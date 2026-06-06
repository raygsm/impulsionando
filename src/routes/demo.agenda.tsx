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
import { Calendar, Clock, Users, Plus, Trash2, RotateCcw, Sparkles, ListChecks, Bell, Briefcase, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid, brl } from "@/lib/demoSandbox";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { gotoCrm, gotoWhatsapp } from "@/lib/demoCrossLink";

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
  const [aba, setAba] = useState<string>("grade");
  const [prefill, setPrefill] = useState<{ cliente: string; telefone: string } | null>(null);

  // Deep-link via ?cliente=&telefone= vindo de outros módulos (CRM/WhatsApp)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cliente = params.get("cliente");
    const telefone = params.get("telefone") ?? "";
    if (cliente) {
      setPrefill({ cliente, telefone });
      setAba("agendar");
    }
  }, []);

  const dash = useMemo(() => {
    const confirmados = agds.filter((a) => a.status === "confirmado").length;
    const concluidos = agds.filter((a) => a.status === "concluido");
    const cancelados = agds.filter((a) => a.status === "cancelado").length;
    const receita = concluidos.reduce((s, a) => s + (servs.find((x) => x.id === a.servicoId)?.preco ?? 0), 0);
    const ocupacao = profs.length && HORAS.length ? Math.round((agds.filter((a) => a.data === dataAtual).length / (profs.length * HORAS.length)) * 100) : 0;
    return { confirmados, concluidos: concluidos.length, cancelados, receita, ocupacao, total: agds.length };
  }, [agds, servs, profs, dataAtual]);

  function seed() {
    const p1: Profissional = { id: uid("pr"), nome: "Dra. Aline", especialidade: "Estética facial", cor: "#22c55e" };
    const p2: Profissional = { id: uid("pr"), nome: "Dr. Bruno", especialidade: "Massoterapia", cor: "#3b82f6" };
    setProfs([p1, p2]);
    const s1: Servico = { id: uid("sv"), nome: "Limpeza de pele", duracao: 60, preco: 180 };
    const s2: Servico = { id: uid("sv"), nome: "Massagem relaxante", duracao: 90, preco: 240 };
    const s3: Servico = { id: uid("sv"), nome: "Drenagem", duracao: 60, preco: 200 };
    setServs([s1, s2, s3]);
    const hoje = new Date().toISOString().slice(0, 10);
    setAgds([
      { id: uid("ag"), profId: p1.id, servicoId: s1.id, cliente: "Marina Souza", telefone: "(11) 90000-0001", data: hoje, hora: "09:00", status: "confirmado" },
      { id: uid("ag"), profId: p2.id, servicoId: s2.id, cliente: "Rafael Dias", telefone: "(11) 90000-0002", data: hoje, hora: "10:00", status: "pendente" },
      { id: uid("ag"), profId: p1.id, servicoId: s3.id, cliente: "Bia Camargo", telefone: "(11) 90000-0003", data: hoje, hora: "15:00", status: "concluido" },
    ]);
    setEspera([{ id: uid("es"), cliente: "Pedro Alves", telefone: "(11) 90000-0004", servicoId: s2.id, preferencia: "Quarta à tarde" }]);
    toast.success("Dados fictícios criados.");
  }

  function resetAll() {
    resetProfs(); resetServs(); resetAgds(); resetEspera(); resetParams();
    toast.message("Demonstração zerada.");
  }

  function alterarStatus(id: string, status: Agendamento["status"]) {
    setAgds((p) => p.map((a) => a.id === id ? { ...a, status } : a));
    toast.success(`Status atualizado: ${status}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Badge className="bg-gradient-primary mb-2">Demo interativa • dados fictícios</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold">Agenda & Reservas</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Profissionais, serviços, grade de horários, fila de espera e lembretes automáticos — testáveis nesta demo.
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
            <Button variant="outline" onClick={seed}><Sparkles className="w-4 h-4 mr-1" />Popular demo</Button>
            <Button variant="ghost" onClick={resetAll}><RotateCcw className="w-4 h-4 mr-1" />Zerar</Button>
          </div>
        </div>

        <Tabs value={aba} onValueChange={setAba} className="mt-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="grade"><Calendar className="w-4 h-4 mr-1" />Grade</TabsTrigger>
            <TabsTrigger value="profs"><Briefcase className="w-4 h-4 mr-1" />Profissionais</TabsTrigger>
            <TabsTrigger value="servs"><ListChecks className="w-4 h-4 mr-1" />Serviços</TabsTrigger>
            <TabsTrigger value="agendar"><Plus className="w-4 h-4 mr-1" />Novo agendamento</TabsTrigger>
            <TabsTrigger value="espera"><Users className="w-4 h-4 mr-1" />Fila de espera</TabsTrigger>
            <TabsTrigger value="painel"><Clock className="w-4 h-4 mr-1" />Painel</TabsTrigger>
            <TabsTrigger value="params"><Bell className="w-4 h-4 mr-1" />Parametrização</TabsTrigger>
          </TabsList>

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
                          const a = agds.find((x) => x.profId === p.id && x.data === dataAtual && x.hora === h);
                          if (!a) return <td key={p.id} className="p-2 text-muted-foreground">livre</td>;
                          return (
                            <td key={p.id} className="p-2">
                              <div className="rounded p-1.5" style={{ background: `${p.cor}22`, borderLeft: `3px solid ${p.cor}` }}>
                                <div className="font-medium">{a.cliente}</div>
                                <div className="text-[10px] text-muted-foreground">{servs.find((s) => s.id === a.servicoId)?.nome}</div>
                                <Badge variant="outline" className="text-[9px] mt-1">{a.status}</Badge>
                              </div>
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

          <TabsContent value="params" className="mt-4">
            <Card className="p-5 space-y-4">
              <ParamToggle label="Lembrete 24h antes" hint="WhatsApp/e-mail automático na véspera." value={params.lembrete24h} onChange={(v) => setParams({ ...params, lembrete24h: v })} />
              <ParamToggle label="Lembrete 1h antes" hint="Push final para reduzir no-show." value={params.lembrete1h} onChange={(v) => setParams({ ...params, lembrete1h: v })} />
              <ParamToggle label="Confirmação por WhatsApp" hint="Cliente confirma com 1 clique no link." value={params.confirmaWhats} onChange={(v) => setParams({ ...params, confirmaWhats: v })} />
              <ParamToggle label="Bloqueio em feriados" hint="Calendário oficial bloqueia agendamento." value={params.bloqueioFeriado} onChange={(v) => setParams({ ...params, bloqueioFeriado: v })} />
              <ParamToggle label="Reagendamento automático" hint="Cancelado libera horário para fila de espera." value={params.reagendamentoAuto} onChange={(v) => setParams({ ...params, reagendamentoAuto: v })} />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <PublicFooter />
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
  useEffect(() => {
    if (prefill?.cliente) setF((prev) => ({ ...prev, cliente: prefill.cliente, telefone: prefill.telefone ?? "" }));
  }, [prefill?.cliente, prefill?.telefone]);

  const conflito = useMemo(
    () => agds.find((a) => a.profId === f.profId && a.data === f.data && a.hora === f.hora && a.status !== "cancelado"),
    [agds, f.profId, f.data, f.hora],
  );

  function handleAgendar() {
    if (conflito) {
      const profNome = profs.find((p) => p.id === f.profId)?.nome ?? "este profissional";
      const ok = window.confirm(
        `Conflito de horário: ${profNome} já tem "${conflito.cliente}" às ${f.hora} em ${f.data}.\n\nDeseja agendar mesmo assim (gera double-booking)?`,
      );
      if (!ok) {
        toast.error("Agendamento cancelado por conflito.");
        return;
      }
      toast.warning("Atenção: agendamento duplicado criado no mesmo horário.");
    }
    onCreate({ id: uid("ag"), ...f, status: "confirmado" });
    setF({ ...f, cliente: "", telefone: "" });
    if (!conflito) toast.success("Agendamento criado");
  }

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
      {conflito && f.profId && (
        <div className="sm:col-span-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-2 text-xs text-amber-900 dark:text-amber-200">
          ⚠ Conflito: {profs.find((p) => p.id === f.profId)?.nome} já tem <strong>{conflito.cliente}</strong> às {f.hora} em {f.data}.
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
