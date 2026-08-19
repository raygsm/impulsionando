import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock3, CheckCircle2, CreditCard, QrCode, Receipt, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chrismed/profissional/repasses")({
  component: ChrismedProfessionalPayoutCountdown,
  head: () => ({ meta: [{ title: "Repasses — Profissional da Saúde | CHRISMED" }] }),
});

type Receivable = {
  payment_id: string;
  appointment_id: string;
  amount_cents: number;
  payment_method: string;
  approved_at: string;
  eligible_at: string;
  matured: boolean;
};

type Dashboard = {
  professional?: { name?: string };
  reference_month?: string;
  invoice?: { status?: string };
  eligibility?: {
    receivables?: Receivable[];
    matured_amount_cents?: number;
    unmatured_amount_cents?: number;
    can_prepare_payout?: boolean;
    invoice_ok?: boolean;
  };
  wallet?: { unsettled_balance_cents?: number };
  policy?: { pix_maturity_days?: number; card_maturity_days?: number; invoice_required?: boolean };
};

function money(cents = 0) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
}

function remaining(eligibleAt: string, now: number) {
  const ms = new Date(eligibleAt).getTime() - now;
  if (ms <= 0) return "LIBERADO";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function ChrismedProfessionalPayoutCountdown() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: result, error } = await (supabase as any).rpc("chrismed_get_my_professional_finance_dashboard", {});
    if (error) {
      toast.error("Não foi possível carregar seus repasses.");
      setLoading(false);
      return;
    }
    setData((result ?? {}) as Dashboard);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const ticker = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = window.setInterval(() => void load(), 60000);
    return () => {
      window.clearInterval(ticker);
      window.clearInterval(refresh);
    };
  }, []);

  const receivables = useMemo(
    () => [...(data?.eligibility?.receivables ?? [])].sort((a, b) => new Date(a.eligible_at).getTime() - new Date(b.eligible_at).getTime()),
    [data],
  );

  if (loading) return <main className="min-h-screen bg-[#F7F3EA] p-8 text-center">Carregando repasses CHRISMED…</main>;

  const eligibility = data?.eligibility ?? {};
  const invoiceOk = Boolean(eligibility.invoice_ok);

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-8 text-[#071C18] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-[#071C18] p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e4b54a]">Financeiro do profissional</p>
          <h1 className="mt-2 text-3xl font-bold">Relógio de repasses CHRISMED</h1>
          <p className="mt-2 max-w-3xl text-white/75">Cada recebível mostra, em tempo real, quanto falta para atingir a maturidade financeira. PIX segue D7 e cartão segue D37, conforme a política vigente.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><WalletCards className="mb-3 h-5 w-5 text-[#078f8b]"/><p className="text-xs text-muted-foreground">Maduros</p><p className="mt-1 text-xl font-bold">{money(eligibility.matured_amount_cents)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><Clock3 className="mb-3 h-5 w-5 text-[#078f8b]"/><p className="text-xs text-muted-foreground">A maturar</p><p className="mt-1 text-xl font-bold">{money(eligibility.unmatured_amount_cents)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><Receipt className="mb-3 h-5 w-5 text-[#078f8b]"/><p className="text-xs text-muted-foreground">Nota fiscal</p><p className="mt-1 text-xl font-bold">{invoiceOk ? "OK" : "PENDENTE"}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><CheckCircle2 className="mb-3 h-5 w-5 text-[#078f8b]"/><p className="text-xs text-muted-foreground">Repasse elegível</p><p className="mt-1 text-xl font-bold">{eligibility.can_prepare_payout ? "SIM" : "NÃO"}</p></CardContent></Card>
        </section>

        <Card>
          <CardHeader><CardTitle>Contagem regressiva por recebível</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!receivables.length && <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há recebíveis neste período.</p>}
            {receivables.map((item) => {
              const pix = item.payment_method?.toLowerCase() === "pix";
              const released = new Date(item.eligible_at).getTime() <= now;
              return (
                <div key={item.payment_id} className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1.2fr_1fr_1.4fr_auto] md:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf8f7] text-[#078f8b]">{pix ? <QrCode className="h-5 w-5"/> : <CreditCard className="h-5 w-5"/>}</span>
                    <div><strong>{pix ? "PIX — D7" : "Cartão — D37"}</strong><p className="text-xs text-muted-foreground">{money(item.amount_cents)}</p></div>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Pagamento aprovado</p><p className="text-sm font-medium">{new Date(item.approved_at).toLocaleString("pt-BR")}</p></div>
                  <div><p className="text-xs text-muted-foreground">{released ? "Maturidade atingida" : "Falta para maturidade"}</p><p className={`font-mono text-lg font-bold ${released ? "text-emerald-700" : "text-[#075c59]"}`}>{remaining(item.eligible_at, now)}</p><p className="text-xs text-muted-foreground">Elegível em {new Date(item.eligible_at).toLocaleString("pt-BR")}</p></div>
                  <Badge variant={released ? "default" : "secondary"}>{released ? "LIBERADO" : "EM CONTAGEM"}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {!invoiceOk && (
          <Card className="border-amber-300 bg-amber-50"><CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"><div><strong>Atenção à nota fiscal</strong><p className="text-sm text-amber-950/75">A maturidade financeira não substitui a exigência fiscal. Sem NF válida do período, a preparação do repasse permanece bloqueada.</p></div><Link to="/chrismed/profissional/financeiro"><Button>Enviar/consultar NF</Button></Link></CardContent></Card>
        )}

        <div className="flex flex-wrap gap-3"><Link to="/agenda/profissional"><Button variant="outline">Voltar à agenda</Button></Link><Link to="/chrismed/profissional/financeiro"><Button variant="outline">Financeiro completo</Button></Link></div>
      </div>
    </main>
  );
}
