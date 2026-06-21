import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { getPaymentStatus } from "@/lib/mercadopago.functions";

const SearchSchema = z.object({
  payment_id: z.string().optional(),
  status: z.string().optional(),
  collection_id: z.string().optional(),
  collection_status: z.string().optional(),
});

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Pagamento confirmado | Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const search = useSearch({ from: "/checkout/success" });
  const fetchStatus = useServerFn(getPaymentStatus);
  const [status, setStatus] = useState<string>("loading");
  const [checking, setChecking] = useState(false);

  const paymentId = search.payment_id ?? search.collection_id ?? null;

  async function refresh() {
    if (!paymentId) {
      setStatus("unknown");
      return;
    }
    try {
      const r = await fetchStatus({ data: { payment_id: paymentId } });
      const s = (r as any)?.status ?? search.collection_status ?? search.status ?? "pending";
      setStatus(s === "approved" ? "paid" : s);
    } catch {
      setStatus(search.collection_status === "approved" ? "paid" : "pending");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  async function handleCheck() {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  }

  const isPaid = status === "paid";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isPaid ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
          {isPaid ? <CheckCircle2 className="w-9 h-9" /> : <Clock className="w-9 h-9" />}
        </div>
        <h1 className="text-3xl font-bold">
          {isPaid ? "Pagamento confirmado!" : "Pagamento recebido ou em confirmação"}
        </h1>
        <p className="text-muted-foreground">
          {isPaid
            ? "Sua assinatura foi ativada. Em instantes você recebe os acessos por e-mail e WhatsApp."
            : "Estamos aguardando a confirmação automática do pagamento pelo Mercado Pago. Assim que confirmado, seu acesso é liberado."}
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          {!isPaid && paymentId && (
            <Button onClick={handleCheck} disabled={checking} variant="default">
              {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : "Verificar pagamento"}
            </Button>
          )}
          {isPaid && (
            <Button asChild variant="default">
              <Link to="/onboarding">Configurar minha conta</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/">Voltar ao site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
