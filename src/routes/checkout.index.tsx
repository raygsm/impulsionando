import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPlans } from "@/lib/mercadopago.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/checkout/")({
  component: CheckoutIndex,
  head: () => ({
    meta: [
      { title: "Checkout — Impulsionando" },
      { name: "description", content: "Escolha seu plano e finalize com Pix, cartão ou boleto. Pagamento 100% dentro da plataforma." },
    ],
  }),
});

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CheckoutIndex() {
  const listFn = useServerFn(listPlans);
  const { data: plans = [] } = useQuery({ queryKey: ["mp-plans"], queryFn: () => listFn() });

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Escolha seu plano</h1>
          <p className="text-muted-foreground">
            Pagamento via Pix, cartão ou boleto. Sem redirecionamento — tudo dentro da plataforma.
          </p>
        </header>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(plans as any[]).map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div>
                  <span className="text-3xl font-bold">{brl(p.price_cents)}</span>
                  <span className="text-sm text-muted-foreground"> /{p.interval === "yearly" ? "ano" : "mês"}</span>
                </div>
                <ul className="text-sm space-y-1">
                  {(p.features as string[]).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-auto">
                  <Link to="/checkout/$slug" params={{ slug: p.slug }}>
                    Assinar <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
