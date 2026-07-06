import { Card } from "@/components/ui/card";
import { Check, X, Minus } from "lucide-react";
import type { CheckResult } from "@/lib/tenant-publication.functions";

export function PublicationValidationCard({
  title,
  result,
}: {
  title: string;
  result: CheckResult | undefined;
}) {
  const state: "ok" | "fail" | "pending" = !result ? "pending" : result.ok ? "ok" : "fail";
  const Icon = state === "ok" ? Check : state === "fail" ? X : Minus;
  const cls =
    state === "ok"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : state === "fail"
        ? "border-rose-500/40 bg-rose-500/5"
        : "border-muted";
  const iconCls =
    state === "ok" ? "text-emerald-600" : state === "fail" ? "text-rose-600" : "text-muted-foreground";
  return (
    <Card className={`p-4 space-y-2 border ${cls}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconCls}`} />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="text-xs text-muted-foreground min-h-[1.25rem]">
        {result?.detail ?? "Ainda não validado"}
      </div>
      {result?.checked_at && (
        <div className="text-[10px] text-muted-foreground/70">
          Última verificação: {new Date(result.checked_at).toLocaleString("pt-BR")}
        </div>
      )}
    </Card>
  );
}
