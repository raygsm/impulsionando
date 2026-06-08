import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  updateModuleCommercial,
  STATUS_TECNICO_VALUES,
  STATUS_TECNICO_LABELS,
  STATUS_COMERCIAL_VALUES,
  STATUS_COMERCIAL_LABELS,
} from "@/lib/modules.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ModuleCommercial = {
  slug: string;
  status_tecnico?: string;
  status_comercial?: string;
  monthly_price?: number | string;
  setup_fee?: number | string;
  min_contract_days?: number;
  min_installments?: number;
  show_on_site?: boolean;
  show_in_demo?: boolean;
  show_in_checkout?: boolean;
  show_in_plans?: boolean;
  show_price?: boolean;
  allow_standalone?: boolean;
  allow_combo?: boolean;
  allow_white_label?: boolean;
  allow_trial?: boolean;
  cta_primary?: string | null;
  cta_secondary?: string | null;
  commercial_url?: string | null;
  internal_notes?: string | null;
};

export function ModuleCommercialPanel({ module: m }: { module: ModuleCommercial }) {
  const qc = useQueryClient();
  const save = useServerFn(updateModuleCommercial);
  const [form, setForm] = useState({
    status_tecnico: m.status_tecnico ?? "em_desenvolvimento",
    status_comercial: m.status_comercial ?? "oculto",
    monthly_price: Number(m.monthly_price ?? 197.99),
    setup_fee: Number(m.setup_fee ?? 197.99),
    min_contract_days: m.min_contract_days ?? 90,
    min_installments: m.min_installments ?? 3,
    show_on_site: m.show_on_site ?? false,
    show_in_demo: m.show_in_demo ?? true,
    show_in_checkout: m.show_in_checkout ?? false,
    show_in_plans: m.show_in_plans ?? false,
    show_price: m.show_price ?? true,
    allow_standalone: m.allow_standalone ?? true,
    allow_combo: m.allow_combo ?? true,
    allow_white_label: m.allow_white_label ?? false,
    allow_trial: m.allow_trial ?? true,
    cta_primary: m.cta_primary ?? "",
    cta_secondary: m.cta_secondary ?? "",
    commercial_url: m.commercial_url ?? "",
    internal_notes: m.internal_notes ?? "",
  });

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          slug: m.slug,
          ...form,
          cta_primary: form.cta_primary || null,
          cta_secondary: form.cta_secondary || null,
          commercial_url: form.commercial_url || null,
          internal_notes: form.internal_notes || null,
        },
      }),
    onSuccess: () => {
      toast.success("Configuração comercial atualizada");
      qc.invalidateQueries({ queryKey: ["module-detail", m.slug] });
      qc.invalidateQueries({ queryKey: ["core-modules-lib"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao salvar"),
  });

  const total = form.setup_fee + form.monthly_price * form.min_installments;

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Status</h3>
          <p className="text-xs text-muted-foreground">
            Status técnico é interno (Impulsionando). Status comercial define o que lead/cliente vê em site, planos e checkout.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Status técnico (interno)</Label>
            <Select value={form.status_tecnico} onValueChange={(v) => setForm({ ...form, status_tecnico: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_TECNICO_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_TECNICO_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status comercial (público)</Label>
            <Select value={form.status_comercial} onValueChange={(v) => setForm({ ...form, status_comercial: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_COMERCIAL_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_COMERCIAL_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Modelo comercial</h3>
          <p className="text-xs text-muted-foreground">
            Total mínimo = Setup + (Mensalidade × mensalidades obrigatórias).
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label>Mensalidade (R$)</Label>
            <Input type="number" step="0.01" value={form.monthly_price}
              onChange={(e) => setForm({ ...form, monthly_price: Number(e.target.value) })} />
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
            <Label>Mensalidades obrigatórias</Label>
            <Input type="number" value={form.min_installments}
              onChange={(e) => setForm({ ...form, min_installments: Number(e.target.value) })} />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Total mínimo do módulo: <strong className="text-foreground">R$ {total.toFixed(2).replace(".", ",")}</strong>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Disponibilidade</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["show_on_site", "Exibir no site"],
            ["show_in_demo", "Exibir na demo"],
            ["show_in_checkout", "Exibir no checkout"],
            ["show_in_plans", "Exibir nos planos"],
            ["show_price", "Exibir preço publicamente"],
            ["allow_standalone", "Permite contratação avulsa"],
            ["allow_combo", "Permite contratação em combo"],
            ["allow_white_label", "Permite White Label"],
            ["allow_trial", "Permite trial / demo"],
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
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Textos comerciais</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>CTA principal</Label>
            <Input value={form.cta_primary} onChange={(e) => setForm({ ...form, cta_primary: e.target.value })} placeholder="Contratar agora" />
          </div>
          <div>
            <Label>CTA secundário</Label>
            <Input value={form.cta_secondary} onChange={(e) => setForm({ ...form, cta_secondary: e.target.value })} placeholder="Ver demonstração" />
          </div>
          <div className="sm:col-span-2">
            <Label>URL comercial</Label>
            <Input value={form.commercial_url} onChange={(e) => setForm({ ...form, commercial_url: e.target.value })} placeholder="https://impulsionando.com.br/modulos/..." />
          </div>
          <div className="sm:col-span-2">
            <Label>Observações internas (não aparece para o cliente)</Label>
            <Textarea rows={3} value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? "Salvando..." : "Salvar configuração comercial"}
        </Button>
      </div>
    </div>
  );
}
