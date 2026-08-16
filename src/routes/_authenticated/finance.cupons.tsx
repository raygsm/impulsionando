import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { BadgePercent, Loader2, Search, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createCustomerCoupon, fetchCouponBI, listCustomerCoupons, searchCouponCustomers, setCustomerCouponStatus } from "@/lib/customer-coupons.functions";

export const Route = createFileRoute("/_authenticated/finance/cupons")({
  head: () => ({ meta: [{ title: "Cupons e Descontos — Financeiro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CouponsPage,
});

const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);

type Customer = { user_id: string; display_name: string; cpf_masked?: string | null; email?: string | null; contact_id?: string | null };

function CouponsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCustomerCoupons);
  const biFn = useServerFn(fetchCouponBI);
  const searchFn = useServerFn(searchCouponCustomers);
  const createFn = useServerFn(createCustomerCoupon);
  const statusFn = useServerFn(setCustomerCouponStatus);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [serviceRef, setServiceRef] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [original, setOriginal] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED_PRICE">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [validity, setValidity] = useState<"INDETERMINATE" | "DAYS_30">("DAYS_30");
  const [reason, setReason] = useState("");

  const coupons = useQuery({ queryKey: ["customer-coupons"], queryFn: () => listFn(), staleTime: 30_000 });
  const bi = useQuery({ queryKey: ["coupon-bi"], queryFn: () => biFn({ data: { from: null, to: null } }), staleTime: 30_000 });
  const customers = useQuery({
    queryKey: ["coupon-customer-search", query],
    queryFn: () => searchFn({ data: { query } }),
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: () => createFn({ data: {
      customerUserId: selected!.user_id,
      contactId: selected?.contact_id ?? null,
      serviceRef: serviceRef.trim(),
      serviceName: serviceName.trim(),
      originalPriceCents: Math.round(Number(original.replace(",", ".")) * 100),
      discountType,
      discountValue: discountType === "PERCENT" ? Number(discountValue.replace(",", ".")) : Math.round(Number(discountValue.replace(",", ".")) * 100),
      validityType: validity,
      reason: reason.trim() || null,
    } }),
    onSuccess: () => {
      toast.success("Cupom criado. A jornada automática de comunicação foi registrada.");
      setSelected(null); setQuery(""); setServiceRef(""); setServiceName(""); setOriginal(""); setDiscountValue(""); setReason("");
      qc.invalidateQueries({ queryKey: ["customer-coupons"] });
      qc.invalidateQueries({ queryKey: ["coupon-bi"] });
    },
    onError: (e: Error) => toast.error(e.message.includes("customer_must_be_registered") ? "O desconto só pode ser concedido a cliente/paciente cadastrado." : e.message),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { couponId: string; status: "ACTIVE" | "SUSPENDED" | "REVOKED" }) => statusFn({ data: { ...v, reason: null } }),
    onSuccess: () => { toast.success("Status atualizado e aviso automático registrado."); qc.invalidateQueries({ queryKey: ["customer-coupons"] }); qc.invalidateQueries({ queryKey: ["coupon-bi"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (coupons.data ?? []) as any[];
  const dashboard = (bi.data ?? {}) as any;
  const finalPreview = useMemo(() => {
    const base = Math.round(Number(original.replace(",", ".")) * 100);
    const value = Number(discountValue.replace(",", "."));
    if (!Number.isFinite(base) || !Number.isFinite(value)) return null;
    return discountType === "PERCENT" ? Math.max(0, Math.round(base * (1 - value / 100))) : Math.max(0, Math.round(value * 100));
  }, [original, discountValue, discountType]);

  const validForm = !!selected && serviceRef.trim() && serviceName.trim() && Number(original.replace(",", ".")) >= 0 && Number(discountValue.replace(",", ".")) >= 0 && (discountType !== "PERCENT" || (Number(discountValue.replace(",", ".")) > 0 && Number(discountValue.replace(",", ".")) <= 100));

  return <div className="space-y-6 p-6">
    <div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Financeiro · recurso nativo do Core</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Cupons e descontos nominais</h1><p className="mt-2 max-w-3xl text-muted-foreground">Conceda desconto somente a clientes já cadastrados. A criação e alteração são restritas a Master/Admin e Financeiro; todo evento fica registrado e alimenta os relatórios.</p></div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Kpi label="Cupons" value={dashboard.total_coupons ?? 0} />
      <Kpi label="Ativos" value={dashboard.active_coupons ?? 0} />
      <Kpi label="Clientes beneficiados" value={dashboard.customers_with_coupon ?? 0} />
      <Kpi label="Desconto concedido" value={money(dashboard.nominal_discount_cents ?? 0)} />
      <Kpi label="Desconto efetivamente usado" value={money(dashboard.applied_discount_cents ?? 0)} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BadgePercent className="h-5 w-5" /> Novo desconto</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><Label>Cliente/paciente cadastrado</Label><div className="mt-1 flex gap-2"><Input value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} placeholder="Busque por nome ou CPF" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>
          {customers.isFetching && <div className="mt-2 text-xs text-muted-foreground"><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Buscando…</div>}
          {!selected && query.length >= 2 && <div className="mt-2 max-h-48 overflow-auto rounded-lg border">{((customers.data ?? []) as Customer[]).map((c) => <button key={c.user_id} type="button" onClick={() => { setSelected(c); setQuery(c.display_name); }} className="block w-full border-b p-3 text-left text-sm last:border-0 hover:bg-muted/50"><div className="font-medium">{c.display_name}</div><div className="text-xs text-muted-foreground">{[c.cpf_masked,c.email].filter(Boolean).join(" · ")}</div></button>)}</div>}
          {selected && <Badge className="mt-2">Selecionado: {selected.display_name}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Referência do serviço</Label><Input value={serviceRef} onChange={(e) => setServiceRef(e.target.value)} placeholder="consulta-hepatologia" /></div><div><Label>Nome do serviço</Label><Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Consulta — Hepatologia" /></div></div>
        <div><Label>Preço original (R$)</Label><Input inputMode="decimal" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="1200,00" /></div>
        <div><Label>Tipo de desconto</Label><div className="mt-1 grid grid-cols-2 gap-2"><Button type="button" variant={discountType === "PERCENT" ? "default" : "outline"} onClick={() => setDiscountType("PERCENT")}>Percentual</Button><Button type="button" variant={discountType === "FIXED_PRICE" ? "default" : "outline"} onClick={() => setDiscountType("FIXED_PRICE")}>Preço fixo final</Button></div></div>
        <div><Label>{discountType === "PERCENT" ? "Desconto (%)" : "Preço final (R$)"}</Label><Input inputMode="decimal" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "PERCENT" ? "10" : "900,00"} />{finalPreview != null && <div className="mt-1 text-xs text-muted-foreground">Preço final previsto: <strong>{money(finalPreview)}</strong></div>}</div>
        <div><Label>Validade</Label><div className="mt-1 grid grid-cols-2 gap-2"><Button type="button" variant={validity === "DAYS_30" ? "default" : "outline"} onClick={() => setValidity("DAYS_30")}>30 dias</Button><Button type="button" variant={validity === "INDETERMINATE" ? "default" : "outline"} onClick={() => setValidity("INDETERMINATE")}>Indeterminado</Button></div></div>
        <div><Label>Motivo/observação</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Opcional" /></div>
        <Button className="w-full" disabled={!validForm || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar cupom nominal</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Histórico e controle</CardTitle></CardHeader><CardContent>
        {coupons.isLoading ? <div className="text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Carregando…</div> : rows.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Nenhum cupom criado.</div> : <div className="space-y-3">{rows.map((c) => <div key={c.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{c.service_name_snapshot}</div><div className="mt-1 text-xs text-muted-foreground">Cliente: {String(c.customer_user_id).slice(0,8)}… · criado em {new Date(c.created_at).toLocaleDateString("pt-BR")}</div></div><Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge></div><div className="mt-3 grid gap-1 text-sm sm:grid-cols-3"><span>Original: {money(c.original_price_cents)}</span><span>{c.discount_type === "PERCENT" ? `Desconto: ${c.discount_percent}%` : `Preço fixo: ${money(c.fixed_price_cents)}`}</span><span>Validade: {c.validity_type === "INDETERMINATE" ? "Indeterminada" : c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "30 dias"}</span></div><div className="mt-3 flex flex-wrap gap-2">{c.status === "ACTIVE" && <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ couponId: c.id, status: "SUSPENDED" })}><PauseCircle className="mr-1 h-4 w-4" />Suspender</Button>}{c.status === "SUSPENDED" && <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ couponId: c.id, status: "ACTIVE" })}><PlayCircle className="mr-1 h-4 w-4" />Reativar</Button>}{c.status !== "REVOKED" && <Button size="sm" variant="ghost" onClick={() => statusMutation.mutate({ couponId: c.id, status: "REVOKED" })}><XCircle className="mr-1 h-4 w-4" />Revogar</Button>}</div></div>)}</div>}
      </CardContent></Card>
    </div>

    <Card><CardContent className="pt-6 text-sm text-muted-foreground"><strong>Relatórios/BI:</strong> os indicadores acima são derivados do histórico auditável de cupons e aplicações. O backend mantém total de clientes beneficiados, descontos nominais, descontos efetivamente aplicados, quantidade de utilizações e estados ativo/suspenso/expirado/revogado, com suporte a filtro temporal pela camada de relatório.</CardContent></Card>
  </div>;
}

function Kpi({ label, value }: { label: string; value: string | number }) { return <Card><CardContent className="pt-5"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></CardContent></Card>; }
