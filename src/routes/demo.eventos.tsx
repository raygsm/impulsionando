import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Ticket, QrCode, Plus, RotateCcw, CheckCircle2, AlertTriangle, Sparkles,
  Smartphone, BarChart3, HelpCircle, ScanLine, Users, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid, brl } from "@/lib/demoSandbox";
import { GuidedTour } from "@/components/demo/GuidedTour";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";

export const Route = createFileRoute("/demo/eventos")({
  head: () => ({
    meta: [
      { title: "Demo — Eventos e Ingressos — Impulsionando" },
      { name: "description", content: "Crie evento, lotes, venda ingresso fictício, emita QR Code, simule check-in e bloqueio de reutilização." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/eventos" }],
  }),
  component: DemoEventos,
});

type Lote = { id: string; nome: string; preco: number; quantidade: number };
type Evento = { id: string; nome: string; data: string; local: string; lotes: Lote[] };
type Ingresso = {
  id: string; eventoId: string; loteId: string;
  participante: string; email: string;
  status: "pago" | "pendente" | "cortesia" | "transferido" | "cancelado";
  checkin: boolean;
  checkinAt?: string;
  qr: string;
  tentativasInvalidas: number;
};
type Params = {
  qrUnico: boolean;
  bloquearReutilizacao: boolean;
  permitirTransferencia: boolean;
  enviarNps: boolean;
  listaEspera: boolean;
};

function DemoEventos() {
  const [eventos, setEventos, resetEventos] = useDemoState<Evento[]>("evt.eventos", []);
  const [ingressos, setIngressos, resetIngressos] = useDemoState<Ingresso[]>("evt.ingressos", []);
  const [params, setParams, resetParams] = useDemoState<Params>("evt.params", {
    qrUnico: true,
    bloquearReutilizacao: true,
    permitirTransferencia: true,
    enviarNps: true,
    listaEspera: false,
  });
  const [scanCode, setScanCode] = useState("");

  const eventoAtivo = eventos[0];

  const dash = useMemo(() => {
    if (!eventoAtivo) return { vendidos: 0, presentes: 0, ausentes: 0, receita: 0, invalidas: 0 };
    const meus = ingressos.filter((i) => i.eventoId === eventoAtivo.id);
    const vendidos = meus.filter((i) => i.status === "pago" || i.status === "transferido").length;
    const presentes = meus.filter((i) => i.checkin).length;
    const receita = meus
      .filter((i) => i.status === "pago" || i.status === "transferido")
      .reduce((s, i) => s + (eventoAtivo.lotes.find((l) => l.id === i.loteId)?.preco ?? 0), 0);
    const invalidas = meus.reduce((s, i) => s + i.tentativasInvalidas, 0);
    return { vendidos, presentes, ausentes: vendidos - presentes, receita, invalidas };
  }, [ingressos, eventoAtivo]);

  function criarEventoExemplo() {
    const e: Evento = {
      id: uid("evt"),
      nome: "Workshop Demo Impulsionando",
      data: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      local: "Centro de Convenções (demo)",
      lotes: [
        { id: uid("lt"), nome: "Lote 1 (early bird)", preco: 97, quantidade: 50 },
        { id: uid("lt"), nome: "Lote 2", preco: 147, quantidade: 100 },
        { id: uid("lt"), nome: "VIP", preco: 297, quantidade: 20 },
      ],
    };
    setEventos([e]);
    toast.success("Evento de exemplo criado.");
  }

  function venderIngresso(loteId?: string) {
    if (!eventoAtivo) return;
    const lote = loteId
      ? eventoAtivo.lotes.find((l) => l.id === loteId)!
      : eventoAtivo.lotes[Math.floor(Math.random() * eventoAtivo.lotes.length)];
    const n = ingressos.length + 1;
    const i: Ingresso = {
      id: uid("ing"),
      eventoId: eventoAtivo.id,
      loteId: lote.id,
      participante: `Participante ${n}`,
      email: `participante${n}@demo.com`,
      status: "pago",
      checkin: false,
      qr: `IMP-${eventoAtivo.id.slice(-4)}-${uid("q").toUpperCase()}`,
      tentativasInvalidas: 0,
    };
    setIngressos((prev) => [i, ...prev]);
    toast.success(`Ingresso emitido — ${lote.nome} — ${brl(lote.preco)}`);
  }

  function checkinPorCode(code: string) {
    if (!code.trim()) return;
    const idx = ingressos.findIndex((i) => i.qr === code.trim());
    if (idx < 0) { toast.error("QR Code não encontrado."); return; }
    const ing = ingressos[idx];
    if (ing.checkin && params.bloquearReutilizacao) {
      const next = [...ingressos];
      next[idx] = { ...ing, tentativasInvalidas: ing.tentativasInvalidas + 1 };
      setIngressos(next);
      toast.error("Ingresso já utilizado — reutilização bloqueada.");
      return;
    }
    const next = [...ingressos];
    next[idx] = { ...ing, checkin: true, checkinAt: new Date().toISOString() };
    setIngressos(next);
    toast.success(`Check-in OK — ${ing.participante}`);
  }

  function transferir(id: string) {
    if (!params.permitirTransferencia) { toast.error("Transferência desativada nas parametrizações."); return; }
    setIngressos((prev) => prev.map((i) => i.id === id ? { ...i, status: "transferido", participante: `${i.participante} (novo titular)` } : i));
    toast.success("Titularidade transferida.");
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <DemoModeBanner />
        <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <Badge className="bg-gradient-primary mb-2">Demo interativa • dados fictícios</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold">Eventos & Ingressos</h1>
              <p className="mt-1 text-muted-foreground max-w-2xl">
                Crie evento, lotes, emita ingressos com QR Code único, simule check-in via celular,
                bloqueie reutilização e acompanhe presença em tempo real.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <DemoContractCTA
                slug="eventos"
                moduleName="Eventos & Ingressos"
                moduleDescription="Crie evento, lotes, emita ingressos com QR Code único e faça check-in mobile."
                amountReference={197}
                features={["Evento e lotes", "Ingresso nominal com QR Code", "Check-in mobile", "Bloqueio de reutilização", "Painel de presença", "Boas-vindas e pesquisa"]}
                testRoute="/demo/eventos"
              />
              <GuidedTour
                moduleKey="eventos"
                title="Eventos & Ingressos"
                steps={[
                  { title: "Crie um evento", body: "Clique em 'Criar evento exemplo' para popular lotes e cortesias.", hint: "Você pode editar lotes e preços." },
                  { title: "Venda ingressos", body: "Emita ingressos pagos ou cortesias. Cada um gera um QR Code único." },
                  { title: "Faça check-in", body: "Use a aba Check-in: cole o código do QR ou simule um scan. O sistema bloqueia reutilização." },
                  { title: "Veja o painel", body: "Vendidos, presentes, ausentes, receita e tentativas inválidas em tempo real." },
                  { title: "Parametrize", body: "Ative confirmação por e-mail/WhatsApp, política de reentrada e cortesia." },
                ]}
              />
              {!eventoAtivo && <Button onClick={criarEventoExemplo}><Sparkles className="w-4 h-4 mr-1" />Criar evento exemplo</Button>}
              <Button variant="ghost" onClick={() => { resetEventos(); resetIngressos(); resetParams(); toast.message("Zerado."); }}>
                <RotateCcw className="w-4 h-4 mr-1" /> Zerar
              </Button>
            </div>
          </div>

          {!eventoAtivo ? (
            <Card className="p-10 text-center mt-8">
              <Ticket className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum evento na demonstração. Clique em "Criar evento exemplo" para começar.</p>
            </Card>
          ) : (
            <Tabs defaultValue="painel" className="mt-6">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="painel"><BarChart3 className="w-4 h-4 mr-1" />Painel</TabsTrigger>
                <TabsTrigger value="vendas"><Ticket className="w-4 h-4 mr-1" />Vender ingressos</TabsTrigger>
                <TabsTrigger value="checkin"><ScanLine className="w-4 h-4 mr-1" />Check-in</TabsTrigger>
                <TabsTrigger value="ingressos"><Users className="w-4 h-4 mr-1" />Ingressos</TabsTrigger>
                <TabsTrigger value="params">Parametrização</TabsTrigger>
              </TabsList>

              <TabsContent value="painel" className="mt-4 space-y-4">
                <Card className="p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <h2 className="font-semibold">{eventoAtivo.nome}</h2>
                      <p className="text-sm text-muted-foreground">{eventoAtivo.data} · {eventoAtivo.local}</p>
                    </div>
                    <Badge variant="outline">{eventoAtivo.lotes.length} lotes</Badge>
                  </div>
                </Card>
                <div className="grid sm:grid-cols-5 gap-3">
                  <KPI label="Vendidos" value={String(dash.vendidos)} hint="Pagos + transferidos" />
                  <KPI label="Presentes" value={String(dash.presentes)} hint="Check-in confirmado" accent />
                  <KPI label="Ausentes" value={String(dash.ausentes)} hint="Vendidos sem check-in" />
                  <KPI label="Receita" value={brl(dash.receita)} hint="Soma dos ingressos pagos" />
                  <KPI label="Tentativas inválidas" value={String(dash.invalidas)} hint="QR Code já usado" />
                </div>

                <RoiSimulator presetKey="eventos" />
              </TabsContent>

              <TabsContent value="vendas" className="mt-4 space-y-3">
                <Card className="p-5">
                  <h3 className="font-semibold mb-3">Lotes</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Capacidade</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventoAtivo.lotes.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>{l.nome}</TableCell>
                          <TableCell className="text-right">{brl(l.preco)}</TableCell>
                          <TableCell className="text-right">{l.quantidade}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => venderIngresso(l.id)}><Plus className="w-3.5 h-3.5 mr-1" />Vender</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="checkin" className="mt-4 space-y-3">
                <Card className="p-5 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4" />Leitor de QR Code (simulado)</h3>
                  <p className="text-sm text-muted-foreground">
                    Cole o código de um ingresso (aba "Ingressos") e simule a leitura pela recepção via celular.
                  </p>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => { e.preventDefault(); checkinPorCode(scanCode); setScanCode(""); }}
                  >
                    <Input placeholder="IMP-XXXX-..." value={scanCode} onChange={(e) => setScanCode(e.target.value)} />
                    <Button type="submit"><ScanLine className="w-4 h-4 mr-1" />Ler QR</Button>
                  </form>
                  {params.bloquearReutilizacao && (
                    <div className="text-xs flex items-start gap-2 rounded-md border bg-muted/40 p-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                      Reutilização bloqueada: tentativas adicionais de leitura do mesmo ingresso são registradas e geram alerta.
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="ingressos" className="mt-4">
                <Card className="p-5">
                  {ingressos.filter((i) => i.eventoId === eventoAtivo.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum ingresso emitido ainda. Use a aba "Vender ingressos".</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Participante</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>QR Code</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingressos.filter((i) => i.eventoId === eventoAtivo.id).map((i) => {
                          const lote = eventoAtivo.lotes.find((l) => l.id === i.loteId);
                          return (
                            <TableRow key={i.id}>
                              <TableCell>{i.participante}<div className="text-xs text-muted-foreground">{i.email}</div></TableCell>
                              <TableCell>{lote?.nome}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <QrSvg value={i.qr} />
                                  <code className="text-[10px]">{i.qr}</code>
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="outline" className="text-[10px]">{i.status}</Badge></TableCell>
                              <TableCell>
                                {i.checkin
                                  ? <span className="text-emerald-700 text-xs inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />confirmado</span>
                                  : <span className="text-muted-foreground text-xs">pendente</span>}
                                {i.tentativasInvalidas > 0 && (
                                  <div className="text-[10px] text-amber-700">{i.tentativasInvalidas} tentativa(s) inválida(s)</div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => setScanCode(i.qr)}>Copiar para leitor</Button>
                                <Button size="sm" variant="ghost" onClick={() => transferir(i.id)}><RefreshCw className="w-3.5 h-3.5 mr-1" />Transferir</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="params" className="mt-4 space-y-3">
                <Card className="p-5 space-y-4">
                  <ParamRow label="QR Code único por ingresso" hint="Cada ingresso gera código único e irrepetível."
                    value={params.qrUnico} onChange={(v) => setParams({ ...params, qrUnico: v })} />
                  <ParamRow label="Bloquear reutilização" hint="Após check-in, novas leituras do mesmo código são bloqueadas."
                    value={params.bloquearReutilizacao} onChange={(v) => setParams({ ...params, bloquearReutilizacao: v })} />
                  <ParamRow label="Permitir transferência de titular" hint="Participante pode transferir antes do evento (com aprovação opcional)."
                    value={params.permitirTransferencia} onChange={(v) => setParams({ ...params, permitirTransferencia: v })} />
                  <ParamRow label="Enviar NPS pós-evento" hint="Envia pesquisa de satisfação após o término do evento."
                    value={params.enviarNps} onChange={(v) => setParams({ ...params, enviarNps: v })} />
                  <ParamRow label="Lista de espera" hint="Quando o lote esgota, captura interessados em fila."
                    value={params.listaEspera} onChange={(v) => setParams({ ...params, listaEspera: v })} />
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="sticky bottom-3 mt-8">
            <Card className="p-3 flex items-center justify-between gap-3 flex-wrap shadow-elegant border-primary/30">
              <div className="text-sm"><Ticket className="w-4 h-4 inline mr-1 text-primary" />Pronto para vender e fazer check-in de verdade? Contrate o módulo Eventos.</div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/modulos/$slug" params={{ slug: "eventos" }}>Ver detalhes</Link></Button>
                <Button asChild size="sm" className="bg-gradient-primary"><Link to="/orcamento" search={{ origem: "demo:eventos" }}>Pedir orçamento</Link></Button>
              </div>
            </Card>
          </div>
        </main>
        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

function KPI({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
    </Card>
  );
}

function ParamRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium flex items-center gap-1">
          {label}
          <Tooltip>
            <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
            <TooltipContent className="max-w-xs">{hint}</TooltipContent>
          </Tooltip>
        </div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * Mini "QR Code" visual determinístico (não escaneável de verdade — apenas visualização).
 * Gera padrão 8x8 a partir do hash do código, suficiente para o lead "sentir" o ingresso.
 */
function QrSvg({ value }: { value: string }) {
  const cells = useMemo(() => {
    let h = 0;
    for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
    const out: boolean[] = [];
    for (let i = 0; i < 64; i++) {
      h = (h * 1103515245 + 12345) | 0;
      out.push(((h >>> 8) & 1) === 1);
    }
    return out;
  }, [value]);
  return (
    <svg width="32" height="32" viewBox="0 0 8 8" className="rounded border bg-white">
      {cells.map((on, i) => (
        <rect key={i} x={i % 8} y={Math.floor(i / 8)} width="1" height="1" fill={on ? "#000" : "#fff"} />
      ))}
    </svg>
  );
}
