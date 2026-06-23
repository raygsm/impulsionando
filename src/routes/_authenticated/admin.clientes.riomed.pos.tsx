import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPosOverview, listPosSessions, listPosTerminals, upsertPosTerminal,
  openPosSession, closePosSession, createPosSale, createPosMovement, emitPosSaleFiscal, listPosSales,
} from "@/lib/riomed-pos.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calculator, Plus, DollarSign, FileText, LockOpen, Lock, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/pos")({
  component: () => (
    <TenantModuleShell tenantSlug="riomed" moduleSlug="pos" title="POS / Caixa Rio Med">
      <Page />
    </TenantModuleShell>
  ),
});

const money = (v: number) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v ?? 0);

function Page() {
  const overviewFn = useServerFn(getPosOverview);
  const { data: ov, isLoading } = useQuery({
    queryKey: ["riomed-pos-overview"],
    queryFn: () => overviewFn(),
    refetchInterval: 20_000,
  });

  if (isLoading) return <div className="p-6">Carregando…</div>;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center gap-2">
        <Calculator className="h-5 w-5" />
        <div>
          <h1 className="text-2xl font-bold">POS / Caixa Físico — Rio Med (BOB)</h1>
          <p className="text-sm text-muted-foreground">
            Vendas de balcão em bolivianos com emissão fiscal Bolívia.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI label="Caixas cadastrados" value={String(ov?.terminals.length ?? 0)} />
        <KPI label="Sessões abertas" value={String(ov?.openSessions.length ?? 0)} />
        <KPI label="Vendas recentes" value={String(ov?.recentSales.length ?? 0)} />
      </div>

      <Tabs defaultValue="caixa">
        <TabsList>
          <TabsTrigger value="caixa">Operar caixa</TabsTrigger>
          <TabsTrigger value="sessoes">Sessões</TabsTrigger>
          <TabsTrigger value="terminais">Terminais</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="caixa"><OperateTab openSessions={ov?.openSessions ?? []} terminals={ov?.terminals ?? []} /></TabsContent>
        <TabsContent value="sessoes"><SessionsTab /></TabsContent>
        <TabsContent value="terminais"><TerminalsTab /></TabsContent>
        <TabsContent value="vendas"><SalesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent></Card>
  );
}

