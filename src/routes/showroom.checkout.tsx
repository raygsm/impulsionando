import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  Shield,
  CheckCircle2,
  Sparkles,
  Lock,
  Tag,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/showroom/checkout")({
  head: () => ({
    meta: [
      { title: "Showroom Checkout — Pagamento otimizado por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "Checkout transparente com Pix, cartão Mercado Pago parcelado, order bumps e cupons — adaptado por nicho.",
      },
      { property: "og:title", content: "Checkout — Impulsionando" },
      {
        property: "og:description",
        content: "Checkout transparente com Pix, cartão e order bumps por nicho.",
      },
    ],
  }),
  component: ShowroomCheckout,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHO_LABEL: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Saúde",
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços (Oficinas, Estética)",
  ecommerce: "E-commerce & Delivery",
};

type Item = { name: string; detail: string; qty: number; price: number };
type Bump = { id: string; name: string; desc: string; price: number };
type Cfg = {
  context: string;
  items: Item[];
  bumps: Bump[];
  coupons: { code: string; discountPct: number }[];
  installments: number;
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    context: "Pacote dermato · Dra. Helena",
    items: [
      { name: "Pacote laser 6 sessões", detail: "Pele clara · 30min/sessão", qty: 1, price: 2880 },
      { name: "Avaliação dermato", detail: "Inclusa no pacote", qty: 1, price: 0 },
    ],
    bumps: [
      { id: "b1", name: "Skinbooster (+1 sessão)", desc: "Hidratação profunda · 50% off", price: 480 },
      { id: "b2", name: "Kit homecare", desc: "Dermo cosméticos · 30 dias", price: 320 },
    ],
    coupons: [
      { code: "PRIMEIRA10", discountPct: 10 },
      { code: "INDIQUE15", discountPct: 15 },
    ],
    installments: 6,
  },
  bares: {
    context: "Reserva sábado · Confraternização",
    items: [
      { name: "Privê 12 pax · 4h", detail: "Sábado 20h–24h · couvert incluso", qty: 1, price: 1800 },
      { name: "Kit boas-vindas", detail: "12 chopes IPA + petisco", qty: 1, price: 480 },
    ],
    bumps: [
      { id: "b1", name: "Open bar destilados (+2h)", desc: "Gin, vodka, whisky", price: 1200 },
      { id: "b2", name: "DJ residente", desc: "Set 3h direto", price: 800 },
    ],
    coupons: [{ code: "CONFRA10", discountPct: 10 }],
    installments: 3,
  },
  microcervejarias: {
    context: "Clube Lúpulo · Mensal",
    items: [
      { name: "Assinatura mensal Clube", detail: "4 rótulos exclusivos/mês", qty: 1, price: 149 },
      { name: "Copo edição limitada", detail: "Brinde do mês", qty: 1, price: 0 },
    ],
    bumps: [
      { id: "b1", name: "Upgrade Premium", desc: "6 rótulos + degustação guiada", price: 80 },
      { id: "b2", name: "Tour para 2 pessoas", desc: "Sábado · 1h", price: 120 },
    ],
    coupons: [
      { code: "CLUBE12", discountPct: 12 },
      { code: "ANUAL2M", discountPct: 16 },
    ],
    installments: 1,
  },
  servicos: {
    context: "OS #4421 · Civic 2019",
    items: [
      { name: "Revisão 30.000km completa", detail: "Box 2 · André", qty: 1, price: 480 },
      { name: "Troca de pastilhas dianteiras", detail: "Par OEM", qty: 1, price: 280 },
      { name: "Filtros + óleo 5W30", detail: "Pacote", qty: 1, price: 280 },
    ],
    bumps: [
      { id: "b1", name: "Alinhamento + balanceamento", desc: "Inclui caster", price: 180 },
      { id: "b2", name: "Higienização ar-cond", desc: "Anti-bactéria", price: 220 },
    ],
    coupons: [{ code: "FROTA12", discountPct: 12 }],
    installments: 12,
  },
  ecommerce: {
    context: "Pedido #7821 · Origem Run",
    items: [
      { name: "Origem Run 39", detail: "Calçado de corrida", qty: 1, price: 389 },
      { name: "Meia esportiva", detail: "Par", qty: 2, price: 39 },
    ],
    bumps: [
      { id: "b1", name: "Squeeze 750ml", desc: "Compre junto · 30% off", price: 62 },
      { id: "b2", name: "Gel pós-treino", desc: "Combo recovery", price: 89 },
    ],
    coupons: [
      { code: "VOLTA10", discountPct: 10 },
      { code: "FRETEFREE", discountPct: 0 },
    ],
    installments: 6,
  },
};

