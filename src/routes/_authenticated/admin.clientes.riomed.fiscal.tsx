import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFiscalOverview, issueInternalDocument, upsertFiscalSequence } from "@/lib/riomed-fiscal.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Settings, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/fiscal")({
  component: () => (
    <TenantModuleShell tenantSlug="riomed" moduleSlug="fiscal" title="Financeiro Rio Med">
      <Page />
    </TenantModuleShell>
  ),
});

function Page() {
  const overview = useServerFn(getFiscalOverview);
  const issue = useServerFn(issueInternalDocument);
  const upSeq = useServerFn(upsertFiscalSequence);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["riomed-fiscal"], queryFn: () => overview() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["riomed-fiscal"] });

  const mIssue = useMutation({
    mutationFn: (arId: string) => issue({ data: { arId } }),
    onSuccess: (result) => {
      invalidate();
      toast.success(`Documento interno ${result.internalDocumentNumber} gerado`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao gerar documento interno"),
  });

  const [prefix, setPrefix] = useState("INT-");
  const [next, setNext] = useState(1);
  const [padding, setPadding] = useState(7);
  const mSeq = useMutation({
    mutationFn: () => upSeq({ data: { prefix, nextNumber: next, padding } }),
    onSuccess: () => { invalidate(); toast.success("Sequência interna salva"); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar sequência"),
  });

  if (isLoading) return <div className="p-6">Carregando…</div>;
  const ar = data?.ar ?? [];
  const seq = data?.sequence;
  const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BOB" }).format(v ?? 0);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Contas a Receber — Rio Med</h1>
        <p className="text-sm text-muted-foreground">Controle financeiro em BOB e documentos internos operacionais.</p>
      </header>

      <Card className="border-amber-300">
        <CardContent className="flex gap-3 p-4 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Emissão fiscal oficial e Mercado Pago não estão habilitados.</p>
            <p className="text-muted-foreground">Os números gerados nesta área são identificadores internos e não representam autorização tributária. Pagamentos e emissão oficial só serão liberados após integração e homologação específicas.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Sequência de documento interno</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div><Label>Prefixo</Label><Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={seq?.prefix ?? "INT-"} /></div>
          <div><Label>Próximo número</Label><Input type="number" value={next} onChange={(e) => setNext(Number(e.target.value))} placeholder={String(seq?.next_number ?? 1)} /></div>
          <div><Label>Casas numéricas</Label><Input type="number" value={padding} onChange={(e) => setPadding(Number(e.target.value))} placeholder={String(seq?.padding ?? 7)} /></div>
          <Button onClick={() => mSeq.mutate()} disabled={mSeq.isPending}>Salvar</Button>
          {seq && <div className="md:col-span-4 text-xs text-muted-foreground">Próximo identificador: {seq.prefix}{String(seq.next_number).padStart(seq.padding, "0")}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Contas a receber ({ar.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead><TableHead>Documento interno</TableHead><TableHead>Fiscal oficial</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ar.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[260px] truncate">{r.description}</TableCell>
                  <TableCell>{money(Number(r.amount))}</TableCell>
                  <TableCell>{r.due_date?.slice(0, 10) ?? "—"}</TableCell>
                  <TableCell><Badge variant={r.status === "paid" ? "default" : r.status === "overdue" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell>{r.internal_document_number ? <Badge>{r.internal_document_number}</Badge> : <Badge variant="outline">não gerado</Badge>}</TableCell>
                  <TableCell><Badge variant="outline">{r.official_fiscal_status === "issued_external" ? "emitido externamente" : "não configurado"}</Badge></TableCell>
                  <TableCell className="text-right">
                    {!r.internal_document_number && <Button size="sm" variant="outline" onClick={() => mIssue.mutate(r.id)} disabled={mIssue.isPending}><FileText className="h-3 w-3 mr-1" />Gerar documento interno</Button>}
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
