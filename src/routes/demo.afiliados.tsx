import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus, Trash2, RotateCcw, HelpCircle, Sparkles, ShoppingCart, Trophy,
  DollarSign, Percent, Users, Tag, Link2, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoState, uid, brl } from "@/lib/demoSandbox";
import { PLATFORM_FEE_PCT } from "@/lib/affiliates.constants";
import { GuidedTour } from "@/components/demo/GuidedTour";
import { RoiSimulator } from "@/components/demo/RoiSimulator";
import { DemoContractCTA } from "@/components/demo/DemoContractCTA";
import { createAfiliadosMock } from "@/lib/demoModuleMocks";

export const Route = createFileRoute("/demo/afiliados")({
  head: () => ({
    meta: [
      { title: "Demo — Afiliados e Produtos — Impulsionando" },
      { name: "description", content: "Teste split, comissões, order bump, recompra e ranking de afiliados com dados fictícios." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/afiliados" }],
  }),
  component: DemoAfiliados,
});

type Produto = { id: string; nome: string; preco: number; recorrencia: "unico" | "mensal" | "anual" };
type Oferta = { id: string; produtoId: string; nome: string; comissaoPct: number; bumpPct: number };
type Afiliado = { id: string; nome: string; email: string; gerenteId?: string };
type Cupom = { id: string; code: string; descontoPct: number; afiliadoId?: string };
type Venda = {
  id: string; data: string; produtoId: string; ofertaId: string; afiliadoId?: string;
  cupomId?: string; bruto: number; bump: boolean; status: "aprovado" | "recusado" | "pendente" | "estornado";
  fonte: "checkout" | "recuperacao" | "recompra";
};
type Params = {
  splitAutomatico: boolean;
  comissaoRecorrencia: boolean;
  recuperacaoCarrinho: boolean;
  recompraAutomatica: boolean;
  rankingPublico: boolean;
};

function DemoAfiliados() {
  const [produtos, setProdutos, resetProdutos] = useDemoState<Produto[]>("aff.produtos", []);
  const [ofertas, setOfertas, resetOfertas] = useDemoState<Oferta[]>("aff.ofertas", []);
  const [afiliados, setAfiliados, resetAfiliados] = useDemoState<Afiliado[]>("aff.afiliados", []);
  const [cupons, setCupons, resetCupons] = useDemoState<Cupom[]>("aff.cupons", []);
  const [vendas, setVendas, resetVendas] = useDemoState<Venda[]>("aff.vendas", []);
  const [params, setParams, resetParams] = useDemoState<Params>("aff.params", {
    splitAutomatico: true,
    comissaoRecorrencia: true,
    recuperacaoCarrinho: true,
    recompraAutomatica: false,
    rankingPublico: true,
  });

  useEffect(() => {
    const marker = typeof window === "undefined" ? "afiliados:v2" : window.localStorage.getItem("imp.demo.mock.afiliados");
    if (marker === "afiliados:v2") return;
    const mock = createAfiliadosMock();
    setProdutos(mock.produtos);
    setOfertas(mock.ofertas);
    setAfiliados(mock.afiliados);
    setCupons(mock.cupons);
    setVendas(mock.vendas);
    setParams(mock.params);
    if (typeof window !== "undefined") window.localStorage.setItem("imp.demo.mock.afiliados", "afiliados:v2");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dash = useMemo(() => {
    const aprovadas = vendas.filter((v) => v.status === "aprovado");
    const receita = aprovadas.reduce((s, v) => s + v.bruto, 0);
    const taxa = receita * (PLATFORM_FEE_PCT / 100);
    const comissoes = aprovadas.reduce((s, v) => {
      const of = ofertas.find((o) => o.id === v.ofertaId);
      if (!of) return s;
      const base = v.bruto;
      const bump = v.bump ? base * (of.bumpPct / 100) : 0;
      return s + base * (of.comissaoPct / 100) + bump;
    }, 0);
    const ranking = afiliados
      .map((a) => {
        const minhas = aprovadas.filter((v) => v.afiliadoId === a.id);
        const rev = minhas.reduce((s, v) => s + v.bruto, 0);
        return { ...a, vendas: minhas.length, receita: rev };
      })
      .sort((x, y) => y.receita - x.receita);
    return { receita, taxa, comissoes, ranking, count: aprovadas.length };
  }, [vendas, ofertas, afiliados]);

  function seed() {
    const mock = createAfiliadosMock();
    setProdutos(mock.produtos);
    setOfertas(mock.ofertas);
    setAfiliados(mock.afiliados);
    setCupons(mock.cupons);
    setVendas(mock.vendas);
    setParams(mock.params);
    toast.success("Dados fictícios específicos de Afiliados criados.");
  }

  function resetAll() {
    resetProdutos(); resetOfertas(); resetAfiliados(); resetCupons(); resetVendas(); resetParams();
    toast.message("Demonstração zerada.");
  }

  function simularVenda(fonte: Venda["fonte"], status: Venda["status"] = "aprovado", comBump = false) {
    if (!ofertas.length) { toast.error("Crie pelo menos uma oferta."); return; }
    const of = ofertas[Math.floor(Math.random() * ofertas.length)];
    const prd = produtos.find((p) => p.id === of.produtoId);
    if (!prd) return;
    const af = afiliados[Math.floor(Math.random() * afiliados.length)];
    const v: Venda = {
      id: uid("vd"),
      data: new Date().toISOString(),
      produtoId: prd.id,
      ofertaId: of.id,
      afiliadoId: af?.id,
      bruto: prd.preco + (comBump ? prd.preco * 0.3 : 0),
      bump: comBump,
      status,
      fonte,
    };
    setVendas((prev) => [v, ...prev]);
    toast.success(`Venda ${status} (${fonte}) — ${brl(v.bruto)}`);
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col bg-background">
        <PublicHeader />
        <DemoModeBanner current="afiliados" />
        <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
          <Header onSeed={seed} onReset={resetAll} />

          <Tabs defaultValue="painel" className="mt-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="painel"><Trophy className="w-4 h-4 mr-1" />Painel</TabsTrigger>
              <TabsTrigger value="catalogo"><Tag className="w-4 h-4 mr-1" />Catálogo</TabsTrigger>
              <TabsTrigger value="rede"><Users className="w-4 h-4 mr-1" />Rede</TabsTrigger>
              <TabsTrigger value="vendas"><ShoppingCart className="w-4 h-4 mr-1" />Simular vendas</TabsTrigger>
              <TabsTrigger value="params"><Sparkles className="w-4 h-4 mr-1" />Parametrização</TabsTrigger>
            </TabsList>

            <TabsContent value="painel" className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
                <KPI label="Vendas aprovadas" value={String(dash.count)} hint="Total no período demo" />
                <KPI label="Receita bruta" value={brl(dash.receita)} hint="Soma das vendas aprovadas" />
                <KPI label={`Taxa Impulsionando ${PLATFORM_FEE_PCT}%`} value={brl(dash.taxa)} hint="Fee operacional fixo sobre tudo" accent />
                <KPI label="Comissões a pagar" value={brl(dash.comissoes)} hint="Inclui bumps quando ativos" />
              </div>

              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4" /> Ranking de afiliados
                  <Help text="No ambiente real, esse ranking pode ser público ou privado conforme a parametrização." />
                </h3>
                {dash.ranking.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem vendas ainda. Use a aba "Simular vendas".</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Afiliado</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dash.ranking.map((r, i) => (
                        <TableRow key={r.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{r.nome}</TableCell>
                          <TableCell className="text-right">{r.vendas}</TableCell>
                          <TableCell className="text-right">{brl(r.receita)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Últimas vendas (TESTE)</h3>
                {vendas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma venda registrada na demonstração.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendas.slice(0, 10).map((v) => {
                        const prd = produtos.find((p) => p.id === v.produtoId);
                        return (
                          <TableRow key={v.id}>
                            <TableCell className="text-xs">{new Date(v.data).toLocaleString("pt-BR")}</TableCell>
                            <TableCell>{prd?.nome ?? "—"} {v.bump && <Badge variant="outline" className="ml-1 text-[10px]">bump</Badge>}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{v.fonte}</Badge></TableCell>
                            <TableCell><StatusPill s={v.status} /></TableCell>
                            <TableCell className="text-right">{brl(v.bruto)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>

              <RoiSimulator presetKey="afiliados" />
            </TabsContent>



            <TabsContent value="catalogo" className="mt-4 space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  Produtos <Help text="Único, mensal ou anual. Suporta recorrência com comissão recorrente quando ativada." />
                </h3>
                <CreateProduto onCreate={(p) => setProdutos((prev) => [...prev, p])} />
                <ListaProdutos items={produtos} onRemove={(id) => setProdutos((prev) => prev.filter((p) => p.id !== id))} />
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Ofertas (comissão + order bump)</h3>
                <CreateOferta produtos={produtos} onCreate={(o) => setOfertas((prev) => [...prev, o])} />
                <ListaOfertas ofertas={ofertas} produtos={produtos} onRemove={(id) => setOfertas((prev) => prev.filter((o) => o.id !== id))} />
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4" /> Cupons / Links / QR Codes
                  <Help text="Na demo, geramos código fictício. No ambiente real, geramos QR Code e link único por afiliado." />
                </h3>
                <CreateCupom afiliados={afiliados} onCreate={(c) => setCupons((prev) => [...prev, c])} />
                <ListaCupons cupons={cupons} afiliados={afiliados} onRemove={(id) => setCupons((prev) => prev.filter((c) => c.id !== id))} />
              </Card>
            </TabsContent>

            <TabsContent value="rede" className="mt-4 space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-3">Afiliados / Coprodutores / Gerentes</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Na demonstração, todos os papéis usam o mesmo formulário simplificado. No ambiente real, cada papel tem painel próprio com permissões.
                </p>
                <CreateAfiliado onCreate={(a) => setAfiliados((prev) => [...prev, a])} />
                <ListaAfiliados items={afiliados} onRemove={(id) => setAfiliados((prev) => prev.filter((a) => a.id !== id))} />
              </Card>
            </TabsContent>

            <TabsContent value="vendas" className="mt-4 space-y-4">
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold">Simular fluxo de vendas (TESTE)</h3>
                <p className="text-sm text-muted-foreground">
                  Cada botão registra uma venda fictícia. A receita, taxa Impulsionando ({PLATFORM_FEE_PCT}%),
                  comissão e ranking se atualizam em tempo real no Painel.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => simularVenda("checkout", "aprovado")}><CheckCircle2 className="w-4 h-4 mr-1" />Venda aprovada</Button>
                  <Button variant="outline" onClick={() => simularVenda("checkout", "aprovado", true)}>+ order bump</Button>
                  <Button variant="outline" onClick={() => simularVenda("checkout", "recusado")}>Cartão recusado</Button>
                  <Button variant="outline" onClick={() => simularVenda("checkout", "pendente")}>Pix pendente</Button>
                  <Button variant="outline" disabled={!params.recuperacaoCarrinho} onClick={() => simularVenda("recuperacao", "aprovado")}>
                    Recuperar carrinho
                  </Button>
                  <Button variant="outline" disabled={!params.recompraAutomatica} onClick={() => simularVenda("recompra", "aprovado")}>
                    Recompra automática
                  </Button>
                  <Button variant="ghost" onClick={() => { resetVendas(); toast.message("Vendas zeradas."); }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Zerar vendas
                  </Button>
                </div>
                <div className="rounded-lg border p-3 bg-muted/40 text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  Recuperação de carrinho e recompra automática só disparam quando ativadas em "Parametrização".
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="params" className="mt-4 space-y-3">
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold">Parametrização SIM / NÃO</h3>
                <ParamToggle
                  label="Split automático no checkout"
                  hint="Ao aprovar a venda, comissão e taxa Impulsionando são separadas automaticamente."
                  value={params.splitAutomatico}
                  onChange={(v) => setParams({ ...params, splitAutomatico: v })}
                />
                <ParamToggle
                  label="Comissão sobre recorrência"
                  hint="Afiliado recebe comissão a cada renovação de assinatura."
                  value={params.comissaoRecorrencia}
                  onChange={(v) => setParams({ ...params, comissaoRecorrencia: v })}
                />
                <ParamToggle
                  label="Recuperação de carrinho"
                  hint="Dispara mensagem para leads que abandonaram o checkout."
                  value={params.recuperacaoCarrinho}
                  onChange={(v) => setParams({ ...params, recuperacaoCarrinho: v })}
                />
                <ParamToggle
                  label="Recompra automática por prazo de consumo"
                  hint="Sugere recompra quando o cliente atinge o prazo médio de consumo do produto."
                  value={params.recompraAutomatica}
                  onChange={(v) => setParams({ ...params, recompraAutomatica: v })}
                />
                <ParamToggle
                  label="Ranking público de afiliados"
                  hint="Quando ativo, afiliados veem o ranking entre si."
                  value={params.rankingPublico}
                  onChange={(v) => setParams({ ...params, rankingPublico: v })}
                />
              </Card>
              <Card className="p-5 text-sm text-muted-foreground">
                <strong className="text-foreground block mb-1">Regras e limites</strong>
                Taxa Impulsionando {PLATFORM_FEE_PCT}% incide sobre toda transação (Pix, cartão, parcelado, bump, upsell, cross-sell, recorrência).
                Prazos de liberação seguem o método de pagamento (Pix 1d, cartão ~30d). Chargeback e reembolso revertem comissão.
              </Card>
            </TabsContent>
          </Tabs>

          <StickyCTA slug="fidelizacao" />
        </main>
        <PublicFooter />
      </div>
    </TooltipProvider>
  );
}

/* ---------- Subcomponents ---------- */

function Header({ onSeed, onReset }: { onSeed: () => void; onReset: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <Badge className="bg-gradient-primary mb-2">Demo interativa • dados fictícios</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold">Afiliados e Produtos</h1>
        <p className="mt-1 text-muted-foreground max-w-2xl">
          Crie produtos, ofertas, afiliados e cupons. Simule vendas, splits e recuperação de carrinho.
          Tudo client-side — nada é cobrado e nenhuma mensagem real é disparada.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <DemoContractCTA
          slug="fidelizacao"
          moduleName="Afiliados"
          moduleDescription="Crie produtos, ofertas, afiliados e cupons com split automático, order bump e recuperação."
          amountReference={297}
          features={["Produtos e ofertas", "Afiliados e cupons", "Split automático", "Order bump", "Recuperação de carrinho", "Ranking de afiliados"]}
          testRoute="/demo/afiliados"
        />
        <GuidedTour
          moduleKey="afiliados"
          title="Afiliados & Produtos"
          steps={[
            { title: "Comece pelo catálogo", body: "Cadastre 1 produto e 1 oferta. Defina comissão e order bump.", hint: "Use 'Popular com dados' para acelerar." },
            { title: "Monte a rede", body: "Cadastre afiliados e gerentes. Cupons podem ser vinculados a um afiliado." },
            { title: "Simule vendas", body: "Na aba Simular vendas, gere transações com diferentes fontes: checkout, recuperação e recompra." },
            { title: "Veja o painel", body: "Acompanhe receita, taxa Impulsionando, comissões e ranking em tempo real." },
            { title: "Parametrize SIM/NÃO", body: "Ative ou desative split, recorrência, recuperação e ranking público.", hint: "Tudo reversível — não toca banco real." },
          ]}
        />
        <Button variant="outline" onClick={onSeed}><Sparkles className="w-4 h-4 mr-1" />Popular com dados</Button>
        <Button variant="ghost" onClick={onReset}><RotateCcw className="w-4 h-4 mr-1" />Zerar tudo</Button>
      </div>
    </div>
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

function Help({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function StatusPill({ s }: { s: Venda["status"] }) {
  const map: Record<Venda["status"], string> = {
    aprovado: "bg-emerald-100 text-emerald-800 border-emerald-300",
    recusado: "bg-red-100 text-red-800 border-red-300",
    pendente: "bg-amber-100 text-amber-800 border-amber-300",
    estornado: "bg-zinc-200 text-zinc-700 border-zinc-300",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${map[s]}`}>{s}</span>;
}

function ParamToggle({
  label, hint, value, onChange,
}: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium flex items-center gap-1">{label} <Help text={hint} /></div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function CreateProduto({ onCreate }: { onCreate: (p: Produto) => void }) {
  return (
    <form
      className="grid sm:grid-cols-[1fr_120px_140px_auto] gap-2 mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const nome = String(f.get("nome") || "").trim();
        const preco = Number(f.get("preco") || 0);
        const rec = String(f.get("rec") || "unico") as Produto["recorrencia"];
        if (!nome || preco <= 0) { toast.error("Preencha nome e preço."); return; }
        onCreate({ id: uid("prd"), nome, preco, recorrencia: rec });
        (e.target as HTMLFormElement).reset();
      }}
    >
      <Input name="nome" placeholder="Nome do produto" />
      <Input name="preco" type="number" step="0.01" min="0" placeholder="Preço" />
      <select name="rec" className="border rounded-md px-2 text-sm bg-background">
        <option value="unico">Único</option>
        <option value="mensal">Mensal</option>
        <option value="anual">Anual</option>
      </select>
      <Button size="sm" type="submit"><Plus className="w-4 h-4 mr-1" />Criar</Button>
    </form>
  );
}

function ListaProdutos({ items, onRemove }: { items: Produto[]; onRemove: (id: string) => void }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">Nenhum produto.</p>;
  return (
    <ul className="space-y-1">
      {items.map((p) => (
        <li key={p.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-1.5">
          <span>{p.nome} <Badge variant="outline" className="ml-1 text-[10px]">{p.recorrencia}</Badge></span>
          <span className="flex items-center gap-3">
            <span className="font-medium">{brl(p.preco)}</span>
            <Button size="icon" variant="ghost" onClick={() => onRemove(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </span>
        </li>
      ))}
    </ul>
  );
}

function CreateOferta({ produtos, onCreate }: { produtos: Produto[]; onCreate: (o: Oferta) => void }) {
  if (!produtos.length) return <p className="text-xs text-muted-foreground mb-3">Crie um produto antes.</p>;
  return (
    <form
      className="grid sm:grid-cols-[1fr_1fr_100px_100px_auto] gap-2 mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onCreate({
          id: uid("of"),
          produtoId: String(f.get("prd")),
          nome: String(f.get("nome") || "Oferta"),
          comissaoPct: Number(f.get("com") || 30),
          bumpPct: Number(f.get("bump") || 10),
        });
        (e.target as HTMLFormElement).reset();
      }}
    >
      <select name="prd" className="border rounded-md px-2 text-sm bg-background">
        {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      <Input name="nome" placeholder="Nome da oferta" />
      <Input name="com" type="number" min="0" max="100" defaultValue={30} placeholder="Comissão %" />
      <Input name="bump" type="number" min="0" max="100" defaultValue={10} placeholder="Bump %" />
      <Button size="sm" type="submit"><Plus className="w-4 h-4 mr-1" />Criar</Button>
    </form>
  );
}

function ListaOfertas({ ofertas, produtos, onRemove }: { ofertas: Oferta[]; produtos: Produto[]; onRemove: (id: string) => void }) {
  if (!ofertas.length) return <p className="text-xs text-muted-foreground">Nenhuma oferta.</p>;
  return (
    <ul className="space-y-1">
      {ofertas.map((o) => {
        const p = produtos.find((x) => x.id === o.produtoId);
        return (
          <li key={o.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-1.5">
            <span>{o.nome} <span className="text-muted-foreground">· {p?.nome}</span></span>
            <span className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px]"><Percent className="w-3 h-3 mr-1" />com {o.comissaoPct}%</Badge>
              <Badge variant="outline" className="text-[10px]">bump {o.bumpPct}%</Badge>
              <Button size="icon" variant="ghost" onClick={() => onRemove(o.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function CreateAfiliado({ onCreate }: { onCreate: (a: Afiliado) => void }) {
  return (
    <form
      className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const nome = String(f.get("nome") || "").trim();
        const email = String(f.get("email") || "").trim();
        if (!nome) return;
        onCreate({ id: uid("af"), nome, email });
        (e.target as HTMLFormElement).reset();
      }}
    >
      <Input name="nome" placeholder="Nome do afiliado" />
      <Input name="email" type="email" placeholder="email@exemplo.com" />
      <Button size="sm" type="submit"><Plus className="w-4 h-4 mr-1" />Criar</Button>
    </form>
  );
}

function ListaAfiliados({ items, onRemove }: { items: Afiliado[]; onRemove: (id: string) => void }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">Nenhum afiliado.</p>;
  return (
    <ul className="space-y-1">
      {items.map((a) => (
        <li key={a.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-1.5">
          <span>{a.nome} <span className="text-muted-foreground">· {a.email || "sem email"}</span></span>
          <Button size="icon" variant="ghost" onClick={() => onRemove(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </li>
      ))}
    </ul>
  );
}

function CreateCupom({ afiliados, onCreate }: { afiliados: Afiliado[]; onCreate: (c: Cupom) => void }) {
  return (
    <form
      className="grid sm:grid-cols-[1fr_1fr_120px_auto] gap-2 mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const code = String(f.get("code") || "").trim().toUpperCase();
        if (!code) return;
        onCreate({
          id: uid("cp"),
          code,
          descontoPct: Number(f.get("desc") || 10),
          afiliadoId: String(f.get("af") || "") || undefined,
        });
        (e.target as HTMLFormElement).reset();
      }}
    >
      <Input name="code" placeholder="Código (ex: PROMO10)" />
      <select name="af" className="border rounded-md px-2 text-sm bg-background">
        <option value="">— sem afiliado vinculado —</option>
        {afiliados.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
      </select>
      <Input name="desc" type="number" min="0" max="100" defaultValue={10} />
      <Button size="sm" type="submit"><Plus className="w-4 h-4 mr-1" />Criar</Button>
    </form>
  );
}

function ListaCupons({ cupons, afiliados, onRemove }: { cupons: Cupom[]; afiliados: Afiliado[]; onRemove: (id: string) => void }) {
  if (!cupons.length) return <p className="text-xs text-muted-foreground">Nenhum cupom.</p>;
  return (
    <ul className="space-y-1">
      {cupons.map((c) => {
        const a = afiliados.find((x) => x.id === c.afiliadoId);
        return (
          <li key={c.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-1.5">
            <span><code className="px-1 py-0.5 bg-muted rounded">{c.code}</code> · {c.descontoPct}% off {a && <span className="text-muted-foreground">· {a.nome}</span>}</span>
            <Button size="icon" variant="ghost" onClick={() => onRemove(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </li>
        );
      })}
    </ul>
  );
}

function StickyCTA({ slug }: { slug: string }) {
  return (
    <div className="sticky bottom-3 mt-8">
      <Card className="p-3 flex items-center justify-between gap-3 flex-wrap shadow-elegant border-primary/30">
        <div className="text-sm">
          <DollarSign className="w-4 h-4 inline mr-1 text-primary" />
          Gostou da simulação? Contrate o módulo Afiliados no plano real.
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/modulos/$slug" params={{ slug }}>Ver detalhes</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-primary">
            <Link to="/orcamento" search={{ origem: `demo:afiliados` }}>Pedir orçamento</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
