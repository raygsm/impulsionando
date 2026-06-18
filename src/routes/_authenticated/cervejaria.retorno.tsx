import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, Ticket, Send } from "lucide-react";
import {
  listMyBreweryBrands, listBreweryCampaigns, fetchBreweryReturnReport,
} from "@/lib/brewery.functions";

export const Route = createFileRoute("/_authenticated/cervejaria/retorno")({
  component: Page,
  head: () => ({ meta: [{ title: "Microcervejaria · Retorno — Impulsionando" }, { name: "robots", content: "noindex" }] }),
});

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Page() {
  const brandsFn = useServerFn(listMyBreweryBrands);
  const campsFn = useServerFn(listBreweryCampaigns);
  const reportFn = useServerFn(fetchBreweryReturnReport);

  const brandsQ = useQuery({ queryKey: ["brewery-brands"], queryFn: () => brandsFn() });
  const brands = brandsQ.data ?? [];
  const [brandId, setBrandId] = useState<string | undefined>();
  const active = brandId ?? brands[0]?.id;
  const [campaignId, setCampaignId] = useState<string>("");
  const [sinceDays, setSinceDays] = useState<number>(90);

  const campsQ = useQuery({
    queryKey: ["brewery-campaigns", active],
    queryFn: () => campsFn({ data: { brandId: active! } }),
    enabled: !!active,
  });
  const reportQ = useQuery({
    queryKey: ["brewery-return", active, campaignId, sinceDays],
    queryFn: () => reportFn({ data: { brandId: active!, campaignId: campaignId || undefined, sinceDays } }),
    enabled: !!active,
  });

  const k = reportQ.data?.kpis;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Retorno por PDV e Cupom</h1>
          <p className="text-sm text-muted-foreground">ROI das campanhas: sell-out por bar parceiro, resgates de cupom e conversão dos disparos.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={active ?? ""} onValueChange={setBrandId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={campaignId || "all"} onValueChange={(v) => setCampaignId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Campanha" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas campanhas</SelectItem>
              {(campsQ.data ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(sinceDays)} onValueChange={(v) => setSinceDays(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />Unidades vendidas</div><div className="text-2xl font-bold">{k?.units ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Receita</div><div className="text-2xl font-bold">{brl(k?.revenue_cents ?? 0)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Ticket className="w-3 h-3" />Resgates de cupom</div><div className="text-2xl font-bold">{k?.redemptions ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Send className="w-3 h-3" />Mensagens disparadas</div><div className="text-2xl font-bold">{k?.enqueued ?? 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Conversão disparo → cupom</div><div className="text-2xl font-bold">{k?.conversionPct != null ? `${k.conversionPct}%` : "—"}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Retorno por PDV</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>PDV</TableHead><TableHead>Cidade</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Resgates</TableHead>
              <TableHead className="text-right">Ticket médio</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(reportQ.data?.byPdv ?? []).length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Sem sell-out no período.</TableCell></TableRow>
              )}
              {(reportQ.data?.byPdv ?? []).map((p: any) => (
                <TableRow key={p.pdv_link_id}>
                  <TableCell className="font-medium">{p.pdv_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.pdv_city ?? "—"}</TableCell>
                  <TableCell className="text-right">{p.units}</TableCell>
                  <TableCell className="text-right">{brl(p.revenue_cents)}</TableCell>
                  <TableCell className="text-right">{p.redemptions}</TableCell>
                  <TableCell className="text-right text-xs">{p.units > 0 ? brl(Math.round(p.revenue_cents / p.units)) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Retorno por Cupom</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Cupom</TableHead>
              <TableHead className="text-right">Resgates</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Receita</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(reportQ.data?.byVoucher ?? []).length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">Nenhum cupom registrado no sell-out.</TableCell></TableRow>
              )}
              {(reportQ.data?.byVoucher ?? []).map((v: any) => (
                <TableRow key={v.voucher_code}>
                  <TableCell><Badge variant="outline">{v.voucher_code}</Badge></TableCell>
                  <TableCell className="text-right">{v.redemptions}</TableCell>
                  <TableCell className="text-right">{v.units}</TableCell>
                  <TableCell className="text-right">{brl(v.revenue_cents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
