import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listRiomedQuotes, getRiomedQuote, saveRiomedQuote, sendRiomedQuote, convertQuoteToOrder, listOrders,
} from "@/lib/riomed-sales.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Send, ArrowRight, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/pedidos")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='orders' title='Pedidos RioMed'><PedidosPage /></TenantModuleShell>),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

function PedidosPage() {
  const qc = useQueryClient();
  const fns = {
    qs: useServerFn(listRiomedQuotes),
    save: useServerFn(saveRiomedQuote),
    send: useServerFn(sendRiomedQuote),
    convert: useServerFn(convertQuoteToOrder),
    orders: useServerFn(listOrders),
  };
  const quotes = useQuery({ queryKey: ["rm-quotes"], queryFn: () => fns.qs() });
  const orders = useQuery({ queryKey: ["rm-orders"], queryFn: () => fns.orders() });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["rm-quotes"] });
    qc.invalidateQueries({ queryKey: ["rm-orders"] });
  };

  const saveMut = useMutation({ mutationFn: (d: any) => fns.save({ data: d }), onSuccess: () => { toast.success("Cotização salva"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const sendMut = useMutation({
    mutationFn: (id: string) => fns.send({ data: { id } }),
    onSuccess: (r: any) => {
      const url = `${window.location.origin}/riomed/cotizacion/${r.token}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      toast.success("Link público copiado: " + url);
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const convMut = useMutation({ mutationFn: (id: string) => fns.convert({ data: { id } }), onSuccess: () => { toast.success("Pedido gerado"); invalidate(); }, onError: (e: any) => toast.error(e.message) });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cotizações & Pedidos — RioMed</h1>
        <p className="text-muted-foreground">Criação de cotização, envio público, conversão para pedido com baixa de estoque e comissão.</p>
      </div>
      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">Cotizações</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cotizações</CardTitle>
              <QuoteDialog onSave={(d: any) => saveMut.mutate(d)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(quotes.data?.quotes ?? []).map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono">{q.code}</TableCell>
                      <TableCell>{q.crm_leads?.name ?? "—"}</TableCell>
                      <TableCell>{Number(q.total ?? 0).toLocaleString()} {q.currency}</TableCell>
                      <TableCell><Badge>{q.status}</Badge></TableCell>
                      <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => sendMut.mutate(q.id)}><Send className="h-3 w-3 mr-1" />Enviar</Button>
                        {q.public_token && (
                          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/riomed/cotizacion/${q.public_token}`); toast.success("Link copiado"); }}><Copy className="h-3 w-3" /></Button>
                        )}
                        {!q.order_id && (
                          <Button size="sm" onClick={() => convMut.mutate(q.id)}><ArrowRight className="h-3 w-3 mr-1" />Pedido</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(quotes.data?.quotes ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem cotizações.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Pedidos</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(orders.data?.orders ?? []).map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono">#{o.number ?? o.id.slice(0, 8)}</TableCell>
                      <TableCell>{o.customer_name}</TableCell>
                      <TableCell>{Number(o.total ?? 0).toLocaleString()}</TableCell>
                      <TableCell><Badge>{o.status}</Badge></TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(orders.data?.orders ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem pedidos.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuoteDialog({ onSave }: { onSave: (d: any) => void }) {
  const [open, setOpen] = useState(false);
  const [lead, setLead] = useState("");
  const [currency, setCurrency] = useState("PYG");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([{ description: "", qty: 1, unit_price: 0, discount: 0 }]);

  function update(i: number, k: string, v: any) {
    const c = [...items]; (c[i] as any)[k] = v; setItems(c);
  }
  function add() { setItems([...items, { description: "", qty: 1, unit_price: 0, discount: 0 }]); }
  function del(i: number) { setItems(items.filter((_, x) => x !== i)); }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nova cotização</Button></DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Nova cotização</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Lead ID</Label><Input value={lead} onChange={(e) => setLead(e.target.value)} placeholder="UUID do lead (opcional)" /></div>
            <div><Label>Moeda</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
          </div>
          <div>
            <Label>Itens</Label>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-end">
                  <Input className="col-span-5" placeholder="Descrição" value={it.description} onChange={(e) => update(i, "description", e.target.value)} />
                  <Input className="col-span-2" type="number" placeholder="Qtde" value={it.qty} onChange={(e) => update(i, "qty", e.target.value)} />
                  <Input className="col-span-2" type="number" placeholder="Unit." value={it.unit_price} onChange={(e) => update(i, "unit_price", e.target.value)} />
                  <Input className="col-span-2" type="number" placeholder="Desc." value={it.discount} onChange={(e) => update(i, "discount", e.target.value)} />
                  <Button className="col-span-1" size="icon" variant="ghost" onClick={() => del(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={add}>+ Item</Button>
          </div>
          <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            onSave({ lead_id: lead || null, currency, notes, items: items.filter((x) => x.description) });
            setOpen(false);
          }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
