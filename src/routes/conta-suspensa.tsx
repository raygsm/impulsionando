import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyBillingStatus } from "@/lib/billing.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CreditCard, Loader2, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
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

function SuspendedPage() {
  const { companyId } = useActiveCompany();
  const fn = useServerFn(getMyBillingStatus);
  const navigate = useNavigate();
  const [creatingPix, setCreatingPix] = useState(false);
  const [pix, setPix] = useState<PixPayment | null>(null);

  const { data } = useQuery({
    queryKey: ["my-billing-status", companyId],
    enabled: !!companyId,
    queryFn: () => fn({ data: { companyId } }),
    refetchInterval: 15_000,
  });

  const inv = (data && "openInvoice" in data ? data.openInvoice : null) ?? null;
  const contract = (data && "contract" in data ? data.contract : null) ?? null;

  useEffect(() => {
    if (contract && contract.status !== "suspended") {
      toast.success("Pagamento reconhecido. Seu acesso foi reativado.");
      navigate({ to: "/dashboard" });
    }
  }, [contract, navigate]);

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
        pix_copy_paste: result.pix_copy_paste ?? null,
        pix_qr_code_base64: result.pix_qr_code_base64 ?? null,
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
        <Card className="w-full max-w-lg border-0 p-7 shadow-2xl md:p-9">
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

            <Button size="lg" variant="outline" className="h-12 gap-2" disabled title="Tokenização transparente de cartão permanece bloqueada até o teste E2E com SDK Mercado Pago.">
              <CreditCard className="h-4 w-4" /> Cartão de crédito — validação final
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <span>O valor é obtido diretamente da fatura no Core. A confirmação é acompanhada automaticamente e o acesso é reativado assim que o Mercado Pago confirmar a baixa.</span>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">Seu restante do Core permanece protegido e indisponível enquanto houver suspensão.</div>
          <div className="mt-5 flex justify-center"><Button asChild variant="ghost" size="sm"><Link to="/auth">Sair da conta</Link></Button></div>
        </Card>
      </div>
    </div>
  );
}
