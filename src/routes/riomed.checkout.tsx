import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCart, submitCheckout } from "@/lib/riomed-portal.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/riomed/checkout")({
  head: () => ({ meta: [{ title: "Checkout · Rio Med" }] }),
  component: Page,
});

const TOKEN_KEY = "riomed_cart_token";

function Page() {
  const fetchCart = useServerFn(getCart);
  const submitFn = useServerFn(submitCheckout);
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    contactName: "", contactEmail: "", contactPhone: "", contactDoc: "",
    companyName: "", audience: "public" as "public"|"b2b"|"hospital"|"rental",
    addressLine: "", city: "", notes: "",
  });

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!t) return;
    fetchCart({ data: { sessionToken: t } }).then(setCart);
  }, []);

  const submit = async () => {
    const t = localStorage.getItem(TOKEN_KEY)!;
    setBusy(true);
    try {
      const r = await submitFn({ data: {
        sessionToken: t,
        contactName: form.contactName, contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone, contactDoc: form.contactDoc || undefined,
        companyName: form.companyName || undefined, audience: form.audience,
        address: { line: form.addressLine, city: form.city },
        notes: form.notes || undefined,
      } });
      localStorage.removeItem(TOKEN_KEY);
      setDone({ code: r.quoteCode });
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
          <h2 className="text-xl font-semibold">Pedido enviado!</h2>
          <p className="text-muted-foreground">Sua cotação <strong>{done.code}</strong> está com nosso time. Em breve entraremos em contato.</p>
          <Button onClick={() => navigate({ to: "/riomed/v/$slug", params: { slug: "ofertas" } })}>Voltar à vitrine</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b"><div className="container py-4"><h1 className="font-semibold">Finalizar pedido</h1></div></header>
      <main className="container py-6 max-w-2xl space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nome*</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Telefone / WhatsApp*</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div className="space-y-1"><Label>NIT / CI</Label><Input value={form.contactDoc} onChange={(e) => setForm({ ...form, contactDoc: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Empresa / Instituição</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={form.audience} onValueChange={(v: any) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Consumidor</SelectItem>
                  <SelectItem value="b2b">Empresa / Revenda</SelectItem>
                  <SelectItem value="hospital">Hospital / Clínica</SelectItem>
                  <SelectItem value="rental">Locação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Entrega</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2"><Label>Endereço</Label><Input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></div>
            <div className="space-y-1"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></CardContent>
        </Card>

        {cart && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total ({cart.items.length} itens)</p>
                <p className="text-2xl font-bold">{new Intl.NumberFormat("es-BO",{style:"currency",currency:cart.cart?.currency ?? "BOB"}).format(Number(cart.cart?.total ?? 0))}</p>
              </div>
              <Button disabled={busy || !form.contactName || !form.contactPhone} onClick={submit}>
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enviar pedido
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
