import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listMasterPlans,
  updateMasterPlan,
  PLAN_STATUS_COMERCIAL_VALUES,
  PLAN_STATUS_COMERCIAL_LABELS,
} from "@/lib/billing.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";
import { useMinimumWage } from "@/hooks/useCoreSetting";

export const Route = createFileRoute("/_authenticated/core/planos")({
  head: () => ({ meta: [{ title: "Gestão Master de Planos" }, { name: "robots", content: "noindex" }] }),
  component: CorePlanosPage,
});

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status_comercial: string;
  recurring_amount: number | string;
  setup_fee: number | string;
  min_contract_days: number;
  min_installments: number;
  included_module_count: number;
  extra_module_price: number | string;
  discount_percent: number | string;
  show_on_site: boolean;
  show_in_checkout: boolean;
  allow_direct_checkout: boolean;
  route_to_quote: boolean;
  route_to_whatsapp: boolean;
  cta: string | null;
  legal_text: string | null;
  internal_notes: string | null;
  is_active: boolean;
  sort_order: number;
  cycle: string;
};

function CorePlanosPage() {
  const fetchPlans = useServerFn(listMasterPlans);
  const { data } = useQuery({
    queryKey: ["core-master-plans"],
    queryFn: () => fetchPlans(),
  });
  const plans = (data?.plans ?? []) as Plan[];

  return (
    <>
      <PageHeader
        title="Gestão de Planos"
        description="Defina status comercial, preço, contrato mínimo, visibilidade e CTAs por plano. Tudo é auditado."
      />
      <Card className="p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      </Card>
    </>
  );
}

function statusVariant(s: string): "default" | "outline" | "secondary" {
  if (s === "disponivel_contratacao") return "default";
  if (s === "oculto" || s === "exclusivo_interno") return "outline";
  return "secondary";
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{plan.name}</div>
          <div className="text-xs text-muted-foreground truncate">{plan.code} · {plan.cycle}</div>
        </div>
        <Badge variant={statusVariant(plan.status_comercial)} className="text-[10px]">
          {PLAN_STATUS_COMERCIAL_LABELS[plan.status_comercial] ?? plan.status_comercial}
        </Badge>
      </div>
      <div className="text-xs space-y-0.5">
        <div>Mensalidade: <strong>R$ {Number(plan.recurring_amount).toFixed(2).replace(".", ",")}</strong></div>
        <div>Setup: R$ {Number(plan.setup_fee).toFixed(2).replace(".", ",")}</div>
        <div>Mín {plan.min_contract_days} dias · {plan.min_installments} mensalidades</div>
      </div>
      <div className="flex flex-wrap gap-1 text-[10px]">
        {plan.show_on_site && <Badge variant="outline" className="text-[10px]">Site</Badge>}
        {plan.show_in_checkout && <Badge variant="outline" className="text-[10px]">Checkout</Badge>}
        {plan.allow_direct_checkout && <Badge variant="outline" className="text-[10px]">Checkout direto</Badge>}
        {plan.route_to_quote && <Badge variant="outline" className="text-[10px]">→ Orçamento</Badge>}
        {plan.route_to_whatsapp && <Badge variant="outline" className="text-[10px]">→ WhatsApp</Badge>}
        {!plan.is_active && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Inativo</Badge>}
      </div>
      <EditPlanDialog plan={plan} />
    </div>
  );
}

function EditPlanDialog({ plan }: { plan: Plan }) {
  const qc = useQueryClient();
  const save = useServerFn(updateMasterPlan);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    status_comercial: plan.status_comercial,
    name: plan.name,
    description: plan.description ?? "",
    recurring_amount: Number(plan.recurring_amount),
    setup_fee: Number(plan.setup_fee),
    min_contract_days: plan.min_contract_days,
    min_installments: plan.min_installments,
    included_module_count: plan.included_module_count,
    extra_module_price: Number(plan.extra_module_price),
    discount_percent: Number(plan.discount_percent),
    show_on_site: plan.show_on_site,
    show_in_checkout: plan.show_in_checkout,
    allow_direct_checkout: plan.allow_direct_checkout,
    route_to_quote: plan.route_to_quote,
    route_to_whatsapp: plan.route_to_whatsapp,
    cta: plan.cta ?? "",
    legal_text: plan.legal_text ?? "",
    internal_notes: plan.internal_notes ?? "",
    is_active: plan.is_active,
  });

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: plan.id,
          ...form,
          description: form.description || null,
          cta: form.cta || null,
          legal_text: form.legal_text || null,
          internal_notes: form.internal_notes || null,
        },
      }),
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["core-master-plans"] });
      setOpen(false);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao salvar"),
  });

  const total = form.setup_fee + form.recurring_amount * form.min_installments;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">Editar plano</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar — {plan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Status comercial</Label>
              <Select value={form.status_comercial} onValueChange={(v) => setForm({ ...form, status_comercial: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_STATUS_COMERCIAL_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>{PLAN_STATUS_COMERCIAL_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label>Mensalidade (R$)</Label>
              <Input type="number" step="0.01" value={form.recurring_amount}
                onChange={(e) => setForm({ ...form, recurring_amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Setup (R$)</Label>
              <Input type="number" step="0.01" value={form.setup_fee}
                onChange={(e) => setForm({ ...form, setup_fee: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Contrato mínimo (dias)</Label>
              <Input type="number" value={form.min_contract_days}
                onChange={(e) => setForm({ ...form, min_contract_days: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Mensalidades obrig.</Label>
              <Input type="number" value={form.min_installments}
                onChange={(e) => setForm({ ...form, min_installments: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Módulos inclusos</Label>
              <Input type="number" value={form.included_module_count}
                onChange={(e) => setForm({ ...form, included_module_count: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Módulo extra (R$)</Label>
              <Input type="number" step="0.01" value={form.extra_module_price}
                onChange={(e) => setForm({ ...form, extra_module_price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Desconto (%)</Label>
              <Input type="number" step="0.01" value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Total mínimo: <strong className="text-foreground">R$ {total.toFixed(2).replace(".", ",")}</strong>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {[
              ["show_on_site", "Exibir no site"],
              ["show_in_checkout", "Exibir no checkout"],
              ["allow_direct_checkout", "Permitir checkout direto"],
              ["route_to_quote", "Encaminhar para orçamento (sob consulta)"],
              ["route_to_whatsapp", "Encaminhar para WhatsApp"],
              ["is_active", "Plano ativo"],
            ].map(([k, label]) => (
              <label key={k} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                <span>{label}</span>
                <Switch
                  checked={(form as never as Record<string, boolean>)[k]}
                  onCheckedChange={(v) => setForm({ ...form, [k]: v } as never)}
                />
              </label>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>CTA</Label>
              <Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Contratar agora" />
            </div>
            <div>
              <Label>Texto legal</Label>
              <Input value={form.legal_text} onChange={(e) => setForm({ ...form, legal_text: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações internas</Label>
              <Textarea rows={2} value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              {mut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
