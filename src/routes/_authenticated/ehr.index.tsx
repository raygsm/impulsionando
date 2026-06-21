import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { auditClinical } from "@/lib/clinical-audit-log";
import { useActiveCompany } from "@/hooks/use-active-company";
import { FileText, Plus, ChevronRight, Trash2, Pencil, UserPlus } from "lucide-react";

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
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [recordNumber, setRecordNumber] = useState("");
  const [editing, setEditing] = useState<EhrRecord | null>(null);
  const [deleting, setDeleting] = useState<EhrRecord | null>(null);

  const { data: records, isLoading } = useQuery({
    queryKey: ["ehr-records", companyId, q],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehr_records")
        .select("id, customer_id, record_number, status, updated_at, customers(name)")
        .eq("company_id", companyId!)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const list = (data ?? []) as unknown as EhrRecord[];
      if (!q.trim()) return list;
      const t = q.toLowerCase();
      return list.filter(
        (r) =>
          r.customers?.name?.toLowerCase().includes(t) ||
          r.record_number?.toLowerCase().includes(t),
      );
    },
  });

  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-opt", companyId],
    enabled: !!companyId && openCreate,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Selecione uma empresa ativa.");
      if (!selectedCustomer) throw new Error("Selecione um paciente.");
      const payload: { company_id: string; customer_id: string; record_number?: string } = {
        company_id: companyId,
        customer_id: selectedCustomer,
      };
      if (recordNumber.trim()) payload.record_number = recordNumber.trim();
      const { data: ins, error } = await supabase
        .from("ehr_records")
        .insert(payload)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      auditClinical({
        company_id: companyId, action: "patient.create", entity: "ehr_records",
        entity_id: ins?.id, after: { customer_id: selectedCustomer, record_number: recordNumber || null },
      });
    },
    onSuccess: () => {
      toast.success("Prontuário criado");
      setOpenCreate(false);
      setSelectedCustomer("");
      setRecordNumber("");
      qc.invalidateQueries({ queryKey: ["ehr-records"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (vars: { id: string; record_number: string | null }) => {
      const { error } = await supabase
        .from("ehr_records")
        .update({ record_number: vars.record_number })
        .eq("id", vars.id);
      if (error) throw error;
      if (companyId) {
        auditClinical({
          company_id: companyId, action: "patient.update", entity: "ehr_records",
          entity_id: vars.id, after: { record_number: vars.record_number },
        });
      }
    },
    onSuccess: () => {
      toast.success("Prontuário atualizado");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["ehr-records"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ehr_records").delete().eq("id", id);
      if (error) throw error;
      if (companyId) {
        auditClinical({
          company_id: companyId, action: "patient.delete", entity: "ehr_records",
          entity_id: id,
        });
      }
    },
    onSuccess: () => {
      toast.success("Prontuário excluído");
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ["ehr-records"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const noCompany = !companyId;
  const noCustomersInDialog = openCreate && !loadingCustomers && (customers?.length ?? 0) === 0;

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
              disabled={noCompany}
            />
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button disabled={noCompany}>
                  <Plus className="w-4 h-4" /> Novo prontuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar prontuário</DialogTitle>
                  <DialogDescription>
                    Vincule um prontuário a um paciente já cadastrado.
                  </DialogDescription>
                </DialogHeader>
                {noCustomersInDialog ? (
                  <div className="space-y-3 py-2">
                    <Card className="p-4 text-sm bg-muted/30">
                      <p className="font-medium mb-1">Nenhum paciente cadastrado</p>
                      <p className="text-muted-foreground text-xs">
                        Cadastre um paciente em <strong>Clientes</strong> antes de abrir um prontuário.
                      </p>
                    </Card>
                    <Button asChild className="w-full">
                      <Link to="/customers" onClick={() => setOpenCreate(false)}>
                        <UserPlus className="w-4 h-4" /> Ir para Clientes
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Paciente *</label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCustomers ? "Carregando…" : "Selecione um paciente"} />
                        </SelectTrigger>
                        <SelectContent>
                          {customers?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Nº do prontuário (opcional)</label>
                      <Input
                        value={recordNumber}
                        onChange={(e) => setRecordNumber(e.target.value)}
                        placeholder="Ex.: 2026-0001"
                      />
                    </div>
                  </div>
                )}
                {!noCustomersInDialog && (
                  <DialogFooter>
                    <Button
                      onClick={() => create.mutate()}
                      disabled={create.isPending || !selectedCustomer}
                    >
                      {create.isPending ? "Criando…" : "Criar"}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {noCompany && (
        <Card className="p-6 text-sm text-muted-foreground shadow-card">
          Selecione uma empresa ativa para visualizar os prontuários.
        </Card>
      )}

      {!noCompany && isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {!noCompany && !isLoading && records && records.length === 0 && (
        <Card className="p-8 text-center shadow-card">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum prontuário ainda. Clique em <strong>Novo prontuário</strong> para começar.
          </p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records?.map((r) => (
          <Card key={r.id} className="p-5 shadow-card hover:shadow-elegant transition-shadow group">
            <div className="flex items-start justify-between gap-3">
              <Link
                to="/ehr/$id"
                params={{ id: r.id }}
                className="min-w-0 flex-1"
              >
                <div className="font-medium truncate">{r.customers?.name ?? "Paciente"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {r.record_number ? `Nº ${r.record_number}` : `ID ${r.id.slice(0, 8)}`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Atualizado em {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                </div>
              </Link>
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="Editar nº"
                  onClick={() => setEditing(r)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  title="Excluir"
                  onClick={() => setDeleting(r)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Link to="/ehr/$id" params={{ id: r.id }} aria-label="Abrir">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Editar nº do prontuário */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar prontuário</DialogTitle>
            <DialogDescription>
              Paciente: <strong>{editing?.customers?.name ?? "—"}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nº do prontuário</label>
            <Input
              defaultValue={editing?.record_number ?? ""}
              onChange={(e) => editing && setEditing({ ...editing, record_number: e.target.value })}
              placeholder="Ex.: 2026-0001"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                editing &&
                update.mutate({
                  id: editing.id,
                  record_number: editing.record_number?.trim() || null,
                })
              }
              disabled={update.isPending}
            >
              {update.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir prontuário */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prontuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o prontuário de <strong>{deleting?.customers?.name ?? "—"}</strong> e
              não pode ser desfeita. Documentos, evoluções e pareceres vinculados serão removidos pelo banco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
