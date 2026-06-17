/**
 * /clube — Área do consumidor logado.
 * Mostra plano (free/premium), faturas, favoritos. Permite virar Premium (R$9,99) e cancelar.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getMyConsumerArea, upsertConsumerProfile, upgradeToPremium, cancelPremium } from "@/lib/consumer.functions";
import { Crown, Sparkles, Heart, Receipt, Copy, AlertCircle, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clube")({
  component: ClubePage,
});

const BRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ClubePage() {
  const qc = useQueryClient();
  const fetchArea = useServerFn(getMyConsumerArea);
  const upsertFn = useServerFn(upsertConsumerProfile);
  const upgradeFn = useServerFn(upgradeToPremium);
  const cancelFn = useServerFn(cancelPremium);

  const area = useQuery({ queryKey: ["consumer-area"], queryFn: () => fetchArea() });
  const [form, setForm] = useState({ full_name: "", phone: "", whatsapp: "", city: "", state: "" });

  // sync once
  if (area.data?.profile && !form.full_name) {
    const p = area.data.profile;
    setForm({ full_name: p.full_name ?? "", phone: p.phone ?? "", whatsapp: p.whatsapp ?? "", city: p.city ?? "", state: p.state ?? "" });
  }

  const membership = area.data?.membership;
  const isPremium = membership?.plan === "premium" && membership?.status === "active";
  const isPending = membership?.plan === "premium" && membership?.status === "pending";

  async function handleSave() {
    try {
      await upsertFn({ data: { ...form, marketing_optin: true } });
      toast.success("Perfil salvo");
      qc.invalidateQueries({ queryKey: ["consumer-area"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleUpgrade() {
    try {
      const r = await upgradeFn();
      toast.success(`Plano Premium criado! Fatura de ${BRL(r.amount_cents)} gerada.`);
      qc.invalidateQueries({ queryKey: ["consumer-area"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleCancel() {
    if (!confirm("Cancelar renovação ao fim do período atual?")) return;
    try { await cancelFn(); toast.success("Cancelamento agendado"); qc.invalidateQueries({ queryKey: ["consumer-area"] }); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Badge className={isPremium ? "bg-gradient-primary mb-2" : "mb-2"}>
            {isPremium ? <><Crown className="w-3 h-3 mr-1" /> Premium ativo</> : <><Sparkles className="w-3 h-3 mr-1" /> Clube Impulsionando</>}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Minha área Consumidor</h1>
          <p className="text-sm text-muted-foreground">Benefícios, faturas e parceiros favoritos.</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/vitrine">Explorar parceiros →</Link></Button>
      </header>

      {!isPremium && (
        <Card className="p-6 bg-gradient-primary text-primary-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Crown className="w-12 h-12 shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Vire Premium por R$ 9,99/mês</h2>
              <p className="text-sm text-white/90 mt-1">Descontos, prioridade em reservas, ofertas exclusivas e cashback nos parceiros da rede.</p>
              {isPending && <p className="text-xs mt-2 bg-white/15 inline-block px-2 py-1 rounded">Aguardando pagamento da 1ª fatura.</p>}
            </div>
            {!isPending && (
              <Button onClick={handleUpgrade} className="bg-white text-primary hover:bg-white/90">Virar Premium agora</Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Meu perfil</h2>
          <div className="space-y-3">
            <div><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>UF</Label><Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
            </div>
            <Button onClick={handleSave} className="w-full">Salvar perfil</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4" /> Minhas faturas</h2>
          {(area.data?.invoices ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem faturas ainda. Vire Premium para ativar o clube.</p>
          ) : (
            <div className="space-y-2">
              {area.data!.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium text-sm">{BRL(inv.amount_cents)}</div>
                    <div className="text-xs text-muted-foreground">Vence em {new Date(inv.due_date).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>{inv.status}</Badge>
                    {inv.status === "open" && inv.pix_copy_paste && (
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(inv.pix_copy_paste); toast.success("PIX copiado"); }}>
                        <Copy className="w-3 h-3 mr-1" /> PIX
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isPremium && !membership?.cancel_at_period_end && (
            <Button onClick={handleCancel} variant="ghost" size="sm" className="w-full mt-3 text-destructive">
              <AlertCircle className="w-3 h-3 mr-1" /> Cancelar renovação
            </Button>
          )}
          {membership?.cancel_at_period_end && (
            <p className="text-xs text-amber-600 mt-3 text-center">Renovação cancelada. Acesso até {membership.current_period_end && new Date(membership.current_period_end).toLocaleDateString("pt-BR")}.</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Heart className="w-4 h-4" /> Parceiros favoritos</h2>
        {(area.data?.favorites ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não favoritou nenhum parceiro. <Link to="/vitrine" className="text-primary underline">Ver vitrine →</Link></p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {area.data!.favorites.map((f: any) => (
              <Link key={f.id} to="/vitrine/$slug" params={{ slug: f.public_slug }}>
                <Card className="p-4 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    {f.logo_url ? <img src={f.logo_url} alt={f.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>}
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{f.trade_name || f.name}</div>
                      {f.segment && <div className="text-xs text-muted-foreground">{f.segment}</div>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