// ---------- Operar caixa ----------
function OperateTab({ openSessions, terminals }: { openSessions: any[]; terminals: any[] }) {
  const qc = useQueryClient();
  const open = useServerFn(openPosSession);
  const close = useServerFn(closePosSession);
  const mov = useServerFn(createPosMovement);

  const [termId, setTermId] = useState<string>(terminals[0]?.id ?? "");
  const [opening, setOpening] = useState<number>(0);

  const mOpen = useMutation({
    mutationFn: () => open({ data: { terminalId: termId, openingAmount: opening } }),
    onSuccess: () => { toast.success("Caixa aberto"); qc.invalidateQueries({ queryKey: ["riomed-pos-overview"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  return (
    <div className="space-y-4">
      {openSessions.length === 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LockOpen className="h-4 w-4" /> Abrir caixa</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Terminal</Label>
              <Select value={termId} onValueChange={setTermId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {terminals.filter((t: any) => t.active).map((t: any) =>
                    <SelectItem key={t.id} value={t.id}>{t.code} · {t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Abertura (BOB)</Label>
              <Input type="number" step="0.01" value={opening} onChange={(e) => setOpening(Number(e.target.value))} />
            </div>
            <Button onClick={() => mOpen.mutate()} disabled={!termId || mOpen.isPending}>Abrir caixa</Button>
            {terminals.length === 0 && <div className="md:col-span-4 text-xs text-muted-foreground">Cadastre um terminal na aba "Terminais" primeiro.</div>}
          </CardContent>
        </Card>
      )}

      {openSessions.map((s: any) => (
        <OpenSessionCard key={s.id} session={s} onClose={close} onMov={mov} />
      ))}
    </div>
  );
}

function OpenSessionCard({ session, onClose, onMov }: { session: any; onClose: any; onMov: any }) {
  const qc = useQueryClient();
  const [closingAmount, setClosingAmount] = useState<number>(0);

  const mClose = useMutation({
    mutationFn: () => onClose({ data: { sessionId: session.id, closingAmount } }),
    onSuccess: (r: any) => {
      toast.success(`Fechado — esperado ${money(r.expected)} · diferença ${money(r.difference)}`);
      qc.invalidateQueries({ queryKey: ["riomed-pos-overview"] });
      qc.invalidateQueries({ queryKey: ["riomed-pos-sessions"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><LockOpen className="h-4 w-4 text-emerald-500" /> {session.terminal?.code} · {session.terminal?.name}</span>
          <Badge variant="outline">Aberto · {money(Number(session.opening_amount))}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SaleForm sessionId={session.id} />
        <MovementForm sessionId={session.id} onMov={onMov} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t items-end">
          <div className="md:col-span-2">
            <Label>Valor contado no fechamento (BOB)</Label>
            <Input type="number" step="0.01" value={closingAmount} onChange={(e) => setClosingAmount(Number(e.target.value))} />
          </div>
          <Button variant="destructive" onClick={() => mClose.mutate()} disabled={mClose.isPending}>
            <Lock className="h-4 w-4 mr-1" /> Fechar caixa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SaleForm({ sessionId }: { sessionId: string }) {
  const qc = useQueryClient();
  const create = useServerFn(createPosSale);
  const [customer, setCustomer] = useState("");
  const [doc, setDoc] = useState("");
  const [discount, setDiscount] = useState(0);
  const [pm, setPm] = useState<"cash" | "card" | "qr" | "transfer" | "mixed">("cash");
  const [paid, setPaid] = useState(0);
  const [items, setItems] = useState<{ description: string; qty: number; unitPrice: number }[]>([
    { description: "", qty: 1, unitPrice: 0 },
  ]);
  const subtotal = useMemo(() => items.reduce((a, i) => a + i.qty * i.unitPrice, 0), [items]);
  const total = Math.max(0, subtotal - discount);

  const m = useMutation({
    mutationFn: () => create({ data: {
      sessionId,
      customerName: customer || undefined,
      customerDoc: doc || undefined,
      discount,
      paymentMethod: pm,
      paidAmount: paid || total,
      items: items.filter(i => i.description.trim() && i.unitPrice > 0),
    } }),
    onSuccess: (r: any) => {
      toast.success(`Venda registrada · troco ${money(r.change)}`);
      setItems([{ description: "", qty: 1, unitPrice: 0 }]);
      setCustomer(""); setDoc(""); setDiscount(0); setPaid(0);
      qc.invalidateQueries({ queryKey: ["riomed-pos-overview"] });
      qc.invalidateQueries({ queryKey: ["riomed-pos-sales"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const update = (idx: number, patch: Partial<typeof items[number]>) =>
    setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));

  return (
    <div className="space-y-3 border rounded-lg p-3">
      <div className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Nova venda</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div><Label>Cliente</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
        <div><Label>Documento (NIT/CI)</Label><Input value={doc} onChange={(e) => setDoc(e.target.value)} /></div>
      </div>

      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6"><Label>Descrição</Label><Input value={it.description} onChange={(e) => update(idx, { description: e.target.value })} /></div>
            <div className="col-span-2"><Label>Qtd</Label><Input type="number" step="0.001" value={it.qty} onChange={(e) => update(idx, { qty: Number(e.target.value) })} /></div>
            <div className="col-span-3"><Label>Preço</Label><Input type="number" step="0.01" value={it.unitPrice} onChange={(e) => update(idx, { unitPrice: Number(e.target.value) })} /></div>
            <div className="col-span-1">
              <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: "", qty: 1, unitPrice: 0 }])}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar item
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
        <div><Label>Desconto</Label><Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
        <div>
          <Label>Pagamento</Label>
          <Select value={pm} onValueChange={(v) => setPm(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="qr">QR</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="mixed">Mixto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Recebido</Label><Input type="number" step="0.01" value={paid} onChange={(e) => setPaid(Number(e.target.value))} /></div>
        <div className="text-sm">Subtotal: <b>{money(subtotal)}</b><br />Total: <b>{money(total)}</b></div>
        <Button onClick={() => m.mutate()} disabled={m.isPending || total <= 0}>Registrar venda</Button>
      </div>
    </div>
  );
}

function MovementForm({ sessionId, onMov }: { sessionId: string; onMov: any }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<"cash_in" | "cash_out">("cash_in");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const m = useMutation({
    mutationFn: () => onMov({ data: { sessionId, kind, amount, reason: reason || undefined } }),
    onSuccess: () => { toast.success("Movimento registrado"); setAmount(0); setReason(""); qc.invalidateQueries({ queryKey: ["riomed-pos-overview"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end border rounded-lg p-3">
      <div className="md:col-span-1">
        <Label>Tipo</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash_in">Suprimento</SelectItem>
            <SelectItem value="cash_out">Sangria</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Valor (BOB)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
      <div className="md:col-span-2"><Label>Motivo</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      <Button onClick={() => m.mutate()} disabled={!amount || m.isPending}>Lançar</Button>
    </div>
  );
}

// ---------- Sessões ----------
function SessionsTab() {
  const fn = useServerFn(listPosSessions);
  const { data } = useQuery({ queryKey: ["riomed-pos-sessions"], queryFn: () => fn({ data: { limit: 50 } }) });
  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Terminal</TableHead><TableHead>Aberto em</TableHead><TableHead>Status</TableHead>
          <TableHead>Abertura</TableHead><TableHead>Fechamento</TableHead><TableHead>Diferença</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {(data ?? []).map((s: any) => (
            <TableRow key={s.id}>
              <TableCell>{s.terminal?.code} · {s.terminal?.name}</TableCell>
              <TableCell>{new Date(s.opened_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell><Badge variant={s.status === "open" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
              <TableCell>{money(Number(s.opening_amount))}</TableCell>
              <TableCell>{s.closing_amount != null ? money(Number(s.closing_amount)) : "—"}</TableCell>
              <TableCell className={Number(s.difference ?? 0) < 0 ? "text-red-600" : ""}>{s.difference != null ? money(Number(s.difference)) : "—"}</TableCell>
            </TableRow>
          ))}
          {(data ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma sessão.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

// ---------- Terminais ----------
function TerminalsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listPosTerminals);
  const up = useServerFn(upsertPosTerminal);
  const { data } = useQuery({ queryKey: ["riomed-pos-terminals"], queryFn: () => list() });
  const [code, setCode] = useState(""); const [name, setName] = useState(""); const [loc, setLoc] = useState("");
  const m = useMutation({
    mutationFn: () => up({ data: { code, name, location: loc || undefined, active: true } }),
    onSuccess: () => { toast.success("Terminal salvo"); setCode(""); setName(""); setLoc("");
      qc.invalidateQueries({ queryKey: ["riomed-pos-terminals"] });
      qc.invalidateQueries({ queryKey: ["riomed-pos-overview"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Novo terminal</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div><Label>Código</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CAJA-01" /></div>
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Caixa Loja Centro" /></div>
          <div><Label>Localização</Label><Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Santa Cruz" /></div>
          <Button onClick={() => m.mutate()} disabled={!code || !name || m.isPending}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </CardContent>
      </Card>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Local</TableHead><TableHead>Moeda</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono">{t.code}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.location ?? "—"}</TableCell>
                <TableCell>{t.currency}</TableCell>
                <TableCell><Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Ativo" : "Inativo"}</Badge></TableCell>
              </TableRow>
            ))}
            {(data ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum terminal cadastrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

// ---------- Vendas ----------
function SalesTab() {
  const qc = useQueryClient();
  const list = useServerFn(listPosSales);
  const emit = useServerFn(emitPosSaleFiscal);
  const { data } = useQuery({ queryKey: ["riomed-pos-sales"], queryFn: () => list({ data: { limit: 100 } }) });
  const m = useMutation({
    mutationFn: (saleId: string) => emit({ data: { saleId } }),
    onSuccess: (r: any) => { toast.success(r.alreadyEmitted ? `Já emitida: ${r.fiscalNumber}` : `Factura ${r.fiscalNumber}`); qc.invalidateQueries({ queryKey: ["riomed-pos-sales"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead>
          <TableHead>Pagamento</TableHead><TableHead>Factura</TableHead><TableHead className="text-right">Ações</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {(data ?? []).map((s: any) => (
            <TableRow key={s.id}>
              <TableCell>{new Date(s.created_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell>{s.customer_name ?? "—"}</TableCell>
              <TableCell>{money(Number(s.total))}</TableCell>
              <TableCell><Badge variant="outline">{s.payment_method}</Badge></TableCell>
              <TableCell>{s.fiscal_number ? <Badge>{s.fiscal_number}</Badge> : <span className="text-muted-foreground text-xs">não emitida</span>}</TableCell>
              <TableCell className="text-right">
                {!s.fiscal_number && (
                  <Button size="sm" variant="outline" onClick={() => m.mutate(s.id)} disabled={m.isPending}>
                    <FileText className="h-4 w-4 mr-1" /> Emitir factura
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {(data ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma venda.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}
