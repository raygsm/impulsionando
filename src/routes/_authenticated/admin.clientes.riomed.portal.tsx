import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listShowcaseAdmin, addShowcaseItem, removeShowcaseItem, listCheckoutSessionsAdmin } from "@/lib/riomed-portal.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExternalLink, Trash2, Plus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/portal")({
  component: Page,
});

function fmt(v?: number | null) { return new Intl.NumberFormat("es-BO",{style:"currency",currency:"BOB"}).format(Number(v ?? 0)); }

function Page() {
  const listFn = useServerFn(listShowcaseAdmin);
  const addFn = useServerFn(addShowcaseItem);
  const removeFn = useServerFn(removeShowcaseItem);
  const sessionsFn = useServerFn(listCheckoutSessionsAdmin);

  const [showcases, setShowcases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedShowcase, setSelectedShowcase] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  useEffect(() => {
    supabase.from("riomed_showcase").select("id,slug,title,is_published").order("title").then(({ data }) => {
      setShowcases(data ?? []);
      if (data?.[0]) setSelectedShowcase(data[0].id);
    });
    supabase.from("riomed_products").select("id,name,sku,price_sale").eq("is_active", true).order("name").limit(500).then(({ data }) => setProducts(data ?? []));
  }, []);

  const itemsQuery = useQuery({
    queryKey: ["riomed-showcase-items", selectedShowcase],
    queryFn: () => listFn({ data: { showcaseId: selectedShowcase } }),
    enabled: !!selectedShowcase,
  });

  const sessionsQuery = useQuery({
    queryKey: ["riomed-checkout-sessions"],
    queryFn: () => sessionsFn(),
  });

  const add = async () => {
    if (!selectedShowcase || !selectedProduct) return;
    try { await addFn({ data: { showcaseId: selectedShowcase, productId: selectedProduct } });
      toast.success("Adicionado"); setSelectedProduct(""); itemsQuery.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  const remove = async (id: string) => {
    try { await removeFn({ data: { itemId: id } }); toast.success("Removido"); itemsQuery.refetch(); }
    catch (e: any) { toast.error(e?.message ?? "Erro"); }
  };

  const currentSlug = showcases.find((s) => s.id === selectedShowcase)?.slug;

  return (
    <div className="container py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portal RioMed</h1>
          <p className="text-sm text-muted-foreground">Vitrines públicas, carrinhos e pedidos do site.</p>
        </div>
        {currentSlug && (
          <Link to="/riomed/v/$slug" params={{ slug: currentSlug }} target="_blank">
            <Button variant="outline"><ExternalLink className="h-4 w-4 mr-1" />Abrir vitrine</Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="vitrine">
        <TabsList>
          <TabsTrigger value="vitrine">Vitrines</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos recebidos</TabsTrigger>
        </TabsList>

        <TabsContent value="vitrine" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Itens da vitrine</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Select value={selectedShowcase} onValueChange={setSelectedShowcase}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Vitrine" /></SelectTrigger>
                  <SelectContent>
                    {showcases.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} {!s.is_published && "(rascunho)"}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1 min-w-64"><SelectValue placeholder="Produto..." /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={add} disabled={!selectedProduct}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
              </div>

              {itemsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(itemsQuery.data?.items ?? []).map((it: any) => (
                    <Card key={it.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{it.riomed_products?.name}</p>
                          <p className="text-xs text-muted-foreground">{fmt(it.override_price ?? it.riomed_products?.price_sale)}</p>
                        </div>
                        {it.is_featured && <Badge variant="secondary">Destaque</Badge>}
                        <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                      </CardContent>
                    </Card>
                  ))}
                  {!itemsQuery.data?.items?.length && <p className="text-sm text-muted-foreground col-span-full">Nenhum item nesta vitrine.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Últimos pedidos do portal</CardTitle></CardHeader>
            <CardContent>
              {sessionsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <div className="space-y-2">
                  {(sessionsQuery.data?.sessions ?? []).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between border rounded p-3 text-sm">
                      <div>
                        <p className="font-medium">{s.contact_name} <span className="text-muted-foreground">· {s.contact_phone}</span></p>
                        <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()} · {s.audience}</p>
                      </div>
                      <Badge>{s.status}</Badge>
                    </div>
                  ))}
                  {!sessionsQuery.data?.sessions?.length && <p className="text-sm text-muted-foreground">Sem pedidos ainda.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
