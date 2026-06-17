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
  Boxes,
  PackageCheck,
  AlertTriangle,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/showroom/estoque")({
  head: () => ({
    meta: [
      { title: "Showroom Estoque — Inventário por nicho | Impulsionando" },
      {
        name: "description",
        content:
          "Controle de estoque com lotes, validade, ponto de reposição e movimentações automáticas integrado ao PDV e financeiro.",
      },
      { property: "og:title", content: "Estoque — Impulsionando" },
      {
        property: "og:description",
        content: "Inventário, lotes e movimentações por nicho.",
      },
    ],
  }),
  component: ShowroomEstoque,
});

type NicheSlug = "bares" | "microcervejarias" | "ecommerce" | "servicos" | "clinicas";

const NICHO_LABEL: Record<NicheSlug, string> = {
  bares: "Bares & Restaurantes",
  microcervejarias: "Microcervejarias",
  ecommerce: "E-commerce & Delivery",
  servicos: "Serviços (Oficinas, Estética)",
  clinicas: "Clínicas & Saúde",
};

type Item = {
  sku: string;
  name: string;
  cat: string;
  stock: number;
  unit: string;
  min: number;
  cost: number;
  expiry?: string;
  lot?: string;
};

type Move = {
  date: string;
  sku: string;
  name: string;
  type: "in" | "out" | "adjust";
  qty: number;
  ref: string;
};

type Cfg = {
  items: Item[];
  movements: Move[];
};

