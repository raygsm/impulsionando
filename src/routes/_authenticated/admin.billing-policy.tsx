import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getDefaultDunningPolicy, updateDunningPolicy } from "@/lib/billing.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/billing-policy")({
  head: () => ({ meta: [{ title: "Régua padrão de cobrança — Impulsionando" }] }),
  component: BillingPolicyPage,
});

interface Step {
  code: string;
  offset_days: number;
  channels: string[];
  template_code: string;
}

const STEP_LABELS: Record<string, string> = {
  d_minus_7: "7 dias antes (D-7)",
  d_minus_1: "1 dia antes (D-1)",
  d_zero: "Dia do vencimento (D0)",
  d_plus_1: "Após o vencimento (D+1)",
};

function BillingPolicyPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getDefaultDunningPolicy);
  const upFn = useServerFn(updateDunningPolicy);

  const { data } = useQuery({ queryKey: ["dunning-policy"], queryFn: () => getFn() });
  const policy = data?.policy;

  const [name, setName] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [suspendOffset, setSuspendOffset] = useState(1);

  useEffect(() => {
    if (!policy) return;
    setName(policy.name);
    setSteps((policy.steps as unknown as Step[]) ?? []);
    setSuspendOffset(policy.suspend_offset_days ?? 1);
  }, [policy]);

  const save = useMutation({
    mutationFn: () =>
      upFn({
        data: {
          id: policy!.id,
          name,
          steps,
          suspend_offset_days: suspendOffset,
        },
      }),
    onSuccess: () => {
      toast.success("Régua salva. Aplicada a todos os contratos.");
      qc.invalidateQueries({ queryKey: ["dunning-policy"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleChannel(idx: number, ch: string) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, channels: s.channels.includes(ch) ? s.channels.filter((x) => x !== ch) : [...s.channels, ch] }
          : s,
      ),
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Régua padrão de cobrança"
        description="Política única aplicada a todos os contratos novos e existentes. Cobrança preventiva, suspensão automática e reativação ao identificar pagamento."
      />

      {!policy ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Carregando…</Card>
      ) : (
        <Card className="p-6 space-y-5">
          <div>
            <Label>Nome da política</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Passos da régua</h3>
            {steps.map((s, idx) => (
              <div key={s.code} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-xs">Passo</Label>
                  <div className="font-medium text-sm">{STEP_LABELS[s.code] ?? s.code}</div>
                  <div className="text-xs text-muted-foreground">Template: {s.template_code}</div>
                </div>
                <div>
                  <Label className="text-xs">Dias relativos</Label>
                  <Input
                    type="number"
                    value={s.offset_days}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, offset_days: Number(e.target.value) } : p)),
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Canais</Label>
                  <div className="flex gap-3 text-sm pt-1">
                    {["whatsapp", "email"].map((ch) => (
                      <label key={ch} className="flex items-center gap-1 cursor-pointer">
                        <Checkbox checked={s.channels.includes(ch)} onCheckedChange={() => toggleChannel(idx, ch)} />
                        <span className="capitalize">{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <Label>Suspender automaticamente após (dias do vencimento)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={suspendOffset}
              onChange={(e) => setSuspendOffset(Number(e.target.value))}
              className="max-w-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              No padrão Impulsionando, a suspensão ocorre em D+1 às 00:01. Reativação é automática ao identificar o pagamento.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="w-4 h-4 mr-1" /> Salvar régua padrão
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
