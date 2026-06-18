import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveCompany } from "@/hooks/use-active-company";
import { toast } from "sonner";
import { seedDemoEmagrecedor } from "@/lib/affiliates.functions";
import { PLATFORM_FEE_PCT } from "@/lib/affiliates.constants";
import {
  Boxes, Handshake, Users2, Briefcase, ShoppingCart, Banknote, Percent, BadgeDollarSign, Sparkles,
} from "lucide-react";
import { PlanGate } from "@/components/app/PlanGate";

export const Route = createFileRoute("/_authenticated/affiliates/")({
  component: AffiliatesGated,
});

function AffiliatesGated() {
  return (
    <PlanGate moduleName="Afiliados & Indicações" allowedTiers={["profissional", "completo"]}>
      <AffiliatesDashboard />
    </PlanGate>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Boxes; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function AffiliatesDashboard() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const seedFn = useServerFn(seedDemoEmagrecedor);
  const seed = useMutation({
    mutationFn: () => seedFn({ data: { company_id: companyId! } }),
    onSuccess: () => {
      toast.success("Produto demo 'Super Emagrecedor Premium' criado com 3 planos, bump, upsell e régua de CRM");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const { data } = useQuery({
    queryKey: ["aff-dashboard", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const c = (t: string, extra?: Record<string, unknown>) =>
        supabase.from(t as never).select("*", { count: "exact", head: true }).eq("company_id", companyId!).match(extra ?? {});
      const sumNet = supabase.from("aff_sales").select("net_amount").eq("company_id", companyId!);
      const commPending = supabase.from("aff_commissions").select("amount").eq("company_id", companyId!)
        .in("status", ["venda_registrada", "aprovado", "aguardando_gateway", "aguardando_prazo_interno"]);
      const commAvail = supabase.from("aff_commissions").select("amount").eq("company_id", companyId!).eq("status", "disponivel");
      const commPaid = supabase.from("aff_commissions").select("amount").eq("company_id", companyId!).eq("status", "pago");

      const [products, offers, affiliates, copro, mgrs, sales, payouts, salesAmt, cP, cA, cPaid] = await Promise.all([
        c("aff_products", { status: "active" }),
        c("aff_offers", { status: "active" }),
        c("aff_affiliates", { status: "aprovado" }),
        c("aff_coproducers"),
        c("aff_managers"),
        c("aff_sales"),
        c("aff_payouts", { status: "solicitado" }),
        sumNet,
        commPending,
        commAvail,
        commPaid,
      ]);
      const sum = (rows: { net_amount?: number; amount?: number }[] | null, k: "net_amount" | "amount") =>
        (rows ?? []).reduce((acc, r) => acc + Number(r[k] ?? 0), 0);
      return {
        products: products.count ?? 0,
        offers: offers.count ?? 0,
        affiliates: affiliates.count ?? 0,
        coproducers: copro.count ?? 0,
        managers: mgrs.count ?? 0,
        sales: sales.count ?? 0,
        payoutsPending: payouts.count ?? 0,
        revenue: sum(salesAmt.data, "net_amount"),
        commPending: sum(cP.data, "amount"),
        commAvail: sum(cA.data, "amount"),
        commPaid: sum(cPaid.data, "amount"),
      };
    },
  });

  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Afiliados e Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada do módulo. Cadastre produtos e ofertas, aprove afiliados, configure splits e acompanhe comissões e saques.
          </p>
        </div>
        <Button onClick={() => seed.mutate()} disabled={seed.isPending || !companyId} variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          Criar produto demo (Emagrecedor)
        </Button>
      </div>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <h2 className="font-medium mb-1">Taxa Impulsionando — {PLATFORM_FEE_PCT}%</h2>
        <p className="text-sm text-muted-foreground">
          A Impulsionando aplica taxa operacional fixa de <strong>{PLATFORM_FEE_PCT}%</strong> sobre o valor bruto de toda transação processada na plataforma —
          Pix, boleto, cartão (à vista e parcelado), order bump, upsell, cross-sell, produtos físicos e digitais, assinaturas e eventos.
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Boxes} label="Produtos ativos" value={data?.products ?? 0} />
        <Stat icon={BadgeDollarSign} label="Ofertas ativas" value={data?.offers ?? 0} />
        <Stat icon={Handshake} label="Afiliados aprovados" value={data?.affiliates ?? 0} />
        <Stat icon={Users2} label="Coprodutores" value={data?.coproducers ?? 0} />
        <Stat icon={Briefcase} label="Gerentes" value={data?.managers ?? 0} />
        <Stat icon={ShoppingCart} label="Vendas registradas" value={data?.sales ?? 0} />
        <Stat icon={Banknote} label="Saques pendentes" value={data?.payoutsPending ?? 0} />
        <Stat icon={Percent} label="Receita líquida" value={brl(data?.revenue ?? 0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat icon={Percent} label="Comissões pendentes" value={brl(data?.commPending ?? 0)} hint="Aguardando aprovação ou prazo" />
        <Stat icon={Percent} label="Disponível para saque" value={brl(data?.commAvail ?? 0)} hint="Já passou o prazo interno" />
        <Stat icon={Percent} label="Comissões pagas" value={brl(data?.commPaid ?? 0)} hint="Repasses concluídos" />
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-2">Como funciona o prazo de liberação</h2>
        <p className="text-sm text-muted-foreground">
          <strong>Valor aprovado ≠ valor disponível.</strong> Toda comissão segue dois prazos somados:
        </p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2 space-y-1">
          <li><strong>Prazo do gateway/operadora</strong> (Pix, crédito, débito, boleto)</li>
          <li><strong>+ 3 dias úteis internos</strong> de processamento</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">Só depois disso a comissão entra em <em>Disponível para saque</em>.</p>
      </Card>
    </div>
  );
}
