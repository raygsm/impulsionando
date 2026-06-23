import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCart, removeFromCart } from "@/lib/riomed-portal.functions";
import { getCotacaoBobUsd } from "@/lib/riomed-public.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, ArrowRight, Loader2, Truck, Store, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/riomed/carrinho")({
  head: () => ({ meta: [{ title: "Carrito · Rio Med" }] }),
  component: Page,
});

const TOKEN_KEY = "riomed_cart_token";
const DELIVERY_KEY = "riomed_cart_delivery";

function fmtBOB(v: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v || 0);
}
function fmtUSD(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);
}

function Page() {
  const fetchCart = useServerFn(getCart);
  const removeFn = useServerFn(removeFromCart);
  const cotFn = useServerFn(getCotacaoBobUsd);
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(6.96);
  const [delivery, setDelivery] = useState<"pickup"|"delivery">(() => {
    if (typeof window === "undefined") return "pickup";
    return (localStorage.getItem(DELIVERY_KEY) as any) ?? "pickup";
  });

  const reload = async () => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!t) { setData({ cart: null, items: [] }); setLoading(false); return; }
    try { setData(await fetchCart({ data: { sessionToken: t } })); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); cotFn().then(r => setRate(r.rate)).catch(() => {}); }, []);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(DELIVERY_KEY, delivery); }, [delivery]);

  const remove = async (id: string) => {
    const t = localStorage.getItem(TOKEN_KEY)!;
    try { await removeFn({ data: { sessionToken: t, itemId: id } }); toast.success("Removido"); window.dispatchEvent(new CustomEvent("riomed:cart-changed")); reload(); }
    catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const items = data?.items ?? [];
  const cart = data?.cart;
  const subtotal = Number(cart?.total ?? 0);
  const deliveryFee = delivery === "delivery" ? subtotal * 0.10 : 0;
  const grand = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Meu carrinho</h1>
          <Link to="/riomed/productos"><Button variant="ghost" size="sm">Continuar comprando</Button></Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            Seu carrinho está vazio. <Link to="/riomed/productos" className="text-primary underline ml-1">Ver catálogo</Link>
          </CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              {items.map((it: any) => {
                const total = Number(it.total);
                return (
                  <Card key={it.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{it.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {it.modality === "sale" ? "Venta" : it.modality === "rental_monthly" ? "Alquiler mensual" : "Alquiler diario"}
                          {" · "}qtd {Number(it.qty)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{fmtBOB(total)}</div>
                        <div className="text-[11px] text-slate-500">≈ {fmtUSD(total / rate)}</div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="space-y-3">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-semibold">Entrega</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setDelivery("pickup")}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${delivery==="pickup" ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                      <Store className="h-4 w-4 mb-1" />
                      <div className="text-xs font-bold">Retirar na loja</div>
                      <div className="text-[11px] text-slate-500">Sin costo adicional</div>
                    </button>
                    <button onClick={() => setDelivery("delivery")}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${delivery==="delivery" ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                      <Truck className="h-4 w-4 mb-1" />
                      <div className="text-xs font-bold">Envío</div>
                      <div className="text-[11px] text-slate-500">+10% sobre o subtotal</div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{fmtBOB(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{delivery === "delivery" ? "Envío (10%)" : "Retirada"}</span>
                    <span>{fmtBOB(deliveryFee)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-baseline">
                    <span className="text-xs uppercase text-slate-500 tracking-wide">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{fmtBOB(grand)}</div>
                      <div className="text-[11px] text-slate-500">≈ {fmtUSD(grand / rate)}</div>
                    </div>
                  </div>
                  <Button className="w-full mt-2" onClick={() => navigate({ to: "/riomed/checkout" })}>
                    Continuar para pagamento <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
