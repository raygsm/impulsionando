import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/units")({
  head: () => ({ meta: [{ title: "Unidades — Impulsionando" }] }),
  component: UnitsPage,
});

function UnitsPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", state: "", phone: "", company_id: "" });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_units")
        .select("id, name, code, city, state, phone, is_active, company_id, companies:company_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-options"],
    queryFn: async () => (await supabase.from("companies").select("id, name").eq("is_active", true).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.company_id) throw new Error("Selecione uma empresa");
      const { error } = await supabase.from("company_units").insert(form);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Unidade criada"); setOpen(false); setForm({ name: "", code: "", city: "", state: "", phone: "", company_id: "" }); qc.invalidateQueries({ queryKey: ["units"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_units").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Unidade removida"); qc.invalidateQueries({ queryKey: ["units"] }); },
  });

  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Filiais e unidades operacionais por empresa."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant"><Plus className="w-4 h-4 mr-2" />Nova unidade</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova unidade</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Empresa*</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>UF</Label><Input value={form.state} maxLength={2} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button disabled={!form.name || !form.company_id} onClick={() => create.mutate()}>{create.isPending ? "Salvando..." : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Unidade</TableHead><TableHead>Empresa</TableHead><TableHead>Localização</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {units?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma unidade cadastrada.</TableCell></TableRow>}
            {units?.map((u) => (
              <TableRow key={u.id}>
                <TableCell><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.code ?? "—"}</div></TableCell>
                <TableCell className="text-sm">{(u.companies as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">{[u.city, u.state].filter(Boolean).join(" / ") || "—"}</TableCell>
                <TableCell>{u.is_active ? <Badge className="bg-success text-success-foreground">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                <TableCell>{(me?.isSuperAdmin) && (
                  <Button size="icon" variant="ghost" onClick={() => confirm("Remover unidade?") && remove.mutate(u.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
