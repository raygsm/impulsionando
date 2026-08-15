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
import { Badge } from "@/components/ui/badge";
import { Save, Mail, MessageCircle, Phone, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/billing-policy")({
  head: () => ({ meta: [{ title: "Régua padrão de cobrança — Impulsionando" }] }),
  component: BillingPolicyPage,
});

interface Step { code: string; offset_days: number; channels: string[]; template_code: string; }

const STEP_LABELS: Record<string, string> = {
  d_minus_7: "7 dias antes (D-7)", d_minus_5: "5 dias antes (D-5)", d_minus_1: "1 dia antes (D-1)",
  d_zero: "Dia do vencimento (D0)", d_plus_1: "1 dia após (D+1)", d_plus_3: "3 dias após (D+3)",
  d_plus_5: "5 dias após (D+5)", d_plus_7: "7 dias após (D+7)", d_plus_10: "10 dias após (D+10)", d_plus_15: "15 dias após (D+15)",
};

function BillingPolicyPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getDefaultDunningPolicy);
  const upFn = useServerFn(updateDunningPolicy);
  const { data } = useQuery({ queryKey: ["dunning-policy"], queryFn: () => getFn() });
  const policy = data?.policy;
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [suspendOffset, setSuspendOffset] = useState(10);

  useEffect(() => {
    if (!policy) return;
    setName(policy.name);
    setSteps(((policy.steps as unknown as Step[]) ?? []).map((s) => ({ ...s, channels: ["email"] })));
    setSuspendOffset(policy.suspend_offset_days ?? 10);
  }, [policy]);

  const save = useMutation({
    mutationFn: () => upFn({ data: { id: policy!.id, name, steps: steps.map((s) => ({ ...s, channels: ["email"] })), suspend_offset_days: suspendOffset } }),
    onSuccess: () => { toast.success("Régua salva com canais homologados."); qc.invalidateQueries({ queryKey: ["dunning-policy"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl">
      <PageHeader title="Régua padrão de cobrança" description="Vencimento sempre no dia 5. A régua só utiliza automaticamente canais com homologação comprovada no Core." />
      <div className="grid gap-3 sm:grid-cols-4 mb-5">
        <Card className="p-4"><Mail className="h-4 w-4 text-primary"/><div className="mt-2 font-medium">E-mail</div><Badge className="mt-2">Ativo</Badge></Card>
        <Card className="p-4"><MessageCircle className="h-4 w-4"/><div className="mt-2 font-medium">WhatsApp</div><Badge variant="outline" className="mt-2">Conexão pendente</Badge></Card>
        <Card className="p-4"><MessageSquareText className="h-4 w-4"/><div className="mt-2 font-medium">SMS</div><Badge variant="outline" className="mt-2">Não homologado</Badge></Card>
        <Card className="p-4"><Phone className="h-4 w-4"/><div className="mt-2 font-medium">VoIP</div><Badge variant="outline" className="mt-2">Não homologado</Badge></Card>
      </div>
      {!policy ? <Card className="p-6 text-center text-sm text-muted-foreground">Carregando…</Card> : (
        <Card className="p-6 space-y-5">
          <div><Label>Nome da política</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="rounded-md border bg-muted/30 p-4 text-sm"><strong>Regra de segurança operacional:</strong> canais pendentes podem ser configurados na área de Integrações, mas só entram em automações após teste de envio/recebimento e promoção para estado homologado.</div>
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Passos da régua</h3>
            {steps.map((s, idx) => (
              <div key={s.code} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2"><Label className="text-xs">Passo</Label><div className="font-medium text-sm">{STEP_LABELS[s.code] ?? s.code}</div><div className="text-xs text-muted-foreground">Template: {s.template_code}</div></div>
                <div><Label className="text-xs">Dias relativos</Label><Input type="number" value={s.offset_days} onChange={(e) => setSteps((prev) => prev.map((p,i) => i===idx ? { ...p, offset_days:Number(e.target.value), channels:["email"] } : p))}/></div>
                <div><Label className="text-xs">Canal automático</Label><div className="mt-2 flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-primary"/> E-mail</div></div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4"><Label>Suspender automaticamente após (dias do vencimento)</Label><Input type="number" min={1} max={30} value={suspendOffset} onChange={(e) => setSuspendOffset(Number(e.target.value))} className="max-w-[120px]"/><p className="text-xs text-muted-foreground mt-1">A suspensão segue a política financeira vigente; pagamento confirmado permite reativação conforme o ciclo de cobrança.</p></div>
          <div className="flex justify-end"><Button onClick={() => save.mutate()} disabled={save.isPending}><Save className="w-4 h-4 mr-1"/> Salvar régua</Button></div>
        </Card>
      )}
    </div>
  );
}
