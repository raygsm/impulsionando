import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface PriceList {
  id: string;
  company_id: string;
  code: string;
  name: string;
  audience: string;
  currency: string;
  is_default: boolean;
  is_active: boolean;
}

const AUDIENCE_LABEL: Record<string, string> = {
  public: "Pública (vitrine)",
  b2b: "B2B / Revenda",
  hospital: "Hospital",
  clinic: "Clínica",
  patient: "Paciente",
  rental: "Locação",
  campaign: "Campanha",
};

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/precos-listas")({
  head: () => ({ meta: [{ title: "Rio Med · Listas de Preço" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const { data: tenant } = useQuery({
    queryKey: ["tenant", "riomed-company"],
    queryFn: async () => (await supabase.from("core_tenant_identity").select("company_id").eq("subdomain", "riomed").maybeSingle()).data,
  });
  const companyId = tenant?.company_id ?? null;

  const { data: items = [] } = useQuery({
    queryKey: ["riomed-pricelists", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("riomed_price_lists")
        .select("*, riomed_prices(count)")
        .eq("company_id", companyId!)
        .order("is_default", { ascending: false }).order("name");
      if (error) throw error;
      return data as (PriceList & { riomed_prices: { count: number }[] })[];
    },
  });

  const [editing, setEditing] = useState<PriceList | null>(null);
  const [open, setOpen] = useState(false);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["riomed-pricelists", companyId] });

  const remove = useMutation({
    mutationFn: async (pl: PriceList) => {
      if (pl.is_default) throw new Error("Defina outra lista como padrão antes de excluir.");
      const { error } = await supabase.from("riomed_price_lists").delete().eq("id", pl.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Lista removida"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Listas de Preço</h1>
          <p className="text-sm text-muted-foreground">Tabela pública, B2B, hospital, locação, campanhas — cada público pode ter o seu preço.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova lista
        </Button>
      </header>

      <div className="grid gap-3">
        {items.map((pl) => (
          <Card key={pl.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{pl.name}</span>
                  <code className="text-xs text-muted-foreground">{pl.code}</code>
                  <Badge variant="secondary">{AUDIENCE_LABEL[pl.audience] ?? pl.audience}</Badge>
                  <Badge variant="outline">{pl.currency}</Badge>
                  {pl.is_default && <Badge>Padrão</Badge>}
                  {!pl.is_active && <Badge variant="outline">Inativa</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pl.riomed_prices?.[0]?.count ?? 0} produtos precificados
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(pl); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm(`Excluir "${pl.name}"?`) && remove.mutate(pl)} disabled={pl.is_default}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PriceListDialog open={open} onOpenChange={setOpen} companyId={companyId} item={editing} onSaved={invalidate} />
    </div>
  );
}

function PriceListDialog({
  open, onOpenChange, companyId, item, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  companyId: string | null; item: PriceList | null; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<PriceList>>({});
  if (open && item && form.id !== item.id) setForm(item);
  if (open && !item && form.id) setForm({ audience: "public", currency: "BOB", is_active: true });

  const save = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Empresa não identificada");
      if (!form.code || !form.name) throw new Error("Código e nome são obrigatórios");
      const payload = {
        company_id: companyId,
        code: form.code.toUpperCase(),
        name: form.name,
        audience: form.audience ?? "public",
        currency: (form.currency ?? "BOB").toUpperCase(),
        is_default: form.is_default ?? false,
        is_active: form.is_active ?? true,
      };
      if (item) {
        const { error } = await supabase.from("riomed_price_lists").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("riomed_price_lists").insert(payload);
        if (error) throw error;
      }
      if (payload.is_default) {
        await supabase.from("riomed_price_lists").update({ is_default: false })
          .eq("company_id", companyId).neq("code", payload.code);
      }
    },
    onSuccess: () => { toast.success(item ? "Atualizada" : "Criada"); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upd = <K extends keyof PriceList>(k: K, v: PriceList[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Editar lista" : "Nova lista de preço"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Código *</Label>
              <Input value={form.code ?? ""} onChange={(e) => upd("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="PUBLIC, B2B…" />
            </div>
            <div>
              <Label>Moeda</Label>
              <Input value={form.currency ?? "BOB"} onChange={(e) => upd("currency", e.target.value.toUpperCase())} maxLength={3} />
            </div>
          </div>
          <div>
            <Label>Nome *</Label>
            <Input value={form.name ?? ""} onChange={(e) => upd("name", e.target.value)} />
          </div>
          <div>
            <Label>Público</Label>
            <Select value={form.audience ?? "public"} onValueChange={(v) => upd("audience", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(AUDIENCE_LABEL).map(([k, lbl]) => <SelectItem key={k} value={k}>{lbl}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2"><Switch checked={form.is_default ?? false} onCheckedChange={(v) => upd("is_default", v)} /><span className="text-sm">Padrão</span></label>
            <label className="flex items-center gap-2"><Switch checked={form.is_active ?? true} onCheckedChange={(v) => upd("is_active", v)} /><span className="text-sm">Ativa</span></label>
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
