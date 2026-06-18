import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listActiveSuppliersPublic,
  listSupplierCatalog,
  getMyBuyerProfile,
  placeMarketplaceOrder,
} from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bar/marketplace/novo-pedido")({
  component: NewOrderPage,
  head: () => ({ meta: [{ title: "Novo Pedido — Marketplace B2B" }] }),
});

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type CartItem = {
  catalog_item_id: string;
  name: string;
  unit: string;
  unit_price_cents: number;
  qty: number;
};

function NewOrderPage() {
  const navigate = useNavigate();
  const suppliersFn = useServerFn(listActiveSuppliersPublic);
  const catalogFn = useServerFn(listSupplierCatalog);
  const buyerFn = useServerFn(getMyBuyerProfile);
  const placeFn = useServerFn(placeMarketplaceOrder);

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [notes, setNotes] = useState("");

  const { data: suppliers } = useQuery({
    queryKey: ["mp-suppliers-active"],
    queryFn: () => suppliersFn(),
  });
  const { data: buyer } = useQuery({ queryKey: ["my-buyer"], queryFn: () => buyerFn() });
  const { data: catalog } = useQuery({
    queryKey: ["mp-catalog", supplierId],
    queryFn: () => catalogFn({ data: { supplierId: supplierId! } }),
    enabled: !!supplierId,
  });

  const subtotal = useMemo(
    () => Object.values(cart).reduce((a, it) => a + Math.round(it.unit_price_cents * it.qty), 0),
    [cart],
  );

  const place = useMutation({
    mutationFn: () =>
      placeFn({
        data: {
          supplier_id: supplierId!,
          buyer_id: buyer!.id,
          items: Object.values(cart),
          notes: notes || null,
        },
      }),
    onSuccess: (order) => {
      toast.success(`Pedido #${order.order_number} enviado para aprovação do fornecedor.`);
      navigate({ to: "/bar/marketplace" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao gerar pedido."),
  });

  function addToCart(it: any) {
    setCart((c) => ({
      ...c,
      [it.id]: c[it.id]
        ? { ...c[it.id], qty: c[it.id].qty + 1 }
        : {
            catalog_item_id: it.id,
            name: it.name,
            unit: it.unit,
            unit_price_cents: it.price_cents,
            qty: Math.max(1, Number(it.min_order_qty || 1)),
          },
    }));
  }
  function changeQty(id: string, delta: number) {
    setCart((c) => {
      const cur = c[id];
      if (!cur) return c;
      const next = cur.qty + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...cur, qty: next } };
    });
  }
  function removeItem(id: string) {
    setCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Novo Pedido B2B
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha um fornecedor e monte seu pedido. A Taxa de Intermediação Digital é
            cobrada do fornecedor e não impacta seu valor final.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/bar/marketplace"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
        </Button>
      </header>

      {!buyer && (
        <Card>
          <CardHeader>
            <CardTitle>Perfil de comprador não encontrado</CardTitle>
            <CardDescription>
              Sua empresa ainda não está cadastrada como compradora no marketplace.
              Peça ao administrador para concluir o cadastro.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {buyer && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>1. Fornecedor</CardTitle>
                <CardDescription>Selecione de quem você quer comprar.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(suppliers ?? []).map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => { setSupplierId(s.id); setCart({}); }}
                    className={`text-left border rounded-lg p-3 hover:border-primary transition ${
                      supplierId === s.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="font-medium">{s.display_name}</div>
                    <div className="text-xs text-muted-foreground">{s.supplier_type}</div>
                  </button>
                ))}
                {(suppliers ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2">
                    Nenhum fornecedor ativo. Volte mais tarde.
                  </p>
                )}
              </CardContent>
            </Card>

            {supplierId && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Catálogo</CardTitle>
                  <CardDescription>Adicione itens ao carrinho.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(catalog ?? []).filter((i: any) => i.active).map((i: any) => (
                    <div key={i.id} className="flex items-center justify-between border-b last:border-0 py-2">
                      <div>
                        <div className="font-medium">{i.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {brl(i.price_cents)} / {i.unit} · mín {i.min_order_qty}
                          {i.stock_qty != null && ` · estoque ${i.stock_qty}`}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addToCart(i)}>
                        <Plus className="w-4 h-4" /> Adicionar
                      </Button>
                    </div>
                  ))}
                  {(catalog ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Fornecedor sem itens no catálogo.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Carrinho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.keys(cart).length === 0 && (
                  <p className="text-sm text-muted-foreground">Vazio.</p>
                )}
                {Object.values(cart).map((it) => (
                  <div key={it.catalog_item_id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{brl(it.unit_price_cents)} / {it.unit}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(it.catalog_item_id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        className="w-14 h-7 text-center"
                        value={it.qty}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 0;
                          setCart((c) => ({ ...c, [it.catalog_item_id]: { ...c[it.catalog_item_id], qty: v } }));
                        }}
                      />
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(it.catalog_item_id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(it.catalog_item_id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{brl(subtotal)}</span>
                </div>
                <Textarea
                  placeholder="Observações para o fornecedor (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <Button
                  className="w-full"
                  disabled={!supplierId || Object.keys(cart).length === 0 || place.isPending}
                  onClick={() => place.mutate()}
                >
                  {place.isPending ? "Enviando..." : "Gerar Pedido"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Pedidos passam por aprovação do fornecedor antes da produção/entrega.
                </p>
              </CardContent>
            </Card>
            {supplierId && (
              <Badge variant="outline" className="w-full justify-center py-2">
                Fornecedor selecionado
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
