import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBasket,
  CreditCard,
  Banknote,
  QrCode,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Sparkles,
  Tag,
} from "lucide-react";

export const Route = createFileRoute("/showroom/pdv")({
  head: () => ({
    meta: [
      { title: "Showroom PDV — Frente de caixa por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "PDV completo com comanda, mesas, Pix instantâneo, cartão Mercado Pago e impressão fiscal — adaptado por nicho.",
      },
      { property: "og:title", content: "PDV — Impulsionando" },
      {
        property: "og:description",
        content: "Tela de caixa pronta para bares, microcervejarias, e-commerce e serviços.",
      },
    ],
  }),
  component: ShowroomPDV,
});

type NicheSlug = "bares" | "microcervejarias" | "ecommerce" | "servicos";

const NICHO_LABEL: Record<NicheSlug, string> = {
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  ecommerce: "E-commerce & Delivery",
  servicos: "Serviços (Oficinas, Estética)",
};

type Product = { id: string; name: string; price: number; cat: string };
type Cfg = {
  contextLabel: string;
  context: string;
  categories: string[];
  products: Product[];
  preCart: { id: string; qty: number }[];
};

const DATA: Record<NicheSlug, Cfg> = {
  bares: {
    contextLabel: "Comanda",
    context: "Mesa 12 · 4 pessoas · garçom Rafa",
    categories: ["Chopes", "Drinks", "Petiscos", "Pratos"],
    products: [
      { id: "b1", name: "Chope IPA 300ml", price: 18, cat: "Chopes" },
      { id: "b2", name: "Chope Pilsen 500ml", price: 22, cat: "Chopes" },
      { id: "b3", name: "Chope Weiss 500ml", price: 26, cat: "Chopes" },
      { id: "b4", name: "Negroni", price: 32, cat: "Drinks" },
      { id: "b5", name: "Gin tônica", price: 36, cat: "Drinks" },
      { id: "b6", name: "Bolinho de costela (6un)", price: 42, cat: "Petiscos" },
      { id: "b7", name: "Pastel rabada (4un)", price: 38, cat: "Petiscos" },
      { id: "b8", name: "Burger da casa", price: 56, cat: "Pratos" },
    ],
    preCart: [
      { id: "b2", qty: 4 },
      { id: "b6", qty: 1 },
      { id: "b8", qty: 2 },
    ],
  },
  microcervejarias: {
    contextLabel: "Pedido",
    context: "Loja física · cliente Clube Lúpulo (5% off)",
    categories: ["Rótulos", "Growler", "Kits", "Acessórios"],
    products: [
      { id: "m1", name: "West Coast IPA 473ml", price: 28, cat: "Rótulos" },
      { id: "m2", name: "Stout Coffee 473ml", price: 32, cat: "Rótulos" },
      { id: "m3", name: "Witbier 473ml", price: 26, cat: "Rótulos" },
      { id: "m4", name: "Growler 1L (refil)", price: 38, cat: "Growler" },
      { id: "m5", name: "Growler 2L (refil)", price: 68, cat: "Growler" },
      { id: "m6", name: "Kit degustação 6 rótulos", price: 168, cat: "Kits" },
      { id: "m7", name: "Copo tulipa", price: 32, cat: "Acessórios" },
      { id: "m8", name: "Abridor de parede", price: 24, cat: "Acessórios" },
    ],
    preCart: [
      { id: "m6", qty: 1 },
      { id: "m4", qty: 1 },
      { id: "m7", qty: 2 },
    ],
  },
  ecommerce: {
    contextLabel: "Venda",
    context: "Pedido balcão / showroom físico · cliente Carla",
    categories: ["Calçados", "Vestuário", "Acessórios"],
    products: [
      { id: "e1", name: "Origem Run 39", price: 389, cat: "Calçados" },
      { id: "e2", name: "Origem Trail 41", price: 449, cat: "Calçados" },
      { id: "e3", name: "Camiseta dry-fit M", price: 119, cat: "Vestuário" },
      { id: "e4", name: "Bermuda treino G", price: 159, cat: "Vestuário" },
      { id: "e5", name: "Meia esportiva (par)", price: 39, cat: "Acessórios" },
      { id: "e6", name: "Squeeze 750ml", price: 89, cat: "Acessórios" },
    ],
    preCart: [
      { id: "e1", qty: 1 },
      { id: "e5", qty: 2 },
      { id: "e6", qty: 1 },
    ],
  },
  servicos: {
    contextLabel: "OS",
    context: "OS #4421 · Pedro Garcia · Civic 2019",
    categories: ["Serviços", "Peças", "Lubrificantes"],
    products: [
      { id: "s1", name: "Revisão 30.000km", price: 480, cat: "Serviços" },
      { id: "s2", name: "Alinhamento + balanceamento", price: 180, cat: "Serviços" },
      { id: "s3", name: "Troca pastilhas (par)", price: 280, cat: "Serviços" },
      { id: "s4", name: "Filtro óleo OEM", price: 68, cat: "Peças" },
      { id: "s5", name: "Filtro ar", price: 92, cat: "Peças" },
      { id: "s6", name: "Óleo 5W30 sintético 1L", price: 78, cat: "Lubrificantes" },
    ],
    preCart: [
      { id: "s1", qty: 1 },
      { id: "s4", qty: 1 },
      { id: "s6", qty: 4 },
    ],
  },
};

