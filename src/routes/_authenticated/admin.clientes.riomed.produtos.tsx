import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listRioMedProducts,
  upsertRioMedProduct,
  deleteRioMedProduct,
} from "@/lib/riomed.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/produtos")({
  component: ProductsPage,
});

type Audience = "paciente" | "clinica" | "hospital";
type Modality = "venta" | "alquiler" | "ambos";

interface Product {
  id?: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  audiences: Audience[];
  modality: Modality;
  price_sale?: number | null;
  price_rental_daily?: number | null;
  price_rental_monthly?: number | null;
  currency: string;
  image_url?: string | null;
  stock: number;
  is_active: boolean;
  display_order: number;
}

const empty: Product = {
  name: "", audiences: ["paciente"], modality: "venta", currency: "BOB",
  stock: 0, is_active: true, display_order: 0,
};

function ProductsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRioMedProducts);
  const saveFn = useServerFn(upsertRioMedProduct);
  const delFn = useServerFn(deleteRioMedProduct);

  const { data: productsRaw = [], isLoading } = useQuery({
    queryKey: ["riomed-products"],
    queryFn: () => listFn(),
  });
  const products = productsRaw as unknown as Product[];


  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Product>(empty);

  const save = useMutation({
    mutationFn: (p: Product) => saveFn({ data: p as any }),
    onSuccess: () => {
      toast.success("Produto salvo. Catálogo do assistente sincronizado.");
      qc.invalidateQueries({ queryKey: ["riomed-products"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Produto removido.");
      qc.invalidateQueries({ queryKey: ["riomed-products"] });
    },
  });

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p: Product) => p.is_active).length;
    const oos = products.filter((p: Product) => p.is_active && p.stock <= 0).length;
    return { total, active, oos };
  }, [products]);

  function edit(p: Product) {
    setDraft({ ...p });
    setOpen(true);
  }

  function toggleAudience(a: Audience) {
    setDraft((d) => ({
      ...d,
      audiences: d.audiences.includes(a) ? d.audiences.filter((x) => x !== a) : [...d.audiences, a],
    }));
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7" /> RioMed · Produtos
          </h1>
          <p className="text-muted-foreground">
            Catálogo virtual. Mudanças sincronizam automaticamente o bot WhatsApp.
          </p>
        </div>
        <Button onClick={() => { setDraft(empty); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo produto
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats.total}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Ativos</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-green-600">{stats.active}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Sem estoque (ativos)</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-orange-600">{stats.oos}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Catálogo</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground">Nenhum produto cadastrado. Clique em "Novo produto".</p>
          ) : (
            <div className="space-y-2">
              {products.map((p: Product) => (
                <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/30">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground"><Package className="h-5 w-5" /></div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {p.name}
                      {!p.is_active && <Badge variant="secondary">inativo</Badge>}
                      {p.stock <= 0 && <Badge variant="destructive">sem estoque</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground flex gap-2 flex-wrap">
                      <span>{p.modality}</span>
                      <span>•</span>
                      {p.audiences.map((a) => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
                      {p.price_sale && <span>• Venda: {p.currency} {Number(p.price_sale).toFixed(2)}</span>}
                      {p.price_rental_daily && <span>• Aluguel/dia: {p.currency} {Number(p.price_rental_daily).toFixed(2)}</span>}
                      <span>• Estoque: {p.stock}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => edit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => p.id && confirm("Remover?") && remove.mutate(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft.id ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome *</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>SKU</Label><Input value={draft.sku ?? ""} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} /></div>
            <div><Label>Categoria</Label><Input value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
            <div className="col-span-2"><Label>Descrição</Label><Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div className="col-span-2"><Label>URL da imagem</Label><Input value={draft.image_url ?? ""} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." /></div>
            <div className="col-span-2">
              <Label>Públicos *</Label>
              <div className="flex gap-4 mt-2">
                {(["paciente", "clinica", "hospital"] as Audience[]).map((a) => (
                  <label key={a} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={draft.audiences.includes(a)} onCheckedChange={() => toggleAudience(a)} />
                    <span className="capitalize">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Modalidade</Label>
              <Select value={draft.modality} onValueChange={(v) => setDraft({ ...draft, modality: v as Modality })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venda</SelectItem>
                  <SelectItem value="alquiler">Aluguel</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Moeda</Label><Input value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} /></div>
            <div><Label>Preço venda</Label><Input type="number" step="0.01" value={draft.price_sale ?? ""} onChange={(e) => setDraft({ ...draft, price_sale: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><Label>Aluguel/dia</Label><Input type="number" step="0.01" value={draft.price_rental_daily ?? ""} onChange={(e) => setDraft({ ...draft, price_rental_daily: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><Label>Aluguel/mês</Label><Input type="number" step="0.01" value={draft.price_rental_monthly ?? ""} onChange={(e) => setDraft({ ...draft, price_rental_monthly: e.target.value ? Number(e.target.value) : null })} /></div>
            <div><Label>Estoque</Label><Input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} /></div>
            <div><Label>Ordem</Label><Input type="number" value={draft.display_order} onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })} /></div>
            <div className="col-span-2 flex items-center gap-2"><Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.name || draft.audiences.length === 0}>
              {save.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
