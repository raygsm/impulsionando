import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, MessageSquare, Mail, Building2, DoorOpen, CalendarClock, Ban, UserRound, Tags } from "lucide-react";
import { toast } from "sonner";
import {
  loadResources,
  saveResources,
  newId,
  clienteLabel,
  DEMO_TAG,
  type AgendaResources,
  type Cliente,
  type Especialidade,
  type Unidade,
  type Sala,
  type Disponibilidade,
  type Bloqueio,
} from "@/lib/agendaResources";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AgendaRecursos({ nicho }: { nicho: string }) {
  const [res, setRes] = useState<AgendaResources>(() => loadResources());
  const labels = clienteLabel(nicho);

  function update(next: AgendaResources) {
    setRes(next);
    saveResources(next);
  }

  function log(action: string) {
    toast.success(`${DEMO_TAG} — ${action}`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 text-xs flex items-center justify-between gap-3 flex-wrap">
        <div>
          Recursos avançados da Agenda Online — cadastros, disponibilidade e bloqueios.
          Tudo em ambiente <strong>{DEMO_TAG}</strong>.
        </div>
        <Badge variant="outline">Lead DEMO</Badge>
      </Card>

      <Tabs defaultValue="clientes">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="clientes"><UserRound className="w-4 h-4 mr-1" />{labels.plural}</TabsTrigger>
          <TabsTrigger value="especialidades"><Tags className="w-4 h-4 mr-1" />Especialidades</TabsTrigger>
          <TabsTrigger value="unidades"><Building2 className="w-4 h-4 mr-1" />Unidades</TabsTrigger>
          <TabsTrigger value="salas"><DoorOpen className="w-4 h-4 mr-1" />Salas</TabsTrigger>
          <TabsTrigger value="disponibilidade"><CalendarClock className="w-4 h-4 mr-1" />Disponibilidade</TabsTrigger>
          <TabsTrigger value="bloqueios"><Ban className="w-4 h-4 mr-1" />Bloqueios</TabsTrigger>
        </TabsList>

        {/* CLIENTES */}
        <TabsContent value="clientes" className="mt-4 space-y-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Centralize o cadastro, histórico, comunicações e agendamentos de cada pessoa atendida.
            </p>
            <NovoCliente
              onCreate={(c) => {
                update({ ...res, clientes: [c, ...res.clientes] });
                log(`Cadastro de ${labels.singular.toLowerCase()} criado: ${c.nome}`);
              }}
            />
          </Card>
          <Card className="p-4">
            {res.clientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum {labels.singular.toLowerCase()} cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {res.clientes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell>{c.whatsapp}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" title="Enviar WhatsApp TESTE"
                            onClick={() => log(`WhatsApp TESTE enviado para ${c.nome}`)}>
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" title="Enviar e-mail TESTE"
                            onClick={() => log(`E-mail TESTE enviado para ${c.nome}`)}>
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            update({ ...res, clientes: res.clientes.filter((x) => x.id !== c.id) });
                            log("Cadastro fictício removido");
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* ESPECIALIDADES */}
        <TabsContent value="especialidades" className="mt-4 space-y-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Organize profissionais, serviços e filtros da agenda por especialidade.
            </p>
            <NovoSimples
              placeholder="Ex: Clínica Médica, Facial, Musculação, Cível"
              onCreate={(nome) => {
                update({ ...res, especialidades: [{ id: newId("esp"), nome, status: "ativo" }, ...res.especialidades] });
                log(`Especialidade criada: ${nome}`);
              }}
            />
          </Card>
          <Card className="p-4">
            {res.especialidades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma especialidade.</p>
            ) : (
              <ListaSimples
                itens={res.especialidades.map((e) => ({ id: e.id, nome: e.nome, status: e.status }))}
                onRemove={(id) => {
                  update({ ...res, especialidades: res.especialidades.filter((x) => x.id !== id) });
                  log("Especialidade removida");
                }}
                onToggle={(id) => {
                  update({
                    ...res,
                    especialidades: res.especialidades.map((x) =>
                      x.id === id ? { ...x, status: x.status === "ativo" ? "inativo" : "ativo" } : x,
                    ),
                  });
                }}
              />
            )}
          </Card>
        </TabsContent>

        {/* UNIDADES */}
        <TabsContent value="unidades" className="mt-4 space-y-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Cadastre unidades físicas, online ou pontos de atendimento para organizar agendas por local.
            </p>
            <NovaUnidade
              onCreate={(u) => {
                update({ ...res, unidades: [u, ...res.unidades] });
                log(`Unidade criada: ${u.nome}`);
              }}
            />
          </Card>
          <Card className="p-4">
            {res.unidades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem unidades.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cidade/UF</TableHead><TableHead>WhatsApp</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {res.unidades.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.nome}</TableCell>
                      <TableCell>{[u.cidade, u.estado].filter(Boolean).join("/") || "—"}</TableCell>
                      <TableCell>{u.whatsapp || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{u.status}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => {
                          update({ ...res, unidades: res.unidades.filter((x) => x.id !== u.id) });
                          log("Unidade removida");
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* SALAS */}
        <TabsContent value="salas" className="mt-4 space-y-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Cadastre salas, consultórios, mesas ou ambientes para controlar ocupação e evitar conflitos.
            </p>
            <NovaSala
              unidades={res.unidades}
              onCreate={(s) => {
                update({ ...res, salas: [s, ...res.salas] });
                log(`Sala criada: ${s.nome}`);
              }}
            />
          </Card>
          <Card className="p-4">
            {res.salas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem salas.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Unidade</TableHead><TableHead>Tipo</TableHead><TableHead>Cap.</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {res.salas.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.nome}</TableCell>
                      <TableCell>{res.unidades.find((u) => u.id === s.unidadeId)?.nome ?? "—"}</TableCell>
                      <TableCell>{s.tipo}</TableCell>
                      <TableCell>{s.capacidade ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => {
                            update({
                              ...res,
                              salas: res.salas.map((x) => x.id === s.id ? { ...x, status: x.status === "bloqueado" ? "disponivel" : "bloqueado" } : x),
                            });
                            log(s.status === "bloqueado" ? "Sala liberada" : "Sala bloqueada");
                          }}>{s.status === "bloqueado" ? "Liberar" : "Bloquear"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            update({ ...res, salas: res.salas.filter((x) => x.id !== s.id) });
                            log("Sala removida");
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* DISPONIBILIDADE */}
        <TabsContent value="disponibilidade" className="mt-4 space-y-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Configure a disponibilidade para que o sistema saiba quando cada profissional, serviço,
              sala ou unidade pode receber agendamentos.
            </p>
            <NovaDisponibilidade
              onCreate={(d) => {
                update({ ...res, disponibilidade: [d, ...res.disponibilidade] });
                log("Disponibilidade configurada");
              }}
            />
          </Card>
          <Card className="p-4">
            {res.disponibilidade.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem regras de disponibilidade.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Dia</TableHead><TableHead>Janela</TableHead><TableHead>Intervalo</TableHead><TableHead>Duração</TableHead><TableHead>Recorrência</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {res.disponibilidade.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{DIAS[d.diaSemana]}</TableCell>
                      <TableCell>{d.horaInicial} — {d.horaFinal}</TableCell>
                      <TableCell>{d.intervaloMin} min</TableCell>
                      <TableCell>{d.duracaoPadrao} min</TableCell>
                      <TableCell>{d.recorrencia}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => {
                          update({ ...res, disponibilidade: res.disponibilidade.filter((x) => x.id !== d.id) });
                          log("Disponibilidade removida");
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* BLOQUEIOS */}
        <TabsContent value="bloqueios" className="mt-4 space-y-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Use bloqueios para impedir agendamentos em horários, salas, unidades ou profissionais indisponíveis.
            </p>
            <NovoBloqueio
              onCreate={(b) => {
                update({ ...res, bloqueios: [b, ...res.bloqueios] });
                log(`Bloqueio criado: ${b.motivo}`);
              }}
            />
          </Card>
          <Card className="p-4">
            {res.bloqueios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem bloqueios cadastrados.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Período</TableHead><TableHead>Motivo</TableHead><TableHead>Afeta</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {res.bloqueios.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.tipo}</TableCell>
                      <TableCell>{b.dataInicio} → {b.dataFim}{b.horaInicio ? ` (${b.horaInicio}–${b.horaFim})` : ""}</TableCell>
                      <TableCell>{b.motivo}</TableCell>
                      <TableCell>{b.afetaAgendamentos ? "SIM" : "NÃO"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => {
                          update({ ...res, bloqueios: res.bloqueios.filter((x) => x.id !== b.id) });
                          log("Bloqueio removido");
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NovoCliente({ onCreate }: { onCreate: (c: Cliente) => void }) {
  const [f, setF] = useState({ nome: "", whatsapp: "", email: "" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">WhatsApp</Label><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
      <div><Label className="text-xs">E-mail</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.nome} onClick={() => {
        onCreate({ id: newId("cli"), nome: f.nome, whatsapp: f.whatsapp, email: f.email, status: "novo" });
        setF({ nome: "", whatsapp: "", email: "" });
      }}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
    </div>
  );
}

function NovoSimples({ placeholder, onCreate }: { placeholder: string; onCreate: (nome: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1"><Label className="text-xs">Nome</Label><Input placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} /></div>
      <Button className="bg-gradient-primary" disabled={!v} onClick={() => { onCreate(v); setV(""); }}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
    </div>
  );
}

function ListaSimples({
  itens,
  onRemove,
  onToggle,
}: {
  itens: { id: string; nome: string; status: string }[];
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
      <TableBody>
        {itens.map((i) => (
          <TableRow key={i.id}>
            <TableCell>{i.nome}</TableCell>
            <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onToggle(i.id)}>Ativar/Inativar</Button>
              <Button size="sm" variant="ghost" onClick={() => onRemove(i.id)}><Trash2 className="w-4 h-4" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function NovaUnidade({ onCreate }: { onCreate: (u: Unidade) => void }) {
  const [f, setF] = useState({ nome: "", cidade: "", estado: "", whatsapp: "" });
  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div className="sm:col-span-2"><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Cidade</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
      <div><Label className="text-xs">UF</Label><Input maxLength={2} value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value.toUpperCase() })} /></div>
      <div><Label className="text-xs">WhatsApp</Label><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
      <Button className="sm:col-span-5 bg-gradient-primary" disabled={!f.nome} onClick={() => {
        onCreate({ id: newId("uni"), ...f, status: "ativo" });
        setF({ nome: "", cidade: "", estado: "", whatsapp: "" });
      }}><Plus className="w-4 h-4 mr-1" />Adicionar unidade</Button>
    </div>
  );
}

function NovaSala({ unidades, onCreate }: { unidades: Unidade[]; onCreate: (s: Sala) => void }) {
  const [f, setF] = useState({ nome: "", unidadeId: "", tipo: "consultorio" as Sala["tipo"], capacidade: 1 });
  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Unidade</Label>
        <Select value={f.unidadeId} onValueChange={(v) => setF({ ...f, unidadeId: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>{unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Tipo</Label>
        <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v as Sala["tipo"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["consultorio", "reuniao", "procedimento", "online", "mesa", "aula", "externo", "evento", "outro"].map((t) =>
              <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Capacidade</Label><Input type="number" value={f.capacidade} onChange={(e) => setF({ ...f, capacidade: Number(e.target.value) })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.nome} onClick={() => {
        onCreate({ id: newId("sla"), nome: f.nome, unidadeId: f.unidadeId, tipo: f.tipo, capacidade: f.capacidade, status: "disponivel" });
        setF({ nome: "", unidadeId: "", tipo: "consultorio", capacidade: 1 });
      }}><Plus className="w-4 h-4 mr-1" />Adicionar sala</Button>
    </div>
  );
}

function NovaDisponibilidade({ onCreate }: { onCreate: (d: Disponibilidade) => void }) {
  const [f, setF] = useState({
    diaSemana: 1, horaInicial: "08:00", horaFinal: "18:00",
    intervaloMin: 0, duracaoPadrao: 30, recorrencia: "semanal" as Disponibilidade["recorrencia"],
  });
  return (
    <div className="grid sm:grid-cols-6 gap-2 items-end">
      <div><Label className="text-xs">Dia</Label>
        <Select value={String(f.diaSemana)} onValueChange={(v) => setF({ ...f, diaSemana: Number(v) })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{DIAS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Início</Label><Input type="time" value={f.horaInicial} onChange={(e) => setF({ ...f, horaInicial: e.target.value })} /></div>
      <div><Label className="text-xs">Fim</Label><Input type="time" value={f.horaFinal} onChange={(e) => setF({ ...f, horaFinal: e.target.value })} /></div>
      <div><Label className="text-xs">Intervalo (min)</Label><Input type="number" value={f.intervaloMin} onChange={(e) => setF({ ...f, intervaloMin: Number(e.target.value) })} /></div>
      <div><Label className="text-xs">Duração (min)</Label><Input type="number" value={f.duracaoPadrao} onChange={(e) => setF({ ...f, duracaoPadrao: Number(e.target.value) })} /></div>
      <div><Label className="text-xs">Recorrência</Label>
        <Select value={f.recorrencia} onValueChange={(v) => setF({ ...f, recorrencia: v as Disponibilidade["recorrencia"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="quinzenal">Quinzenal</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="unica">Única</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="sm:col-span-6 bg-gradient-primary" onClick={() => {
        onCreate({ id: newId("dsp"), ...f, ativo: true });
      }}><Plus className="w-4 h-4 mr-1" />Adicionar disponibilidade</Button>
    </div>
  );
}

function NovoBloqueio({ onCreate }: { onCreate: (b: Bloqueio) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    tipo: "profissional" as Bloqueio["tipo"],
    dataInicio: today, dataFim: today,
    horaInicio: "", horaFim: "",
    motivo: "Feriado", afetaAgendamentos: false, avisarEnvolvidos: true,
  });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Tipo</Label>
        <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v as Bloqueio["tipo"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["profissional", "sala", "unidade", "servico", "geral"].map((t) =>
              <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Data início</Label><Input type="date" value={f.dataInicio} onChange={(e) => setF({ ...f, dataInicio: e.target.value })} /></div>
      <div><Label className="text-xs">Data fim</Label><Input type="date" value={f.dataFim} onChange={(e) => setF({ ...f, dataFim: e.target.value })} /></div>
      <div><Label className="text-xs">Motivo</Label>
        <Select value={f.motivo} onValueChange={(v) => setF({ ...f, motivo: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Feriado", "Reunião interna", "Manutenção", "Ausência profissional", "Evento", "Férias", "Bloqueio administrativo", "Outro"].map((m) =>
              <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button className="sm:col-span-4 bg-gradient-primary" onClick={() => {
        onCreate({ id: newId("blk"), ...f });
      }}><Plus className="w-4 h-4 mr-1" />Criar bloqueio</Button>
    </div>
  );
}