type PayMethod = "pix" | "card" | "boleto";
const PAY: { id: PayMethod; label: string; icon: React.ComponentType<{ className?: string }>; tag: string }[] = [
  { id: "pix", label: "Pix", icon: QrCode, tag: "5% off à vista" },
  { id: "card", label: "Cartão Mercado Pago", icon: CreditCard, tag: "Parcele sem juros" },
  { id: "boleto", label: "Boleto", icon: Banknote, tag: "Compensa em 1 dia útil" },
];

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

function ShowroomCheckout() {
  const [nicho, setNicho] = useState<NicheSlug>("ecommerce");
  const cfg = DATA[nicho];

  const [bumps, setBumps] = useState<Record<string, boolean>>({});
  const [pay, setPay] = useState<PayMethod>("card");
  const [installments, setInstallments] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; pct: number } | null>(null);

  // reset on niche switch
  const handleNiche = (v: NicheSlug) => {
    setNicho(v);
    setBumps({});
    setApplied(null);
    setInstallments(1);
  };

  const itemsSubtotal = cfg.items.reduce((a, i) => a + i.price * i.qty, 0);
  const bumpsSubtotal = cfg.bumps.reduce((a, b) => a + (bumps[b.id] ? b.price : 0), 0);
  const subtotal = itemsSubtotal + bumpsSubtotal;
  const discount = applied ? Math.round(subtotal * (applied.pct / 100)) : 0;
  const pixDiscount = pay === "pix" ? Math.round((subtotal - discount) * 0.05) : 0;
  const total = subtotal - discount - pixDiscount;

  const installmentOptions = useMemo(
    () => Array.from({ length: cfg.installments }, (_, i) => i + 1),
    [cfg.installments],
  );

  const applyCoupon = () => {
    const found = cfg.coupons.find((c) => c.code.toLowerCase() === coupon.trim().toLowerCase());
    if (found) setApplied({ code: found.code, pct: found.discountPct });
    else setApplied(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <ShoppingBag className="h-3 w-3" /> Showroom Checkout
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Checkout transparente, conversão alta
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Pix instantâneo, cartão Mercado Pago parcelado, order bumps e cupons — sem redirecionar
              o cliente para fora do seu site.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Checkout ao vivo</h2>
            <p className="mt-1 text-muted-foreground">Contexto: {cfg.context}</p>
          </div>
          <div className="w-full sm:w-80">
            <Select value={nicho} onValueChange={(v) => handleNiche(v as NicheSlug)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHO_LABEL) as NicheSlug[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {NICHO_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Form */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                Seus dados
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" placeholder="Como aparecerá no recibo" defaultValue="Carla M. Origem" />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="voce@email.com" defaultValue="carla@origem.run" />
                </div>
                <div>
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input id="phone" placeholder="(11) 90000-0000" defaultValue="(11) 98421-7711" />
                </div>
                <div>
                  <Label htmlFor="doc">CPF</Label>
                  <Input id="doc" placeholder="000.000.000-00" defaultValue="389.221.118-09" />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" placeholder="00000-000" defaultValue="05417-002" />
                </div>
              </div>
            </Card>

            {/* Order bumps */}
            {cfg.bumps.length > 0 && (
              <Card className="p-5">
                <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    2
                  </span>
                  Adicione e ganhe condição
                </h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Order bumps com desconto exclusivo · clique para incluir
                </p>
                <div className="space-y-2">
                  {cfg.bumps.map((b) => {
                    const on = !!bumps[b.id];
                    return (
                      <label
                        key={b.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          on ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setBumps((s) => ({ ...s, [b.id]: !s[b.id] }))}
                          className="mt-1 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums text-primary">
                            +{fmt(b.price)}
                          </p>
                          {!on && (
                            <span className="flex items-center justify-end gap-0.5 text-[10px] text-muted-foreground">
                              <Plus className="h-3 w-3" /> incluir
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Pagamento */}
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </span>
                Forma de pagamento
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {PAY.map((p) => {
                  const Icon = p.icon;
                  const active = pay === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPay(p.id)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold">{p.label}</span>
                      <span className="text-[10px] text-muted-foreground">{p.tag}</span>
                    </button>
                  );
                })}
              </div>

              {pay === "card" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="cc">Número do cartão</Label>
                    <Input id="cc" placeholder="0000 0000 0000 0000" defaultValue="4111 11•• •••• 4242" />
                  </div>
                  <div>
                    <Label htmlFor="exp">Validade</Label>
                    <Input id="exp" placeholder="MM/AA" defaultValue="08/29" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="000" defaultValue="•••" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Parcelas</Label>
                    <Select
                      value={String(installments)}
                      onValueChange={(v) => setInstallments(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {installmentOptions.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x de {fmt(total / n)} sem juros
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {pay === "pix" && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border bg-emerald-50 p-4 text-sm">
                  <QrCode className="h-10 w-10 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-emerald-800">
                      Pague em segundos e ganhe 5% off
                    </p>
                    <p className="text-xs text-emerald-700">
                      Geraremos o QR Code MercadoPago após confirmar. Confirmação automática.
                    </p>
                  </div>
                </div>
              )}

              {pay === "boleto" && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border bg-amber-50 p-4 text-sm">
                  <Banknote className="h-10 w-10 text-amber-700" />
                  <div>
                    <p className="font-semibold text-amber-800">
                      Boleto vence em 3 dias úteis
                    </p>
                    <p className="text-xs text-amber-700">
                      Liberação após compensação. Ideal para B2B.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Resumo */}
          <Card className="sticky top-4 flex h-fit flex-col">
            <div className="border-b px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resumo do pedido
              </p>
            </div>

            <ul className="divide-y">
              {cfg.items.map((i, idx) => (
                <li key={idx} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                    {i.qty}x
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.detail}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {i.price === 0 ? (
                      <span className="text-emerald-600">incluso</span>
                    ) : (
                      fmt(i.price * i.qty)
                    )}
                  </span>
                </li>
              ))}
              {cfg.bumps
                .filter((b) => bumps[b.id])
                .map((b) => (
                  <li key={b.id} className="flex items-start gap-3 bg-primary/5 px-5 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-primary">
                      {fmt(b.price)}
                    </span>
                  </li>
                ))}
            </ul>

            <div className="space-y-2 border-t px-5 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Cupom de desconto"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="h-9"
                />
                <Button size="sm" variant="outline" onClick={applyCoupon}>
                  Aplicar
                </Button>
              </div>
              {applied && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <Tag className="h-3 w-3" /> Cupom {applied.code} aplicado (-{applied.pct}%)
                </p>
              )}
              {!applied && cfg.coupons.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Tente: {cfg.coupons.map((c) => c.code).join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-1 border-t px-5 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Cupom {applied?.code}</span>
                  <span className="tabular-nums">-{fmt(discount)}</span>
                </div>
              )}
              {pixDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto Pix (-5%)</span>
                  <span className="tabular-nums">-{fmt(pixDiscount)}</span>
                </div>
              )}
              <div className="flex items-end justify-between border-t pt-2">
                <span className="text-sm font-semibold">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-primary">{fmt(total)}</p>
                  {pay === "card" && installments > 1 && (
                    <p className="text-xs text-muted-foreground">
                      ou {installments}x de {fmt(total / installments)} sem juros
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t bg-muted/30 px-5 py-4">
              <Button className="w-full" size="lg">
                <Lock className="mr-2 h-4 w-4" />
                Finalizar pedido · {fmt(total)}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> SSL · PCI DSS
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Confirmação por WhatsApp
                </span>
              </div>
              <p className="flex items-start gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                Webhook do gateway baixa direto no financeiro e no CRM.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Checkout que converte</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Transparente, mobile-first, com Pix instantâneo, antifraude Mercado Pago e
            recuperação automática de carrinho integrada — pronto para o seu nicho.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/financeiro">Ver financeiro</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/">Voltar ao hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
