/**
 * VitrineWidget (W19) — Card de status da vitrine para o dashboard do tenant.
 *
 * Mostra ao tenant se ele tem listagens opt-in ativas, quantas estão aprovadas
 * e o desconto médio ofertado ao Clube Impulsionito. Convida a ativar a vitrine
 * quando ainda não há nenhuma.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function VitrineWidget({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vitrine-widget", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eco_marketplace_listings")
        .select("id, status, vitrine_opt_in, discount_pct, vitrine_approved_at")
        .eq("company_id", companyId)
        .eq("vitrine_opt_in", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = data?.length ?? 0;
  const approved = data?.filter((l) => !!l.vitrine_approved_at).length ?? 0;
  const avgDiscount = total > 0
    ? (data!.reduce((acc, l) => acc + Number(l.discount_pct ?? 0), 0) / total).toFixed(1)
    : "0";

  return (
    <Card className="p-5 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="font-semibold text-sm">Vitrine Impulsionando</div>
            <div className="text-[11px] text-muted-foreground">Exposição no Clube + Marketplace</div>
          </div>
        </div>
        {total > 0 && <Badge variant="outline" className="text-[10px]">{approved}/{total} aprovadas</Badge>}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : total === 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Você ainda não publicou nenhuma listagem na Vitrine. Ative para aparecer aos Impulsionitos.
          </p>
          <Button asChild size="sm" className="w-full bg-gradient-primary text-primary-foreground gap-2">
            <Link to="/core/marketplace/compradores">
              Ativar minha Vitrine <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/50 p-2.5">
              <div className="text-2xl font-bold tabular-nums">{total}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Listagens</div>
            </div>
            <div className="rounded-md bg-emerald-500/10 p-2.5">
              <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{approved}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Aprovadas</div>
            </div>
            <div className="rounded-md bg-primary/10 p-2.5">
              <div className="text-2xl font-bold tabular-nums text-primary">{avgDiscount}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Desc. médio</div>
            </div>
          </div>
          {approved < total && (
            <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300">
              {total - approved} listagem(ns) aguardando aprovação da curadoria.
            </p>
          )}
          <Button asChild size="sm" variant="outline" className="w-full mt-3 gap-2">
            <Link to="/core/marketplace/compradores">
              Gerenciar vitrine <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </>
      )}
    </Card>
  );
}