type PayMethod = "pix" | "card" | "cash";
const PAY: { id: PayMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "pix", label: "Pix MercadoPago", icon: QrCode },
  { id: "card", label: "Cartão Mercado Pago", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

function ShowroomPDV() {
  const [nicho, setNicho] = useState<NicheSlug>("bares");
  const cfg = DATA[nicho];
  const [cat, setCat] = useState<string>(cfg.categories[0]);
  const [cart, setCart] = useState<Record<string, number>>(() =>
    Object.fromEntries(cfg.preCart.map((p) => [p.id, p.qty])),
  );
  const [pay, setPay] = useState<PayMethod>("pix");

  // reset on niche switch
  const handleNiche = (v: NicheSlug) => {
    setNicho(v);
    const next = DATA[v];
    setCat(next.categories[0]);
    setCart(Object.fromEntries(next.preCart.map((p) => [p.id, p.qty])));
  };

  const productById = useMemo(
    () => Object.fromEntries(cfg.products.map((p) => [p.id, p])),
    [cfg],
  );

  const items = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ ...productById[id], qty }))
    .filter((i) => i.id);

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const serviceFee = nicho === "bares" ? subtotal * 0.1 : 0; // couvert 10%
  const discount = nicho === "microcervejarias" ? subtotal * 0.05 : 0; // clube
  const total = subtotal + serviceFee - discount;

  const visible = cfg.products.filter((p) => p.cat === cat);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const sub = (id: string) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }));
  const remove = (id: string) =>
    setCart((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <ShoppingBasket className="h-3 w-3" /> Showroom PDV
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Frente de caixa rápida, pronta para o seu negócio
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Comanda, mesas, Pix instantâneo, Mercado Pago e fechamento integrado ao financeiro —
              clique para experimentar.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">PDV ao vivo</h2>
            <p className="mt-1 text-muted-foreground">
              {cfg.contextLabel}: {cfg.context}
            </p>
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
          {/* Catálogo */}
          <Card className="flex flex-col overflow-hidden">
            <div className="flex flex-wrap gap-2 border-b bg-muted/30 p-3">
              {cfg.categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    cat === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {visible.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add(p.id)}
                  className="group flex flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <span className="line-clamp-2 text-sm font-medium leading-tight">
                    {p.name}
                  </span>
                  <span className="mt-auto text-base font-bold tabular-nums text-primary">
                    {fmt(p.price)}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="h-3 w-3" /> Adicionar
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Comanda / cart */}
          <Card className="flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{cfg.contextLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {items.reduce((a, i) => a + i.qty, 0)} itens
                </p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Receipt className="h-3 w-3" />
                #PDV-{nicho.slice(0, 3).toUpperCase()}-0824
              </Badge>
            </div>

            <ul className="flex-1 divide-y overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Comanda vazia. Toque em um item ao lado.
                </li>
              )}
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(i.price)} un.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => sub(i.id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">{i.qty}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => add(i.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="w-20 text-right text-sm font-semibold tabular-nums">
                    {fmt(i.price * i.qty)}
                  </span>
                  <button
                    onClick={() => remove(i.id)}
                    className="text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-1 border-t px-4 py-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(subtotal)}</span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Couvert (10%)</span>
                  <span className="tabular-nums">{fmt(serviceFee)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Desconto Clube (-5%)
                  </span>
                  <span className="tabular-nums">-{fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums text-primary">{fmt(total)}</span>
              </div>
            </div>

            <div className="space-y-2 border-t bg-muted/30 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Forma de pagamento
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAY.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPay(p.id)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                        pay === p.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {p.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
              <Button className="mt-2 w-full" size="lg" disabled={items.length === 0}>
                Finalizar {fmt(total)}
              </Button>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Recibo enviado por WhatsApp e baixado no financeiro automaticamente.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">PDV pronto desde o primeiro dia</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Comanda por mesa, controle de garçons, integração com cozinha (KDS), Pix
            instantâneo e maquininhas — tudo cai no financeiro automaticamente.
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
