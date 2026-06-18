import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchUserPlanContext } from "@/lib/plan-context.functions";
import { Lock, Sparkles } from "lucide-react";

/**
 * Gate visual por plano. Mapeia planos por palavras-chave em código/nome
 * para evitar acoplamento com IDs específicos.
 *
 * - `allowedTiers` aceita: "essencial" | "profissional" | "completo".
 * - Staff Impulsionando sempre passa.
 * - Quando não há contrato/plano, mostra upgrade CTA.
 */
export interface PlanGateProps {
  moduleName: string;
  allowedTiers: Array<"essencial" | "profissional" | "completo">;
  children: ReactNode;
}

function classifyPlan(code: string | null, name: string | null): "essencial" | "profissional" | "completo" | null {
  const blob = `${code ?? ""} ${name ?? ""}`.toLowerCase();
  if (blob.includes("complet")) return "completo";
  if (blob.includes("profission") || blob.includes("integrad") || blob.includes("avanc")) return "profissional";
  if (blob.includes("essencial") || blob.includes("basic") || blob.includes("starter")) return "essencial";
  return null;
}

export function PlanGate({ moduleName, allowedTiers, children }: PlanGateProps) {
  const fn = useServerFn(fetchUserPlanContext);
  const { data, isLoading } = useQuery({
    queryKey: ["plan-context"],
    queryFn: () => fn({ data: {} }),
    staleTime: 60_000,
  });

  if (isLoading) return null;

  // Staff bypass
  if (data?.isStaff) return <>{children}</>;

  const tier = classifyPlan(data?.planCode ?? null, data?.planName ?? null);
  const allowed = tier ? allowedTiers.includes(tier) : false;

  if (allowed) return <>{children}</>;

  return (
    <Card className="p-6 max-w-2xl mx-auto my-8 border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-500/20 p-2">
          <Lock className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{moduleName}</h2>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> Plano superior
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Este módulo está disponível nos planos{" "}
            <span className="font-medium text-foreground">
              {allowedTiers.map((t) => t[0].toUpperCase() + t.slice(1)).join(" e ")}
            </span>
            . Seu plano atual:{" "}
            <span className="font-medium text-foreground">
              {data?.planName ?? "Sem contrato ativo"}
            </span>
            .
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link to="/minha-assinatura">Ver minha assinatura</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/saiba-mais">Comparar planos</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
