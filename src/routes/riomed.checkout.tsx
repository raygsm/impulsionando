import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCart, submitCheckout } from "@/lib/riomed-portal.functions";
import { getCotacaoBobUsd } from "@/lib/riomed-public.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/riomed/checkout")({
  head: () => ({ meta: [{ title: "Solicitar pedido · Rio Med" }] }),
  component: Page,
});

const TOKEN_KEY = "riomed_cart_token";
const DELIVERY_KEY = "riomed_cart_delivery";

function fmtBOB(value: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(value || 0);
}
function fmtUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function Page() {
  const fetchCart = useServerFn(getCart);
  const submitFn = useServerFn(submitCheckout);
  const cotFn = useServerFn(getCotacaoBobUsd);
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [done, setDone] = useState<{ code: string; total: number; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [accept, setAccept] = useState(false);
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [form, setForm] = useState({
    contactName: "", contactEmail: "", contactPhone: "", contactDoc: "",
    companyName: "", audience: "public" as "public" | "b2b" | "hospital" | "rental",
    addressLine: "", city: "", notes: "",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (typeof window !== "undefined") setDelivery((localStorage.getItem(DELIVERY_KEY) as "pickup" | "delivery") ?? "pickup");
    cotFn().then((result) => setRate(Number(result.rate) || null)).catch(() => setRate(null));
    if (token) fetchCart({ data: { sessionToken: token } }).then(setCart).catch(() => setCart(null));
  }, []);

  const subtotal = Number(cart?.cart?.total ?? 0);
  const deliveryFee = delivery === "delivery" ? subtotal * 0.10 : 0;
  const grand = subtotal + deliveryFee;

  const submit = async () => {
    if (!accept) { toast.error("Acepta los términos para continuar"); return; }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { toast.error("Carrito no encontrado"); return; }
    setBusy(true);
    try {
      const result = await submitFn({ data: {
        sessionToken: token,
        contactName: form.contactName,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone,
        contactDoc: form.contactDoc || undefined,
        companyName: form.companyName || undefined,
        audience: form.audience,
        address: {
          line: form.addressLine,
          city: form.city,
          delivery_mode: delivery,
          delivery_fee: deliveryFee,
          accepted_terms_at: new Date().toISOString(),
        },
        notes: [delivery === "delivery" ? "Envío solicitado (+10% estimado)" : "Retira en tienda", form.notes].filter(Boolean).join(" · ") || undefined,
      } });
      localStorage.removeItem(TOKEN_KEY);
      setDone({ code: result.quoteCode, total: grand, currency: cart?.cart?.currency ?? "BOB" });
    } catch (e: any) {
      toast.error(e?.message ?? "No pudimos registrar la solicitud");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
            <h2 className="text-2xl font-bold">¡Solicitud recibida!</h2>
            <p className="text-muted-foreground">
              Cotización <strong className="font-mono">{done.code}</strong> · valor estimado <strong>{fmtBOB(done.total)}</strong>
              {rate ? <span className="text-xs"> (≈ {fmtUSD(done.total / rate)})</span> : null}.
            </p>
            <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
              No se realizó ningún cobro. El equipo de Rio Med revisará disponibilidad, entrega y condiciones comerciales antes de confirmar el pedido y la forma de pago.
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate({ to: "/riomed/cotizar" })}>Nueva cotización</Button>
              <Button onClick={() => navigate({ to: "/riomed" })}>Ir al inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="max-w-3xl mx-auto px-4 py-4"><h1 className="font-bold text-lg">Solicitar pedido</h1></div></header>
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label htmlFor="co-name">Nombre*</Label><Input id="co-name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="co-phone">Teléfono / WhatsApp*</Label><Input id="co-phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="co-email">E-mail</Label><Input id="co-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="co-doc">NIT / CI</Label><Input id="co-doc" value={form.contactDoc} onChange={(e) => setForm({ ...form, contactDoc: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2"><Label htmlFor="co-company">Empresa / Institución</Label><Input id="co-company" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div className="space-y-1">
              <Label htmlFor="co-profile">Perfil</Label>
              <Select value={form.audience} onValueChange={(value: any) => setForm({ ...form, audience: value })}>
                <SelectTrigger id="co-profile"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Consumidor</SelectItem>
                  <SelectItem value="b2b">Empresa / Reventa</SelectItem>
                  <SelectItem value="hospital">Hospital / Clínica</SelectItem>
                  <SelectItem value="rental">Alquiler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Entrega ({delivery === "delivery" ? "Envío +10% estimado" : "Retira en tienda"})</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDelivery("pickup")} className={`rounded-xl border-2 p-3 text-left ${delivery === "pickup" ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                <div className="text-sm font-bold">Retira en tienda</div><div className="text-xs text-slate-500">Sin costo adicional</div>
              </button>
              <button type="button" onClick={() => setDelivery("delivery")} className={`rounded-xl border-2 p-3 text-left ${delivery === "delivery" ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                <div className="text-sm font-bold">Envío</div><div className="text-xs text-slate-500">Estimación +10%, sujeto a validación</div>
              </button>
            </div>
            {delivery === "delivery" && <>
              <div className="space-y-1 sm:col-span-2"><Label htmlFor="co-address">Dirección</Label><Input id="co-address" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="co-city">Ciudad</Label><Input id="co-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            </>}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader><CardContent><Label htmlFor="co-notes" className="sr-only">Observaciones</Label><Textarea id="co-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></CardContent></Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{fmtBOB(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">{delivery === "delivery" ? "Envío estimado (10%)" : "Retirada"}</span><span>{fmtBOB(deliveryFee)}</span></div>
            <div className="border-t pt-2 flex justify-between items-baseline"><span className="text-xs uppercase text-slate-500 tracking-wide">Valor estimado</span><div className="text-right"><div className="text-2xl font-bold">{fmtBOB(grand)}</div>{rate ? <div className="text-[11px] text-slate-500">≈ {fmtUSD(grand / rate)}</div> : null}</div></div>
            <label className="flex items-start gap-2 text-xs pt-3 border-t cursor-pointer"><Checkbox checked={accept} onCheckedChange={(value) => setAccept(!!value)} /><span>Acepto los <a href="/legal" className="underline text-primary" target="_blank" rel="noreferrer">términos y condiciones</a>, la política de privacidad y autorizo el contacto comercial de Rio Med.</span></label>
            <Button className="w-full" disabled={busy || !accept || !form.contactName || !form.contactPhone || !cart?.cart?.items_count} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enviar para cotización y validación</Button>
            <p className="text-[11px] text-slate-500 text-center">Este envío no realiza cobro. Disponibilidad, entrega, valor final y forma de pago serán confirmados por Rio Med.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
