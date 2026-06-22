import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPartners, updatePartnerStatus } from "@/lib/riomed-partners.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, HardHat, Users, Hospital, ClipboardList, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/parceiros")({
  component: Page,
});

function Page() {
  const list = useServerFn(listPartners);
  const upd = useServerFn(updatePartnerStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["riomed-partners"], queryFn: () => list() });
  const m = useMutation({
    mutationFn: (args: { table: any; id: string; status: string }) => upd({ data: args }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["riomed-partners"] }); toast.success("Atualizado"); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  if (isLoading) return <div className="p-6">Carregando…</div>;
  const d = data ?? { suppliers: [], offers: [], technicians: [], candidates: [], hospitals: [], requests: [] };
  const pendingCount = (a: any[]) => a.filter((x) => x.status === "pending" || x.status === "new" || x.status === "open").length;

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Parceiros & Hospitais — Rio Med</h1>
        <p className="text-sm text-muted-foreground">Cadastros recebidos pelos portais públicos.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat icon={<Building2 className="h-4 w-4" />} label="Fornecedores" value={d.suppliers.length} sub={`${pendingCount(d.suppliers)} pendentes`} />
        <Stat icon={<Package className="h-4 w-4" />} label="Ofertas" value={d.offers.length} sub={`${pendingCount(d.offers)} a aprovar`} />
        <Stat icon={<HardHat className="h-4 w-4" />} label="Técnicos" value={d.technicians.length} sub={`${pendingCount(d.technicians)} pendentes`} />
        <Stat icon={<Users className="h-4 w-4" />} label="Candidatos" value={d.candidates.length} sub={`${pendingCount(d.candidates)} novos`} />
        <Stat icon={<Hospital className="h-4 w-4" />} label="Hospitais" value={d.hospitals.length} sub={`${pendingCount(d.hospitals)} pendentes`} />
        <Stat icon={<ClipboardList className="h-4 w-4" />} label="Pedidos" value={d.requests.length} sub={`${pendingCount(d.requests)} abertos`} />
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="offers">Ofertas</TabsTrigger>
          <TabsTrigger value="technicians">Técnicos</TabsTrigger>
          <TabsTrigger value="candidates">Candidatos</TabsTrigger>
          <TabsTrigger value="hospitals">Hospitais</TabsTrigger>
          <TabsTrigger value="requests">Pedidos hospitalares</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <SimpleTable rows={d.suppliers} cols={[
            ["Empresa", (r) => r.legal_name],
            ["Contato", (r) => `${r.contact_name} · ${r.contact_email}`],
            ["Tel", (r) => r.contact_phone],
            ["Categorias", (r) => (r.categories ?? []).join(", ")],
            ["Status", (r) => <StatusBadge value={r.status} />],
          ]} actions={(r) => (
            <ActionButtons disabled={m.isPending} current={r.status}
              onApprove={() => m.mutate({ table: "riomed_suppliers", id: r.id, status: "approved" })}
              onReject={() => m.mutate({ table: "riomed_suppliers", id: r.id, status: "rejected" })}
            />
          )} />
        </TabsContent>

        <TabsContent value="offers">
          <SimpleTable rows={d.offers} cols={[
            ["Produto", (r) => r.product_name],
            ["Marca/SKU", (r) => [r.brand, r.sku].filter(Boolean).join(" · ")],
            ["Preço", (r) => r.unit_price ? `${r.unit_price} ${r.currency ?? ""}` : "—"],
            ["MOQ / Lead", (r) => `${r.moq ?? "—"} / ${r.lead_time_days ?? "—"}d`],
            ["Status", (r) => <StatusBadge value={r.status} />],
          ]} actions={(r) => (
            <ActionButtons disabled={m.isPending} current={r.status}
              onApprove={() => m.mutate({ table: "riomed_supplier_offers", id: r.id, status: "approved" })}
              onReject={() => m.mutate({ table: "riomed_supplier_offers", id: r.id, status: "rejected" })}
            />
          )} />
        </TabsContent>

        <TabsContent value="technicians">
          <SimpleTable rows={d.technicians} cols={[
            ["Nome", (r) => r.full_name],
            ["Contato", (r) => `${r.email} · ${r.phone}`],
            ["Especialidades", (r) => (r.specialties ?? []).join(", ")],
            ["Áreas", (r) => (r.service_areas ?? []).join(", ")],
            ["Status", (r) => <StatusBadge value={r.status} />],
          ]} actions={(r) => (
            <ActionButtons disabled={m.isPending} current={r.status}
              onApprove={() => m.mutate({ table: "riomed_technicians", id: r.id, status: "approved" })}
              onReject={() => m.mutate({ table: "riomed_technicians", id: r.id, status: "rejected" })}
            />
          )} />
        </TabsContent>

        <TabsContent value="candidates">
          <SimpleTable rows={d.candidates} cols={[
            ["Nome", (r) => r.full_name],
            ["Cargo", (r) => r.position_interest],
            ["Contato", (r) => `${r.email} · ${r.phone}`],
            ["Cidade", (r) => r.city ?? "—"],
            ["Status", (r) => <StatusBadge value={r.status} />],
          ]} actions={(r) => (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate({ table: "riomed_candidates", id: r.id, status: "interview" })}>Entrevistar</Button>
              <Button size="sm" variant="ghost" disabled={m.isPending} onClick={() => m.mutate({ table: "riomed_candidates", id: r.id, status: "archived" })}>Arquivar</Button>
            </div>
          )} />
        </TabsContent>

        <TabsContent value="hospitals">
          <SimpleTable rows={d.hospitals} cols={[
            ["Hospital", (r) => r.hospital_name],
            ["Contato", (r) => `${r.contact_name} · ${r.contact_email}`],
            ["Segmento", (r) => r.segment ?? "—"],
            ["SLA (h)", (r) => r.sla_hours ?? "—"],
            ["Status", (r) => <StatusBadge value={r.status} />],
          ]} actions={(r) => (
            <ActionButtons disabled={m.isPending} current={r.status}
              onApprove={() => m.mutate({ table: "riomed_hospital_accounts", id: r.id, status: "active" })}
              onReject={() => m.mutate({ table: "riomed_hospital_accounts", id: r.id, status: "suspended" })}
              approveLabel="Ativar"
            />
          )} />
        </TabsContent>

        <TabsContent value="requests">
          <SimpleTable rows={d.requests} cols={[
            ["Título", (r) => r.title],
            ["Tipo", (r) => r.request_kind],
            ["Prioridade", (r) => <Badge variant={r.priority === "critical" || r.priority === "urgent" ? "destructive" : "secondary"}>{r.priority}</Badge>],
            ["Para", (r) => r.needed_by ? new Date(r.needed_by).toLocaleDateString() : "—"],
            ["Valor est.", (r) => r.estimated_value ?? "—"],
            ["Status", (r) => <StatusBadge value={r.status} />],
          ]} actions={(r) => (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate({ table: "riomed_hospital_requests", id: r.id, status: "quoted" })}>Cotado</Button>
              <Button size="sm" disabled={m.isPending} onClick={() => m.mutate({ table: "riomed_hospital_requests", id: r.id, status: "fulfilling" })}>Em atendimento</Button>
              <Button size="sm" variant="ghost" disabled={m.isPending} onClick={() => m.mutate({ table: "riomed_hospital_requests", id: r.id, status: "delivered" })}>Entregue</Button>
            </div>
          )} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </CardContent></Card>
  );
}

