import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, TrendingUp, Wallet, Sparkles, MessageCircle } from "lucide-react";

const BASE_PRICE = 299.9;
const MIN_DOMAINS = 10;

type Tier = { min: number; max: number | null; discount: number; label: string };

const TIERS: Tier[] = [
  { min: 10, max: 10, discount: 0, label: "Mínimo" },
  { min: 11, max: 50, discount: 0.1, label: "-10%" },
  { min: 51, max: 100, discount: 0.15, label: "-15%" },
  { min: 101, max: null, discount: 0.2, label: "-20%" },
];

function currentTier(qty: number): Tier {
  return (
    TIERS.slice()
      .reverse()
      .find((t) => qty >= t.min) ?? TIERS[0]
  );
}

function nextTier(qty: number): Tier | null {
  return TIERS.find((t) => qty < t.min) ?? null;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  ctaHref?: string;
  onCtaClick?: () => void;
  ctaLabel?: string;
}

export function WhiteLabelSimulator({ ctaHref, onCtaClick, ctaLabel }: Props) {
  const [qty, setQty] = useState(25);
  const domains = Math.max(MIN_DOMAINS, Math.min(500, Math.round(qty || MIN_DOMAINS)));

  const calc = useMemo(() => {
    const tier = currentTier(domains);
    const unit = BASE_PRICE * (1 - tier.discount);
    const gross = BASE_PRICE * domains;
    const net = unit * domains;
    const savings = gross - net;
    const next = nextTier(domains);
    let missing = 0;
    let additionalMonthly = 0;
    let additionalAnnual = 0;
    if (next) {
      missing = next.min - domains;
      const nextUnit = BASE_PRICE * (1 - next.discount);
      // Additional monthly savings vs current unit at same qty
      additionalMonthly = (unit - nextUnit) * domains;
      additionalAnnual = additionalMonthly * 12;
    }
    return {
      tier,
      next,
      unit,
      gross,
      net,
      savings,
      monthlySavings: savings,
      annualSavings: savings * 12,
      missing,
      additionalMonthly,
      additionalAnnual,
    };
  }, [domains]);

  return (
    <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
        <Sparkles className="w-4 h-4" /> Simulador White Label
      </div>
      <h3 className="font-serif text-2xl md:text-3xl mt-2">
        Simule sua mensalidade em tempo real
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
        Informe quantos domínios você pretende operar. O sistema aplica a faixa
        de desconto automaticamente e mostra quanto falta para atingir a próxima
        faixa.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        {/* Controles */}
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Domínios ativos
            </label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                type="number"
                min={MIN_DOMAINS}
                max={500}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || MIN_DOMAINS)}
                className="w-28 text-lg font-semibold"
              />
              <div className="text-xs text-muted-foreground">
                mínimo {MIN_DOMAINS} · máximo simulado 500
              </div>
            </div>
            <div className="mt-4">
              <Slider
                value={[domains]}
                min={MIN_DOMAINS}
                max={200}
                step={1}
                onValueChange={(v) => setQty(v[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>10</span>
                <span>50</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Faixa atual</span>
              <span className="font-medium">
                {calc.tier.min}
                {calc.tier.max ? `–${calc.tier.max}` : "+"} domínios ·{" "}
                {calc.tier.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor por domínio</span>
              <span className="font-medium">{brl(calc.unit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor bruto</span>
              <span>{brl(calc.gross)}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span>Desconto aplicado</span>
              <span>− {brl(calc.savings)}</span>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
            <Wallet className="w-4 h-4" /> Mensalidade estimada
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-bold tracking-tight">
              {brl(calc.net)}
            </span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {domains} domínios × {brl(calc.unit)}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-background/60 border border-border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Economia mensal
              </div>
              <div className="font-semibold text-primary mt-1">
                {brl(calc.monthlySavings)}
              </div>
            </div>
            <div className="rounded-lg bg-background/60 border border-border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Economia anual
              </div>
              <div className="font-semibold text-primary mt-1">
                {brl(calc.annualSavings)}
              </div>
            </div>
          </div>

          {calc.next ? (
            <div className="mt-5 rounded-lg border border-dashed border-primary/40 p-4 bg-background/40">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <TrendingUp className="w-4 h-4" /> Próxima faixa · {calc.next.label}
              </div>
              <p className="text-sm mt-2 leading-relaxed">
                Faltam <strong>{calc.missing}</strong>{" "}
                {calc.missing === 1 ? "domínio" : "domínios"} para atingir{" "}
                <strong>{calc.next.label}</strong> de desconto.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Economia adicional estimada:{" "}
                <strong className="text-foreground">
                  {brl(calc.additionalMonthly)}/mês
                </strong>{" "}
                · {brl(calc.additionalAnnual)}/ano
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-primary/40 p-4 bg-primary/10">
              <div className="text-xs font-medium text-primary uppercase tracking-wider">
                Faixa máxima atingida
              </div>
              <p className="text-sm mt-1">
                Você já opera com o maior desconto do modelo White Label (−20%).
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            {ctaHref && (
              <Button asChild className="gap-2">
                <a href={ctaHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Falar com o comercial
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            WhatsApp Business API, VoIP, SMS e telefonia não estão incluídos —
            são contratados à parte conforme o consumo ou pacote escolhido pelo
            parceiro.
          </p>
        </div>
      </div>
    </Card>
  );
}
