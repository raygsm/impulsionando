import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFiscalOverview, emitFiscalInvoice, upsertFiscalSequence,
  createMpPreferenceForAr, reconcileArByExternalRef,
} from "@/lib/riomed-fiscal.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, CreditCard, RefreshCw, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/fiscal")({
  component: Page,
});

function Page() {
  const fn = useServerFn(getFiscalOverview);
  const emit = useServerFn(emitFiscalInvoice);
  const mp = useServerFn(createMpPreferenceForAr);
  const rec = useServerFn(reconcileArByExternalRef);
  const upSeq = useServerFn(upsertFiscalSequence);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["riomed-fiscal"], queryFn: () => fn() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["riomed-fiscal"] });
  const handler = (mf: any, msg: string) => useMutation({
    mutationFn: (a: any) => mf({ data: a }),
    onSuccess: (r: any) => { invalidate(); toast.success(r?.fiscalNumber ? `Factura ${r.fiscalNumber}` : (r?.initPoint ? "Link gerado" : msg)); if (r?.initPoint) window.open(r.initPoint, "_blank"); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const mEmit = handler(emit, "Emitida");
  const mMp = handler(mp, "Link MP gerado");
  const mRec = handler(rec, "Reconciliado");

  const [prefix, setPrefix] = useState("001-001-");
  const [next, setNext] = useState(1);
  const [padding, setPadding] = useState(7);
  const mSeq = useMutation({
    mutationFn: () => upSeq({ data: { prefix, nextNumber: next, padding } }),
    onSuccess: () => { invalidate(); toast.success("Sequência salva"); },
    onError: (e: any) => toast.error(e?.message),
  });

  if (isLoading) return <div className="p-6">Carregando…</div>;
  const ar = data?.ar ?? [];
  const seq = data?.sequence;
  const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BOB" }).format(v ?? 0);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Faturamento Fiscal — Rio Med</h1>
        <p className="text-sm text-muted-foreground">Emissão de factura (PY/BO), links de pagamento Mercado Pago e conciliação.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Sequência fiscal</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div><Label>Prefixo</Label><Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={seq?.prefix ?? "001-001-"} /></div>
          <div><Label>Próximo número</Label><Input type="number" value={next} onChange={(e) => setNext(Number(e.target.value))} placeholder={String(seq?.next_number ?? 1)} /></div>
          <div><Label>Padding</Label><Input type="number" value={padding} onChange={(e) => setPadding(Number(e.target.value))} placeholder={String(seq?.padding ?? 7)} /></div>
          <Button onClick={() => mSeq.mutate()} disabled={mSeq.isPending}>Salvar</Button>
          {seq && <div className="md:col-span-4 text-xs text-muted-foreground">Atual: {seq.prefix}{String(seq.next_number).padStart(seq.padding, "0")}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Contas a receber ({ar.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead><TableHead>Factura</TableHead><TableHead>MP</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ar.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[260px] truncate">{r.description}</TableCell>
                  <TableCell>{money(Number(r.amount))}</TableCell>
                  <TableCell>{r.due_date?.slice(0, 10)}</TableCell>
                  <TableCell><Badge variant={r.status === "paid" ? "default" : r.status === "overdue" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell>{r.fiscal_number ? <Badge>{r.fiscal_number}</Badge> : <Badge variant="outline">pendente</Badge>}</TableCell>
                  <TableCell>{r.mp_preference_id ? <Badge variant="outline">link</Badge> : "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {!r.fiscal_number && <Button size="sm" variant="outline" onClick={() => mEmit.mutate({ arId: r.id })}><FileText className="h-3 w-3 mr-1" />Emitir</Button>}
                    {!r.mp_preference_id && r.status !== "paid" && <Button size="sm" variant="outline" onClick={() => mMp.mutate({ arId: r.id })}><CreditCard className="h-3 w-3 mr-1" />Link MP</Button>}
                    {r.mp_preference_id && r.status !== "paid" && <Button size="sm" variant="outline" onClick={() => mRec.mutate({ arId: r.id })}><RefreshCw className="h-3 w-3 mr-1" />Conciliar</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {ar.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem contas a receber</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
