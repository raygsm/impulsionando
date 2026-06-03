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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory/categories")({
  head: () => ({ meta: [{ title: "Categorias — Estoque" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data } = useQuery({
    queryKey: ["inv-cats", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("inv_categories").select("*").eq("company_id", companyId).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inv_categories").insert({ company_id: companyId, name: form.name, description: form.description || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-cats"] }); setOpen(false); setForm({ name: "", description: "" }); toast.success("Criada"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("inv_categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-cats"] }); toast.success("Excluída"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Categorias" description="Organize seus produtos." action={
        <div className="flex gap-2"><CompanyPicker />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog></div>
      } />
      <Card className="shadow-card divide-y">
        {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma categoria.</div>}
        {data?.map((c) => (
          <div key={c.id} className="p-3 flex items-center gap-3">
            <div className="flex-1"><div className="font-medium text-sm">{c.name}</div>{c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}</div>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir?")) del.mutate(c.id); }}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
