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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance/categories")({
  head: () => ({ meta: [{ title: "Categorias — Financeiro" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", kind: "income", color: "#10b981" });

  const { data: cats } = useQuery({
    queryKey: ["fin-categories", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_categories").select("*").eq("company_id", companyId).order("kind").order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fin_categories").insert({
        company_id: companyId, name: form.name, kind: form.kind, color: form.color,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-categories"] }); setOpen(false); setForm({ name: "", kind: "income", color: "#10b981" }); toast.success("Categoria criada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Categorias" description="Categorias de receita e despesa."
        action={<div className="flex gap-2"><CompanyPicker />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nova categoria</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="income">Receita</SelectItem><SelectItem value="expense">Despesa</SelectItem></SelectContent>
                  </Select></div>
                <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog></div>} />

      <Card className="shadow-card divide-y">
        {!cats?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem categorias.</div>}
        {cats?.map((c) => (
          <div key={c.id} className="p-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: c.color ?? "#64748b" }} />
            <div className="flex-1 font-medium text-sm">{c.name}</div>
            <Badge variant="outline" className={c.kind === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
              {c.kind === "income" ? "Receita" : "Despesa"}
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
