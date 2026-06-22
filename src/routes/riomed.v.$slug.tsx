import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicShowcase, getOrCreateCart, addToCart } from "@/lib/riomed-portal.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/riomed/v/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Rio Med · ${params.slug}` }] }),
  component: Page,
});

const TOKEN_KEY = "riomed_cart_token";

function fmt(v: number, c = "BOB") {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: c }).format(v || 0);
}

function Page() {
  const { slug } = Route.useParams();
  const fetchShowcase = useServerFn(getPublicShowcase);
  const fetchCart = useServerFn(getOrCreateCart);
  const addFn = useServerFn(addToCart);

  const showcase = useQuery({
    queryKey: ["riomed-public-showcase", slug],
    queryFn: () => fetchShowcase({ data: { subdomain: "riomed", slug } }),
  });

  const [token, setToken] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const existing = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    fetchCart({ data: { subdomain: "riomed", sessionToken: existing ?? undefined } }).then((r) => {
      setToken(r.sessionToken);
      setCount(r.items.length);
      if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, r.sessionToken);
    }).catch(() => {});
  }, []);

  const add = async (productId: string, variantId?: string) => {
    if (!token) return;
    try {
      await addFn({ data: { sessionToken: token, productId, variantId, qty: 1, modality: "sale" } });
      setCount((c) => c + 1);
      toast.success("Adicionado ao carrinho");
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  if (showcase.isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (showcase.error || !showcase.data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Vitrine indisponível</div>;

  const { showcase: s, products } = showcase.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="container py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Rio Med</p>
            <h1 className="font-semibold">{s.title}</h1>
          </div>
          <Link to="/riomed/carrinho">
            <Button variant="outline"><ShoppingCart className="h-4 w-4 mr-1" />{count}</Button>
          </Link>
        </div>
      </header>

      {s.banner_url && <img src={s.banner_url} alt={s.title} className="w-full max-h-72 object-cover" />}

      <main className="container py-8">
        {s.subtitle && <p className="text-lg text-muted-foreground mb-6">{s.subtitle}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <Card key={p.itemId} className={p.featured ? "border-primary" : undefined}>
              <CardContent className="p-3 flex flex-col gap-2">
                {p.image
                  ? <img src={p.image} alt={p.name} className="aspect-square object-cover rounded" />
                  : <div className="aspect-square bg-muted rounded flex items-center justify-center text-muted-foreground"><Sparkles className="h-8 w-8" /></div>}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium leading-tight line-clamp-2">{p.name}</p>
                    {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                  </div>
                  {p.badge && <Badge variant="secondary" className="shrink-0">{p.badge}</Badge>}
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <p className="font-bold text-lg">{fmt(Number(p.price), p.currency)}</p>
                  <Button size="sm" onClick={() => add(p.productId, p.variantId ?? undefined)}>+</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!products.length && <p className="text-center text-muted-foreground py-12">Nenhum produto ainda.</p>}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        Powered by Impulsionando · Rio Med
      </footer>
    </div>
  );
}
