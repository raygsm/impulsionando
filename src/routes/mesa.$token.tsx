/**
 * /mesa/$token — Página pública acessada pelo QR Code da mesa.
 *
 * Recursos:
 * - Resolve mesa via RPC pública resolve_table_qr(token).
 * - Cardápio digital + check-in.
 * - Pagamento PIX da conta (createTableInvoice) com:
 *   - countdown de expiração do PIX (15 min);
 *   - histórico de tentativas de cobrança (open/paid/failed/expired);
 *   - botões "Atualizar QR" (re-poll) e "Gerar novo pagamento" (force).
 */
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  createTableInvoice,
  getTableInvoiceStatus,
  forceNewTableInvoice,
  listTableInvoices,
} from "@/lib/restaurant-table-pay.functions";
import {
  UtensilsCrossed,
  CheckCircle2,
  Users,
  Receipt,
  Plus,
  QrCode,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus as PlusIcon,
  XCircle,
  Clock as ClockIcon,
} from "lucide-react";

type Resolved = {
  ok: boolean;
  error?: string;
  table?: { id: string; number: number; label?: string; capacity: number; area?: string; status: string };
  company?: { id: string; name: string; primary_color?: string; logo_url?: string };
  session?: null | { id: string; customer_name?: string; party_size: number; total: number; opened_at: string; status: string };
};
type MenuData = { ok: boolean; categories?: any[]; uncategorized?: any[] };
type Bill = {
  invoice_id: string;
  amount_cents: number;
  status: string;
  pix_url: string | null;
  pix_configured: boolean;
  attempt_number?: number;
  expires_at?: string | null;
};

