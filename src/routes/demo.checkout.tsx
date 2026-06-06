import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  CreditCard, QrCode, FileText, Link as LinkIcon, RotateCcw, CheckCircle2,
  XCircle, Clock, Undo2, Sparkles, HelpCircle, Wallet, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid, brl } from "@/lib/demoSandbox";
import { GuidedTour } from "@/components/demo/GuidedTour";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";

export const Route = createFileRoute("/demo/checkout")({
  head: () => ({
    meta: [
      { title: "Demo — Checkout & Pagamentos — Impulsionando" },
      { name: "description", content: "Simule Pix, cartão, boleto, link de pagamento, baixa automática e reembolsos com dados fictícios." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/checkout" }],
  }),
  component: DemoCheckout,
});

type Pagto = {
  id: string;
  data: string;
  metodo: "pix" | "cartao" | "boleto" | "link";
  status: "aprovado" | "recusado" | "pendente" | "estornado";
  valor: number;
  parcelas?: number;
  cliente: string;
  obs?: string;
};
type Params = {
  baixaAutomatica: boolean;
  jurosCliente: boolean;
  parcelamentoAteN: number;
  reenvioLinkAuto: boolean;
  webhookAtivo: boolean;
};

function DemoCheckout() {
  const [pagtos, setPagtos, resetPagtos] = useDemoState<Pagto[]>("pay.pagamentos", []);
  const [params, setParams, resetParams] = useDemoState<Params>("pay.params", {
    baixaAutomatica: true,
    jurosCliente: false,
    parcelamentoAteN: 12,
    reenvioLinkAuto: true,
    webhookAtivo: true,
  });

  const dash = useMemo(() => {
    const ap = pagtos.filter((p) => p.status === "aprovado");
    const receita = ap.reduce((s, p) => s + p.valor, 0);
    const pendente = pagtos.filter((p) => p.status === "pendente").reduce((s, p) => s + p.valor, 0);
    const reemb = pagtos.filter((p) => p.status === "estornado").reduce((s, p) => s + p.valor, 0);
    const porMetodo = (m: Pagto["metodo"]) => ap.filter((p) => p.metodo === m).length;
    return {
      receita, pendente, reemb,
      count: ap.length,
      pix: porMetodo("pix"),
      cartao: porMetodo("cartao"),
      boleto: porMetodo("boleto"),
      link: porMetodo("link"),
    };
  }, [pagtos]);

  function novo(metodo: Pagto["metodo"], status: Pagto["status"], valor = 197, obs?: string, parcelas?: number) {
    const p: Pagto = {
      id: uid("pg"),
      data: new Date().toISOString(),
      metodo, status, valor, parcelas,
      cliente: `Cliente Teste ${Math.floor(Math.random() * 999)}`,
      obs,
    };
    setPagtos((prev) => [p, ...prev]);
    toast.success(`${metodo.toUpperCase()} ${status} — ${brl(valor)}`);
  }

  function estornar(id: string) {
    setPagtos((prev) => prev.map((p) => p.id === id ? { ...p, status: "estornado" } : p));
    toast.message("Reembolso simulado.");
  }

  function baixar(id: string) {
    setPagtos((prev) => prev.map((p) => p.id === id ? { ...p, status: "aprovado" } : p));
    toast.success("Baixa automática simulada.");
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
              <h1 className="text-3xl sm:text-4xl font-bold">Checkout & Pagamentos</h1>
              <p className="mt-1 text-muted-foreground max-w-2xl">
                Pix, cartão, boleto e link de pagamento. Simule aprovação, recusa, pendência,
                baixa automática e reembolso. Webhooks e dashboards atualizam em tempo real.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <DemoContractCTA
                slug="commerce"
                moduleName="Checkout & Pagamentos"
                moduleDescription="Pix, cartão, boleto, link de pagamento, baixa automática, reembolso e recuperação."
                amountReference={247}
                features={["Pix", "Cartão até 12x", "Boleto", "Baixa automática", "Reembolso simulado", "Comparativo de gateways"]}
                testRoute="/demo/checkout"
              />
              <GuidedTour
                moduleKey="checkout"
                title="Checkout & Pagamentos"
                steps={[
                  { title: "Escolha o método", body: "Na aba Simular pagamentos, teste Pix, Cartão (até 12x) e Boleto." },
                  { title: "Observe o status", body: "Pix é aprovado em segundos; boleto fica pendente até a baixa simulada; cartão pode recusar." },
                  { title: "Acompanhe o painel", body: "Cards de Aprovado/Pendente/Reembolsado e distribuição por método em tempo real." },
                  { title: "Compare gateways", body: "Veja taxas, prazos e cobertura na aba Comparativo." },
                  { title: "Parametrize", body: "Ative/desative recuperação automática, baixa automática e parcelamento.", hint: "Tudo client-side — nada toca o banco real." },
                ]}
              />
              <Button variant="ghost" onClick={() => { resetPagtos(); resetParams(); toast.message("Zerado."); }}>
                <RotateCcw className="w-4 h-4 mr-1" /> Zerar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="painel" className="mt-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="painel"><Wallet className="w-4 h-4 mr-1" />Painel financeiro</TabsTrigger>
              <TabsTrigger value="simular"><Sparkles className="w-4 h-4 mr-1" />Simular pagamentos</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo de métodos</TabsTrigger>
              <TabsTrigger value="params">Parametrização</TabsTrigger>
            </TabsList>

            <TabsContent value="painel" className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
                <KPI label="Aprovados" value={String(dash.count)} hint="Vendas finalizadas no demo" />
                <KPI label="Receita" value={brl(dash.receita)} hint="Soma de aprovados" accent />
                <KPI label="Pendente" value={brl(dash.pendente)} hint="Pix/boleto aguardando pagamento" />
                <KPI label="Reembolsado" value={brl(dash.reemb)} hint="Total estornado" />
              </div>

              <Card className="p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Distribuição por método</h3>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <MetricoMetodo icon={<QrCode className="w-4 h-4" />} label="Pix" n={dash.pix} />
                  <MetricoMetodo icon={<CreditCard className="w-4 h-4" />} label="Cartão" n={dash.cartao} />
                  <MetricoMetodo icon={<FileText className="w-4 h-4" />} label="Boleto" n={dash.boleto} />
                  <MetricoMetodo icon={<LinkIcon className="w-4 h-4" />} label="Link" n={dash.link} />
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Histórico de transações (TESTE)</h3>
                {pagtos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma transação registrada.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagtos.slice(0, 15).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">{new Date(p.data).toLocaleString("pt-BR")}</TableCell>
                          <TableCell>{p.cliente}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{p.metodo}{p.parcelas ? ` ${p.parcelas}x` : ""}</Badge></TableCell>
                          <TableCell><StatusPill s={p.status} /></TableCell>
                          <TableCell className="text-right">{brl(p.valor)}</TableCell>
                          <TableCell className="text-right">
                            {p.status === "pendente" && params.baixaAutomatica && (
                              <Button size="sm" variant="outline" onClick={() => baixar(p.id)}>Baixar</Button>
                            )}
                            {p.status === "aprovado" && (
                              <Button size="sm" variant="ghost" onClick={() => estornar(p.id)}><Undo2 className="w-3.5 h-3.5 mr-1" />Estornar</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>

              <RoiSimulator presetKey="checkout" />
            </TabsContent>

            <TabsContent value="simular" className="mt-4 space-y-4">
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><QrCode className="w-4 h-4" />Pix</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => novo("pix", "pendente", 247, "QR Code + copia-e-cola gerados")}><Clock className="w-4 h-4 mr-1" />Pix pendente</Button>
                  <Button variant="outline" onClick={() => novo("pix", "aprovado", 247, "Confirmado em 4s")}><CheckCircle2 className="w-4 h-4 mr-1" />Pix aprovado</Button>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" />Cartão</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => novo("cartao", "aprovado", 397, "À vista", 1)}><CheckCircle2 className="w-4 h-4 mr-1" />À vista aprovado</Button>
                  <Button variant="outline" onClick={() => novo("cartao", "aprovado", 397, `Parcelado em ${params.parcelamentoAteN}x`, params.parcelamentoAteN)}>
                    Parcelado em {params.parcelamentoAteN}x
                  </Button>
                  <Button variant="outline" onClick={() => novo("cartao", "recusado", 397, "Recusa do banco - tentativa alternativa sugerida")}>
                    <XCircle className="w-4 h-4 mr-1" />Recusado
                  </Button>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />Boleto</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => novo("boleto", "pendente", 197, "Linha digitável + PDF gerados")}><Clock className="w-4 h-4 mr-1" />Boleto pendente</Button>
                  <Button variant="outline" onClick={() => novo("boleto", "aprovado", 197, "Compensado")}><CheckCircle2 className="w-4 h-4 mr-1" />Boleto pago</Button>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><LinkIcon className="w-4 h-4" />Link de pagamento</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => novo("link", "pendente", 597, "Link enviado por WhatsApp + e-mail")}>Gerar e enviar link</Button>
                  <Button variant="outline" disabled={!params.reenvioLinkAuto} onClick={() => novo("link", "pendente", 597, "Reenvio automático após 24h")}>
                    Simular reenvio automático
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="comparativo" className="mt-4">
              <Card className="p-5 overflow-x-auto">
                <h3 className="font-semibold mb-3">Comparativo de métodos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Método</TableHead>
                      <TableHead>Liquidação</TableHead>
                      <TableHead>Taxa típica</TableHead>
                      <TableHead>Estabilidade</TableHead>
                      <TableHead>Indicação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><Badge>Pix</Badge></TableCell>
                      <TableCell>~1 dia</TableCell>
                      <TableCell>Baixa</TableCell>
                      <TableCell>Alta</TableCell>
                      <TableCell>Vendas rápidas, alto ticket, evento, ingresso</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge>Cartão</Badge></TableCell>
                      <TableCell>~30 dias (parcelado)</TableCell>
                      <TableCell>Média</TableCell>
                      <TableCell>Alta</TableCell>
                      <TableCell>Recorrência, parcelamento, conversão</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge>Boleto</Badge></TableCell>
                      <TableCell>1–2 dias após pagamento</TableCell>
                      <TableCell>Baixa</TableCell>
                      <TableCell>Média</TableCell>
                      <TableCell>B2B, público sem cartão</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge>Link</Badge></TableCell>
                      <TableCell>Depende do método escolhido</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>Alta</TableCell>
                      <TableCell>Venda assistida por WhatsApp/CRM</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-3">
                  Os números acima são referências de mercado. Valores reais dependem do gateway/credenciamento contratado.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="params" className="mt-4 space-y-3">
              <Card className="p-5 space-y-4">
                <ParamRow label="Baixa automática" hint="Confirma pendente assim que o gateway notifica o pagamento."
                  value={params.baixaAutomatica} onChange={(v) => setParams({ ...params, baixaAutomatica: v })} />
                <ParamRow label="Juros pagos pelo cliente" hint="Quando ativo, parcelamento adiciona juros ao cliente; quando inativo, produtor assume."
                  value={params.jurosCliente} onChange={(v) => setParams({ ...params, jurosCliente: v })} />
                <ParamRow label="Reenvio automático de link pendente" hint="Reenvia link em 24h se cliente não pagou."
                  value={params.reenvioLinkAuto} onChange={(v) => setParams({ ...params, reenvioLinkAuto: v })} />
                <ParamRow label="Webhooks ativos" hint="Dispara webhooks para sistemas externos a cada mudança de status."
                  value={params.webhookAtivo} onChange={(v) => setParams({ ...params, webhookAtivo: v })} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Parcelamento máximo</div>
                    <div className="text-xs text-muted-foreground">Limite de parcelas no checkout (1 a 12).</div>
                  </div>
                  <input type="number" min={1} max={12} value={params.parcelamentoAteN}
                    onChange={(e) => setParams({ ...params, parcelamentoAteN: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })}
                    className="w-20 border rounded-md px-2 py-1 text-sm bg-background" />
                </div>
              </Card>
              <Card className="p-5 text-sm text-muted-foreground">
                <strong className="text-foreground block mb-1">Integrações externas</strong>
                Pix, cartão, boleto e split exigem gateway/conta de pagamento credenciada (preparada — aguardando credenciais externas).
              </Card>
            </TabsContent>
          </Tabs>

          <div className="sticky bottom-3 mt-8">
            <Card className="p-3 flex items-center justify-between gap-3 flex-wrap shadow-elegant border-primary/30">
              <div className="text-sm"><CreditCard className="w-4 h-4 inline mr-1 text-primary" />Pronto para receber de verdade? Contrate Checkout & Pagamentos.</div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/modulos/$slug" params={{ slug: "commerce" }}>Ver detalhes</Link></Button>
                <Button asChild size="sm" className="bg-gradient-primary"><Link to="/orcamento" search={{ origem: "demo:checkout" }}>Pedir orçamento</Link></Button>
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

function MetricoMetodo({ icon, label, n }: { icon: React.ReactNode; label: string; n: number }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-xl font-bold mt-1">{n}</div>
    </div>
  );
}

function StatusPill({ s }: { s: Pagto["status"] }) {
  const map: Record<Pagto["status"], string> = {
    aprovado: "bg-emerald-100 text-emerald-800 border-emerald-300",
    recusado: "bg-red-100 text-red-800 border-red-300",
    pendente: "bg-amber-100 text-amber-800 border-amber-300",
    estornado: "bg-zinc-200 text-zinc-700 border-zinc-300",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${map[s]}`}>{s}</span>;
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
