import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { auditClinical } from "@/lib/clinical-audit-log";
import { useActiveCompany } from "@/hooks/use-active-company";
import { FileText, Plus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ehr/")({
  head: () => ({ meta: [{ title: "Prontuário Eletrônico — Impulsionando" }] }),
  component: EhrList,
});

type Customer = { id: string; name: string };
type EhrRecord = {
  id: string;
  customer_id: string;
  record_number: string | null;
  status: string;
  updated_at: string;
  customers?: { name: string } | null;
};

function EhrList() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const { data: records, isLoading } = useQuery({
    queryKey: ["ehr-records", companyId, q],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_records")
        .select("id, customer_id, record_number, status, updated_at, customers(name)")
        .eq("company_id", companyId!)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const list = (data ?? []) as unknown as EhrRecord[];
      if (!q.trim()) return list;
      const t = q.toLowerCase();
      return list.filter(
        (r) =>
          r.customers?.name?.toLowerCase().includes(t) ||
          r.record_number?.toLowerCase().includes(t)
      );
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-opt", companyId],
    enabled: !!companyId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("name")
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!companyId || !selectedCustomer) throw new Error("Selecione um paciente");
      const { data: ins, error } = await supabase
        .from("ehr_records")
        .insert({ company_id: companyId, customer_id: selectedCustomer })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      auditClinical({
        company_id: companyId, action: "patient.create", entity: "ehr_records",
        entity_id: ins?.id, after: { customer_id: selectedCustomer },
      });
    },
    onSuccess: () => {
      toast.success("Prontuário criado");
      setOpen(false);
      setSelectedCustomer("");
      qc.invalidateQueries({ queryKey: ["ehr-records"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Prontuário Eletrônico"
        description="Histórico clínico, exames, documentos e pareceres por paciente."
        action={
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por paciente ou nº"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-64"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4" /> Novo prontuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar prontuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <label className="text-sm">Paciente</label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {!isLoading && records && records.length === 0 && (
        <Card className="p-8 text-center shadow-card">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum prontuário ainda. Clique em <strong>Novo prontuário</strong> para começar.
          </p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records?.map((r) => (
          <Link
            key={r.id}
            to="/ehr/$id"
            params={{ id: r.id }}
            className="group"
          >
            <Card className="p-5 shadow-card hover:shadow-elegant transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.customers?.name ?? "Paciente"}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.record_number ? `Nº ${r.record_number}` : `ID ${r.id.slice(0, 8)}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Atualizado em {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
