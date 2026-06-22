import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMySellerAssignments, updateAssignmentStatus } from "@/lib/riomed-sellers.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm")({
  component: SellerCrmPage,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

function SellerCrmPage() {
  const qc = useQueryClient();
  const mine = useServerFn(getMySellerAssignments);
  const upd = useServerFn(updateAssignmentStatus);

  const q = useQuery({ queryKey: ["crm-mine"], queryFn: () => mine() });
  const updMut = useMutation({
    mutationFn: (d: any) => upd({ data: d }),
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["crm-mine"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="container mx-auto p-8">Carregando…</div>;

  if (!q.data?.seller) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader><CardTitle>Acesso CRM</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Seu usuário não está vinculado a um vendedor cadastrado. Procure o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = q.data.seller as any;
  const assignments = q.data.assignments as any[];
  const notifs = q.data.notifications as any[];
  const open = assignments.filter((a) => ["new", "contacted"].includes(a.status));
  const won = assignments.filter((a) => a.status === "won").length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {s.full_name}</h1>
          <p className="text-muted-foreground">Código {s.seller_code} · Comissão {s.commission_rate}% · Meta {Number(s.monthly_goal ?? 0).toLocaleString()}</p>
        </div>
        <Badge className="text-sm"><Bell className="h-3 w-3 mr-1" /> {notifs.filter((n) => !n.read_at).length} notificações</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Leads em aberto" value={open.length} />
        <Stat label="Total atribuídos" value={assignments.length} />
        <Stat label="Ganhos" value={won} />
      </div>

      <Card>
        <CardHeader><CardTitle>Meus leads</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recebido</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.crm_leads?.name ?? "Sem nome"}</TableCell>
                  <TableCell>
                    {a.crm_leads?.phone && <a className="text-sm flex items-center gap-1" href={`https://wa.me/${a.crm_leads.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Phone className="h-3 w-3" />{a.crm_leads.phone}</a>}
                    {a.crm_leads?.email && <a className="text-sm flex items-center gap-1" href={`mailto:${a.crm_leads.email}`}><Mail className="h-3 w-3" />{a.crm_leads.email}</a>}
                  </TableCell>
                  <TableCell>{a.crm_leads?.source ?? "—"}</TableCell>
                  <TableCell><Badge>{a.status}</Badge></TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Select value={a.status} onValueChange={(v) => updMut.mutate({ id: a.id, status: v })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="contacted">Contatado</SelectItem>
                        <SelectItem value="won">Ganho</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum lead atribuído ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {notifs.length === 0 && <p className="text-sm text-muted-foreground">Sem notificações.</p>}
          {notifs.map((n) => (
            <div key={n.id} className={`p-3 rounded border ${n.read_at ? "opacity-60" : ""}`}>
              <div className="font-medium">{n.title}</div>
              {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
              <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}