export const Route = createFileRoute("/mesa/$token")({
  head: () => ({
    meta: [
      { title: "Mesa · Impulsionando" },
      { name: "description", content: "Acesse sua comanda escaneando o QR Code da mesa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params }) => {
    const [resolvedRes, menuRes] = await Promise.all([
      supabase.rpc("resolve_table_qr", { _token: params.token }),
      supabase.rpc("get_table_menu", { _token: params.token }),
    ]);
    if (resolvedRes.error) throw resolvedRes.error;
    if (!resolvedRes.data || (resolvedRes.data as any).ok === false) throw notFound();
    return { resolved: resolvedRes.data as Resolved, menu: (menuRes.data ?? { ok: false }) as MenuData };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="p-8 text-center max-w-sm">
        <UtensilsCrossed className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <h1 className="text-xl font-bold">Mesa não encontrada</h1>
        <p className="text-sm text-muted-foreground mt-2">O QR Code pode estar inválido ou desativado.</p>
      </Card>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="p-8 text-center max-w-sm">
        <h1 className="text-xl font-bold">Erro ao carregar</h1>
        <p className="text-sm text-muted-foreground mt-2">{String(error)}</p>
      </Card>
    </div>
  ),
  component: MesaPage,
});

const BRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const BRLnum = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function MesaPage() {
  const { resolved, menu } = Route.useLoaderData();
  const [data, setData] = useState<Resolved>(resolved);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [party, setParty] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const createBill = useServerFn(createTableInvoice);
  const forceNewBill = useServerFn(forceNewTableInvoice);
  const checkBill = useServerFn(getTableInvoiceStatus);
  const listHistory = useServerFn(listTableInvoices);

  // Tick para countdown do PIX (1s).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Polling principal: status da mesa + status da cobrança + histórico.
  useEffect(() => {
    const id = setInterval(async () => {
      const t = window.location.pathname.split("/").pop();
      if (!t) return;
      const { data: r } = await supabase.rpc("resolve_table_qr", { _token: t });
      if (r && (r as any).ok) setData(r as Resolved);
      if (bill && bill.status !== "paid") {
        try {
          const res = await checkBill({ data: { token: t, invoice_id: bill.invoice_id } });
          if (res.status === "paid") {
            setBill({ ...bill, status: "paid" });
            toast.success("Pagamento confirmado! Obrigado 💙");
            void refreshHistory(t);
          } else if (res.status === "failed" || res.status === "expired" || res.status === "cancelled") {
            setBill({ ...bill, status: res.status });
            void refreshHistory(t);
          }
        } catch { /* silencioso */ }
      }
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill]);

  async function refreshHistory(token: string) {
    try {
      const res = await listHistory({ data: { token } });
      setHistory(res.invoices ?? []);
    } catch { /* silencioso */ }
  }

  // Quando abrir uma sessão, busca histórico.
  useEffect(() => {
    if (!data.session) return;
    const token = window.location.pathname.split("/").pop();
    if (token) void refreshHistory(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.session?.id]);

  async function handlePay() {
    if (!data.session) return;
    setBillLoading(true);
    try {
      const token = window.location.pathname.split("/").pop()!;
      const res = await createBill({ data: { token } });
      setBill({
        invoice_id: res.invoice_id,
        amount_cents: res.amount_cents,
        status: res.status,
        pix_url: res.pix_url,
        pix_configured: res.pix_configured,
        attempt_number: res.attempt_number,
        expires_at: res.expires_at,
      });
      await refreshHistory(token);
      if (!res.pix_configured) {
        toast.warning("Cobrança gerada, mas o PIX automático ainda não está configurado.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao gerar cobrança");
    } finally {
      setBillLoading(false);
    }
  }

  async function handleForceNew() {
    setBillLoading(true);
    try {
      const token = window.location.pathname.split("/").pop()!;
      const res = await forceNewBill({ data: { token } });
      setBill({
        invoice_id: res.invoice_id,
        amount_cents: res.amount_cents,
        status: res.status,
        pix_url: res.pix_url,
        pix_configured: res.pix_configured,
        attempt_number: res.attempt_number,
        expires_at: res.expires_at,
      });
      await refreshHistory(token);
      toast.success("Nova cobrança gerada — escaneie o novo QR.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao gerar nova cobrança");
    } finally {
      setBillLoading(false);
    }
  }

  async function handleRefreshQR() {
    if (!bill) return;
    try {
      const token = window.location.pathname.split("/").pop()!;
      const res = await checkBill({ data: { token, invoice_id: bill.invoice_id } });
      setBill({ ...bill, status: res.status });
      await refreshHistory(token);
      toast.success(`Status: ${res.status}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro");
    }
  }

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Informe seu nome.");
    if (phone.replace(/\D/g, "").length < 10) return toast.error("WhatsApp inválido.");
    setSubmitting(true);
    try {
      const token = window.location.pathname.split("/").pop()!;
      const { data: r, error } = await supabase.rpc("restaurant_table_checkin", {
        _token: token, _name: name, _phone: phone, _party_size: Number(party) || 1, _email: email || undefined,
      });
      if (error) throw error;
      if (!(r as any)?.ok) throw new Error((r as any)?.error ?? "Falha no check-in.");
      toast.success("Check-in registrado! O garçom já foi avisado.");
      const { data: r2 } = await supabase.rpc("resolve_table_qr", { _token: token });
      if (r2 && (r2 as any).ok) setData(r2 as Resolved);
    } catch (err: any) { toast.error(err?.message ?? "Erro no check-in."); }
    finally { setSubmitting(false); }
  }

  async function addToOrder(itemId: string, itemName: string) {
    if (!data.session) return toast.error("Faça check-in primeiro.");
    setAdding(itemId);
    try {
      const token = window.location.pathname.split("/").pop()!;
      const { data: r, error } = await supabase.rpc("add_table_order_item", {
        _token: token, _item_id: itemId, _quantity: 1,
      });
      if (error) throw error;
      if (!(r as any)?.ok) throw new Error((r as any)?.error ?? "Erro ao adicionar.");
      toast.success(`${itemName} adicionado à comanda!`);
      const { data: r2 } = await supabase.rpc("resolve_table_qr", { _token: token });
      if (r2 && (r2 as any).ok) setData(r2 as Resolved);
    } catch (err: any) { toast.error(err?.message ?? "Erro"); }
    finally { setAdding(null); }
  }

  // Countdown PIX (mm:ss)
  const expiryInfo = useMemo(() => {
    if (!bill?.expires_at) return null;
    const ms = new Date(bill.expires_at).getTime() - now;
    if (ms <= 0) return { expired: true, label: "00:00" };
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return { expired: false, label: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
  }, [bill?.expires_at, now]);

  const primary = data.company?.primary_color ?? "#1e3a8a";
  const allCategories = menu.categories ?? [];
  const uncategorized = menu.uncategorized ?? [];
  const hasMenu = allCategories.length > 0 || uncategorized.length > 0;
  const failedOrExpired = bill && (bill.status === "failed" || bill.status === "expired" || bill.status === "cancelled" || expiryInfo?.expired);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-8">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-6">
          {data.company?.logo_url ? (
            <img src={data.company.logo_url} alt={data.company.name} className="h-14 mx-auto mb-3" />
          ) : (
            <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ background: `${primary}15`, color: primary }}>
              <UtensilsCrossed className="w-7 h-7" />
            </div>
          )}
          <h1 className="text-xl font-bold">{data.company?.name}</h1>
          <Badge className="mt-2" style={{ background: primary, color: "#fff" }}>
            Mesa {data.table?.number}{data.table?.label ? ` · ${data.table.label}` : ""}
          </Badge>
          {data.table?.area && <p className="text-xs text-muted-foreground mt-1">{data.table.area}</p>}
        </header>

        {data.session ? (
          <Card className="p-5 mb-4 border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold">Comanda aberta</h2>
            </div>
            <div className="text-xs text-muted-foreground">Aberta em {new Date(data.session.opened_at).toLocaleTimeString("pt-BR")}</div>
            {data.session.customer_name && (
              <div className="mt-2 text-sm"><Users className="w-4 h-4 inline mr-1" /> {data.session.customer_name} · {data.session.party_size} pessoa(s)</div>
            )}
            <div className="mt-3 pt-3 border-t flex items-baseline justify-between">
              <div className="text-xs text-muted-foreground"><Receipt className="w-3 h-3 inline mr-1" /> Total parcial</div>
              <div className="text-2xl font-bold">R$ {Number(data.session.total ?? 0).toFixed(2)}</div>
            </div>
            {Number(data.session.total ?? 0) > 0 && (
              <div className="mt-3 pt-3 border-t">
                {bill?.status === "paid" ? (
                  <div className="text-center py-2">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-green-600 mb-1" />
                    <p className="text-sm font-medium text-green-700">Pagamento confirmado!</p>
                    <p className="text-xs text-muted-foreground">A mesa foi liberada. Obrigado pela visita.</p>
                  </div>
                ) : bill && !failedOrExpired ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        <span>PIX de <strong>R$ {(bill.amount_cents/100).toFixed(2)}</strong></span>
                      </div>
                      {expiryInfo && (
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${expiryInfo.expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                          <ClockIcon className="w-3 h-3 inline mr-1" />
                          {expiryInfo.expired ? "Expirado" : expiryInfo.label}
                        </span>
                      )}
                    </div>
                    {bill.attempt_number && bill.attempt_number > 1 && (
                      <p className="text-[10px] text-muted-foreground">Tentativa #{bill.attempt_number}</p>
                    )}
                    {bill.pix_url && (
                      <div className="flex gap-2">
                        <Button asChild size="sm" className="flex-1" style={{ background: primary }}>
                          <a href={bill.pix_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" /> Abrir checkout PIX
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(bill.pix_url!); toast.success("Link copiado"); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="flex-1" onClick={handleRefreshQR}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Atualizar status
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1" onClick={handleForceNew} disabled={billLoading}>
                        <PlusIcon className="w-3 h-3 mr-1" /> Novo pagamento
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">A mesa será liberada automaticamente quando o pagamento for confirmado.</p>
                  </div>
                ) : failedOrExpired ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      <XCircle className="w-4 h-4" />
                      <span>
                        {bill?.status === "expired" || expiryInfo?.expired
                          ? "Cobrança expirada."
                          : bill?.status === "cancelled"
                          ? "Cobrança cancelada."
                          : "Pagamento não concluído."}
                      </span>
                    </div>
                    <Button onClick={handleForceNew} disabled={billLoading} className="w-full" style={{ background: primary }}>
                      {billLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <PlusIcon className="w-4 h-4 mr-1" />}
                      Gerar novo pagamento
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handlePay} disabled={billLoading} className="w-full" style={{ background: primary }}>
                    {billLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
                    Pagar conta agora
                  </Button>
                )}

                {history.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      Histórico de cobranças ({history.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {history.map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                          <div className="flex items-center gap-2">
                            <InvoiceStatusBadge status={h.status} />
                            <span className="text-muted-foreground">#{h.attempt_number}</span>
                            <span>{BRLnum(Number(h.amount_cents) / 100)}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(h.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-5 mb-4">
            <h2 className="font-semibold mb-2">Bem-vindo(a)!</h2>
            <p className="text-sm text-muted-foreground">Faça seu check-in para abrir sua comanda e pedir pelo cardápio digital.</p>
          </Card>
        )}

        {!data.session && (
          <Card className="p-5 mb-4">
            <h3 className="font-semibold mb-3">Check-in na mesa</h3>
            <form onSubmit={handleCheckin} className="space-y-3">
              <div><Label htmlFor="m-name">Seu nome *</Label><Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" /></div>
              <div><Label htmlFor="m-phone">WhatsApp *</Label><Input id="m-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(21) 99999-9999" /></div>
              <div><Label htmlFor="m-email">E-mail (para receber o aviso do pedido e a conta)</Label><Input id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
              <div><Label htmlFor="m-party">Quantas pessoas?</Label><Input id="m-party" type="number" min={1} max={50} value={party} onChange={(e) => setParty(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={submitting} style={{ background: primary }}>
                {submitting ? "Enviando..." : "Confirmar check-in"}
              </Button>
            </form>
          </Card>
        )}

        {hasMenu && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><UtensilsCrossed className="w-5 h-5" /> Cardápio</h2>
            {allCategories.map((cat: any) => (
              <CategoryBlock key={cat.id} title={cat.name} items={cat.items ?? []} onAdd={addToOrder} adding={adding} canOrder={!!data.session} primary={primary} />
            ))}
            {uncategorized.length > 0 && (
              <CategoryBlock title="Outros" items={uncategorized} onAdd={addToOrder} adding={adding} canOrder={!!data.session} primary={primary} />
            )}
          </div>
        )}

        <p className="text-[10px] text-center text-muted-foreground mt-6">
          Atendimento por <strong>Impulsionando</strong> · seus dados são usados apenas para esta visita.
        </p>
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    paid: { bg: "bg-green-100 text-green-700", label: "Pago" },
    open: { bg: "bg-amber-100 text-amber-700", label: "Aberta" },
    failed: { bg: "bg-red-100 text-red-700", label: "Falhou" },
    expired: { bg: "bg-red-100 text-red-700", label: "Expirada" },
    cancelled: { bg: "bg-gray-100 text-gray-600", label: "Cancelada" },
  };
  const cfg = map[status] ?? { bg: "bg-gray-100 text-gray-600", label: status };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg}`}>{cfg.label}</span>;
}

function CategoryBlock({ title, items, onAdd, adding, canOrder, primary }: any) {
  if (!items.length) return null;
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-2">
        {items.map((it: any) => (
          <div key={it.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{it.name}</div>
              {it.description && <div className="text-xs text-muted-foreground line-clamp-2">{it.description}</div>}
              <div className="text-sm font-semibold mt-1">{BRL(it.price_cents)}</div>
            </div>
            <Button
              size="sm" disabled={!canOrder || adding === it.id}
              onClick={() => onAdd(it.id, it.name)}
              style={canOrder ? { background: primary } : undefined}
              title={canOrder ? "Adicionar à comanda" : "Faça check-in primeiro"}
            >
              <Plus className="w-3 h-3 mr-1" /> {adding === it.id ? "..." : "Pedir"}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
