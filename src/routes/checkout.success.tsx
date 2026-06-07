import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { checkInfinitePayStatus, getInfinitePayPayment } from "@/lib/infinitepay.functions";

const SearchSchema = z.object({
  order_nsu: z.string().optional(),
  transaction_nsu: z.string().optional(),
  slug: z.string().optional(),
  receipt_url: z.string().optional(),
  capture_method: z.string().optional(),
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
  const checkStatus = useServerFn(checkInfinitePayStatus);
  const getPayment = useServerFn(getInfinitePayPayment);
  const [status, setStatus] = useState<string>("loading");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!search.order_nsu) {
      setStatus("unknown");
      return;
    }
    getPayment({ data: { order_nsu: search.order_nsu } })
      .then((r) => setStatus(r.ok && r.payment ? (r.payment as any).status : "unknown"))
      .catch(() => setStatus("unknown"));
  }, [search.order_nsu]);

  async function handleCheck() {
    if (!search.order_nsu) return;
    setChecking(true);
    try {
      const r = await checkStatus({
        data: {
          order_nsu: search.order_nsu,
          transaction_nsu: search.transaction_nsu,
          slug: search.slug,
        },
      });
      setStatus(r.status);
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
            : "Estamos aguardando a confirmação automática do pagamento pela InfinitePay. Assim que confirmado, seu acesso é liberado."}
        </p>

        {search.receipt_url && (
          <p className="text-sm">
            <a className="underline text-primary" href={search.receipt_url} target="_blank" rel="noreferrer">
              Ver recibo da InfinitePay
            </a>
          </p>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          {!isPaid && search.order_nsu && (
            <Button onClick={handleCheck} disabled={checking} variant="default">
              {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : "Verificar pagamento"}
            </Button>
          )}
          {isPaid && (
            <Button asChild variant="default">
              <Link to="/onboarding">Configurar minha conta</Link>
            </Button>
          )}
          <Button asChild variant={isPaid ? "outline" : "outline"}>
            <Link to="/">Voltar ao site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
