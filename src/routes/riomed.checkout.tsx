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
import { CheckCircle2, Loader2, QrCode, Copy } from "lucide-react";
import { QrPng } from "@/components/demo/QrPng";

export const Route = createFileRoute("/riomed/checkout")({
  head: () => ({ meta: [{ title: "Checkout · Rio Med" }] }),
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
  const submitFn = useServerFn(submitCheckout);
  const cotFn = useServerFn(getCotacaoBobUsd);
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [done, setDone] = useState<{ code: string; total: number; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [rate, setRate] = useState(6.96);
  const [accept, setAccept] = useState(false);
  const [delivery, setDelivery] = useState<"pickup"|"delivery">("pickup");
  const [form, setForm] = useState({
    contactName: "", contactEmail: "", contactPhone: "", contactDoc: "",
    companyName: "", audience: "public" as "public"|"b2b"|"hospital"|"rental",
    addressLine: "", city: "", notes: "",
  });

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (typeof window !== "undefined") setDelivery((localStorage.getItem(DELIVERY_KEY) as any) ?? "pickup");
    cotFn().then(r => setRate(r.rate)).catch(() => {});
    if (!t) return;
    fetchCart({ data: { sessionToken: t } }).then(setCart);
  }, []);

  const subtotal = Number(cart?.cart?.total ?? 0);
  const deliveryFee = delivery === "delivery" ? subtotal * 0.10 : 0;
  const grand = subtotal + deliveryFee;

  const submit = async () => {
    if (!accept) { toast.error("Acepta los términos para continuar"); return; }
    const t = localStorage.getItem(TOKEN_KEY)!;
    setBusy(true);
    try {
      const r = await submitFn({ data: {
        sessionToken: t,
        contactName: form.contactName, contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone, contactDoc: form.contactDoc || undefined,
        companyName: form.companyName || undefined, audience: form.audience,
        address: {
          line: form.addressLine, city: form.city,
          delivery_mode: delivery, delivery_fee: deliveryFee,
          accepted_terms_at: new Date().toISOString(),
        },
        notes: [
          delivery === "delivery" ? "Envío (+10%)" : "Retira en tienda",
          form.notes,
        ].filter(Boolean).join(" · ") || undefined,
      } });
      localStorage.removeItem(TOKEN_KEY);
      setDone({ code: r.quoteCode, total: grand, currency: cart?.cart?.currency ?? "BOB" });
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };

  if (done) {
    const qrPayload = JSON.stringify({
      v: 1, type: "qr_simple_bo",
      merchant: "RIOMED-BO",
      order: done.code,
      amount: done.total.toFixed(2),
      currency: done.currency,
      issued_at: new Date().toISOString(),
    });
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
            <h2 className="text-2xl font-bold">¡Pedido recibido!</h2>
            <p className="text-muted-foreground">
              Cotización <strong className="font-mono">{done.code}</strong> · Total <strong>{fmtBOB(done.total)}</strong> <span className="text-xs">(≈ {fmtUSD(done.total / rate)})</span>
            </p>

            <div className="border-2 border-dashed rounded-2xl p-5 bg-white">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 mb-3">
                <QrCode className="h-4 w-4" /> QR Simple Bolivia (simulado)
              </div>
              <div className="flex justify-center"><QrPng value={qrPayload} size={220} alt="QR de pago BOB" /></div>
              <p className="text-[11px] text-slate-500 mt-3">
                Escaneá este QR con tu app bancaria para simular el pago. En producción, el QR es emitido por el banco adquirente (BCP, BNB, Mercantil Santa Cruz).
              </p>
              <button onClick={() => { navigator.clipboard.writeText(qrPayload); toast.success("Payload copiado"); }}
                className="text-xs mt-2 inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
                <Copy className="h-3 w-3" /> Copiar payload
              </button>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate({ to: "/riomed/productos" })}>Seguir comprando</Button>
              <Button onClick={() => navigate({ to: "/riomed" })}>Ir al inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="max-w-3xl mx-auto px-4 py-4"><h1 className="font-bold text-lg">Finalizar pedido</h1></div></header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nombre*</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Teléfono / WhatsApp*</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div className="space-y-1"><Label>NIT / CI</Label><Input value={form.contactDoc} onChange={(e) => setForm({ ...form, contactDoc: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Empresa / Institución</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={form.audience} onValueChange={(v: any) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          <CardHeader><CardTitle className="text-base">Entrega ({delivery === "delivery" ? "Envío +10%" : "Retira en tienda"})</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 grid grid-cols-2 gap-2">
              <button onClick={() => setDelivery("pickup")}
                className={`rounded-xl border-2 p-3 text-left ${delivery==="pickup" ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                <div className="text-sm font-bold">Retira en tienda</div>
                <div className="text-xs text-slate-500">Sin costo adicional</div>
              </button>
              <button onClick={() => setDelivery("delivery")}
                className={`rounded-xl border-2 p-3 text-left ${delivery==="delivery" ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                <div className="text-sm font-bold">Envío</div>
                <div className="text-xs text-slate-500">+10% sobre el subtotal</div>
              </button>
            </div>
            {delivery === "delivery" && (
              <>
                <div className="space-y-1 sm:col-span-2"><Label>Dirección</Label><Input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></div>
                <div className="space-y-1"><Label>Ciudad</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader>
          <CardContent><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{fmtBOB(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">{delivery === "delivery" ? "Envío (10%)" : "Retirada"}</span><span>{fmtBOB(deliveryFee)}</span></div>
            <div className="border-t pt-2 flex justify-between items-baseline">
              <span className="text-xs uppercase text-slate-500 tracking-wide">Total a pagar</span>
              <div className="text-right">
                <div className="text-2xl font-bold">{fmtBOB(grand)}</div>
                <div className="text-[11px] text-slate-500">≈ {fmtUSD(grand / rate)}</div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs pt-3 border-t cursor-pointer">
              <Checkbox checked={accept} onCheckedChange={(v) => setAccept(!!v)} />
              <span>
                Acepto los <a href="/legal" className="underline text-primary" target="_blank">términos y condiciones</a>,
                la política de privacidad y autorizo el contacto comercial de Rio Med para concretar este pedido.
              </span>
            </label>

            <Button className="w-full" disabled={busy || !accept || !form.contactName || !form.contactPhone} onClick={submit}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Generar QR de pago
            </Button>
            <p className="text-[11px] text-slate-500 text-center">
              Al confirmar, generamos un QR Simple Bolivia (BOB) y nuestro equipo comercial valida el pedido en horas hábiles.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
