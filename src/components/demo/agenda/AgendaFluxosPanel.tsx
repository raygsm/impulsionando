import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, QrCode, Globe, Ban, UserX, Users, Zap, Repeat, Star, Plus, Trash2, Copy, MessageSquare, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  loadFluxos, saveFluxos, appendLog, newId, CANCEL_MOTIVOS, ENCAIXE_MOTIVOS,
  type AgendaFluxos, type DemoPagamento, type Cancelamento, type NoShow,
  type FilaItem, type Encaixe, type RetornoProgramado, type Pesquisa,
} from "@/lib/agendaFluxos";
import { clienteLabel, DEMO_TAG } from "@/lib/agendaResources";

const TAG = `TESTE — ${DEMO_TAG}`;

export function AgendaFluxosPanel({ nicho }: { nicho: string }) {
  const [f, setF] = useState<AgendaFluxos>(() => loadFluxos());
  const labels = clienteLabel(nicho);

  function persist(next: AgendaFluxos) { setF(next); saveFluxos(next); }
  function log(area: Parameters<typeof appendLog>[1], msg: string) {
    persist(appendLog(f, area, msg));
    toast.success(`${TAG} — ${msg}`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 text-xs flex items-center justify-between gap-3 flex-wrap">
        <div>
          Fluxos completos da Agenda Online — pagamento DEMO, QR Code, cancelamento, no-show, fila, encaixe, retorno e pesquisa.
          Ambiente <strong>{DEMO_TAG}</strong>. Nunca aciona cobrança real.
        </div>
        <Badge variant="outline">PAGO — DEMO</Badge>
      </Card>

      <Tabs defaultValue="publico">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="publico"><Globe className="w-4 h-4 mr-1" />Link público</TabsTrigger>
          <TabsTrigger value="pagamento"><CreditCard className="w-4 h-4 mr-1" />Pagamento DEMO</TabsTrigger>
          <TabsTrigger value="cancelar"><Ban className="w-4 h-4 mr-1" />Cancelamento</TabsTrigger>
          <TabsTrigger value="noshow"><UserX className="w-4 h-4 mr-1" />No-show</TabsTrigger>
          <TabsTrigger value="fila"><Users className="w-4 h-4 mr-1" />Fila de espera</TabsTrigger>
          <TabsTrigger value="encaixe"><Zap className="w-4 h-4 mr-1" />Encaixes</TabsTrigger>
          <TabsTrigger value="retorno"><Repeat className="w-4 h-4 mr-1" />Retornos</TabsTrigger>
          <TabsTrigger value="pesquisa"><Star className="w-4 h-4 mr-1" />Pesquisa</TabsTrigger>
        </TabsList>

        <TabsContent value="publico" className="mt-4">
          <AgendamentoPublico
            singular={labels.singular}
            onConfirm={(payload) => log("agendamento", `Agendamento online criado: ${payload.cliente} — ${payload.servico} ${payload.data} ${payload.hora}`)}
          />
        </TabsContent>

        <TabsContent value="pagamento" className="mt-4 space-y-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-2">
              O pagamento nesta demonstração é fictício e serve apenas para simular a confirmação automática do horário.
            </p>
            <NovoPagamento
              onCreate={async (p) => {
                const qr = await QRCode.toDataURL(JSON.stringify({
                  agendamentoId: p.agendamentoId, modulo: "agenda_online", ambiente: "DEMO",
                  cliente: p.cliente, servico: p.servico, valor: p.valor, status: p.status,
                  geradoEm: p.geradoEm, marker: "DEMO_QR_NO_REAL_VALUE",
                }), { width: 240, margin: 1 });
                const next = appendLog({ ...f, pagamentos: [{ ...p, qrPayload: qr }, ...f.pagamentos] }, "pagamento",
                  `Cobrança DEMO gerada para ${p.cliente} (${p.servico}) — R$ ${p.valor}`);
                persist(next);
              }}
            />
          </Card>
          <div className="grid md:grid-cols-2 gap-3">
            {f.pagamentos.length === 0 ? (
              <Card className="p-4 text-sm text-muted-foreground">Sem cobranças DEMO.</Card>
            ) : f.pagamentos.map((p) => (
              <Card key={p.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{p.cliente} — {p.servico}</div>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
                <div>Valor: <strong>R$ {p.valor.toFixed(2)}</strong></div>
                <div>Agendamento: <code>{p.agendamentoId}</code></div>
                {p.qrPayload && (
                  <div className="flex flex-col items-center gap-1 py-2">
                    <img src={p.qrPayload} alt="QR Code DEMO" className="w-40 h-40" />
                    <div className="text-[10px] text-center text-muted-foreground">QR Code gerado em ambiente de demonstração. Sem validade real.</div>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard?.writeText(`DEMO-${p.id}`);
                    log("pagamento", `Código fictício copiado: DEMO-${p.id}`);
                  }}><Copy className="w-3 h-3 mr-1" />Copiar código</Button>
                  <Button size="sm" variant="outline" onClick={() => log("pagamento", `QR enviado por WhatsApp TESTE para ${p.cliente}`)}>
                    <MessageSquare className="w-3 h-3 mr-1" />WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => log("pagamento", `QR enviado por e-mail TESTE para ${p.cliente}`)}>
                    <Mail className="w-3 h-3 mr-1" />E-mail
                  </Button>
                  <Button size="sm" className="bg-gradient-primary" onClick={() => {
                    const next = appendLog({
                      ...f,
                      pagamentos: f.pagamentos.map((x) => x.id === p.id ? { ...x, status: "pago_demo" } : x),
                    }, "pagamento", `PAGO — DEMO marcado para ${p.cliente}. Agendamento confirmado.`);
                    persist(next);
                  }}>Simular pagamento</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelar" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoCancelamento
              onConfirm={(c) => {
                const next = appendLog({ ...f, cancelamentos: [c, ...f.cancelamentos] }, "cancelamento",
                  `Cancelamento de ${c.cliente} — motivo: ${c.motivo}`);
                persist(next);
              }}
            />
          </Card>
          <ListaCard
            empty="Sem cancelamentos."
            items={f.cancelamentos.map((c) => ({
              id: c.id,
              cols: [c.cliente, c.motivo, c.quemCancelou, c.liberarHorario ? "Horário liberado" : "—", c.avisarFila ? "Fila avisada" : "—"],
            }))}
            headers={["Cliente", "Motivo", "Quem", "Horário", "Fila"]}
            onRemove={(id) => persist({ ...f, cancelamentos: f.cancelamentos.filter((x) => x.id !== id) })}
          />
        </TabsContent>

        <TabsContent value="noshow" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoNoShow
              singular={labels.singular}
              onConfirm={(n) => {
                const next = appendLog({ ...f, noShows: [n, ...f.noShows] }, "noshow",
                  `No-show registrado: ${n.cliente} — ${n.servico} (${n.data} ${n.hora})`);
                persist(next);
              }}
            />
          </Card>
          <ListaCard
            empty="Sem registros de no-show."
            items={f.noShows.map((n) => ({
              id: n.id,
              cols: [n.cliente, n.servico, `${n.data} ${n.hora}`, n.justificativa ?? "—"],
            }))}
            headers={[labels.singular, "Serviço", "Quando", "Justificativa"]}
            onRemove={(id) => persist({ ...f, noShows: f.noShows.filter((x) => x.id !== id) })}
          />
        </TabsContent>

        <TabsContent value="fila" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovaFila
              singular={labels.singular}
              onAdd={(item) => {
                const next = appendLog({ ...f, fila: [item, ...f.fila] }, "fila",
                  `${item.cliente} adicionado à fila para ${item.servico}`);
                persist(next);
              }}
            />
          </Card>
          <Card className="p-4">
            {f.fila.length === 0 ? <p className="text-sm text-muted-foreground">Fila vazia.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>{labels.singular}</TableHead><TableHead>Serviço</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {f.fila.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>{q.cliente}<div className="text-xs text-muted-foreground">{q.whatsapp}</div></TableCell>
                      <TableCell>{q.servico}</TableCell>
                      <TableCell><Badge variant="outline">{q.prioridade}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{q.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => {
                            const next = appendLog({
                              ...f,
                              fila: f.fila.map((x) => x.id === q.id ? { ...x, status: "avisado" } : x),
                            }, "fila", `WhatsApp TESTE de horário liberado enviado para ${q.cliente}`);
                            persist(next);
                          }}>Avisar</Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const next = appendLog({
                              ...f,
                              fila: f.fila.map((x) => x.id === q.id ? { ...x, status: "convertido" } : x),
                            }, "fila", `${q.cliente} convertido em agendamento`);
                            persist(next);
                          }}>Converter</Button>
                          <Button size="sm" variant="ghost" onClick={() => persist({ ...f, fila: f.fila.filter((x) => x.id !== q.id) })}>
                            <Trash2 className="w-4 h-4" />
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

        <TabsContent value="encaixe" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoEncaixe
              onCreate={(e) => {
                const next = appendLog({ ...f, encaixes: [e, ...f.encaixes] }, "encaixe",
                  `Encaixe criado para ${e.cliente} — motivo: ${e.motivo}`);
                persist(next);
              }}
            />
          </Card>
          <ListaCard
            empty="Sem encaixes."
            items={f.encaixes.map((e) => ({
              id: e.id,
              cols: [e.cliente, e.profissional, e.servico, `${e.data} ${e.hora}`, e.motivo, e.status],
            }))}
            headers={[labels.singular, "Profissional", "Serviço", "Quando", "Motivo", "Status"]}
            onRemove={(id) => persist({ ...f, encaixes: f.encaixes.filter((x) => x.id !== id) })}
          />
        </TabsContent>

        <TabsContent value="retorno" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoRetorno
              onCreate={(r) => {
                const next = appendLog({ ...f, retornos: [r, ...f.retornos] }, "retorno",
                  `Retorno sugerido para ${r.cliente} em ${r.prazoDias} dias (${r.dataSugerida})`);
                persist(next);
              }}
            />
          </Card>
          <ListaCard
            empty="Sem retornos programados."
            items={f.retornos.map((r) => ({
              id: r.id,
              cols: [r.cliente, r.servicoOrigem, r.profissional, `${r.prazoDias} dias → ${r.dataSugerida}`, r.canal, r.status],
            }))}
            headers={[labels.singular, "Serviço", "Profissional", "Prazo", "Canal", "Status"]}
            onRemove={(id) => persist({ ...f, retornos: f.retornos.filter((x) => x.id !== id) })}
          />
        </TabsContent>

        <TabsContent value="pesquisa" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovaPesquisa
              onCreate={(p) => {
                const next = appendLog({ ...f, pesquisas: [p, ...f.pesquisas] }, "pesquisa",
                  `Pesquisa pós-atendimento enviada para ${p.cliente} (${p.canal})`);
                persist(next);
              }}
            />
          </Card>
          <ListaCard
            empty="Sem pesquisas."
            items={f.pesquisas.map((p) => ({
              id: p.id,
              cols: [p.cliente, p.servico, p.profissional, `${p.nota}/5`, p.canal, p.status],
            }))}
            headers={[labels.singular, "Serviço", "Profissional", "Nota", "Canal", "Status"]}
            onRemove={(id) => persist({ ...f, pesquisas: f.pesquisas.filter((x) => x.id !== id) })}
          />
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <div className="font-medium text-sm mb-2">Logs internos da Agenda</div>
        {f.logs.length === 0 ? <p className="text-xs text-muted-foreground">Sem logs ainda.</p> : (
          <ul className="space-y-1 text-xs max-h-64 overflow-auto">
            {f.logs.slice(0, 50).map((l) => (
              <li key={l.id} className="flex gap-2 border-b pb-1">
                <Badge variant="outline" className="text-[9px]">{l.area}</Badge>
                <span className="text-muted-foreground">{new Date(l.at).toLocaleString("pt-BR")}</span>
                <span>{l.msg}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============== Sub-componentes ==============

function ListaCard({
  empty, items, headers, onRemove,
}: {
  empty: string;
  items: { id: string; cols: (string | number)[] }[];
  headers: string[];
  onRemove: (id: string) => void;
}) {
  return (
    <Card className="p-4">
      {items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <Table>
          <TableHeader><TableRow>{headers.map((h) => <TableHead key={h}>{h}</TableHead>)}<TableHead /></TableRow></TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                {it.cols.map((c, i) => <TableCell key={i}>{c}</TableCell>)}
                <TableCell><Button size="sm" variant="ghost" onClick={() => onRemove(it.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function AgendamentoPublico({ singular, onConfirm }: { singular: string; onConfirm: (p: { cliente: string; servico: string; data: string; hora: string }) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    servico: "", profissional: "", unidade: "", data: today, hora: "09:00",
    nome: "", whatsapp: "", email: "", cpf: "", obs: "", aceite: false,
  });
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Card className="p-6 text-center space-y-2">
        <Badge className="bg-gradient-primary">SUCESSO — DEMO</Badge>
        <h3 className="text-lg font-semibold">Agendamento criado com sucesso na demonstração.</h3>
        <p className="text-sm text-muted-foreground">Nenhuma cobrança real foi realizada.</p>
        <Button variant="outline" onClick={() => { setDone(false); setStep(1); }}>Simular outro</Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="text-xs text-muted-foreground">
        Simulação do link público de agendamento — visão do {singular.toLowerCase()}. Etapa {step} de 4.
      </div>
      {step === 1 && (
        <div className="space-y-2">
          <Label className="text-xs">Serviço desejado</Label>
          <Input placeholder="Ex: Consulta inicial" value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} />
          <Label className="text-xs">Profissional (opcional)</Label>
          <Input placeholder="Indiferente" value={form.profissional} onChange={(e) => setForm({ ...form, profissional: e.target.value })} />
          <Label className="text-xs">Unidade (opcional)</Label>
          <Input placeholder="Indiferente" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
          <Button className="bg-gradient-primary" disabled={!form.servico} onClick={() => setStep(2)}>Próximo</Button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <Label className="text-xs">Data</Label>
          <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          <Label className="text-xs">Horário</Label>
          <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button className="bg-gradient-primary" onClick={() => setStep(3)}>Próximo</Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-2">
          <Label className="text-xs">Nome completo</Label>
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Label className="text-xs">WhatsApp</Label>
          <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <Label className="text-xs">E-mail</Label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Label className="text-xs">CPF (se exigido)</Label>
          <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          <Label className="text-xs">Observação</Label>
          <Textarea rows={2} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={form.aceite} onCheckedChange={(v) => setForm({ ...form, aceite: v })} />
            Aceito as regras de agendamento, cancelamento e privacidade.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
            <Button className="bg-gradient-primary" disabled={!form.nome || !form.whatsapp || !form.aceite} onClick={() => setStep(4)}>Revisar</Button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-2 text-sm">
          <div className="rounded border p-3 space-y-1 text-xs bg-muted/30">
            <div><strong>{singular}:</strong> {form.nome}</div>
            <div><strong>WhatsApp:</strong> {form.whatsapp}</div>
            <div><strong>Serviço:</strong> {form.servico}</div>
            <div><strong>Quando:</strong> {form.data} {form.hora}</div>
            <div className="pt-1 text-muted-foreground">Origem: Agendamento Online — {DEMO_TAG}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>Voltar</Button>
            <Button className="bg-gradient-primary" onClick={() => {
              onConfirm({ cliente: form.nome, servico: form.servico, data: form.data, hora: form.hora });
              setDone(true);
            }}>Confirmar solicitação</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function NovoPagamento({ onCreate }: { onCreate: (p: DemoPagamento) => void }) {
  const [f, setF] = useState({ cliente: "", servico: "", valor: 100, agendamentoId: "" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Cliente</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">Serviço</Label><Input value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })} /></div>
      <div><Label className="text-xs">Valor R$</Label><Input type="number" value={f.valor} onChange={(e) => setF({ ...f, valor: Number(e.target.value) })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.cliente || !f.servico} onClick={() => {
        onCreate({
          id: newId("pag"),
          agendamentoId: f.agendamentoId || newId("agd"),
          cliente: f.cliente, servico: f.servico, valor: f.valor,
          status: "qr_gerado", geradoEm: new Date().toISOString(),
        });
        setF({ cliente: "", servico: "", valor: 100, agendamentoId: "" });
      }}><QrCode className="w-4 h-4 mr-1" />Gerar cobrança + QR DEMO</Button>
    </div>
  );
}

function NovoCancelamento({ onConfirm }: { onConfirm: (c: Cancelamento) => void }) {
  const [f, setF] = useState({
    cliente: "", motivo: "Cliente solicitou", quemCancelou: "Recepção",
    liberarHorario: true, avisarFila: true, registrarNoShow: false, criarTarefa: false,
  });
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-2 items-end">
        <div><Label className="text-xs">Cliente</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
        <div><Label className="text-xs">Motivo</Label>
          <Select value={f.motivo} onValueChange={(v) => setF({ ...f, motivo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CANCEL_MOTIVOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Quem cancelou</Label><Input value={f.quemCancelou} onChange={(e) => setF({ ...f, quemCancelou: e.target.value })} /></div>
        <Button className="sm:col-span-3 bg-gradient-primary" disabled={!f.cliente} onClick={() => setOpen(true)}>
          <Ban className="w-4 h-4 mr-1" />Cancelar agendamento
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cancelamento?</DialogTitle>
            <DialogDescription>{TAG}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><strong>Cliente:</strong> {f.cliente}</div>
            <div><strong>Motivo:</strong> {f.motivo}</div>
            <ToggleRow label="Liberar horário?" v={f.liberarHorario} onChange={(v) => setF({ ...f, liberarHorario: v })} />
            <ToggleRow label="Avisar fila de espera?" v={f.avisarFila} onChange={(v) => setF({ ...f, avisarFila: v })} />
            <ToggleRow label="Registrar no-show?" v={f.registrarNoShow} onChange={(v) => setF({ ...f, registrarNoShow: v })} />
            <ToggleRow label="Criar tarefa de recuperação?" v={f.criarTarefa} onChange={(v) => setF({ ...f, criarTarefa: v })} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Voltar</Button>
            <Button className="bg-gradient-primary" onClick={() => {
              onConfirm({
                id: newId("cnc"),
                agendamentoId: newId("agd"),
                cliente: f.cliente, motivo: f.motivo, quemCancelou: f.quemCancelou,
                liberarHorario: f.liberarHorario, avisarFila: f.avisarFila,
                registrarNoShow: f.registrarNoShow, criarTarefa: f.criarTarefa,
                at: new Date().toISOString(),
              });
              setF({ ...f, cliente: "" });
              setOpen(false);
            }}>Confirmar cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ToggleRow({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span>{label}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </div>
  );
}

function NovoNoShow({ singular, onConfirm }: { singular: string; onConfirm: (n: NoShow) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ cliente: "", servico: "", data: today, hora: "09:00", justificativa: "" });
  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div><Label className="text-xs">{singular}</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">Serviço</Label><Input value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })} /></div>
      <div><Label className="text-xs">Data</Label><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
      <div><Label className="text-xs">Hora</Label><Input type="time" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} /></div>
      <div><Label className="text-xs">Justificativa</Label><Input value={f.justificativa} onChange={(e) => setF({ ...f, justificativa: e.target.value })} /></div>
      <Button className="sm:col-span-5 bg-gradient-primary" disabled={!f.cliente} onClick={() => {
        onConfirm({ id: newId("nsh"), ...f, at: new Date().toISOString() });
        setF({ ...f, cliente: "", servico: "", justificativa: "" });
      }}><UserX className="w-4 h-4 mr-1" />Marcar no-show</Button>
    </div>
  );
}

function NovaFila({ singular, onAdd }: { singular: string; onAdd: (f: FilaItem) => void }) {
  const [f, setF] = useState({
    cliente: "", whatsapp: "", servico: "",
    profissionalDesejado: "", unidadeDesejada: "",
    preferenciaData: "", preferenciaHora: "",
    prioridade: "normal" as FilaItem["prioridade"], observacoes: "",
  });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">{singular}</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">WhatsApp</Label><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
      <div><Label className="text-xs">Serviço</Label><Input value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })} /></div>
      <div><Label className="text-xs">Prioridade</Label>
        <Select value={f.prioridade} onValueChange={(v) => setF({ ...f, prioridade: v as FilaItem["prioridade"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="sm:col-span-4 bg-gradient-primary" disabled={!f.cliente || !f.servico} onClick={() => {
        onAdd({ id: newId("fil"), ...f, status: "aguardando_horario", at: new Date().toISOString() });
        setF({ ...f, cliente: "", whatsapp: "", servico: "", observacoes: "" });
      }}><Plus className="w-4 h-4 mr-1" />Adicionar à fila</Button>
    </div>
  );
}

function NovoEncaixe({ onCreate }: { onCreate: (e: Encaixe) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    cliente: "", profissional: "", servico: "", unidade: "", sala: "",
    data: today, hora: "09:00", motivo: "Urgência", autorizadoPor: "Gestão",
    observacao: "", avisarEnvolvidos: true,
  });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Cliente</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">Profissional</Label><Input value={f.profissional} onChange={(e) => setF({ ...f, profissional: e.target.value })} /></div>
      <div><Label className="text-xs">Serviço</Label><Input value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })} /></div>
      <div><Label className="text-xs">Data</Label><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
      <div><Label className="text-xs">Hora</Label><Input type="time" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} /></div>
      <div><Label className="text-xs">Motivo</Label>
        <Select value={f.motivo} onValueChange={(v) => setF({ ...f, motivo: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ENCAIXE_MOTIVOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Autorizado por</Label><Input value={f.autorizadoPor} onChange={(e) => setF({ ...f, autorizadoPor: e.target.value })} /></div>
      <Button className="sm:col-span-4 bg-gradient-primary" disabled={!f.cliente || !f.profissional || !f.servico} onClick={() => {
        onCreate({ id: newId("enc"), ...f, status: "autorizado", at: new Date().toISOString() });
        setF({ ...f, cliente: "", profissional: "", servico: "", observacao: "" });
      }}><Zap className="w-4 h-4 mr-1" />Criar encaixe</Button>
    </div>
  );
}

function NovoRetorno({ onCreate }: { onCreate: (r: RetornoProgramado) => void }) {
  const [f, setF] = useState({
    cliente: "", servicoOrigem: "", profissional: "",
    prazoDias: 30, canal: "whatsapp" as RetornoProgramado["canal"],
  });
  const dataSugerida = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + f.prazoDias);
    return d.toISOString().slice(0, 10);
  }, [f.prazoDias]);
  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div><Label className="text-xs">Cliente</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">Serviço origem</Label><Input value={f.servicoOrigem} onChange={(e) => setF({ ...f, servicoOrigem: e.target.value })} /></div>
      <div><Label className="text-xs">Profissional</Label><Input value={f.profissional} onChange={(e) => setF({ ...f, profissional: e.target.value })} /></div>
      <div><Label className="text-xs">Prazo (dias)</Label><Input type="number" value={f.prazoDias} onChange={(e) => setF({ ...f, prazoDias: Number(e.target.value) })} /></div>
      <div><Label className="text-xs">Canal</Label>
        <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v as RetornoProgramado["canal"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="sm:col-span-5 bg-gradient-primary" disabled={!f.cliente || !f.servicoOrigem} onClick={() => {
        onCreate({
          id: newId("ret"),
          cliente: f.cliente, servicoOrigem: f.servicoOrigem, profissional: f.profissional,
          prazoDias: f.prazoDias, dataSugerida, canal: f.canal,
          status: "sugerido", at: new Date().toISOString(),
        });
        setF({ ...f, cliente: "", servicoOrigem: "", profissional: "" });
      }}><Repeat className="w-4 h-4 mr-1" />Programar retorno (sugestão: {dataSugerida})</Button>
    </div>
  );
}

function NovaPesquisa({ onCreate }: { onCreate: (p: Pesquisa) => void }) {
  const [f, setF] = useState({
    cliente: "", servico: "", profissional: "", nota: 5,
    comentario: "", canal: "whatsapp" as Pesquisa["canal"],
  });
  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div><Label className="text-xs">Cliente</Label><Input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
      <div><Label className="text-xs">Serviço</Label><Input value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })} /></div>
      <div><Label className="text-xs">Profissional</Label><Input value={f.profissional} onChange={(e) => setF({ ...f, profissional: e.target.value })} /></div>
      <div><Label className="text-xs">Nota</Label><Input type="number" min={1} max={5} value={f.nota} onChange={(e) => setF({ ...f, nota: Number(e.target.value) })} /></div>
      <div><Label className="text-xs">Canal</Label>
        <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v as Pesquisa["canal"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-4"><Label className="text-xs">Comentário</Label><Textarea rows={2} value={f.comentario} onChange={(e) => setF({ ...f, comentario: e.target.value })} /></div>
      <Button className="sm:col-span-5 bg-gradient-primary" disabled={!f.cliente} onClick={() => {
        const status: Pesquisa["status"] = f.nota <= 2 ? "avaliacao_baixa" : f.nota >= 4 ? "avaliacao_positiva" : "respondida";
        onCreate({ id: newId("psq"), ...f, status, at: new Date().toISOString() });
        setF({ ...f, cliente: "", servico: "", profissional: "", comentario: "" });
      }}><Star className="w-4 h-4 mr-1" />Enviar pesquisa</Button>
    </div>
  );
}
