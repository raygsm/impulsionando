import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory/movements")({
  head: () => ({ meta: [{ title: "Movimentações — Estoque" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "in" | "out" | "adjust">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", kind: "in", quantity: "", unit_cost: "", reason: "", notes: "" });

  const { data: products } = useQuery({
    queryKey: ["inv-prods-min", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("inv_products").select("id,name,unit").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const { data: movs } = useQuery({
    queryKey: ["inv-movs", companyId, tab], enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("inv_movements")
        .select("id, kind, quantity, unit_cost, reason, notes, created_at, product_id, inv_products(name, unit)")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
      if (tab !== "all") q = q.eq("kind", tab);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inv_movements").insert({
        company_id: companyId, product_id: form.product_id, kind: form.kind,
        quantity: Number(form.quantity || 0),
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
        reason: form.reason || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inv-movs"] });
      qc.invalidateQueries({ queryKey: ["inv-products"] });
      qc.invalidateQueries({ queryKey: ["inv-stats"] });
      setOpen(false);
      setForm({ product_id: "", kind: "in", quantity: "", unit_cost: "", reason: "", notes: "" });
      toast.success("Movimentação registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Movimentações" description="Entradas, saídas e ajustes de estoque." action={
        <div className="flex gap-2"><CompanyPicker />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova movimentação</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Produto</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Tipo</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Saída</SelectItem>
                      <SelectItem value="adjust">Ajuste (±)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Quantidade</Label><Input type="number" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div className="col-span-2"><Label>Custo unitário (opcional)</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></div>
                <div className="col-span-2"><Label>Motivo</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Compra, venda, perda..." /></div>
                <div className="col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.product_id || !form.quantity || create.isPending}>Registrar</Button></DialogFooter>
            </DialogContent>
          </Dialog></div>
      } />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="in">Entradas</TabsTrigger>
          <TabsTrigger value="out">Saídas</TabsTrigger>
          <TabsTrigger value="adjust">Ajustes</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="shadow-card divide-y">
        {!movs?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem movimentações.</div>}
        {movs?.map((m) => {
          const prod = (m as { inv_products: { name: string; unit: string } | null }).inv_products;
          const Icon = m.kind === "in" ? ArrowDown : m.kind === "out" ? ArrowUp : RefreshCw;
          const color = m.kind === "in" ? "text-emerald-600" : m.kind === "out" ? "text-red-600" : "text-amber-600";
          return (
            <div key={m.id} className="p-3 flex items-center gap-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{prod?.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                  {m.reason ? ` · ${m.reason}` : ""}
                </div>
              </div>
              <Badge variant="outline">{m.kind === "in" ? "Entrada" : m.kind === "out" ? "Saída" : "Ajuste"}</Badge>
              <div className={`text-sm font-semibold w-24 text-right ${color}`}>
                {m.kind === "in" ? "+" : m.kind === "out" ? "-" : "±"}{Number(m.quantity)} {prod?.unit ?? ""}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
