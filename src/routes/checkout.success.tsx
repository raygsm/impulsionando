import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  CheckCircle2, Clock, Loader2, ArrowRight, ShieldCheck, Sparkles,
  Mail, Rocket, Headphones, Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { getPaymentStatus } from "@/lib/mercadopago.functions";
import { cn } from "@/lib/utils";

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

/** Etapas — reflete o mesmo indicador do checkout premium. */
const STEPS = [
  { id: "plano", label: "Plano" },
  { id: "dados", label: "Dados" },
  { id: "pagamento", label: "Pagamento" },
  { id: "revisao", label: "Revisão" },
  { id: "confirmacao", label: "Confirmação" },
] as const;

function SuccessPage() {
  const search = useSearch({ from: "/checkout/success" });
  const fetchStatus = useServerFn(getPaymentStatus);
  const [status, setStatus] = useState<string>("loading");
  const [checking, setChecking] = useState(false);

  const paymentId = search.payment_id ?? search.collection_id ?? null;

  async function refresh() {
    if (!paymentId) { setStatus("unknown"); return; }
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
    try { await refresh(); } finally { setChecking(false); }
  }

  const isPaid = status === "paid";
  const isLoading = status === "loading";

  return (
    <div className="min-h-dvh bg-muted/20">
      {/* Top bar consistente com o checkout */}
      <header className="bg-background border-b border-border sticky top-0 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-sm sm:text-base tracking-tight text-primary" aria-label="Impulsionando — início">
            Impulsionando
          </Link>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            Checkout seguro · SSL
          </div>
        </div>
        {/* Progress bar concluída */}
        <div className="max-w-6xl mx-auto px-4 pb-3 sm:pb-4">
          <ol className="flex items-center gap-1 sm:gap-2" aria-label="Etapas do checkout">
            {STEPS.map((s, idx) => {
              const stepNum = idx + 1;
              const done = stepNum < 5 || isPaid;
              const active = stepNum === 5 && !isPaid;
              return (
                <li key={s.id} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
                  <span
                    className={cn(
                      "shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-semibold border",
                      done && "bg-primary text-primary-foreground border-primary",
                      active && "bg-primary/10 text-primary border-primary",
                      !done && !active && "bg-muted text-muted-foreground border-border",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
                  </span>
                  <span className={cn(
                    "text-[11px] sm:text-xs truncate",
                    (done || active) ? "text-foreground font-medium" : "text-muted-foreground",
                  )}>
                    {s.label}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <span className="hidden sm:block flex-1 h-px bg-border ml-1" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main
        className="max-w-2xl mx-auto px-4 py-10 sm:py-14"
        aria-labelledby="success-heading"
      >
        <Card className="border-border overflow-hidden">
          {/* Header colorido conforme estado */}
          <div className={cn(
            "px-6 sm:px-10 py-10 text-center relative",
            isPaid && "bg-primary/5 border-b border-primary/20",
            !isPaid && !isLoading && "bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900",
            isLoading && "bg-muted/30 border-b border-border",
          )}>
            <div className={cn(
              "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm",
              isPaid && "bg-primary text-primary-foreground",
              !isPaid && !isLoading && "bg-amber-500 text-white",
              isLoading && "bg-muted text-muted-foreground",
            )}>
              {isLoading ? (
                <Loader2 className="w-10 h-10 animate-spin" aria-hidden="true" />
              ) : isPaid ? (
                <CheckCircle2 className="w-11 h-11" aria-hidden="true" />
              ) : (
                <Clock className="w-10 h-10" aria-hidden="true" />
              )}
            </div>
            <h1 id="success-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isLoading
                ? "Verificando pagamento…"
                : isPaid
                  ? "Pagamento confirmado!"
                  : "Aguardando confirmação"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
              {isLoading
                ? "Consultando o status junto ao gateway."
                : isPaid
                  ? "Sua assinatura foi ativada. Em instantes você recebe os acessos por e-mail."
                  : "Estamos aguardando a confirmação automática do Mercado Pago. Assim que confirmado, seu acesso é liberado — pode fechar esta página com segurança."}
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Próximos passos — apenas quando pago */}
            {isPaid && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" /> Próximos passos
                </div>
                <ol className="space-y-3">
                  {[
                    { icon: Mail, t: "Você recebe as credenciais", d: "E-mail com login, senha temporária e link do painel em até 2 minutos." },
                    { icon: Rocket, t: "Onboarding assistido", d: "Fluxo guiado para configurar sua empresa, usuários e primeiros módulos." },
                    { icon: Headphones, t: "Suporte à disposição", d: "Fale com nosso time por WhatsApp ou e-mail sempre que precisar." },
                  ].map((step, i) => {
                    const SIcon = step.icon;
                    return (
                      <li key={step.t} className="flex gap-3">
                        <span
                          className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 font-semibold text-sm">
                            <SIcon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                            {step.t}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {step.d}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* CTAs — dominante quando pago; verificação quando pendente */}
            <div className="flex flex-col sm:flex-row gap-2">
              {isPaid ? (
                <>
                  <Button asChild size="lg" className="min-h-12 flex-1 font-semibold">
                    <Link to="/onboarding">
                      Configurar minha conta <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="min-h-12">
                    <Link to="/">Voltar ao site</Link>
                  </Button>
                </>
              ) : (
                <>
                  {paymentId && (
                    <Button
                      onClick={handleCheck}
                      disabled={checking}
                      size="lg"
                      className="min-h-12 flex-1 font-semibold"
                    >
                      {checking ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando…</>
                      ) : (
                        <>Verificar pagamento <ArrowRight className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  )}
                  <Button asChild variant="outline" size="lg" className="min-h-12">
                    <Link to="/">Voltar ao site</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Trust bar compacta — reforça confiança pós-compra */}
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-primary" aria-hidden="true" /> Sua contratação é protegida
              </div>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  Conforme LGPD
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  Ambiente SSL
                </li>
                <li className="flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  Suporte especializado
                </li>
              </ul>
            </div>

            {paymentId && (
              <p className="text-[11px] text-muted-foreground text-center">
                Referência do pagamento: <span className="font-mono">{paymentId}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
