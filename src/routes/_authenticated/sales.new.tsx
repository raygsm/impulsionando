import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart, AlertTriangle, PackageCheck, PackageX, Radio } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales/new")({
  head: () => ({ meta: [{ title: "Nova venda — PDV" }] }),
  component: Page,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Item = { product_id: string | null; description: string; quantity: number; unit_price: number; discount: number };
type Pay = { payment_method_id: string; account_id: string; amount: number };

function Page() {
  const { companyId } = useActiveCompany();
  const nav = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [customerDoc, setCustomerDoc] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [pays, setPays] = useState<Pay[]>([]);

  const { data: products } = useQuery({
    queryKey: ["pdv-products", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("inv_products").select("id, name, sale_price, unit").eq("company_id", companyId).eq("is_active", true).order("name").limit(500)).data ?? [],
  });
  const { data: methods } = useQuery({
    queryKey: ["pdv-methods", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_payment_methods").select("id, name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });
  const { data: accounts } = useQuery({
    queryKey: ["pdv-accounts", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_accounts").select("id, name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unit_price - i.discount, 0), [items]);
  const total = Math.max(0, subtotal - discount);
  const paid = useMemo(() => pays.reduce((s, p) => s + p.amount, 0), [pays]);

  function addProduct(productId: string) {
    const p = products?.find((x) => x.id === productId);
    if (!p) return;
    setItems((arr) => [...arr, { product_id: p.id, description: p.name, quantity: 1, unit_price: Number(p.sale_price), discount: 0 }]);
  }
  function addFreeLine() { setItems((arr) => [...arr, { product_id: null, description: "", quantity: 1, unit_price: 0, discount: 0 }]); }
  function updateItem(i: number, patch: Partial<Item>) { setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, ...patch } : it)); }
  function removeItem(i: number) { setItems((arr) => arr.filter((_, idx) => idx !== i)); }
  function addPay() { setPays((arr) => [...arr, { payment_method_id: "", account_id: "", amount: Math.max(0, total - paid) }]); }
  function updatePay(i: number, patch: Partial<Pay>) { setPays((arr) => arr.map((p, idx) => idx === i ? { ...p, ...patch } : p)); }
  function removePay(i: number) { setPays((arr) => arr.filter((_, idx) => idx !== i)); }

  const confirmSale = useMutation({
    mutationFn: async () => {
      if (!items.length) throw new Error("Adicione ao menos um item");
      if (Math.abs(paid - total) > 0.01) throw new Error("Pagamentos não fecham com o total");
      for (const p of pays) if (!p.payment_method_id || !p.account_id) throw new Error("Selecione método e conta");

      const { data: { user } } = await supabase.auth.getUser();
      // 1. create draft order
      const { data: ord, error: e1 } = await supabase.from("sales_orders").insert({
        company_id: companyId, status: "draft",
        customer_name: customerName || null, customer_doc: customerDoc || null,
        subtotal, discount, total, created_by: user?.id,
      }).select("id, number").single();
      if (e1) throw e1;

      // 2. insert items
      const { error: e2 } = await supabase.from("sales_order_items").insert(items.map((it) => ({
        order_id: ord.id, company_id: companyId,
        product_id: it.product_id, description: it.description || "Item",
        quantity: it.quantity, unit_price: it.unit_price, discount: it.discount,
        total: it.quantity * it.unit_price - it.discount,
      })));
      if (e2) throw e2;

      // 3. insert payments
      const { error: e3 } = await supabase.from("sales_payments").insert(pays.map((p) => ({
        order_id: ord.id, company_id: companyId,
        payment_method_id: p.payment_method_id, account_id: p.account_id, amount: p.amount,
      })));
      if (e3) throw e3;

      // 4. confirm
      const { error: e4 } = await supabase.from("sales_orders").update({ status: "confirmed" }).eq("id", ord.id);
      if (e4) throw e4;
      return ord.number;
    },
    onSuccess: (n) => { toast.success(`Venda #${n} confirmada`); nav({ to: "/sales/orders" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Nova venda" description="Ponto de venda." action={<CompanyPicker />} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 shadow-card">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cliente</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente" /></div>
              <div><Label>Documento</Label><Input value={customerDoc} onChange={(e) => setCustomerDoc(e.target.value)} placeholder="CPF/CNPJ" /></div>
            </div>
          </Card>

          <Card className="shadow-card">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Itens</h3>
              <div className="flex gap-2">
                <Select onValueChange={addProduct}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Adicionar produto" /></SelectTrigger>
                  <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {fmt(Number(p.sale_price))}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={addFreeLine}><Plus className="w-4 h-4 mr-1" />Item livre</Button>
              </div>
            </div>
            <div className="divide-y">
              {!items.length && <div className="p-6 text-center text-sm text-muted-foreground">Nenhum item.</div>}
              {items.map((it, i) => (
                <div key={i} className="p-3 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5"><Label className="text-xs">Descrição</Label><Input value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} /></div>
                  <div className="col-span-2"><Label className="text-xs">Qtd</Label><Input type="number" step="0.001" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} /></div>
                  <div className="col-span-2"><Label className="text-xs">Preço</Label><Input type="number" step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} /></div>
                  <div className="col-span-2"><Label className="text-xs">Desc.</Label><Input type="number" step="0.01" value={it.discount} onChange={(e) => updateItem(i, { discount: Number(e.target.value) })} /></div>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="shadow-card">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Pagamentos</h3>
              <Button variant="outline" size="sm" onClick={addPay}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
            </div>
            <div className="divide-y">
              {!pays.length && <div className="p-6 text-center text-sm text-muted-foreground">Nenhum pagamento.</div>}
              {pays.map((p, i) => (
                <div key={i} className="p-3 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4"><Label className="text-xs">Método</Label>
                    <Select value={p.payment_method_id} onValueChange={(v) => updatePay(i, { payment_method_id: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{methods?.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="col-span-4"><Label className="text-xs">Conta</Label>
                    <Select value={p.account_id} onValueChange={(v) => updatePay(i, { account_id: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="col-span-3"><Label className="text-xs">Valor</Label><Input type="number" step="0.01" value={p.amount} onChange={(e) => updatePay(i, { amount: Number(e.target.value) })} /></div>
                  <Button variant="ghost" size="sm" onClick={() => removePay(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4 shadow-card h-fit sticky top-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Resumo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Desconto</span>
              <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-24 h-8 text-right" /></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>{fmt(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span className={Math.abs(paid - total) > 0.01 ? "text-amber-600" : "text-emerald-600"}>{fmt(paid)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Diferença</span><span>{fmt(total - paid)}</span></div>
          </div>
          <Button className="w-full mt-4" onClick={() => confirmSale.mutate()} disabled={confirmSale.isPending || !items.length}>
            Confirmar venda
          </Button>
        </Card>
      </div>
    </div>
  );
}
