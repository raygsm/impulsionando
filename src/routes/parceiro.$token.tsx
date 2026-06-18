import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Beer, Handshake, Send, Megaphone, CalendarCheck } from "lucide-react";
import {
  fetchPartnerPortal, acceptPartnerInvite, submitPartnerSellout,
} from "@/lib/brewery.functions";

export const Route = createFileRoute("/parceiro/$token")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Portal do Bar Parceiro — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Page() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const portalFn = useServerFn(fetchPartnerPortal);
  const acceptFn = useServerFn(acceptPartnerInvite);

  const q = useQuery({
    queryKey: ["partner-portal", token],
    queryFn: () => portalFn({ data: { token } }),
  });

  const acceptMut = useMutation({
    mutationFn: () => acceptFn({ data: { token } }),
    onSuccess: () => { toast.success("Convite aceito! Bem-vindo à parceria."); qc.invalidateQueries({ queryKey: ["partner-portal", token] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  if (q.isLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (!q.data?.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-2">
            <Beer className="w-10 h-10 mx-auto text-muted-foreground" />
            <h1 className="text-lg font-semibold">Link inválido</h1>
            <p className="text-sm text-muted-foreground">Este link de convite não é mais válido. Solicite um novo à cervejaria.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { pdv, brand, campaigns, recentSellouts } = q.data;
  const isPending = pdv.contractStatus === "pending";
  const isActive = pdv.contractStatus === "active";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-3">
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt={brand.name} className="w-12 h-12 rounded object-cover" />
            : <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center"><Beer className="w-6 h-6 text-primary" /></div>}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Portal do Bar Parceiro</div>
            <h1 className="text-lg font-bold">{brand.name}</h1>
          </div>
          <Badge variant={isActive ? "default" : isPending ? "secondary" : "outline"}>
            {isActive ? "Parceria ativa" : isPending ? "Convite pendente" : pdv.contractStatus}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Handshake className="w-4 h-4" />Dados do PDV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><strong>{pdv.name}</strong></div>
            <div className="text-muted-foreground">{[pdv.city, pdv.state].filter(Boolean).join(" — ") || "Localização não informada"}</div>
            {pdv.contactName && <div className="text-muted-foreground">Contato: {pdv.contactName}</div>}
          </CardContent>
        </Card>

        {isPending && (
          <Card className="border-primary">
            <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">Aceite a parceria com {brand.name}</div>
                <p className="text-sm text-muted-foreground">Ao confirmar, seu PDV passa a receber campanhas e cupons da cervejaria.</p>
              </div>
              <Button onClick={() => acceptMut.mutate()} disabled={acceptMut.isPending}>
                <Handshake className="w-4 h-4 mr-2" />{acceptMut.isPending ? "Aceitando…" : "Aceitar convite"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4" />Campanhas ativas ({campaigns.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {campaigns.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma campanha ativa no momento.</p>}
            {campaigns.map((c: any) => (
              <div key={c.id} className="border rounded p-3 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium">{c.name}</div>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{c.starts_at} → {c.ends_at}{c.goal ? ` · ${c.goal}` : ""}</div>
                <div className="flex gap-2 flex-wrap text-xs">
                  {c.voucher_code && <Badge>Cupom: {c.voucher_code}</Badge>}
                  {c.kpi_target_units && <span className="text-muted-foreground">Meta: {c.kpi_target_units} un</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <SelloutForm token={token} disabled={!isActive} campaigns={campaigns} onSaved={() => qc.invalidateQueries({ queryKey: ["partner-portal", token] })} />

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="w-4 h-4" />Sell-out enviado</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Período</TableHead><TableHead className="text-right">Un</TableHead><TableHead className="text-right">Receita</TableHead><TableHead>Cupom</TableHead><TableHead className="text-right">Resgates</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {recentSellouts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Nenhum envio ainda.</TableCell></TableRow>}
                {recentSellouts.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">{s.period_start} → {s.period_end}</TableCell>
                    <TableCell className="text-right">{s.units}</TableCell>
                    <TableCell className="text-right">{brl(Number(s.gross_revenue_cents ?? 0))}</TableCell>
                    <TableCell className="text-xs">{s.voucher_code ?? "—"}</TableCell>
                    <TableCell className="text-right">{s.coupon_redemptions ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground text-center pb-4">Impulsionando · Portal do parceiro · acesso por convite</p>
      </main>
    </div>
  );
}

function SelloutForm({ token, disabled, campaigns, onSaved }: { token: string; disabled: boolean; campaigns: any[]; onSaved: () => void }) {
  const submitFn = useServerFn(submitPartnerSellout);
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
  const [f, setF] = useState({
    periodStart: weekAgo, periodEnd: today,
    units: 0, gross: "0,00",
    voucherCode: "", couponRedemptions: 0,
    campaignId: "", notes: "",
  });

  const mut = useMutation({
    mutationFn: () => submitFn({ data: {
      token,
      periodStart: f.periodStart, periodEnd: f.periodEnd,
      units: Number(f.units) || 0,
      grossRevenueCents: Math.round(Number((f.gross || "0").replace(",", ".")) * 100),
      voucherCode: f.voucherCode || undefined,
      couponRedemptions: Number(f.couponRedemptions) || 0,
      campaignId: f.campaignId || undefined,
      notes: f.notes || undefined,
    } }),
    onSuccess: () => {
      toast.success("Sell-out semanal enviado!");
      setF((s) => ({ ...s, units: 0, gross: "0,00", couponRedemptions: 0, notes: "" }));
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao enviar"),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="w-4 h-4" />Enviar sell-out semanal</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {disabled && <p className="text-xs text-muted-foreground">Aceite o convite acima para liberar o envio de sell-out.</p>}
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Início</Label><Input type="date" value={f.periodStart} onChange={(e) => setF({ ...f, periodStart: e.target.value })} disabled={disabled} /></div>
          <div><Label className="text-xs">Fim</Label><Input type="date" value={f.periodEnd} onChange={(e) => setF({ ...f, periodEnd: e.target.value })} disabled={disabled} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Unidades vendidas</Label><Input type="number" min={0} value={f.units} onChange={(e) => setF({ ...f, units: Number(e.target.value || 0) })} disabled={disabled} /></div>
          <div><Label className="text-xs">Receita bruta (R$)</Label><Input inputMode="decimal" value={f.gross} onChange={(e) => setF({ ...f, gross: e.target.value })} disabled={disabled} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Cupom usado (opcional)</Label><Input value={f.voucherCode} onChange={(e) => setF({ ...f, voucherCode: e.target.value.toUpperCase() })} disabled={disabled} placeholder="IPA20" /></div>
          <div><Label className="text-xs">Resgates do cupom</Label><Input type="number" min={0} value={f.couponRedemptions} onChange={(e) => setF({ ...f, couponRedemptions: Number(e.target.value || 0) })} disabled={disabled} /></div>
        </div>
        <div>
          <Label className="text-xs">Campanha vinculada (opcional)</Label>
          <Select value={f.campaignId || "none"} onValueChange={(v) => setF({ ...f, campaignId: v === "none" ? "" : v })} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem campanha</SelectItem>
              {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Observações</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} disabled={disabled} /></div>
        <Button onClick={() => mut.mutate()} disabled={disabled || mut.isPending} className="w-full">
          <Send className="w-4 h-4 mr-2" />{mut.isPending ? "Enviando…" : "Enviar sell-out"}
        </Button>
      </CardContent>
    </Card>
  );
}