function StatusBadge({ value }: { value: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary", approved: "default", active: "default", rejected: "destructive",
    new: "secondary", reviewing: "secondary", interview: "default", hired: "default",
    open: "secondary", quoted: "secondary", fulfilling: "default", delivered: "default",
    cancelled: "destructive", suspended: "destructive", archived: "outline", inactive: "outline",
  };
  return <Badge variant={variants[value] ?? "outline"}>{value}</Badge>;
}

function SimpleTable({ rows, cols, actions }: {
  rows: any[]; cols: [string, (r: any) => React.ReactNode][]; actions?: (r: any) => React.ReactNode;
}) {
  if (!rows.length) return <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">Nenhum registro.</CardContent></Card>;
  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow>{cols.map(([h]) => <TableHead key={h}>{h}</TableHead>)}{actions && <TableHead className="text-right">Ações</TableHead>}</TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              {cols.map(([h, render]) => <TableCell key={h}>{render(r)}</TableCell>)}
              {actions && <TableCell className="text-right">{actions(r)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

function ActionButtons({ current, onApprove, onReject, approveLabel = "Aprovar", disabled }: {
  current: string; onApprove: () => void; onReject: () => void; approveLabel?: string; disabled?: boolean;
}) {
  if (current === "approved" || current === "active") return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" disabled={disabled} onClick={onApprove}>{approveLabel}</Button>
      <Button size="sm" variant="ghost" disabled={disabled} onClick={onReject}>Rejeitar</Button>
    </div>
  );
}
