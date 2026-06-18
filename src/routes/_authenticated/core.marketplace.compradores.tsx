import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMarketplaceBuyers } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/marketplace/compradores")({
  component: BuyersPage,
  head: () => ({ meta: [{ title: "Compradores — Marketplace B2B" }] }),
});

function BuyersPage() {
  const fn = useServerFn(listMarketplaceBuyers);
  const { data, isLoading } = useQuery({ queryKey: ["mp-buyers"], queryFn: () => fn() });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users2 className="w-6 h-6 text-primary" /> Compradores
      </h1>
      <p className="text-sm text-muted-foreground">
        Bares, restaurantes, hotéis e eventos que compram via Marketplace.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>{(data ?? []).length} cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum comprador cadastrado ainda.</p>
          )}
          {(data ?? []).map((b: any) => (
            <div key={b.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
              <div>
                <div className="font-medium">{b.display_name}</div>
                <div className="text-xs text-muted-foreground">{b.buyer_type}</div>
              </div>
              <Badge>{b.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
