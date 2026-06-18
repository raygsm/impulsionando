import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getPlanBySlug,
  getMercadoPagoConfig,
  createPixPayment,
  createCardPayment,
  getPaymentStatus,
} from "@/lib/mercadopago.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Copy, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/$slug")({
  component: CheckoutPlanPage,
  head: ({ params }) => ({
    meta: [
      { title: `Checkout ${params.slug} — Impulsionando` },
      { name: "description", content: "Finalize seu plano com Pix, cartão ou boleto, sem sair da plataforma." },
    ],
  }),
});

const brl = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

declare global { interface Window { MercadoPago: any } }

function useMpSdk(publicKey: string | null) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!publicKey) return;
    if (typeof window === "undefined") return;
    if (window.MercadoPago) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, [publicKey]);
  return ready;
}

function CheckoutPlanPage() {
  const { slug } = useParams({ from: "/checkout/$slug" });
  const getPlan = useServerFn(getPlanBySlug);
  const getCfg = useServerFn(getMercadoPagoConfig);
  const createPix = useServerFn(createPixPayment);
  const createCard = useServerFn(createCardPayment);
  const getStatus = useServerFn(getPaymentStatus);

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["plan", slug], queryFn: () => getPlan({ data: { slug } }),
  });
  const { data: cfg } = useQuery({
    queryKey: ["mp-config"], queryFn: () => getCfg(),
  });
  const mpReady = useMpSdk(cfg?.public_key ?? null);

  const [session, setSession] = useState<any>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setSession(data.user)); }, []);

  if (planLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }
  if (!plan) {
    return (
      <div className="p-12 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <p>Plano não encontrado.</p>
        <Button asChild variant="outline"><Link to="/checkout">Ver planos disponíveis</Link></Button>
      </div>
    );
  }
  if (!cfg?.configured) {
    return (
      <div className="p-12 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Pagamento indisponível</CardTitle>
            <CardDescription>Informe as credenciais do Mercado Pago para ativar o checkout transparente.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="p-12 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Entre para continuar</CardTitle>
            <CardDescription>Para assinar o plano <b>{plan.name}</b>, faça login.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link to="/auth">Fazer login</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto grid md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento — {plan.name}</CardTitle>
              <CardDescription>
                <ShieldCheck className="w-3 h-3 inline mr-1 text-emerald-600" />
                Ambiente {cfg.environment === "production" ? "PRODUÇÃO" : "SANDBOX"} · 100% dentro da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pix" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="pix">Pix</TabsTrigger>
                  <TabsTrigger value="card">Cartão</TabsTrigger>
                  <TabsTrigger value="boleto">Boleto</TabsTrigger>
                </TabsList>
                <TabsContent value="pix">
                  <PixForm planId={plan.id} userEmail={session.email} createPix={createPix} getStatus={getStatus} />
                </TabsContent>
                <TabsContent value="card">
                  <CardForm
                    planId={plan.id}
                    publicKey={cfg.public_key!}
                    mpReady={mpReady}
                    userEmail={session.email}
                    createCard={createCard}
                  />
                </TabsContent>
                <TabsContent value="boleto">
                  <p className="text-sm text-muted-foreground py-4">
                    Boleto será habilitado em breve. Por ora, use Pix ou cartão.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>{plan.name}</span><b>{brl(plan.price_cents)}</b></div>
              <div className="text-xs text-muted-foreground">{plan.interval === "yearly" ? "Cobrança anual" : "Cobrança mensal"}</div>
              <hr />
              <div className="flex justify-between text-lg"><span>Total</span><b>{brl(plan.price_cents)}</b></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PixForm({ planId, userEmail, createPix, getStatus }: any) {
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState("");
  const [pix, setPix] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!pix?.id) return;
    const t = setInterval(async () => {
      try {
        const r = await getStatus({ data: { payment_id: String(pix.id) } });
        if (r?.status) setStatus(r.status);
        if (r?.status === "approved") clearInterval(t);
      } catch {}
    }, 4000);
    return () => clearInterval(t);
  }, [pix?.id]);

  async function pay() {
    setLoading(true);
    try {
      const res = await createPix({
        data: {
          plan_id: planId,
          payer: {
            email: userEmail,
            identification: doc ? { type: "CPF", number: doc.replace(/\D/g, "") } : undefined,
          },
        },
      });
      setPix(res);
      setStatus(res.status);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar Pix.");
    } finally { setLoading(false); }
  }

  if (status === "approved") {
    return (
      <div className="text-center space-y-2 py-6">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
        <p className="font-medium">Pagamento aprovado!</p>
        <p className="text-sm text-muted-foreground">Seu plano será liberado em instantes.</p>
      </div>
    );
  }
  if (pix) {
    return (
      <div className="space-y-3">
        <div className="text-center text-sm text-muted-foreground">
          Aguardando pagamento{status && status !== "pending" ? ` · ${status}` : "..."}
        </div>
        {pix.qr_code_base64 && (
          <img
            src={`data:image/png;base64,${pix.qr_code_base64}`}
            alt="QR Code Pix"
            className="mx-auto w-56 h-56 border rounded"
          />
        )}
        {pix.qr_code && (
          <div className="space-y-1">
            <Label className="text-xs">Pix copia e cola</Label>
            <div className="flex gap-2">
              <Input readOnly value={pix.qr_code} className="text-xs" />
              <Button variant="outline" size="icon" onClick={() => {
                navigator.clipboard.writeText(pix.qr_code);
                toast.success("Copiado!");
              }}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
        {pix.expires_at && (
          <p className="text-xs text-muted-foreground text-center">
            Expira em {new Date(pix.expires_at).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <Label>CPF (opcional)</Label>
        <Input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="000.000.000-00" />
      </div>
      <Button onClick={pay} disabled={loading} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar Pix"}
      </Button>
    </div>
  );
}

function CardForm({ planId, publicKey, mpReady, userEmail, createCard }: any) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ status: string; detail?: string } | null>(null);
  const [form, setForm] = useState({
    cardNumber: "", cardholderName: "",
    expMonth: "", expYear: "", cvv: "",
    docType: "CPF", docNumber: "",
    installments: 1,
  });

  async function pay() {
    if (!mpReady || !window.MercadoPago) {
      toast.error("SDK do Mercado Pago ainda carregando.");
      return;
    }
    setLoading(true);
    try {
      const mp = new window.MercadoPago(publicKey);
      const cardToken = await mp.createCardToken({
        cardNumber: form.cardNumber.replace(/\s+/g, ""),
        cardholderName: form.cardholderName,
        cardExpirationMonth: form.expMonth,
        cardExpirationYear: form.expYear,
        securityCode: form.cvv,
        identificationType: form.docType,
        identificationNumber: form.docNumber.replace(/\D/g, ""),
      });

      const bin = form.cardNumber.replace(/\s+/g, "").slice(0, 6);
      const methods = await mp.getPaymentMethods({ bin });
      const pm = methods?.results?.[0];
      if (!pm) throw new Error("Bandeira de cartão não reconhecida.");

      const res = await createCard({
        data: {
          plan_id: planId,
          token: cardToken.id,
          installments: Number(form.installments),
          payment_method_id: pm.id,
          payer: {
            email: userEmail,
            identification: { type: form.docType, number: form.docNumber.replace(/\D/g, "") },
          },
        },
      });
      setDone({ status: res.status, detail: res.status_detail });
    } catch (e: any) {
      toast.error(e?.message ?? "Pagamento recusado.");
    } finally { setLoading(false); }
  }

  if (done?.status === "approved") {
    return (
      <div className="text-center space-y-2 py-6">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
        <p className="font-medium">Pagamento aprovado!</p>
        <p className="text-sm text-muted-foreground">Seu plano foi liberado.</p>
      </div>
    );
  }
  if (done) {
    return (
      <div className="text-center space-y-3 py-4">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <p>{done.status === "in_process" ? "Pagamento em análise." : "Pagamento não aprovado."}</p>
        {done.detail && <p className="text-xs text-muted-foreground">{done.detail}</p>}
        <Button variant="outline" onClick={() => setDone(null)}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><Label>Número do cartão</Label>
        <Input value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} placeholder="0000 0000 0000 0000" />
      </div>
      <div className="col-span-2"><Label>Nome no cartão</Label>
        <Input value={form.cardholderName} onChange={(e) => setForm({ ...form, cardholderName: e.target.value })} />
      </div>
      <div><Label>Mês</Label><Input value={form.expMonth} onChange={(e) => setForm({ ...form, expMonth: e.target.value })} placeholder="MM" /></div>
      <div><Label>Ano</Label><Input value={form.expYear} onChange={(e) => setForm({ ...form, expYear: e.target.value })} placeholder="AAAA" /></div>
      <div><Label>CVV</Label><Input value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} /></div>
      <div><Label>Parcelas</Label>
        <Input type="number" min={1} max={12} value={form.installments}
          onChange={(e) => setForm({ ...form, installments: Number(e.target.value) })} />
      </div>
      <div><Label>Tipo doc.</Label>
        <Input value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })} placeholder="CPF" />
      </div>
      <div><Label>Documento</Label>
        <Input value={form.docNumber} onChange={(e) => setForm({ ...form, docNumber: e.target.value })} placeholder="000.000.000-00" />
      </div>
      <div className="col-span-2">
        <Button onClick={pay} disabled={loading || !mpReady} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pagar agora"}
        </Button>
      </div>
    </div>
  );
}
