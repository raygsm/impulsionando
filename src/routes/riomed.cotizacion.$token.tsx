import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicQuote, approvePublicQuote, rejectPublicQuote } from "@/lib/riomed-sales.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/riomed/cotizacion/$token")({
  component: PublicQuotePage,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div className="p-8">Cotización no encontrada</div>,
  head: () => ({ meta: [{ title: "Cotización RioMed" }, { name: "robots", content: "noindex" }] }),
});

function PublicQuotePage() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const fns = {
    get: useServerFn(getPublicQuote),
    ok: useServerFn(approvePublicQuote),
    no: useServerFn(rejectPublicQuote),
  };
  const q = useQuery({ queryKey: ["pq", token], queryFn: () => fns.get({ data: { token } }) });
  const okMut = useMutation({
    mutationFn: (name: string) => fns.ok({ data: { token, approverName: name } }),
    onSuccess: () => { toast.success("¡Cotización aprobada!"); qc.invalidateQueries({ queryKey: ["pq", token] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const noMut = useMutation({
    mutationFn: (reason: string) => fns.no({ data: { token, reason } }),
    onSuccess: () => { toast.success("Cotización rechazada"); qc.invalidateQueries({ queryKey: ["pq", token] }); },
  });
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");

  if (q.isLoading) return <div className="p-8">Cargando…</div>;
  if (q.data?.expired) return <div className="p-8 text-center"><h1 className="text-xl font-bold">Enlace expirado</h1></div>;
  if (!q.data?.quote) return <div className="p-8 text-center"><h1 className="text-xl font-bold">Cotización no encontrada</h1></div>;

  const quote = q.data.quote as any;
  const items = q.data.items as any[];
  const decided = ["approved", "converted", "rejected"].includes(quote.status);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-3xl py-10 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Cotización {quote.code}</CardTitle>
              <Badge>{quote.status}</Badge>
            </div>
            <p className="text-muted-foreground">RioMed — Equipamiento médico</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Descripción</TableHead><TableHead>Cant.</TableHead><TableHead>Unit.</TableHead><TableHead>Total</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>{it.description}</TableCell>
                    <TableCell>{it.qty}</TableCell>
                    <TableCell>{Number(it.unit_price).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{Number(it.total).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-8 text-sm">
              <div className="space-y-1 text-right">
                <div>Subtotal: <strong>{Number(quote.subtotal ?? 0).toLocaleString()} {quote.currency}</strong></div>
                {Number(quote.discount_total ?? 0) > 0 && <div>Descuento: -{Number(quote.discount_total).toLocaleString()}</div>}
                <div className="text-lg">Total: <strong>{Number(quote.total ?? 0).toLocaleString()} {quote.currency}</strong></div>
              </div>
            </div>

            {quote.notes && <div className="p-3 bg-muted/40 rounded text-sm">{quote.notes}</div>}

            {decided ? (
              <div className="p-4 rounded bg-muted text-center">
                <p className="font-medium">Esta cotización ya fue {quote.status}.</p>
                {quote.approved_at && <p className="text-sm text-muted-foreground">Aprobada el {new Date(quote.approved_at).toLocaleString()}</p>}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Aprobar</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <Label>Su nombre</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
                    <Button className="w-full" disabled={name.length < 2 || okMut.isPending} onClick={() => okMut.mutate(name)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar cotización
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Rechazar</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <Label>Motivo (opcional)</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                    <Button variant="outline" className="w-full" disabled={noMut.isPending} onClick={() => noMut.mutate(reason)}>
                      <XCircle className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
