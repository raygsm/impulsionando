import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sectors")({
  head: () => ({ meta: [{ title: "Setores — Impulsionando" }] }),
  component: SectorsPage,
});

function SectorsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", company_id: "" });

  const { data: sectors } = useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sectors")
        .select("id, name, description, is_active, companies:company_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-opt"],
    queryFn: async () => (await supabase.from("companies").select("id, name").order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("sectors").insert(form); if (error) throw error; },
    onSuccess: () => { toast.success("Setor criado"); setOpen(false); setForm({ name: "", description: "", company_id: "" }); qc.invalidateQueries({ queryKey: ["sectors"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sectors").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["sectors"] }); },
  });

  return (
    <div>
      <PageHeader title="Setores" description="Setores internos das empresas."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary shadow-elegant"><Plus className="w-4 h-4 mr-2" />Novo setor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo setor</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Empresa*</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button disabled={!form.name || !form.company_id} onClick={() => create.mutate()}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Setor</TableHead><TableHead>Empresa</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {sectors?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum setor cadastrado.</TableCell></TableRow>}
            {sectors?.map((s) => (
              <TableRow key={s.id}>
                <TableCell><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.description}</div></TableCell>
                <TableCell className="text-sm">{(s.companies as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell><Button size="icon" variant="ghost" aria-label={`Remover setor ${s.name}`} onClick={() => confirm("Remover?") && remove.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
