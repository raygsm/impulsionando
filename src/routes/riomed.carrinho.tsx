import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCart, removeFromCart } from "@/lib/riomed-portal.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/riomed/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho · Rio Med" }] }),
  component: Page,
});

const TOKEN_KEY = "riomed_cart_token";

function fmt(v: number, c = "BOB") {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: c }).format(v || 0);
}

function Page() {
  const fetchCart = useServerFn(getCart);
  const removeFn = useServerFn(removeFromCart);
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!t) { setData({ cart: null, items: [] }); setLoading(false); return; }
    try { setData(await fetchCart({ data: { sessionToken: t } })); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const remove = async (id: string) => {
    const t = localStorage.getItem(TOKEN_KEY)!;
    try { await removeFn({ data: { sessionToken: t, itemId: id } }); toast.success("Removido"); reload(); }
    catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const items = data?.items ?? [];
  const cart = data?.cart;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="font-semibold">Meu carrinho</h1>
          <Link to="/riomed/v/$slug" params={{ slug: "ofertas" }}><Button variant="ghost">Continuar comprando</Button></Link>
        </div>
      </header>

      <main className="container py-6 max-w-3xl">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Seu carrinho está vazio.</p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {items.map((it: any) => (
                <Card key={it.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{it.product_name}</p>
                      <p className="text-xs text-muted-foreground">{it.modality} · qtd {it.qty}</p>
                    </div>
                    <p className="font-semibold">{fmt(Number(it.total), cart?.currency)}</p>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{fmt(Number(cart?.total ?? 0), cart?.currency)}</p>
                </div>
                <Button onClick={() => navigate({ to: "/riomed/checkout" })}>
                  Finalizar pedido <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
