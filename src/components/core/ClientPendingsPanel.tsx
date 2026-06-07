import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Pending {
  key: string;
  label: string;
  severity: "critical" | "warning" | "info";
  hint?: string;
}

export function ClientPendingsPanel({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["client-pendings", companyId],
    queryFn: async (): Promise<Pending[]> => {
      const pendings: Pending[] = [];

      const [companyRes, settingsRes, modulesRes, invoicesRes, contractRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
        supabase.from("company_settings").select("key, value").eq("company_id", companyId),
        supabase.from("company_modules").select("*").eq("company_id", companyId),
        supabase
          .from("billing_invoices")
          .select("id, status, due_date")
          .eq("company_id", companyId)
          .in("status", ["open", "overdue"]),
        supabase.from("billing_contracts").select("status").eq("company_id", companyId).maybeSingle(),
      ]);

      const c = companyRes.data;
      const settings = new Map<string, unknown>((settingsRes.data ?? []).map((r) => [r.key, r.value]));

      if (!c?.email) pendings.push({ key: "company.email", label: "E-mail principal não configurado", severity: "critical" });
      if (!c?.phone && !c?.whatsapp) pendings.push({ key: "company.phone", label: "WhatsApp/telefone não configurado", severity: "critical" });
      if (!c?.document) pendings.push({ key: "company.document", label: "CPF/CNPJ ausente", severity: "warning" });
      if (!c?.address_zip) pendings.push({ key: "company.cep", label: "CEP/Endereço incompleto", severity: "warning" });
      if (!c?.financial_email) pendings.push({ key: "company.financial_email", label: "E-mail financeiro não configurado", severity: "warning" });

      if (!settings.get("billing.pix_key")) pendings.push({ key: "billing.pix_key", label: "Chave Pix não configurada", severity: "warning", hint: "Aba Parâmetros → Financeiro" });
      if (!settings.get("billing.payment_link")) pendings.push({ key: "billing.payment_link", label: "Link de pagamento não configurado", severity: "info" });

      if (settings.get("fiscal.issue_invoice") === true) {
        if (!settings.get("fiscal.service_code")) pendings.push({ key: "fiscal.service_code", label: "Código fiscal de serviço ausente", severity: "warning" });
        if (!settings.get("fiscal.city")) pendings.push({ key: "fiscal.city", label: "Município fiscal ausente", severity: "warning" });
      }

      const enabledModules = (modulesRes.data ?? []).filter((m) => m.is_enabled);
      if (enabledModules.length === 0) pendings.push({ key: "modules.empty", label: "Nenhum módulo ativo", severity: "critical" });

      const overdue = (invoicesRes.data ?? []).filter((i) => i.status === "overdue");
      if (overdue.length > 0) pendings.push({ key: "billing.overdue", label: `${overdue.length} fatura(s) vencida(s)`, severity: "critical" });

      if (contractRes.data?.status === "suspended") {
        pendings.push({ key: "contract.suspended", label: "Contrato suspenso", severity: "critical" });
      }

      return pendings;
    },
  });

  if (isLoading) return <Card className="p-4">Verificando pendências…</Card>;

  const list = data ?? [];
  if (list.length === 0) {
    return (
      <Card className="p-6 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
        <div>
          <div className="font-semibold">Nenhuma pendência</div>
          <div className="text-sm text-muted-foreground">Esta empresa está com tudo configurado.</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Pendências ({list.length})
      </h3>
      <div className="space-y-2">
        {list.map((p) => (
          <div key={p.key} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
            <div className="min-w-0">
              <div className="text-sm font-medium">{p.label}</div>
              {p.hint && <div className="text-xs text-muted-foreground">{p.hint}</div>}
              <div className="text-[10px] text-muted-foreground/70 font-mono">{p.key}</div>
            </div>
            <Badge
              variant="outline"
              className={
                p.severity === "critical"
                  ? "border-destructive text-destructive"
                  : p.severity === "warning"
                  ? "border-amber-500 text-amber-600"
                  : ""
              }
            >
              {p.severity === "critical" ? "Crítico" : p.severity === "warning" ? "Atenção" : "Info"}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
