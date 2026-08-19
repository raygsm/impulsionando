import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getMyBillingStatus } from "@/lib/billing.functions";
import { getBillingPaymentPublicConfig } from "@/lib/billing-payment-config.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CreditCard, Loader2, LockKeyhole, QrCode, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/conta-suspensa")({
  head: () => ({ meta: [{ title: "Regularize sua assinatura — Impulsionando" }] }),
  component: SuspendedPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type PixPayment = {
  pix_copy_paste: string | null;
  pix_qr_code_base64: string | null;
  payment_id: string | null;
  status: string | null;
};

type MpCardFormData = {
  paymentMethodId?: string;
  issuerId?: string;
  cardholderEmail?: string;
  token?: string;
  installments?: string | number;
  identificationNumber?: string;
  identificationType?: string;
};

type MpCardForm = {
  getCardFormData: () => MpCardFormData;
  unmount?: () => void;
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      cardForm: (config: Record<string, unknown>) => MpCardForm;
    };
  }
}

function loadMercadoPagoSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-impulsionando-mp-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("MercadoPago.js indisponível")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.dataset.impulsionandoMpSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("MercadoPago.js indisponível"));
    document.head.appendChild(script);
  });
}

function SuspendedPage() {
  const { companyId } = useActiveCompany();
  const billingFn = useServerFn(getMyBillingStatus);
  const paymentConfigFn = useServerFn(getBillingPaymentPublicConfig);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creatingPix, setCreatingPix] = useState(false);
  const [pix, setPix] = useState<PixPayment | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [payerEmail, setPayerEmail] = useState("");
  const cardFormRef = useRef<MpCardForm | null>(null);

  const { data } = useQuery({
    queryKey: ["my-billing-status", companyId],
    enabled: !!companyId,
    queryFn: () => billingFn({ data: { companyId } }),
    refetchInterval: 10_000,
  });

  const { data: paymentConfig } = useQuery({
    queryKey: ["billing-payment-public-config"],
    queryFn: () => paymentConfigFn(),
    staleTime: 10 * 60_000,
  });

  const inv = (data && "openInvoice" in data ? data.openInvoice : null) ?? null;
  const contract = (data && "contract" in data ? data.contract : null) ?? null;

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: auth }) => setPayerEmail(auth.user?.email ?? ""));
  }, []);

  useEffect(() => {
    if (contract && contract.status !== "suspended") {
      toast.success("Pagamento reconhecido. Seu acesso foi reativado.");
      navigate({ to: "/dashboard" });
    }
  }, [contract, navigate]);

  useEffect(() => {
    if (!showCard || !inv?.id || !inv.amount || !paymentConfig?.publicKey) return;
    let cancelled = false;

    const initialize = async () => {
      try {
        setCardReady(false);
        await loadMercadoPagoSdk();
        if (cancelled || !window.MercadoPago) return;
        const mp = new window.MercadoPago(paymentConfig.publicKey, { locale: "pt-BR" });
        const cardForm = mp.cardForm({
          amount: String(Number(inv.amount).toFixed(2)),
          iframe: true,
          form: {
            id: "billing-card-form",
            cardNumber: { id: "billing-card-number", placeholder: "Número do cartão" },
            expirationDate: { id: "billing-card-expiration", placeholder: "MM/AA" },
            securityCode: { id: "billing-card-security", placeholder: "CVV" },
            cardholderName: { id: "billing-card-holder", placeholder: "Nome impresso no cartão" },
            issuer: { id: "billing-card-issuer", placeholder: "Banco emissor" },
            installments: { id: "billing-card-installments", placeholder: "Parcelas" },
            identificationType: { id: "billing-card-document-type", placeholder: "Documento" },
            identificationNumber: { id: "billing-card-document", placeholder: "CPF/CNPJ" },
            cardholderEmail: { id: "billing-card-email", placeholder: "E-mail" },
          },
          callbacks: {
            onFormMounted: (error: unknown) => {
              if (error) {
                console.error("[billing-card] mount", error);
                toast.error("Não foi possível carregar o pagamento por cartão.");
                return;
              }
              setCardReady(true);
            },
            onSubmit: async (event: Event) => {
              event.preventDefault();
              if (cardSubmitting) return;
              const formData = cardForm.getCardFormData();
              if (!formData.token || !formData.paymentMethodId) {
                toast.error("Revise os dados do cartão antes de continuar.");
                return;
              }
              setCardSubmitting(true);
              try {
                const { data: result, error } = await supabase.functions.invoke("billing-create-payment", {
                  body: {
                    invoice_id: inv.id,
                    payment_method: "credit_card",
                    token: formData.token,
                    payment_method_id: formData.paymentMethodId,
                    issuer_id: formData.issuerId || undefined,
                    installments: Math.max(1, Number(formData.installments || 1)),
                    identification: formData.identificationType && formData.identificationNumber
                      ? { type: formData.identificationType, number: formData.identificationNumber }
                      : undefined,
                  },
                });
                if (error) throw error;
                if (!result?.ok) throw new Error(result?.error || "Pagamento não processado");

                if (result.status === "approved") {
                  toast.success("Pagamento aprovado. Reativando seu acesso…");
                  await queryClient.invalidateQueries({ queryKey: ["my-billing-status", companyId] });
                } else if (result.status === "pending" || result.status === "in_process") {
                  toast.success("Pagamento recebido e em análise. A reativação ocorrerá automaticamente após a confirmação.");
                } else {
                  toast.error("O pagamento não foi aprovado. Você pode revisar os dados e tentar novamente.");
                }
              } catch (error) {
                console.error("[billing-card] payment", error);
                toast.error("Não foi possível concluir o pagamento por cartão. Tente novamente.");
              } finally {
                setCardSubmitting(false);
              }
            },
            onFetching: () => {
              const progress = document.getElementById("billing-card-progress") as HTMLProgressElement | null;
              progress?.removeAttribute("value");
              return () => progress?.setAttribute("value", "0");
            },
          },
        });
        cardFormRef.current = cardForm;
      } catch (error) {
        console.error("[billing-card] sdk", error);
        toast.error("Pagamento por cartão temporariamente indisponível.");
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      try { cardFormRef.current?.unmount?.(); } catch { /* SDK cleanup best-effort */ }
      cardFormRef.current = null;
      setCardReady(false);
    };
  }, [showCard, inv?.id, inv?.amount, paymentConfig?.publicKey, companyId, queryClient]);

  const effectivePix = pix?.pix_copy_paste || inv?.pix_copy_paste || null;
  const qrBase64 = pix?.pix_qr_code_base64 || null;

  async function createPixPayment() {
    if (!inv?.id) return;
    setCreatingPix(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("billing-create-payment", {
        body: { invoice_id: inv.id, payment_method: "pix" },
      });
      if (error) throw error;
      if (!result?.ok) throw new Error(result?.error || "Não foi possível gerar o Pix");
      setPix({
        pix_copy_paste: result.pix_copy_paste ?? result.qr_code ?? null,
        pix_qr_code_base64: result.pix_qr_code_base64 ?? result.qr_code_base64 ?? null,
        payment_id: result.payment_id ?? null,
        status: result.status ?? null,
      });
      toast.success("Pix gerado com segurança para esta fatura.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o Pix agora. Tente novamente.");
    } finally {
      setCreatingPix(false);
    }
  }

  async function copyPix() {
    if (!effectivePix) return;
    await navigator.clipboard.writeText(effectivePix);
    toast.success("Pix copia e cola copiado");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none opacity-25 blur-[2px] grayscale">
        <div className="flex h-16 items-center border-b bg-white px-8 text-xl font-bold tracking-wide">IMPULSIONANDO</div>
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[240px_1fr]">
          <aside className="border-r bg-white p-6 space-y-4">
            {["Gestão", "Comunicação", "ERP", "Growth", "Configurações"].map((x) => <div key={x} className="rounded-xl bg-slate-200 px-4 py-3 font-medium">{x}</div>)}
          </aside>
          <main className="p-8">
            <h2 className="text-3xl font-semibold">Dashboard</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">{[1,2,3,4,5,6].map((x) => <div key={x} className="h-32 rounded-2xl border bg-white" />)}</div>
          </main>
        </div>
      </div>

      <div className="absolute inset-0 bg-white/55 backdrop-blur-[3px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl border-0 p-7 shadow-2xl md:p-9">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700"><LockKeyhole className="h-7 w-7" /></div>
          <div className="mt-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Assinatura Impulsionando</p>
            <h1 className="mt-2 text-2xl font-semibold">Regularize seu acesso</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Identificamos uma mensalidade pendente. Enquanto a assinatura estiver suspensa, somente esta área de pagamento permanece disponível.</p>
          </div>

          {inv ? (
            <div className="mt-6 rounded-2xl border bg-muted/25 p-5">
              <div className="flex items-end justify-between gap-4">
                <div><div className="text-xs text-muted-foreground">Valor pendente</div><div className="mt-1 text-3xl font-bold">{fmt(Number(inv.amount))}</div></div>
                <div className="text-right"><div className="text-xs text-muted-foreground">Vencimento</div><div className="mt-1 font-semibold">{new Date(`${inv.due_date}T12:00:00-03:00`).toLocaleDateString("pt-BR")}</div></div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border bg-muted/25 p-5 text-center text-sm text-muted-foreground">Carregando a fatura pendente…</div>
          )}

          <div className="mt-5 grid gap-3">
            {!effectivePix ? (
              <Button size="lg" className="h-12 justify-center gap-2" disabled={!inv?.id || creatingPix} onClick={createPixPayment}>
                {creatingPix ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} {creatingPix ? "Gerando Pix…" : "Pagar com Pix"}
              </Button>
            ) : (
              <>
                {qrBase64 ? <div className="mx-auto rounded-xl border bg-white p-3"><img alt="QR Code Pix" className="h-48 w-48" src={`data:image/png;base64,${qrBase64}`} /></div> : null}
                <Button size="lg" className="h-12 justify-center gap-2" onClick={copyPix}><Copy className="h-4 w-4" /> Copiar Pix copia e cola</Button>
                <button type="button" onClick={copyPix} className="flex items-center justify-between rounded-xl border bg-background p-3 text-left text-xs hover:bg-muted/30"><span className="min-w-0 pr-3"><span className="block font-semibold">Pix desta fatura</span><span className="mt-1 block truncate text-muted-foreground">{effectivePix}</span></span><Copy className="h-4 w-4 shrink-0" /></button>
              </>
            )}

            {!showCard ? (
              <Button size="lg" variant="outline" className="h-12 gap-2" disabled={!inv?.id || !paymentConfig?.publicKey} onClick={() => setShowCard(true)}>
                <CreditCard className="h-4 w-4" /> Pagar com cartão de crédito
              </Button>
            ) : (
              <div className="rounded-2xl border bg-background p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><div className="font-semibold">Cartão de crédito</div><div className="text-xs text-muted-foreground">Dados protegidos pelo Mercado Pago</div></div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowCard(false)} aria-label="Fechar cartão"><X className="h-4 w-4" /></Button>
                </div>
                <form id="billing-card-form" className="grid gap-3">
                  <div id="billing-card-number" className="h-11 rounded-md border bg-white px-3 py-2" />
                  <div className="grid grid-cols-2 gap-3">
                    <div id="billing-card-expiration" className="h-11 rounded-md border bg-white px-3 py-2" />
                    <div id="billing-card-security" className="h-11 rounded-md border bg-white px-3 py-2" />
                  </div>
                  <input id="billing-card-holder" className="h-11 rounded-md border bg-background px-3 text-sm" placeholder="Nome impresso no cartão" autoComplete="cc-name" />
                  <div className="grid grid-cols-2 gap-3">
                    <select id="billing-card-issuer" className="h-11 rounded-md border bg-background px-3 text-sm"><option value="">Banco emissor</option></select>
                    <select id="billing-card-installments" className="h-11 rounded-md border bg-background px-3 text-sm"><option value="">Parcelas</option></select>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <select id="billing-card-document-type" className="h-11 rounded-md border bg-background px-3 text-sm"><option value="">Documento</option></select>
                    <input id="billing-card-document" className="h-11 rounded-md border bg-background px-3 text-sm" placeholder="CPF/CNPJ" inputMode="numeric" />
                  </div>
                  <input id="billing-card-email" type="email" defaultValue={payerEmail} className="h-11 rounded-md border bg-background px-3 text-sm" placeholder="E-mail" autoComplete="email" />
                  <progress id="billing-card-progress" value="0" className="h-1 w-full" />
                  <Button type="submit" size="lg" className="h-12 gap-2" disabled={!cardReady || cardSubmitting}>
                    {cardSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {cardSubmitting ? "Processando…" : `Pagar ${inv ? fmt(Number(inv.amount)) : ""}`}
                  </Button>
                </form>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <span>O valor é obtido diretamente da fatura no Core. Pix e cartão são processados pelo Mercado Pago; dados sensíveis do cartão não passam pelo servidor da Impulsionando. A baixa reativa o acesso automaticamente.</span>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">Seu restante do Core permanece protegido e indisponível enquanto houver suspensão.</div>
          <div className="mt-5 flex justify-center"><Button asChild variant="ghost" size="sm"><Link to="/auth">Sair da conta</Link></Button></div>
        </Card>
      </div>
    </div>
  );
}