const DATA: Record<NicheSlug, Cfg> = {
  bares: {
    items: [
      { sku: "CHP-IPA-30L", name: "Barril IPA 30L", cat: "Chopes", stock: 4, unit: "barril", min: 3, cost: 420, lot: "L248", expiry: "30/07" },
      { sku: "CHP-PIL-50L", name: "Barril Pilsen 50L", cat: "Chopes", stock: 2, unit: "barril", min: 4, cost: 560, lot: "L249", expiry: "22/07" },
      { sku: "GIN-TAN-750", name: "Gin Tanqueray 750ml", cat: "Destilados", stock: 6, unit: "garrafa", min: 4, cost: 168 },
      { sku: "COSTELA-KG", name: "Costela bovina (kg)", cat: "Cozinha", stock: 18, unit: "kg", min: 25, cost: 62, expiry: "20/06" },
      { sku: "BATATA-RUSTICA", name: "Batata rústica congelada", cat: "Cozinha", stock: 14, unit: "kg", min: 10, cost: 22 },
      { sku: "COPO-AMER", name: "Copo americano", cat: "Utensílios", stock: 220, unit: "un", min: 150, cost: 4.5 },
    ],
    movements: [
      { date: "14:32", sku: "CHP-IPA-30L", name: "Barril IPA 30L", type: "out", qty: 1, ref: "Consumo Mesa 12" },
      { date: "13:10", sku: "COSTELA-KG", name: "Costela bovina (kg)", type: "out", qty: 2.4, ref: "Comanda 0824" },
      { date: "11:00", sku: "GIN-TAN-750", name: "Gin Tanqueray", type: "in", qty: 6, ref: "NF 7821 · Distrib. Norte" },
      { date: "ontem", sku: "BATATA-RUSTICA", name: "Batata rústica", type: "adjust", qty: -1.5, ref: "Quebra inventário" },
    ],
  },
  microcervejarias: {
    items: [
      { sku: "L248-IPA", name: "Lote #248 · West Coast IPA", cat: "Lotes produção", stock: 1200, unit: "L", min: 400, cost: 8.4, lot: "L248", expiry: "30/09" },
      { sku: "L249-STT", name: "Lote #249 · Stout Coffee", cat: "Lotes produção", stock: 820, unit: "L", min: 400, cost: 9.6, lot: "L249", expiry: "12/10" },
      { sku: "GAR-473", name: "Garrafa âmbar 473ml", cat: "Embalagens", stock: 1840, unit: "un", min: 2000, cost: 1.6 },
      { sku: "ROT-IPA", name: "Rótulo IPA adesivo", cat: "Embalagens", stock: 4200, unit: "un", min: 1500, cost: 0.32 },
      { sku: "LUP-CITRA", name: "Lúpulo Citra (kg)", cat: "Insumos", stock: 6.8, unit: "kg", min: 10, cost: 320 },
      { sku: "MAL-PIL", name: "Malte Pilsen (saco 25kg)", cat: "Insumos", stock: 18, unit: "saco", min: 12, cost: 145 },
    ],
    movements: [
      { date: "08:02", sku: "L248-IPA", name: "Lote #248 IPA", type: "out", qty: 90, ref: "Venda B2B Tap House (3 barris)" },
      { date: "ontem", sku: "GAR-473", name: "Garrafa 473ml", type: "in", qty: 2400, ref: "NF 4412 · Vidraria SP" },
      { date: "ontem", sku: "L249-STT", name: "Lote #249 Stout", type: "in", qty: 820, ref: "Envase finalizado" },
      { date: "2d", sku: "LUP-CITRA", name: "Lúpulo Citra", type: "out", qty: 3.2, ref: "Brassagem #250" },
    ],
  },
  ecommerce: {
    items: [
      { sku: "OR-RUN-37", name: "Origem Run 37", cat: "Calçados", stock: 0, unit: "par", min: 4, cost: 189 },
      { sku: "OR-RUN-39", name: "Origem Run 39", cat: "Calçados", stock: 6, unit: "par", min: 5, cost: 189 },
      { sku: "OR-RUN-41", name: "Origem Run 41", cat: "Calçados", stock: 12, unit: "par", min: 5, cost: 189 },
      { sku: "DRY-M", name: "Camiseta dry-fit M", cat: "Vestuário", stock: 28, unit: "un", min: 15, cost: 48 },
      { sku: "DRY-G", name: "Camiseta dry-fit G", cat: "Vestuário", stock: 8, unit: "un", min: 15, cost: 48 },
      { sku: "MEIA-PAR", name: "Meia esportiva", cat: "Acessórios", stock: 84, unit: "par", min: 40, cost: 12 },
    ],
    movements: [
      { date: "14:32", sku: "OR-RUN-39", name: "Origem Run 39", type: "out", qty: 1, ref: "Pedido #7821 (Carla)" },
      { date: "11:20", sku: "DRY-G", name: "Camiseta dry-fit G", type: "in", qty: 0, ref: "Aguardando reposição" },
      { date: "ontem", sku: "MEIA-PAR", name: "Meia esportiva", type: "in", qty: 40, ref: "NF 9912 · Fornec. SC" },
      { date: "ontem", sku: "OR-RUN-37", name: "Origem Run 37", type: "out", qty: 2, ref: "Pedido #7790 (Mariana)" },
    ],
  },
  servicos: {
    items: [
      { sku: "PAS-FRE", name: "Pastilha freio dianteira", cat: "Peças", stock: 12, unit: "par", min: 8, cost: 140 },
      { sku: "FIL-OLE", name: "Filtro óleo OEM", cat: "Peças", stock: 18, unit: "un", min: 10, cost: 32 },
      { sku: "FIL-AR", name: "Filtro ar", cat: "Peças", stock: 6, unit: "un", min: 8, cost: 38 },
      { sku: "OL-5W30", name: "Óleo 5W30 sintético", cat: "Lubrificantes", stock: 42, unit: "L", min: 30, cost: 38 },
      { sku: "AD-WD40", name: "WD-40 300ml", cat: "Insumos", stock: 4, unit: "lata", min: 6, cost: 28 },
      { sku: "CER-POL", name: "Cera polimento (kit)", cat: "Estética", stock: 9, unit: "kit", min: 5, cost: 78 },
    ],
    movements: [
      { date: "13:14", sku: "PAS-FRE", name: "Pastilha dianteira", type: "out", qty: 1, ref: "OS #4421 (Pedro)" },
      { date: "13:14", sku: "OL-5W30", name: "Óleo 5W30", type: "out", qty: 4, ref: "OS #4421 (Pedro)" },
      { date: "ontem", sku: "FIL-AR", name: "Filtro ar", type: "in", qty: 12, ref: "NF 552 · Distrib. Auto" },
      { date: "2d", sku: "CER-POL", name: "Cera polimento", type: "out", qty: 1, ref: "Serviço T-Cross" },
    ],
  },
  clinicas: {
    items: [
      { sku: "BTX-100UI", name: "Toxina botulínica 100UI", cat: "Estética", stock: 6, unit: "frasco", min: 8, cost: 1180, lot: "BX-2406", expiry: "10/08" },
      { sku: "HA-1ML", name: "Ácido hialurônico 1ml", cat: "Estética", stock: 14, unit: "seringa", min: 8, cost: 620, lot: "HA-2405", expiry: "15/09" },
      { sku: "LUVA-M", name: "Luva procedimento M", cat: "Insumos", stock: 220, unit: "un", min: 400, cost: 0.6 },
      { sku: "GASE-PCT", name: "Gase estéril", cat: "Insumos", stock: 58, unit: "pacote", min: 30, cost: 12 },
      { sku: "VAC-FEB", name: "Vacina febre amarela", cat: "Vacinas", stock: 9, unit: "dose", min: 15, cost: 78, lot: "VFA-241", expiry: "18/07" },
    ],
    movements: [
      { date: "14:00", sku: "HA-1ML", name: "Ácido hialurônico", type: "out", qty: 1, ref: "Procedimento Marina S." },
      { date: "10:00", sku: "VAC-FEB", name: "Vacina febre amarela", type: "out", qty: 1, ref: "Aplicação Pedro F." },
      { date: "ontem", sku: "GASE-PCT", name: "Gase estéril", type: "in", qty: 60, ref: "NF 882 · Med Supply" },
      { date: "2d", sku: "BTX-100UI", name: "Toxina botulínica", type: "in", qty: 4, ref: "NF 871 · Distrib. Pharma" },
    ],
  },
};

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

