import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPosZReport, listPosTerminals } from "@/lib/riomed-pos.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileBarChart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/pos-relatorio")({
  component: () => (
    <TenantModuleShell tenantSlug="riomed" moduleSlug="pos-relatorio" title="Relatório Z/X — POS Rio Med">
      <Page />
    </TenantModuleShell>
  ),
});

const money = (v: number) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v ?? 0);

function toCsv(rows: any[], headers: { key: string; label: string }[]) {
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = headers.map(h => esc(h.label)).join(";");
  const body = rows.map(r => headers.map(h => esc(r[h.key])).join(";")).join("\n");
  return head + "\n" + body;
}

function download(name: string, content: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Page() {
  const reportFn = useServerFn(getPosZReport);
  const termFn = useServerFn(listPosTerminals);

  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [terminalId, setTerminalId] = useState<string>("");

  const { data: terminals } = useQuery({ queryKey: ["riomed-pos-terminals"], queryFn: () => termFn() });

  const params = useMemo(() => ({
    from: `${from}T00:00:00.000Z`,
    to: `${to}T23:59:59.999Z`,
    terminalId: terminalId || undefined,
  }), [from, to, terminalId]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["riomed-pos-z", params],
    queryFn: () => reportFn({ data: params }),
  });

  const exportSales = () => {
    const rows = (data?.sales ?? []).map((s: any) => ({
      data: new Date(s.created_at).toLocaleString("pt-BR"),
      cliente: s.customer_name ?? "",
      documento: s.customer_doc ?? "",
      subtotal: Number(s.subtotal).toFixed(2),
      desconto: Number(s.discount).toFixed(2),
      total: Number(s.total).toFixed(2),
      pagamento: s.payment_method,
      recebido: Number(s.paid_amount).toFixed(2),
      troco: Number(s.change_amount).toFixed(2),
      factura: s.fiscal_number ?? "",
    }));
    download(`pos-vendas-${from}_${to}.csv`, toCsv(rows, [
      { key: "data", label: "Data" }, { key: "cliente", label: "Cliente" }, { key: "documento", label: "NIT/CI" },
      { key: "subtotal", label: "Subtotal" }, { key: "desconto", label: "Desconto" }, { key: "total", label: "Total (BOB)" },
      { key: "pagamento", label: "Forma" }, { key: "recebido", label: "Recebido" }, { key: "troco", label: "Troco" },
      { key: "factura", label: "Factura" },
    ]));
  };

  const exportSummary = () => {
    const s = data?.summary;
    if (!s) return;
    const rows = [
      { item: "Vendas (qtd)", valor: s.salesCount },
      { item: "Vendas (total BOB)", valor: Number(s.salesTotal).toFixed(2) },
      { item: "Efectivo", valor: Number(s.cashTotal).toFixed(2) },
      { item: "Suprimentos", valor: Number(s.cashIn).toFixed(2) },
      { item: "Sangrias", valor: Number(s.cashOut).toFixed(2) },
      { item: "Abertura total", valor: Number(s.openingSum).toFixed(2) },
      { item: "Caixa esperado", valor: Number(s.expectedCash).toFixed(2) },
      { item: "Facturas emitidas", valor: s.fiscalEmitted },
      { item: "Facturas pendentes", valor: s.fiscalPending },
      ...Object.entries(s.byMethod).map(([k, v]: any) => ({ item: `Pgto ${k}`, valor: `${v.count} · ${Number(v.total).toFixed(2)}` })),
    ];
    download(`pos-resumo-${from}_${to}.csv`, toCsv(rows, [
      { key: "item", label: "Item" }, { key: "valor", label: "Valor" },
    ]));
  };

  const s = data?.summary;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center gap-2">
        <FileBarChart className="h-5 w-5" />
        <div>
          <h1 className="text-2xl font-bold">Relatório Z/X — POS Rio Med</h1>
          <p className="text-sm text-muted-foreground">Fechamento diário do caixa físico em BOB, com exportação CSV.</p>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className="md:col-span-2">
            <Label>Terminal</Label>
            <Select value={terminalId || "all"} onValueChange={(v) => setTerminalId(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(terminals ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.code} · {t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => refetch()} disabled={isFetching}>Aplicar</Button>
        </CardContent>
      </Card>

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Vendas" value={String(s.salesCount)} sub={money(s.salesTotal)} />
          <KPI label="Efectivo" value={money(s.cashTotal)} sub={`Esperado em caixa: ${money(s.expectedCash)}`} />
          <KPI label="Suprimentos / Sangrias" value={`${money(s.cashIn)} / ${money(s.cashOut)}`} sub={`Abertura: ${money(s.openingSum)}`} />
          <KPI label="Facturas" value={String(s.fiscalEmitted)} sub={`Pendentes: ${s.fiscalPending}`} />
        </div>
      )}

      {s && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Por forma de pagamento</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportSummary}><Download className="h-4 w-4 mr-1" /> Resumo CSV</Button>
              <Button variant="outline" size="sm" onClick={exportSales}><Download className="h-4 w-4 mr-1" /> Vendas CSV</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Forma</TableHead><TableHead>Qtd</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(s.byMethod).map(([k, v]: any) => (
                  <TableRow key={k}><TableCell><Badge variant="outline">{k}</Badge></TableCell><TableCell>{v.count}</TableCell><TableCell>{money(v.total)}</TableCell></TableRow>
                ))}
                {Object.keys(s.byMethod).length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sem vendas no período.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Sessões no período</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Terminal</TableHead><TableHead>Aberta</TableHead><TableHead>Fechada</TableHead>
              <TableHead>Abertura</TableHead><TableHead>Esperado</TableHead><TableHead>Contado</TableHead><TableHead>Diferença</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data?.sessions ?? []).map((ss: any) => (
                <TableRow key={ss.id}>
                  <TableCell>{ss.terminal?.code} · {ss.terminal?.name}</TableCell>
                  <TableCell>{new Date(ss.opened_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{ss.closed_at ? new Date(ss.closed_at).toLocaleString("pt-BR") : <Badge>Aberta</Badge>}</TableCell>
                  <TableCell>{money(Number(ss.opening_amount))}</TableCell>
                  <TableCell>{ss.expected_amount != null ? money(Number(ss.expected_amount)) : "—"}</TableCell>
                  <TableCell>{ss.closing_amount != null ? money(Number(ss.closing_amount)) : "—"}</TableCell>
                  <TableCell className={Number(ss.difference ?? 0) < 0 ? "text-red-600 font-semibold" : Number(ss.difference ?? 0) > 0 ? "text-amber-600 font-semibold" : ""}>
                    {ss.difference != null ? money(Number(ss.difference)) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {(data?.sessions ?? []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhuma sessão.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent></Card>
  );
}
