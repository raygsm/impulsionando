import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface Warehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  kind: string;
  is_default: boolean;
  is_active: boolean;
  notes: string | null;
}

const KIND_LABEL: Record<string, string> = {
  main: "Matriz",
  branch: "Filial",
  rental: "Locação",
  transit: "Em trânsito",
  consignment: "Consignação",
  virtual: "Virtual",
};

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/estoque-almoxarifados")({
  head: () => ({ meta: [{ title: "Rio Med · Almoxarifados" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const { data: tenant } = useQuery({
    queryKey: ["tenant", "riomed-company"],
    queryFn: async () => {
      const { data } = await supabase.from("core_tenant_identity").select("company_id").eq("subdomain", "riomed").maybeSingle();
      return data;
    },
  });
  const companyId = tenant?.company_id ?? null;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["riomed-warehouses", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("riomed_warehouses")
        .select("*")
        .eq("company_id", companyId!)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as Warehouse[];
    },
  });

  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["riomed-warehouses", companyId] });

  const remove = useMutation({
    mutationFn: async (w: Warehouse) => {
      if (w.is_default) throw new Error("Defina outro almoxarifado como padrão antes de excluir.");
      const { error } = await supabase.from("riomed_warehouses").delete().eq("id", w.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Almoxarifado removido"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Almoxarifados</h1>
          <p className="text-sm text-muted-foreground">Onde o estoque do Rio Med fica: matriz, filiais, locação e consignação.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo almoxarifado
        </Button>
      </header>

      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : (
        <div className="grid gap-3">
          {items.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{w.name}</span>
                    <code className="text-xs text-muted-foreground">{w.code}</code>
                    <Badge variant="secondary">{KIND_LABEL[w.kind] ?? w.kind}</Badge>
                    {w.is_default && <Badge>Padrão</Badge>}
                    {!w.is_active && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  {w.notes && <p className="text-xs text-muted-foreground mt-1">{w.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(w); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm(`Excluir "${w.name}"?`) && remove.mutate(w)} disabled={w.is_default}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WarehouseDialog open={open} onOpenChange={setOpen} companyId={companyId} item={editing} onSaved={invalidate} />
    </div>
  );
}

function WarehouseDialog({
  open, onOpenChange, companyId, item, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  companyId: string | null; item: Warehouse | null; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Warehouse>>({});

  // Reset on open
  useState(() => setForm(item ?? { kind: "main", is_active: true }));
  if (open && item && form.id !== item.id) setForm(item);
  if (open && !item && form.id) setForm({ kind: "main", is_active: true });

  const save = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Empresa não identificada");
      if (!form.code || !form.name) throw new Error("Código e nome são obrigatórios");
      const payload = {
        company_id: companyId,
        code: form.code.toUpperCase(),
        name: form.name,
        kind: form.kind ?? "main",
        is_default: form.is_default ?? false,
        is_active: form.is_active ?? true,
        notes: form.notes ?? null,
      };
      if (item) {
        const { error } = await supabase.from("riomed_warehouses").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("riomed_warehouses").insert(payload);
        if (error) throw error;
      }
      // Se virou default, desmarcar os outros
      if (payload.is_default) {
        await supabase.from("riomed_warehouses")
          .update({ is_default: false })
          .eq("company_id", companyId)
          .neq("code", payload.code);
      }
    },
    onSuccess: () => { toast.success(item ? "Atualizado" : "Criado"); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upd = <K extends keyof Warehouse>(k: K, v: Warehouse[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Editar almoxarifado" : "Novo almoxarifado"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Código *</Label>
              <Input value={form.code ?? ""} onChange={(e) => upd("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="MAIN, SC01…" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.kind ?? "main"} onValueChange={(v) => upd("kind", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KIND_LABEL).map(([k, lbl]) => <SelectItem key={k} value={k}>{lbl}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Nome *</Label>
            <Input value={form.name ?? ""} onChange={(e) => upd("name", e.target.value)} placeholder="Matriz Santa Cruz" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => upd("notes", e.target.value)} />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={form.is_default ?? false} onCheckedChange={(v) => upd("is_default", v)} />
              <span className="text-sm">Padrão</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => upd("is_active", v)} />
              <span className="text-sm">Ativo</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
