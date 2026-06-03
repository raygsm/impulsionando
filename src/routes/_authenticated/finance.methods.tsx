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
import { Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance/methods")({
  head: () => ({ meta: [{ title: "Métodos de pagamento" }] }),
  component: MethodsPage,
});

function MethodsPage() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", provider: "" });

  const { data: methods } = useQuery({
    queryKey: ["fin-methods", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_payment_methods").select("*").eq("company_id", companyId).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fin_payment_methods").insert({
        company_id: companyId, name: form.name, code: form.code, provider: form.provider || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-methods"] }); setOpen(false); setForm({ name: "", code: "", provider: "" }); toast.success("Método criado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Métodos de pagamento" description="Dinheiro, Pix, cartão, boleto, etc."
        action={<div className="flex gap-2"><CompanyPicker />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Novo método</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo método</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s+/g, "_") })} /></div>
                <div><Label>Provedor (opcional)</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="mercado_pago, stripe..." /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name || !form.code || create.isPending}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog></div>} />

      <Card className="shadow-card divide-y">
        {!methods?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem métodos.</div>}
        {methods?.map((m) => (
          <div key={m.id} className="p-3 flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-sm">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.code}{m.provider ? ` · ${m.provider}` : ""}</div>
            </div>
            <span className={`text-xs ${m.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>{m.is_active ? "Ativo" : "Inativo"}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