function ShowroomEstoque() {
  const [nicho, setNicho] = useState<NicheSlug>("microcervejarias");
  const d = DATA[nicho];

  const stats = useMemo(() => {
    const itemsCount = d.items.length;
    const skuValue = d.items.reduce((a, i) => a + i.stock * i.cost, 0);
    const low = d.items.filter((i) => i.stock < i.min).length;
    const out = d.items.filter((i) => i.stock === 0).length;
    return { itemsCount, skuValue, low, out };
  }, [d]);

  const status = (i: Item) => {
    if (i.stock === 0) return { label: "ruptura", cls: "bg-rose-100 text-rose-700", bar: "bg-rose-500" };
    if (i.stock < i.min) return { label: "abaixo do mínimo", cls: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
    return { label: "saudável", cls: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" };
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Boxes className="h-3 w-3" /> Showroom Estoque
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Inventário, lotes e validade sob controle
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Movimentações automáticas a cada venda/OS, ponto de reposição inteligente e alertas
              de validade — específico por nicho.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Posição de estoque</h2>
            <p className="mt-1 text-muted-foreground">
              Atualizado em tempo real pelo PDV, OS e recebimentos.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <Select value={nicho} onValueChange={(v) => setNicho(v as NicheSlug)}>
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

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <PackageCheck className="h-3 w-3" /> SKUs ativos
            </p>
            <p className="mt-1 text-2xl font-bold">{stats.itemsCount}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Boxes className="h-3 w-3" /> Valor em estoque
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{fmt(stats.skuValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" /> Abaixo do mínimo
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{stats.low}</p>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3" /> Ruptura
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{stats.out}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Tabela de itens */}
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4">
              <h3 className="text-lg font-semibold">Itens monitorados</h3>
              <p className="text-xs text-muted-foreground">
                Barra mostra estoque atual vs mínimo · ponto de reposição automatizado.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">SKU / Item</th>
                    <th className="px-4 py-2 text-left">Categoria</th>
                    <th className="px-4 py-2 text-right">Estoque</th>
                    <th className="px-4 py-2 text-right">Mínimo</th>
                    <th className="px-4 py-2 text-left">Lote / Validade</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((i) => {
                    const st = status(i);
                    const pct = Math.min(
                      100,
                      Math.round((i.stock / Math.max(i.min * 2, 1)) * 100),
                    );
                    return (
                      <tr key={i.sku} className="border-t align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium leading-tight">{i.name}</p>
                          <p className="text-[11px] text-muted-foreground">{i.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{i.cat}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold tabular-nums">
                            {i.stock} <span className="text-xs text-muted-foreground">{i.unit}</span>
                          </span>
                          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${st.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {i.min}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {i.lot && <p>Lote {i.lot}</p>}
                          {i.expiry && (
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> val. {i.expiry}
                            </p>
                          )}
                          {!i.lot && !i.expiry && "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Movimentações */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold">Movimentações recentes</h3>
            <p className="text-xs text-muted-foreground">
              Cada venda, OS ou recebimento gera uma entrada automática.
            </p>
            <ul className="mt-4 space-y-3">
              {d.movements.map((m, i) => {
                const isIn = m.type === "in";
                const isOut = m.type === "out";
                const Icon = isIn ? ArrowDownRight : isOut ? ArrowUpRight : AlertTriangle;
                const cls = isIn
                  ? "text-emerald-600 bg-emerald-50"
                  : isOut
                    ? "text-rose-600 bg-rose-50"
                    : "text-amber-600 bg-amber-50";
                return (
                  <li key={i} className="flex gap-3 rounded-lg border p-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${cls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">{m.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.ref}</p>
                      <p className={`mt-1 text-sm font-semibold ${isIn ? "text-emerald-600" : isOut ? "text-rose-600" : "text-amber-600"}`}>
                        {isIn ? "+" : isOut ? "-" : ""}
                        {Math.abs(m.qty)} un.
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              Itens em ruptura disparam pedido de compra sugerido para o fornecedor preferido.
            </p>
          </Card>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Estoque sem surpresa</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Controle de lotes, validade, custo médio e curva ABC integrados ao PDV, financeiro e
            relatórios — pronto para o seu nicho.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contato">Falar com especialista</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/showroom/pdv">Ver PDV</Link>
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
