import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Bell, MessageSquare, Mail, Zap, Users, ShieldCheck, Plus, Trash2, Eye, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  loadComunicacao,
  saveComunicacao,
  resetComunicacao,
  renderTemplate,
  EVENTOS_LABEL,
  PERFIS_LABEL,
  AREAS_PERMISSAO,
  _uid as uid,
  type ComunicacaoState,
  type Canal,
  type Lembrete,
  type ModeloMensagem,
  type Gatilho,
  type Automacao,
  type UsuarioDemo,
  type PerfilUsuario,
  type GatilhoEvento,
  type EnvioLog,
} from "@/lib/agendaComunicacao";

const CANAL_ICON: Record<Canal, React.ReactNode> = {
  whatsapp: <MessageSquare className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  sms: <MessageSquare className="w-3.5 h-3.5" />,
};

export function AgendaComunicacaoPanel({ nicho }: { nicho: string }) {
  const [state, setState] = useState<ComunicacaoState>(() => loadComunicacao());
  const [previewModelo, setPreviewModelo] = useState<ModeloMensagem | null>(null);

  function update(updater: (s: ComunicacaoState) => ComunicacaoState) {
    setState((prev) => {
      const next = updater(prev);
      saveComunicacao(next);
      return next;
    });
  }

  function pushEnvio(e: Omit<EnvioLog, "id" | "data" | "status">) {
    const entry: EnvioLog = { id: uid("en"), data: new Date().toISOString(), status: "enviado", ...e };
    update((s) => ({ ...s, envios: [entry, ...s.envios].slice(0, 50) }));
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Comunicação, automações, usuários e permissões</div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Tudo aqui é DEMONSTRAÇÃO. Mensagens disparadas levam o selo
            <strong> TESTE — DEMONSTRAÇÃO — VERSÃO TESTE</strong> e nada chega a clientes reais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Nicho: {nicho}</Badge>
          <Button size="sm" variant="ghost" onClick={() => setState(resetComunicacao())}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restaurar padrão
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="lembretes">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="lembretes"><Bell className="w-3.5 h-3.5 mr-1" />Lembretes</TabsTrigger>
          <TabsTrigger value="modelos"><MessageSquare className="w-3.5 h-3.5 mr-1" />Modelos</TabsTrigger>
          <TabsTrigger value="gatilhos"><Zap className="w-3.5 h-3.5 mr-1" />Gatilhos</TabsTrigger>
          <TabsTrigger value="automacoes"><Zap className="w-3.5 h-3.5 mr-1" />Automações</TabsTrigger>
          <TabsTrigger value="usuarios"><Users className="w-3.5 h-3.5 mr-1" />Usuários</TabsTrigger>
          <TabsTrigger value="permissoes"><ShieldCheck className="w-3.5 h-3.5 mr-1" />Permissões</TabsTrigger>
          <TabsTrigger value="logs"><Send className="w-3.5 h-3.5 mr-1" />Envios</TabsTrigger>
        </TabsList>

        {/* LEMBRETES */}
        <TabsContent value="lembretes" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoLembrete
              modelos={state.modelos}
              onCreate={(l) => update((s) => ({ ...s, lembretes: [l, ...s.lembretes] }))}
            />
          </Card>
          <Card className="p-4">
            {state.lembretes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem lembretes configurados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Antecedência</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.lembretes.map((l) => {
                    const m = state.modelos.find((x) => x.id === l.template);
                    return (
                      <TableRow key={l.id}>
                        <TableCell>{l.nome}</TableCell>
                        <TableCell><Badge variant="outline">{l.antecedencia}</Badge></TableCell>
                        <TableCell><span className="inline-flex items-center gap-1 text-xs">{CANAL_ICON[l.canal]} {l.canal}</span></TableCell>
                        <TableCell className="text-xs">{m?.nome ?? "—"}</TableCell>
                        <TableCell>
                          <Switch checked={l.ativo} onCheckedChange={(v) => update((s) => ({
                            ...s, lembretes: s.lembretes.map((x) => x.id === l.id ? { ...x, ativo: v } : x),
                          }))} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => {
                              if (!m) return;
                              pushEnvio({ canal: l.canal, para: "+55 11 9XXXX-XXXX (DEMO)", modelo: m.nome, evento: "Lembrete simulado" });
                              toast.success(`Lembrete ${l.antecedencia} simulado — selo TESTE adicionado.`);
                            }}>
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => update((s) => ({
                              ...s, lembretes: s.lembretes.filter((x) => x.id !== l.id),
                            }))}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* MODELOS */}
        <TabsContent value="modelos" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoModelo onCreate={(m) => update((s) => ({ ...s, modelos: [m, ...s.modelos] }))} />
          </Card>
          <div className="grid md:grid-cols-2 gap-2">
            {state.modelos.map((m) => (
              <Card key={m.id} className="p-3 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium flex items-center gap-1.5">{CANAL_ICON[m.canal]} {m.nome}</div>
                  <Badge variant="outline" className="text-[10px]">{m.canal}</Badge>
                </div>
                {m.assunto && <div className="text-xs text-muted-foreground">Assunto: {m.assunto}</div>}
                <div className="text-xs whitespace-pre-wrap line-clamp-3 text-muted-foreground">{m.corpo}</div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setPreviewModelo(m)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => update((s) => ({
                    ...s, modelos: s.modelos.filter((x) => x.id !== m.id),
                  }))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {m.marcaTeste && <span className="text-[10px] text-muted-foreground ml-auto">Selo TESTE: SIM</span>}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* GATILHOS */}
        <TabsContent value="gatilhos" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoGatilho
              modelos={state.modelos}
              onCreate={(g) => update((s) => ({ ...s, gatilhos: [g, ...s.gatilhos] }))}
            />
          </Card>
          <Card className="p-4">
            {state.gatilhos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum gatilho.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Quando</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.gatilhos.map((g) => {
                    const m = state.modelos.find((x) => x.id === g.modeloId);
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="text-xs">{EVENTOS_LABEL[g.evento]}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{g.delay ?? "imediato"}</Badge></TableCell>
                        <TableCell><span className="inline-flex items-center gap-1 text-xs">{CANAL_ICON[g.canal]} {g.canal}</span></TableCell>
                        <TableCell className="text-xs">{m?.nome ?? "—"}</TableCell>
                        <TableCell>
                          <Switch checked={g.ativo} onCheckedChange={(v) => update((s) => ({
                            ...s, gatilhos: s.gatilhos.map((x) => x.id === g.id ? { ...x, ativo: v } : x),
                          }))} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => {
                              if (!m) return;
                              pushEnvio({ canal: g.canal, para: "+55 11 9XXXX-XXXX (DEMO)", modelo: m.nome, evento: EVENTOS_LABEL[g.evento] });
                              toast.success(`Gatilho "${EVENTOS_LABEL[g.evento]}" disparado em DEMO.`);
                            }}>
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => update((s) => ({
                              ...s, gatilhos: s.gatilhos.filter((x) => x.id !== g.id),
                            }))}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* AUTOMAÇÕES */}
        <TabsContent value="automacoes" className="mt-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-2">
            {state.automacoes.map((a) => (
              <Card key={a.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {a.nome}</div>
                    <div className="text-xs text-muted-foreground">{a.descricao}</div>
                  </div>
                  <Switch checked={a.ativo} onCheckedChange={(v) => update((s) => ({
                    ...s, automacoes: s.automacoes.map((x) => x.id === a.id ? { ...x, ativo: v } : x),
                  }))} />
                </div>
                <ol className="text-xs list-decimal pl-5 space-y-0.5 text-muted-foreground">
                  {a.passos.map((p, i) => <li key={i}>{p}</li>)}
                </ol>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" disabled={!a.ativo} onClick={() => {
                    toast.success(`Automação "${a.nome}" simulada em DEMO. Logs gerados.`);
                  }}>
                    <Send className="w-3.5 h-3.5 mr-1" /> Simular execução
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* USUÁRIOS */}
        <TabsContent value="usuarios" className="mt-4 space-y-3">
          <Card className="p-4">
            <NovoUsuario onCreate={(u) => update((s) => ({ ...s, usuarios: [u, ...s.usuarios] }))} />
          </Card>
          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.perfil} onValueChange={(v) => update((s) => ({
                        ...s, usuarios: s.usuarios.map((x) => x.id === u.id ? { ...x, perfil: v as PerfilUsuario } : x),
                      }))}>
                        <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PERFIS_LABEL) as PerfilUsuario[]).map((p) =>
                            <SelectItem key={p} value={p}>{PERFIS_LABEL[p]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Switch checked={u.ativo} onCheckedChange={(v) => update((s) => ({
                        ...s, usuarios: s.usuarios.map((x) => x.id === u.id ? { ...x, ativo: v } : x),
                      }))} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => update((s) => ({
                        ...s, usuarios: s.usuarios.filter((x) => x.id !== u.id),
                      }))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* PERMISSÕES */}
        <TabsContent value="permissoes" className="mt-4 space-y-3">
          <Card className="p-4 text-xs text-muted-foreground">
            Matriz de permissões por perfil. Edite o que cada perfil pode ver/criar/editar/excluir.
            Em DEMO, nenhuma alteração afeta usuários reais.
          </Card>
          <Card className="p-3 overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2">Área</th>
                  {(Object.keys(PERFIS_LABEL) as PerfilUsuario[]).map((p) =>
                    <th key={p} className="text-left p-2">{PERFIS_LABEL[p]}</th>)}
                </tr>
              </thead>
              <tbody>
                {AREAS_PERMISSAO.map((area) => (
                  <tr key={area} className="border-t">
                    <td className="p-2 font-medium">{area}</td>
                    {(Object.keys(PERFIS_LABEL) as PerfilUsuario[]).map((perfil) => {
                      const perm = state.permissoes.find((x) => x.area === area && x.perfil === perfil);
                      if (!perm) return <td key={perfil} className="p-2">—</td>;
                      return (
                        <td key={perfil} className="p-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            {(["ver", "criar", "editar", "excluir"] as const).map((acao) => (
                              <label key={acao} className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-3 h-3"
                                  checked={perm.acoes[acao]}
                                  onChange={(e) => update((s) => ({
                                    ...s,
                                    permissoes: s.permissoes.map((x) =>
                                      x.area === area && x.perfil === perfil
                                        ? { ...x, acoes: { ...x.acoes, [acao]: e.target.checked } } : x),
                                  }))}
                                />
                                <span className="text-[10px]">{acao}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* LOGS DE ENVIO */}
        <TabsContent value="logs" className="mt-4 space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Últimos envios simulados</div>
              <Button size="sm" variant="ghost" onClick={() => update((s) => ({ ...s, envios: [] }))}>
                Limpar
              </Button>
            </div>
            {state.envios.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum envio ainda. Use "Simular" em Lembretes/Gatilhos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.envios.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.data).toLocaleString("pt-BR")}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1 text-xs">{CANAL_ICON[e.canal]} {e.canal}</span></TableCell>
                      <TableCell className="text-xs">{e.para}</TableCell>
                      <TableCell className="text-xs">{e.modelo}</TableCell>
                      <TableCell className="text-xs">{e.evento}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{e.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview modal */}
      <Dialog open={!!previewModelo} onOpenChange={(o) => !o && setPreviewModelo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewModelo && CANAL_ICON[previewModelo.canal]}
              Preview — {previewModelo?.nome}
            </DialogTitle>
            <DialogDescription>DEMONSTRAÇÃO — VERSÃO TESTE — variáveis substituídas com dados fictícios.</DialogDescription>
          </DialogHeader>
          {previewModelo && (
            <div className="space-y-2 text-sm">
              {previewModelo.assunto && (
                <div><span className="text-xs text-muted-foreground">Assunto:</span> <strong>{previewModelo.assunto}</strong></div>
              )}
              <div className="rounded border bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                {renderTemplate(previewModelo, {
                  cliente: "Joana DEMO",
                  servico: "Consulta inicial",
                  data: "15/06/2026",
                  hora: "14:30",
                  profissional: "Dra. Ana Silva",
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewModelo(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NovoLembrete({ modelos, onCreate }: { modelos: ModeloMensagem[]; onCreate: (l: Lembrete) => void }) {
  const [f, setF] = useState({ nome: "", antecedencia: "24h", canal: "whatsapp" as Canal, template: "", ativo: true });
  const modelosCanal = useMemo(() => modelos.filter((m) => m.canal === f.canal), [modelos, f.canal]);
  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Antecedência</Label>
        <Select value={f.antecedencia} onValueChange={(v) => setF({ ...f, antecedencia: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["imediato", "30m", "1h", "2h", "4h", "24h", "48h", "7d"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Canal</Label>
        <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v as Canal, template: "" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Modelo</Label>
        <Select value={f.template} onValueChange={(v) => setF({ ...f, template: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>
            {modelosCanal.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button className="bg-gradient-primary" disabled={!f.nome || !f.template} onClick={() => {
        onCreate({ id: uid("lb"), ...f });
        setF({ nome: "", antecedencia: "24h", canal: "whatsapp", template: "", ativo: true });
      }}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar
      </Button>
    </div>
  );
}

function NovoModelo({ onCreate }: { onCreate: (m: ModeloMensagem) => void }) {
  const [f, setF] = useState({ nome: "", canal: "whatsapp" as Canal, assunto: "", corpo: "Olá {{cliente}}, ...", marcaTeste: true });
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <div><Label className="text-xs">Nome do modelo</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Canal</Label>
        <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v as Canal })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {f.canal === "email" && (
        <div className="sm:col-span-2"><Label className="text-xs">Assunto</Label><Input value={f.assunto} onChange={(e) => setF({ ...f, assunto: e.target.value })} /></div>
      )}
      <div className="sm:col-span-2">
        <Label className="text-xs">Corpo (variáveis: {`{{cliente}} {{servico}} {{data}} {{hora}} {{profissional}}`})</Label>
        <Textarea rows={4} value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-xs sm:col-span-2">
        <Switch checked={f.marcaTeste} onCheckedChange={(v) => setF({ ...f, marcaTeste: v })} />
        Adicionar selo "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE" automaticamente
      </label>
      <Button className="sm:col-span-2 bg-gradient-primary" disabled={!f.nome || !f.corpo} onClick={() => {
        onCreate({ id: uid("md"), ...f });
        setF({ nome: "", canal: "whatsapp", assunto: "", corpo: "Olá {{cliente}}, ...", marcaTeste: true });
      }}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar modelo
      </Button>
    </div>
  );
}

function NovoGatilho({ modelos, onCreate }: { modelos: ModeloMensagem[]; onCreate: (g: Gatilho) => void }) {
  const [f, setF] = useState({ evento: "agendamento_criado" as GatilhoEvento, canal: "whatsapp" as Canal, modeloId: "", delay: "imediato", ativo: true });
  const modelosCanal = useMemo(() => modelos.filter((m) => m.canal === f.canal), [modelos, f.canal]);
  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div><Label className="text-xs">Evento</Label>
        <Select value={f.evento} onValueChange={(v) => setF({ ...f, evento: v as GatilhoEvento })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(EVENTOS_LABEL) as GatilhoEvento[]).map((e) =>
              <SelectItem key={e} value={e}>{EVENTOS_LABEL[e]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Quando</Label>
        <Select value={f.delay} onValueChange={(v) => setF({ ...f, delay: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["imediato", "+15m", "+1h", "+4h", "+24h", "+48h"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Canal</Label>
        <Select value={f.canal} onValueChange={(v) => setF({ ...f, canal: v as Canal, modeloId: "" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Modelo</Label>
        <Select value={f.modeloId} onValueChange={(v) => setF({ ...f, modeloId: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>
            {modelosCanal.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button className="bg-gradient-primary" disabled={!f.modeloId} onClick={() => {
        onCreate({ id: uid("gt"), ...f });
        setF({ evento: "agendamento_criado", canal: "whatsapp", modeloId: "", delay: "imediato", ativo: true });
      }}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar
      </Button>
    </div>
  );
}

function NovoUsuario({ onCreate }: { onCreate: (u: UsuarioDemo) => void }) {
  const [f, setF] = useState({ nome: "", email: "", perfil: "recepcao" as PerfilUsuario, ativo: true });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">E-mail</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><Label className="text-xs">Perfil</Label>
        <Select value={f.perfil} onValueChange={(v) => setF({ ...f, perfil: v as PerfilUsuario })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(PERFIS_LABEL) as PerfilUsuario[]).map((p) =>
              <SelectItem key={p} value={p}>{PERFIS_LABEL[p]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button className="bg-gradient-primary" disabled={!f.nome || !f.email} onClick={() => {
        onCreate({ id: uid("us"), ...f });
        setF({ nome: "", email: "", perfil: "recepcao", ativo: true });
      }}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar usuário
      </Button>
    </div>
  );
}
