import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMarketplaceSuppliers } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/marketplace/fornecedores")({
  component: SuppliersPage,
  head: () => ({ meta: [{ title: "Fornecedores — Marketplace B2B" }] }),
});

function SuppliersPage() {
  const fn = useServerFn(listMarketplaceSuppliers);
  const { data, isLoading } = useQuery({ queryKey: ["mp-suppliers"], queryFn: () => fn() });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Store className="w-6 h-6 text-primary" /> Fornecedores
      </h1>
      <p className="text-sm text-muted-foreground">
        Microcervejarias, distribuidores, vinícolas, cafés especiais, destilarias e alimentos artesanais.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>{(data ?? []).length} cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum fornecedor cadastrado ainda. Convide microcervejarias e distribuidores para começar.
            </p>
          )}
          {(data ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
              <div>
                <div className="font-medium">{s.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.supplier_type} · {(s.regions_served ?? []).join(", ") || "Sem regiões definidas"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.custom_fee_pct != null && (
                  <Badge variant="outline">Taxa {(Number(s.custom_fee_pct) * 100).toFixed(2)}%</Badge>
                )}
                <Badge>{s.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
