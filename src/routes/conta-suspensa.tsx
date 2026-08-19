import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBillingStatus } from "@/lib/billing.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CreditCard, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/conta-suspensa")({
  head: () => ({ meta: [{ title: "Regularize sua assinatura — Impulsionando" }] }),
  component: SuspendedPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function SuspendedPage() {
  const { companyId } = useActiveCompany();
  const fn = useServerFn(getMyBillingStatus);
  const { data } = useQuery({
    queryKey: ["my-billing-status", companyId],
    enabled: !!companyId,
    queryFn: () => fn({ data: { companyId } }),
    refetchInterval: 15_000,
  });

  const inv = (data && "openInvoice" in data ? data.openInvoice : null) ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none opacity-25 blur-[2px] grayscale">
        <div className="flex h-16 items-center border-b bg-white px-8 text-xl font-bold tracking-wide">IMPULSIONANDO</div>
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[240px_1fr]">
          <aside className="border-r bg-white p-6 space-y-4">
            {['Gestão','Comunicação','ERP','Growth','Configurações'].map((x) => <div key={x} className="rounded-xl bg-slate-200 px-4 py-3 font-medium">{x}</div>)}
          </aside>
          <main className="p-8">
            <h2 className="text-3xl font-semibold">Dashboard</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[1,2,3,4,5,6].map((x) => <div key={x} className="h-32 rounded-2xl border bg-white" />)}
            </div>
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
                <div className="text-right"><div className="text-xs text-muted-foreground">Vencimento</div><div className="mt-1 font-semibold">{new Date(inv.due_date).toLocaleDateString("pt-BR")}</div></div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border bg-muted/25 p-5 text-center text-sm text-muted-foreground">Carregando a fatura pendente…</div>
          )}

          <div className="mt-5 grid gap-3">
            {inv?.pix_copy_paste ? (
              <Button size="lg" className="h-12 justify-center gap-2" onClick={() => { navigator.clipboard.writeText(inv.pix_copy_paste ?? ""); toast.success("PIX copia e cola copiado"); }}>
                <QrCode className="h-4 w-4" /> Pagar com Pix
              </Button>
            ) : null}

            {inv?.pix_copy_paste ? (
              <button type="button" onClick={() => { navigator.clipboard.writeText(inv.pix_copy_paste ?? ""); toast.success("PIX copia e cola copiado"); }} className="flex items-center justify-between rounded-xl border bg-background p-3 text-left text-xs hover:bg-muted/30">
                <span className="min-w-0 pr-3"><span className="block font-semibold">PIX copia e cola</span><span className="mt-1 block truncate text-muted-foreground">{inv.pix_copy_paste}</span></span><Copy className="h-4 w-4 shrink-0" />
              </button>
            ) : null}

            <Button size="lg" variant="outline" className="h-12 gap-2" disabled title="Checkout de cartão será liberado após homologação E2E do fluxo de cobrança recorrente.">
              <CreditCard className="h-4 w-4" /> Cartão de crédito — em homologação
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <span>A confirmação do pagamento é acompanhada automaticamente. Assim que a baixa for reconhecida, o acesso é reativado sem necessidade de abrir chamado.</span>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">Seu restante do Core permanece protegido e indisponível enquanto houver suspensão.</div>
          <div className="mt-5 flex justify-center"><Button asChild variant="ghost" size="sm"><Link to="/auth">Sair da conta</Link></Button></div>
        </Card>
      </div>
    </div>
  );
}
