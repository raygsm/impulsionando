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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory/products")({
  head: () => ({ meta: [{ title: "Produtos — Estoque" }] }),
  component: Page,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type Form = {
  id?: string; sku: string; barcode: string; name: string; description: string; unit: string;
  category_id: string; supplier_id: string;
  cost_price: string; sale_price: string; min_stock: string; max_stock: string;
  track_stock: boolean; allow_negative: boolean; is_active: boolean;
};
const empty: Form = { sku: "", barcode: "", name: "", description: "", unit: "un",
  category_id: "", supplier_id: "", cost_price: "0", sale_price: "0", min_stock: "0", max_stock: "",
  track_stock: true, allow_negative: false, is_active: true };

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data: cats } = useQuery({
    queryKey: ["inv-cats-min", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("inv_categories").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });
  const { data: sups } = useQuery({
    queryKey: ["inv-sups-min", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("inv_suppliers").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const { data: products } = useQuery({
    queryKey: ["inv-products", companyId, search], enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("inv_products")
        .select("id, sku, name, unit, cost_price, sale_price, current_stock, min_stock, track_stock, allow_negative, is_active, category_id, supplier_id, inv_categories(name), inv_suppliers(name)")
        .eq("company_id", companyId).order("name").limit(200);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: companyId,
        sku: form.sku || null, barcode: form.barcode || null, name: form.name,
        description: form.description || null, unit: form.unit,
        category_id: form.category_id || null, supplier_id: form.supplier_id || null,
        cost_price: Number(form.cost_price || 0), sale_price: Number(form.sale_price || 0),
        min_stock: Number(form.min_stock || 0),
        max_stock: form.max_stock === "" ? null : Number(form.max_stock),
        track_stock: form.track_stock, allow_negative: form.allow_negative, is_active: form.is_active,
      };
      const q = form.id
        ? supabase.from("inv_products").update(payload).eq("id", form.id)
        : supabase.from("inv_products").insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-products"] }); setOpen(false); setForm(empty); toast.success("Salvo"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("inv_products").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-products"] }); toast.success("Excluído"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Produtos" description="Catálogo e saldo de estoque." action={
        <div className="flex gap-2">
          <CompanyPicker />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Novo produto</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                <div><Label>Código de barras</Label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
                <div><Label>Unidade</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                <div><Label>Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{cats?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="col-span-2"><Label>Fornecedor</Label>
                  <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{sups?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Custo</Label><Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></div>
                <div><Label>Preço de venda</Label><Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div>
                <div><Label>Estoque mínimo</Label><Input type="number" step="0.001" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></div>
                <div><Label>Estoque máximo</Label><Input type="number" step="0.001" value={form.max_stock} onChange={(e) => setForm({ ...form, max_stock: e.target.value })} /></div>
                <div className="col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.track_stock} onCheckedChange={(v) => setForm({ ...form, track_stock: v })} />Controla estoque</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.allow_negative} onCheckedChange={(v) => setForm({ ...form, allow_negative: v })} />Permite negativo</label>
                <label className="flex items-center gap-2 text-sm col-span-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Ativo</label>
              </div>
              <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      } />

      <div className="mb-4"><Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></div>

      <Card className="shadow-card divide-y">
        {!products?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</div>}
        {products?.map((p) => {
          const low = p.track_stock && Number(p.current_stock) <= Number(p.min_stock);
          return (
            <div key={p.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center gap-2 truncate">
                  {p.name}
                  {low && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1"><AlertTriangle className="w-3 h-3" />Baixo</Badge>}
                  {!p.is_active && <Badge variant="outline">Inativo</Badge>}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.sku ? `SKU ${p.sku} · ` : ""}{(p as { inv_categories?: { name: string } | null }).inv_categories?.name ?? "Sem categoria"}
                  {(p as { inv_suppliers?: { name: string } | null }).inv_suppliers?.name ? ` · ${(p as { inv_suppliers?: { name: string } | null }).inv_suppliers?.name}` : ""}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">{Number(p.current_stock)} {p.unit}</div>
                <div className="text-xs text-muted-foreground">{fmt(Number(p.sale_price))}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setForm({
                id: p.id, sku: p.sku ?? "", barcode: "", name: p.name, description: "",
                unit: p.unit, category_id: p.category_id ?? "", supplier_id: p.supplier_id ?? "",
                cost_price: String(p.cost_price), sale_price: String(p.sale_price),
                min_stock: String(p.min_stock), max_stock: "",
                track_stock: p.track_stock, allow_negative: p.allow_negative, is_active: p.is_active,
              }); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir produto?")) del.mutate(p.id); }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
