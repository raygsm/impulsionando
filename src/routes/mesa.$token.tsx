/**
 * /mesa/$token — Página pública acessada pelo QR Code da mesa.
 *
 * Fluxo:
 * - Resolve a mesa via RPC pública resolve_table_qr(token).
 * - Se a comanda existir, mostra status (aberta), total parcial e CARDÁPIO DIGITAL.
 * - Cliente clica nos itens e o pedido é adicionado via add_table_order_item.
 * - Captura nome + WhatsApp + nº de pessoas e faz check-in.
 */
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UtensilsCrossed, CheckCircle2, Users, Receipt, Plus } from "lucide-react";

type Resolved = {
  ok: boolean;
  error?: string;
  table?: { id: string; number: number; label?: string; capacity: number; area?: string; status: string };
  company?: { id: string; name: string; primary_color?: string; logo_url?: string };
  session?: null | { id: string; customer_name?: string; party_size: number; total: number; opened_at: string; status: string };
};
type MenuData = { ok: boolean; categories?: any[]; uncategorized?: any[] };

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

function MesaPage() {
  const { resolved, menu } = Route.useLoaderData();
  const [data, setData] = useState<Resolved>(resolved);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [party, setParty] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(async () => {
      const t = window.location.pathname.split("/").pop();
      if (!t) return;
      const { data: r } = await supabase.rpc("resolve_table_qr", { _token: t });
      if (r && (r as any).ok) setData(r as Resolved);
    }, 15000);
    return () => clearInterval(id);
  }, []);

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

  const primary = data.company?.primary_color ?? "#1e3a8a";
  const allCategories = menu.categories ?? [];
  const uncategorized = menu.uncategorized ?? [];
  const hasMenu = allCategories.length > 0 || uncategorized.length > 0;

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
