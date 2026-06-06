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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Send, Plus, Trash2, RotateCcw, Sparkles, Bot, Workflow, Inbox, FileText, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid } from "@/lib/demoSandbox";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { gotoCrm, gotoAgenda } from "@/lib/demoCrossLink";
import { createWhatsAppMock } from "@/lib/demoModuleMocks";

export const Route = createFileRoute("/demo/whatsapp")({
  head: () => ({
    meta: [
      { title: "Demo — WhatsApp & Comunicação — Impulsionando" },
      { name: "description", content: "Teste disparos, chatbot, templates, inbox unificada e jornadas de WhatsApp com dados fictícios." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/whatsapp" }],
  }),
  component: DemoWhats,
});

type Contato = { id: string; nome: string; telefone: string; tags: string[]; optIn: boolean };
type Conversa = { id: string; contatoId: string; mensagens: { de: "cliente" | "atendente" | "bot"; texto: string; quando: string }[]; status: "aberto" | "fechado" };
type Template = { id: string; nome: string; corpo: string; aprovado: boolean };
type Campanha = { id: string; nome: string; templateId: string; enviadas: number; entregues: number; lidas: number; respondidas: number };
type Fluxo = { id: string; nome: string; passos: string[]; ativo: boolean };
type Params = { respostaAuto: boolean; horarioComercial: boolean; protocoloLGPD: boolean; multiAtendente: boolean };

function DemoWhats() {
  const [contatos, setContatos, resetContatos] = useDemoState<Contato[]>("wa.contatos", []);
  const [conversas, setConversas, resetConversas] = useDemoState<Conversa[]>("wa.conv", []);
  const [tpls, setTpls, resetTpls] = useDemoState<Template[]>("wa.tpls", []);
  const [camps, setCamps, resetCamps] = useDemoState<Campanha[]>("wa.camps", []);
  const [fluxos, setFluxos, resetFluxos] = useDemoState<Fluxo[]>("wa.fluxos", []);
  const [params, setParams, resetParams] = useDemoState<Params>("wa.params", {
    respostaAuto: true, horarioComercial: false, protocoloLGPD: true, multiAtendente: true,
  });
  const [convAtiva, setConvAtiva] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (contatos.length || conversas.length || tpls.length || camps.length || fluxos.length) return;
    const mock = createWhatsAppMock();
    setContatos(mock.contatos);
    setConversas(mock.conversas);
    setTpls(mock.tpls);
    setCamps(mock.camps);
    setFluxos(mock.fluxos);
    setParams(mock.params);
    setConvAtiva(mock.conversas[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dash = useMemo(() => {
    const totalMsgs = conversas.reduce((s, c) => s + c.mensagens.length, 0);
    const enviadas = camps.reduce((s, c) => s + c.enviadas, 0);
    const lidas = camps.reduce((s, c) => s + c.lidas, 0);
    const respondidas = camps.reduce((s, c) => s + c.respondidas, 0);
    const taxa = enviadas ? Math.round((lidas / enviadas) * 100) : 0;
    return { totalMsgs, enviadas, lidas, respondidas, taxa, contatos: contatos.length, optin: contatos.filter((c) => c.optIn).length };
  }, [conversas, camps, contatos]);

  function seed() {
    const mock = createWhatsAppMock();
    setContatos(mock.contatos);
    setTpls(mock.tpls);
    setConversas(mock.conversas);
    setFluxos(mock.fluxos);
    setCamps(mock.camps);
    setParams(mock.params);
    setConvAtiva(mock.conversas[0]?.id ?? null);
    toast.success("Dados fictícios específicos de WhatsApp criados.");
  }

  function resetAll() {
    resetContatos(); resetConversas(); resetTpls(); resetCamps(); resetFluxos(); resetParams();
    setConvAtiva(null);
    toast.message("Demonstração zerada.");
  }

  function enviarMensagem() {
    if (!convAtiva || !mensagem.trim()) return;
    setConversas((prev) => prev.map((c) => c.id === convAtiva ? {
      ...c,
      mensagens: [...c.mensagens, { de: "atendente", texto: mensagem, quando: new Date().toISOString() }],
    } : c));
    setMensagem("");
    if (params.respostaAuto) {
      setTimeout(() => {
        setConversas((prev) => prev.map((c) => c.id === convAtiva ? {
          ...c, mensagens: [...c.mensagens, { de: "cliente", texto: "Perfeito, obrigado!", quando: new Date().toISOString() }],
        } : c));
      }, 800);
    }
  }

  function dispararCampanha(nome: string) {
    const total = Math.max(20, contatos.filter((c) => c.optIn).length * 10);
    const c: Campanha = {
      id: uid("cp"), nome, templateId: tpls[0]?.id ?? "x",
      enviadas: total, entregues: Math.round(total * 0.95), lidas: Math.round(total * 0.78), respondidas: Math.round(total * 0.18),
    };
    setCamps((prev) => [c, ...prev]);
    toast.success(`Campanha "${nome}" disparada (${total} envios fictícios).`);
  }

  const conv = conversas.find((c) => c.id === convAtiva);
  const contatoConv = conv ? contatos.find((c) => c.id === conv.contatoId) : null;

  // Deep-link via ?conv=<id> vindo de outros módulos (CRM/Agenda)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("conv");
    if (id && conversas.some((c) => c.id === id)) setConvAtiva(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversas.length]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner current="automacao" />
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Badge className="bg-gradient-primary mb-2">Demo interativa • dados fictícios</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold">WhatsApp & Comunicação</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Inbox unificada, chatbot, templates aprovados, campanhas de disparo e fluxos automatizados — em demonstração.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <DemoContractCTA
              slug="automacao"
              moduleName="WhatsApp & Comunicação"
              moduleDescription="Inbox unificada, chatbot, templates, disparos em massa e fluxos automatizados."
              amountReference={397}
              features={["Inbox multi-atendente", "Chatbot com IA", "Templates aprovados", "Campanhas com métricas", "Jornadas automatizadas"]}
              testRoute="/demo/whatsapp"
              size="default"
              variant="default"
            />
            <Button variant="outline" onClick={seed}><Sparkles className="w-4 h-4 mr-1" />Popular demo</Button>
            <Button variant="ghost" onClick={resetAll}><RotateCcw className="w-4 h-4 mr-1" />Zerar</Button>
          </div>
        </div>

        <Tabs defaultValue="inbox" className="mt-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="inbox"><Inbox className="w-4 h-4 mr-1" />Inbox</TabsTrigger>
            <TabsTrigger value="contatos"><MessageSquare className="w-4 h-4 mr-1" />Contatos</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-1" />Templates</TabsTrigger>
            <TabsTrigger value="campanhas"><Send className="w-4 h-4 mr-1" />Campanhas</TabsTrigger>
            <TabsTrigger value="bots"><Bot className="w-4 h-4 mr-1" />Chatbot / Fluxos</TabsTrigger>
            <TabsTrigger value="painel"><Workflow className="w-4 h-4 mr-1" />Painel</TabsTrigger>
            <TabsTrigger value="params"><Sparkles className="w-4 h-4 mr-1" />Parametrização</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-4">
            <div className="grid md:grid-cols-3 gap-3 h-[500px]">
              <Card className="p-3 overflow-auto">
                <h4 className="text-xs font-semibold mb-2">Conversas</h4>
                {conversas.length === 0 && <p className="text-xs text-muted-foreground">Sem conversas. Use "Popular demo".</p>}
                {conversas.map((c) => {
                  const ct = contatos.find((x) => x.id === c.contatoId);
                  return (
                    <button key={c.id} onClick={() => setConvAtiva(c.id)} className={`w-full text-left p-2 rounded mb-1 text-sm hover:bg-muted ${convAtiva === c.id ? "bg-muted" : ""}`}>
                      <div className="font-medium">{ct?.nome ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.mensagens[c.mensagens.length - 1]?.texto}</div>
                    </button>
                  );
                })}
              </Card>
              <Card className="p-3 md:col-span-2 flex flex-col">
                {!conv ? (
                  <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Selecione uma conversa.</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b mb-2">
                      <div>
                        <div className="font-medium text-sm">{contatoConv?.nome ?? "Contato"}</div>
                        <div className="text-xs text-muted-foreground">{contatoConv?.telefone}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" title="Ver lead no CRM" onClick={() => contatoConv && gotoCrm({ nome: contatoConv.nome, telefone: contatoConv.telefone })}>
                          <User className="w-3.5 h-3.5 mr-1" />CRM
                        </Button>
                        <Button size="sm" variant="outline" title="Agendar" onClick={() => contatoConv && gotoAgenda({ nome: contatoConv.nome, telefone: contatoConv.telefone })}>
                          <Calendar className="w-3.5 h-3.5 mr-1" />Agendar
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto space-y-2">
                      {conv.mensagens.map((m, i) => (
                        <div key={i} className={`max-w-[80%] p-2 rounded text-sm ${m.de === "cliente" ? "bg-muted" : m.de === "bot" ? "bg-primary/10 ml-auto" : "bg-gradient-primary text-primary-foreground ml-auto"}`}>
                          <div className="text-[10px] opacity-70">{m.de === "cliente" ? "Cliente" : m.de === "bot" ? "Bot" : "Atendente"} — TESTE</div>
                          {m.texto}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2 pt-2 border-t">
                      <Input value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Digite uma mensagem (demo)..." onKeyDown={(e) => e.key === "Enter" && enviarMensagem()} />
                      <Button onClick={enviarMensagem} className="bg-gradient-primary"><Send className="w-4 h-4" /></Button>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contatos" className="mt-4 space-y-4">
            <Card className="p-5">
              <NovoContato onCreate={(c) => setContatos((p) => [c, ...p])} />
            </Card>
            <Card className="p-5">
              {contatos.length === 0 ? <p className="text-sm text-muted-foreground">Sem contatos.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Tags</TableHead><TableHead>Opt-in</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {contatos.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.nome}</TableCell>
                        <TableCell className="text-xs">{c.telefone}</TableCell>
                        <TableCell><div className="flex gap-1">{c.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div></TableCell>
                        <TableCell><Switch checked={c.optIn} onCheckedChange={(v) => setContatos((p) => p.map((x) => x.id === c.id ? { ...x, optIn: v } : x))} /></TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => setContatos((p) => p.filter((x) => x.id !== c.id))}><Trash2 className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-4 space-y-4">
            <Card className="p-5">
              <NovoTpl onCreate={(t) => setTpls((p) => [t, ...p])} />
            </Card>
            <div className="grid md:grid-cols-2 gap-3">
              {tpls.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{t.nome}</div>
                    <Badge variant={t.aprovado ? "default" : "outline"}>{t.aprovado ? "Aprovado" : "Pendente"}</Badge>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-muted/40 p-2 rounded">{t.corpo}</pre>
                  <div className="flex justify-end mt-2"><Button size="sm" variant="ghost" onClick={() => setTpls((p) => p.filter((x) => x.id !== t.id))}><Trash2 className="w-4 h-4" /></Button></div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="campanhas" className="mt-4 space-y-4">
            <Card className="p-5 flex gap-2 flex-wrap">
              <Button onClick={() => dispararCampanha("Campanha demo " + (camps.length + 1))} className="bg-gradient-primary">
                <Send className="w-4 h-4 mr-1" />Disparar campanha (TESTE)
              </Button>
              <Button variant="ghost" onClick={() => { resetCamps(); toast.message("Campanhas zeradas."); }}><RotateCcw className="w-4 h-4 mr-1" />Zerar</Button>
            </Card>
            <Card className="p-5">
              {camps.length === 0 ? <p className="text-sm text-muted-foreground">Sem campanhas.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Enviadas</TableHead><TableHead className="text-right">Entregues</TableHead><TableHead className="text-right">Lidas</TableHead><TableHead className="text-right">Respondidas</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {camps.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.nome}</TableCell>
                        <TableCell className="text-right">{c.enviadas}</TableCell>
                        <TableCell className="text-right">{c.entregues}</TableCell>
                        <TableCell className="text-right">{c.lidas}</TableCell>
                        <TableCell className="text-right">{c.respondidas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="bots" className="mt-4 space-y-4">
            {fluxos.map((f) => (
              <Card key={f.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium flex items-center gap-2"><Bot className="w-4 h-4" />{f.nome}</div>
                  <Switch checked={f.ativo} onCheckedChange={(v) => setFluxos((p) => p.map((x) => x.id === f.id ? { ...x, ativo: v } : x))} />
                </div>
                <div className="flex gap-2 flex-wrap text-xs">
                  {f.passos.map((p, i) => <Badge key={i} variant="outline">{i + 1}. {p}</Badge>)}
                </div>
              </Card>
            ))}
            {fluxos.length === 0 && <p className="text-sm text-muted-foreground">Sem fluxos. Use "Popular demo".</p>}
          </TabsContent>

          <TabsContent value="painel" className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-4 gap-3">
              <KPI label="Contatos" value={String(dash.contatos)} />
              <KPI label="Opt-in" value={String(dash.optin)} />
              <KPI label="Mensagens" value={String(dash.totalMsgs)} />
              <KPI label="Taxa de leitura" value={`${dash.taxa}%`} accent />
            </div>
            <RoiSimulator presetKey="whatsapp" />
          </TabsContent>

          <TabsContent value="params" className="mt-4">
            <Card className="p-5 space-y-4">
              <ParamToggle label="Resposta automática (bot)" hint="Bot responde quando atendente offline." value={params.respostaAuto} onChange={(v) => setParams({ ...params, respostaAuto: v })} />
              <ParamToggle label="Horário comercial" hint="Bloqueia disparos fora do expediente." value={params.horarioComercial} onChange={(v) => setParams({ ...params, horarioComercial: v })} />
              <ParamToggle label="Protocolo LGPD" hint="Registra opt-in/opt-out e exibe na conversa." value={params.protocoloLGPD} onChange={(v) => setParams({ ...params, protocoloLGPD: v })} />
              <ParamToggle label="Multi-atendente" hint="Várias pessoas atendendo o mesmo número." value={params.multiAtendente} onChange={(v) => setParams({ ...params, multiAtendente: v })} />
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
function NovoContato({ onCreate }: { onCreate: (c: Contato) => void }) {
  const [f, setF] = useState({ nome: "", telefone: "", tags: "" });
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label className="text-xs">Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
      <div><Label className="text-xs">Tags (vírgula)</Label><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></div>
      <Button className="bg-gradient-primary" disabled={!f.nome} onClick={() => { onCreate({ id: uid("ct"), nome: f.nome, telefone: f.telefone, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), optIn: true }); setF({ nome: "", telefone: "", tags: "" }); }}>
        <Plus className="w-4 h-4 mr-1" />Adicionar
      </Button>
    </div>
  );
}
function NovoTpl({ onCreate }: { onCreate: (t: Template) => void }) {
  const [f, setF] = useState({ nome: "", corpo: "" });
  return (
    <div className="grid sm:grid-cols-3 gap-2 items-end">
      <div><Label className="text-xs">Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label className="text-xs">Corpo</Label><Textarea rows={2} value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} /></div>
      <Button className="sm:col-span-3 bg-gradient-primary" disabled={!f.nome || !f.corpo} onClick={() => { onCreate({ id: uid("tp"), nome: f.nome, corpo: f.corpo, aprovado: false }); setF({ nome: "", corpo: "" }); }}>
        <Plus className="w-4 h-4 mr-1" />Criar template
      </Button>
    </div>
  );
}
