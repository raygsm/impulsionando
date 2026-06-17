/**
 * /restaurante/cardapio — Gestão de categorias e itens do cardápio digital.
 * Conectado ao QR Code da mesa: itens ativos aparecem em /mesa/$token.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { listMenu, upsertMenuCategory, deleteMenuCategory, upsertMenuItem, deleteMenuItem } from "@/lib/restaurant-menu.functions";
import { Plus, Trash2, Pencil, UtensilsCrossed, FolderPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/restaurante/cardapio")({
  component: CardapioPage,
});

const BRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CardapioPage() {
  const qc = useQueryClient();
  const fetchMenu = useServerFn(listMenu);
  const upCat = useServerFn(upsertMenuCategory);
  const delCat = useServerFn(deleteMenuCategory);
  const upItem = useServerFn(upsertMenuItem);
  const delItem = useServerFn(deleteMenuItem);

  const menu = useQuery({ queryKey: ["restaurant-menu"], queryFn: () => fetchMenu() });
  const [catName, setCatName] = useState("");
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const reload = () => qc.invalidateQueries({ queryKey: ["restaurant-menu"] });

  async function addCategory() {
    if (catName.trim().length < 2) return toast.error("Nome obrigatório");
    try { await upCat({ data: { name: catName.trim() } }); setCatName(""); reload(); toast.success("Categoria criada"); }
    catch (e: any) { toast.error(e.message); }
  }

  async function removeCategory(id: string) {
    if (!confirm("Remover categoria? Itens ficam sem categoria.")) return;
    try { await delCat({ data: { id } }); reload(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function saveItem(form: any) {
    try {
      await upItem({ data: {
        id: editItem?.id,
        category_id: form.category_id || null,
        name: form.name,
        description: form.description || null,
        price_cents: Math.round(Number(form.price) * 100),
        is_available: form.is_available,
        is_active: true,
      }});
      setOpenItemDialog(false); setEditItem(null); reload();
      toast.success("Item salvo");
    } catch (e: any) { toast.error(e.message); }
  }

  async function removeItem(id: string) {
    if (!confirm("Remover item do cardápio?")) return;
    try { await delItem({ data: { id } }); reload(); }
    catch (e: any) { toast.error(e.message); }
  }

  const categories = menu.data?.categories ?? [];
  const items = menu.data?.items ?? [];
  const itemsByCat = (catId: string | null) => items.filter((i: any) => i.category_id === catId);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Badge className="bg-gradient-primary mb-2"><UtensilsCrossed className="w-3 h-3 mr-1" /> Restaurante</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Cardápio digital</h1>
          <p className="text-sm text-muted-foreground">O que estiver disponível aqui aparece no QR Code da mesa.</p>
        </div>
        <Dialog open={openItemDialog} onOpenChange={(o) => { setOpenItemDialog(o); if (!o) setEditItem(null); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Novo item</Button></DialogTrigger>
          <ItemDialog categories={categories} editItem={editItem} onSave={saveItem} />
        </Dialog>
      </header>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2"><FolderPlus className="w-4 h-4" /> Categorias</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((c: any) => (
            <Badge key={c.id} variant="secondary" className="text-sm py-1.5 px-3 gap-2">
              {c.name}
              <button onClick={() => removeCategory(c.id)} className="text-destructive hover:opacity-70"><Trash2 className="w-3 h-3" /></button>
            </Badge>
          ))}
          {categories.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma categoria ainda.</p>}
        </div>
        <div className="flex gap-2">
          <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nova categoria (ex: Bebidas)" className="max-w-xs" />
          <Button onClick={addCategory} variant="outline" size="sm">Adicionar</Button>
        </div>
      </Card>

      {[...categories, { id: null, name: "Sem categoria" }].map((c: any) => {
        const list = itemsByCat(c.id);
        if (c.id === null && list.length === 0) return null;
        return (
          <Card key={c.id ?? "none"} className="p-5">
            <h3 className="font-semibold mb-3">{c.name} <span className="text-muted-foreground text-sm">({list.length})</span></h3>
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item nesta categoria.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((i: any) => (
                  <Card key={i.id} className="p-3 flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{i.name}</div>
                      {i.description && <div className="text-xs text-muted-foreground line-clamp-2">{i.description}</div>}
                      <div className="text-sm font-semibold mt-1">{BRL(i.price_cents)}</div>
                      {!i.is_available && <Badge variant="outline" className="mt-1 text-xs">Indisponível</Badge>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditItem(i); setOpenItemDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ItemDialog({ categories, editItem, onSave }: { categories: any[]; editItem: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState(() => ({
    name: editItem?.name ?? "",
    description: editItem?.description ?? "",
    price: editItem ? (editItem.price_cents / 100).toFixed(2) : "",
    category_id: editItem?.category_id ?? "",
    is_available: editItem?.is_available ?? true,
  }));
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editItem ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Preço (R$) *</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div>
            <Label>Categoria</Label>
            <select className="w-full border rounded h-10 px-2 bg-background" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">— Sem categoria —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} /><Label>Disponível</Label></div>
        <Button className="w-full" onClick={() => { if (!form.name.trim() || !form.price) return toast.error("Preencha nome e preço"); onSave(form); }}>Salvar</Button>
      </div>
    </DialogContent>
  );
}
