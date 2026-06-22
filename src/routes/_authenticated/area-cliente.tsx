import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getRiomedCustomerArea } from "@/lib/riomed-customer-area.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User, Hospital, Truck, HeadphonesIcon, FileText, ShoppingCart, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/area-cliente")({
  component: AreaClientePage,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

const PROFILE_ICONS: Record<string, any> = {
  paciente: <User className="h-4 w-4" />, cliente: <User className="h-4 w-4" />,
  hospital: <Hospital className="h-4 w-4" />, fornecedor: <Truck className="h-4 w-4" />,
  vendedor: <Briefcase className="h-4 w-4" />, visitante: <User className="h-4 w-4" />,
};

function AreaClientePage() {
  const fn = useServerFn(getRiomedCustomerArea);
  const q = useQuery({ queryKey: ["rm-area"], queryFn: () => fn() });

  if (q.isLoading) return <div className="p-8">Cargando…</div>;
  const d = q.data!;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mi área RioMed</h1>
          <p className="text-muted-foreground">{d.email}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {d.profiles.map((p) => (
            <Badge key={p} variant="secondary" className="capitalize">
              {PROFILE_ICONS[p]} <span className="ml-1">{p}</span>
            </Badge>
          ))}
        </div>
      </div>

      {d.profiles.includes("visitante") && (
        <Card>
          <CardHeader><CardTitle>Bienvenido</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Tu correo aún no está vinculado a un perfil RioMed. Puedes solicitar una cotización para empezar.</p>
            <Button asChild><Link to="/riomed/cotizar">Solicitar cotización</Link></Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="quotes">Cotizaciones ({d.quotes.length})</TabsTrigger>
          <TabsTrigger value="orders">Pedidos ({d.orders.length})</TabsTrigger>
          <TabsTrigger value="support">Soporte ({d.tickets.length})</TabsTrigger>
          {d.profiles.includes("vendedor") && <TabsTrigger value="seller">Vendedor</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {d.hospital && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Hospital className="h-5 w-5" />Cuenta hospitalaria</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nombre:</strong> {d.hospital.legal_name ?? d.hospital.name}</div>
                  <div><strong>RUC:</strong> {d.hospital.tax_id ?? "—"}</div>
                  <div><strong>Tier:</strong> {d.hospital.tier ?? "—"}</div>
                  <div><strong>Status:</strong> {d.hospital.status ?? "—"}</div>
                </div>
              </CardContent>
            </Card>
          )}
          {d.supplier && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Proveedor</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nombre:</strong> {d.supplier.legal_name ?? d.supplier.name}</div>
                  <div><strong>Tipo:</strong> {d.supplier.kind ?? "—"}</div>
                  <div><strong>Status:</strong> {d.supplier.status ?? "—"}</div>
                </div>
              </CardContent>
            </Card>
          )}
          {(d.lead || d.customer) && !d.hospital && (
            <Card>
              <CardHeader><CardTitle>Mis datos</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><strong>Nombre:</strong> {d.customer?.name ?? d.lead?.name}</div>
                <div><strong>Teléfono:</strong> {d.customer?.phone ?? d.lead?.phone ?? "—"}</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Código</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Fecha</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {d.quotes.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono">{q.code}</TableCell>
                      <TableCell>{Number(q.total).toLocaleString()} {q.currency}</TableCell>
                      <TableCell><Badge>{q.status}</Badge></TableCell>
                      <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {d.quotes.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin cotizaciones.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Pedido</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Fecha</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {d.orders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono">#{o.number ?? o.id.slice(0, 8)}</TableCell>
                      <TableCell>{Number(o.total).toLocaleString()}</TableCell>
                      <TableCell><Badge>{o.status}</Badge></TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {d.orders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin pedidos.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="flex items-center gap-2"><HeadphonesIcon className="h-5 w-5" />Tickets</CardTitle>
              <Button size="sm" variant="outline" asChild><a href={`mailto:soporte@riomed.com.py`}>Nuevo ticket</a></Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Asunto</TableHead><TableHead>Prioridad</TableHead><TableHead>Status</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.tickets.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.subject}</TableCell>
                      <TableCell>{t.priority}</TableCell>
                      <TableCell><Badge>{t.status}</Badge></TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {d.tickets.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin tickets.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {d.profiles.includes("vendedor") && (
          <TabsContent value="seller">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Panel del vendedor</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Código: <strong>{d.seller.seller_code}</strong> · Comisión: <strong>{d.seller.commission_rate}%</strong></p>
                <Button asChild><Link to="/crm">Ir al CRM del vendedor</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
