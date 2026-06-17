import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileText, ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/irpf")({
  head: () => ({ meta: [{ title: "IRPF — Contabilidade" }] }),
  component: ContabIRPF,
});

interface Journey {
  id: string; taxpayer_name: string; taxpayer_cpf: string | null;
  base_year: number; current_step: number; status: string;
  result_type: string | null; result_amount: number; fee_amount: number; fee_paid: boolean;
  client_id: string | null;
}
interface Step { id: string; step_number: number; step_name: string; status: string; }
interface Client { id: string; legal_name: string; trade_name: string | null; }

function ContabIRPF() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    taxpayer_name: "", taxpayer_cpf: "", client_id: "",
    base_year: new Date().getFullYear() - 1, fee_amount: 0,
  });

  const { data: clients } = useQuery({
    queryKey: ["contab-clients-min", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_clients")
        .select("id, legal_name, trade_name").eq("company_id", companyId!).order("legal_name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: journeys, isLoading } = useQuery({
    queryKey: ["contab-irpf", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_irpf_journeys")
        .select("*").eq("company_id", companyId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Journey[];
    },
  });

  const { data: steps } = useQuery({
    queryKey: ["contab-irpf-steps", expanded],
    enabled: !!expanded,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_irpf_steps")
        .select("*").eq("journey_id", expanded!).order("step_number");
      if (error) throw error;
      return data as Step[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contab_irpf_journeys").insert({
        company_id: companyId!,
        taxpayer_name: form.taxpayer_name,
        taxpayer_cpf: form.taxpayer_cpf || null,
        client_id: form.client_id || null,
        base_year: form.base_year,
        fee_amount: form.fee_amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Jornada IRPF criada com 14 etapas");
      qc.invalidateQueries({ queryKey: ["contab-irpf"] });
      setOpen(false);
      setForm({ taxpayer_name: "", taxpayer_cpf: "", client_id: "", base_year: new Date().getFullYear() - 1, fee_amount: 0 });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStep = useMutation({
    mutationFn: async ({ step, journey }: { step: Step; journey: Journey }) => {
      const done = step.status !== "concluida";
      const { error } = await supabase.from("contab_irpf_steps").update({
        status: done ? "concluida" : "pendente",
        completed_at: done ? new Date().toISOString() : null,
      }).eq("id", step.id);
      if (error) throw error;
      if (done && step.step_number > journey.current_step) {
        await supabase.from("contab_irpf_journeys")
          .update({ current_step: step.step_number }).eq("id", journey.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contab-irpf-steps"] });
      qc.invalidateQueries({ queryKey: ["contab-irpf"] });
    },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Imposto de Renda PF"
        description="Jornada completa de 14 etapas — do convite ao recibo. Acompanhe cada declaração do início ao fim."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova jornada
            </Button>
          </div>
        }
      />

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !journeys?.length && (
        <EmptyState title="Nenhuma jornada IRPF" description="Crie a primeira declaração para começar." />
      )}

      <div className="space-y-2">
        {journeys?.map((j) => {
          const pct = Math.round((j.current_step / 14) * 100);
          const isOpen = expanded === j.id;
          return (
            <Card key={j.id}>
              <button
                className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => setExpanded(isOpen ? null : j.id)}
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{j.taxpayer_name} <span className="text-xs text-muted-foreground">· Ano-base {j.base_year}</span></div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span>Etapa {j.current_step}/14</span>
                    <Progress value={pct} className="w-32 h-1.5" />
                    <span>{pct}%</span>
                  </div>
                </div>
                <Badge variant={j.status === "concluida" ? "default" : "secondary"}>{j.status}</Badge>
                {j.fee_amount > 0 && (
                  <Badge variant={j.fee_paid ? "default" : "outline"} className="text-xs">
                    R$ {j.fee_amount.toFixed(2)} {j.fee_paid ? "✓" : ""}
                  </Badge>
                )}
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-1">
                  {steps?.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                      <Checkbox
                        checked={s.status === "concluida"}
                        onCheckedChange={() => toggleStep.mutate({ step: s, journey: j })}
                      />
                      <span className={`text-sm flex-1 ${s.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                        {s.step_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova jornada IRPF</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do contribuinte *</Label>
              <Input value={form.taxpayer_name} onChange={(e) => setForm({ ...form, taxpayer_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CPF</Label>
                <Input value={form.taxpayer_cpf} onChange={(e) => setForm({ ...form, taxpayer_cpf: e.target.value })} />
              </div>
              <div><Label>Ano-base *</Label>
                <Input type="number" value={form.base_year}
                  onChange={(e) => setForm({ ...form, base_year: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Cliente vinculado (opcional)</Label>
              <Select value={form.client_id || "none"}
                onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem vínculo —</SelectItem>
                  {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Honorário (R$)</Label>
              <Input type="number" step="0.01" value={form.fee_amount}
                onChange={(e) => setForm({ ...form, fee_amount: Number(e.target.value) })} />
            </div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.taxpayer_name || save.isPending}
              onClick={() => save.mutate()}>
              Criar jornada (14 etapas)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
