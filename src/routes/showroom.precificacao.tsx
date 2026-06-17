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
  Calculator,
  Check,
  X,
  Sparkles,
  TrendingUp,
  ArrowRight,
  PiggyBank,
  Receipt,
  Users,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/showroom/precificacao")({
  head: () => ({
    meta: [
      { title: "Precificação & ROI — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Calculadora de planos, simulador de ROI ao vivo e comparativo de funcionalidades — descubra o plano ideal por nicho.",
      },
      { property: "og:title", content: "Precificação — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Planos Starter, Pro e Scale + Enterprise. Simulador de payback e comparativo completo.",
      },
    ],
  }),
  component: ShowroomPrecificacao,
});

type PlanKey = "starter" | "pro" | "scale";

type Plan = {
  key: PlanKey;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  highlight?: boolean;
  perks: string[];
  cap: { users: number; units: number; integrations: number };
};

const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    tagline: "Para começar com o básico bem feito",
    monthly: 197,
    yearly: 1970,
    perks: [
      "Agenda, CRM e Caixa unificada",
      "Até 3 usuários",
      "WhatsApp 1 número",
      "Relatórios essenciais",
      "Suporte por chat (horário comercial)",
    ],
    cap: { users: 3, units: 1, integrations: 5 },
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Para operações em crescimento",
    monthly: 497,
    yearly: 4970,
    highlight: true,
    perks: [
      "Tudo do Starter",
      "Até 15 usuários · 1 unidade",
      "Automações ilimitadas",
      "Integrações premium (Meta Ads, GA4, Conta Azul…)",
      "BI avançado e relatórios personalizados",
      "Suporte prioritário 12h",
    ],
    cap: { users: 15, units: 1, integrations: 20 },
  },
  {
    key: "scale",
    name: "Scale",
    tagline: "Para redes, franquias e multi-unidades",
    monthly: 997,
    yearly: 9970,
    perks: [
      "Tudo do Pro",
      "Multi-unidades e franqueador",
      "API pública e webhooks ilimitados",
      "SSO (SAML/OIDC), RBAC granular, auditoria",
      "Customer Success dedicado",
      "SLA 99,9% contratual",
    ],
    cap: { users: 100, units: 25, integrations: 100 },
  },
];

const FEATURES: { name: string; starter: boolean | string; pro: boolean | string; scale: boolean | string }[] = [
  { name: "Agenda inteligente", starter: true, pro: true, scale: true },
  { name: "CRM 360° + segmentações", starter: "Básico", pro: true, scale: true },
  { name: "Caixa unificada + Pix", starter: true, pro: true, scale: true },
  { name: "WhatsApp Business API", starter: "1 número", pro: "3 números", scale: "Ilimitado" },
  { name: "Automações", starter: "5 ativas", pro: "Ilimitadas", scale: "Ilimitadas" },
  { name: "BI avançado", starter: false, pro: true, scale: true },
  { name: "Multi-unidades / franquias", starter: false, pro: false, scale: true },
  { name: "API pública + webhooks", starter: false, pro: "Limitada", scale: "Ilimitada" },
  { name: "SSO (SAML/OIDC)", starter: false, pro: false, scale: true },
  { name: "Auditoria imutável", starter: false, pro: true, scale: true },
  { name: "Suporte", starter: "Chat 8x5", pro: "Prioritário 12h", scale: "CS dedicado" },
  { name: "SLA contratual", starter: false, pro: "99,5%", scale: "99,9%" },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Posso trocar de plano a qualquer momento?",
    a: "Sim — upgrades entram em vigor no mesmo dia e geram pro-rata. Downgrades valem no próximo ciclo.",
  },
  {
    q: "Existe taxa de setup?",
    a: "Não. O onboarding guiado e a migração padrão estão inclusos. Migrações complexas têm pacote opcional.",
  },
  {
    q: "Vocês cobram por transação?",
    a: "Não cobramos % sobre vendas. As taxas de pagamento são as do gateway (Pix, cartão, etc.).",
  },
  {
    q: "E se eu cancelar?",
    a: "Sem fidelidade. Você exporta todos os dados em qualquer momento e segue seu caminho.",
  },
];

function ShowroomPrecificacao() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  // ROI inputs
  const [revenue, setRevenue] = useState(80000);
  const [adminHours, setAdminHours] = useState(40);
  const [noShowPct, setNoShowPct] = useState(12);
  const [planForRoi, setPlanForRoi] = useState<PlanKey>("pro");

  const roi = useMemo(() => {
    const plan = PLANS.find((p) => p.key === planForRoi)!;
    const monthly = billing === "yearly" ? plan.yearly / 12 : plan.monthly;
    // Premissas (simulação)
    const hoursValue = 35; // R$/h custo equipe
    const hoursSaved = adminHours * 0.45;
    const hoursGain = hoursSaved * hoursValue;
    const noShowGain = revenue * (noShowPct / 100) * 0.4; // recupera 40% dos no-shows
    const upsell = revenue * 0.05; // 5% extra por CRM + automação
    const totalGain = hoursGain + noShowGain + upsell;
    const net = totalGain - monthly;
    const payback = monthly > 0 ? monthly / Math.max(1, totalGain / 30) : 0;
    return {
      monthly: Math.round(monthly),
      hoursSaved: Math.round(hoursSaved),
      hoursGain: Math.round(hoursGain),
      noShowGain: Math.round(noShowGain),
      upsell: Math.round(upsell),
      totalGain: Math.round(totalGain),
      net: Math.round(net),
      paybackDays: Math.max(1, Math.round(payback)),
      roiPct: Math.round((net / monthly) * 100),
    };
  }, [revenue, adminHours, noShowPct, planForRoi, billing]);

  function brl(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Calculator className="h-3 w-3" /> Showroom — Precificação & ROI
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Planos transparentes. Sem taxa por venda.
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Pague pelo que sua operação realmente precisa — e simule o ROI com os seus números
              em tempo real.
            </p>
            <div className="mt-6 inline-flex rounded-lg border bg-background p-1 text-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-md px-4 py-1.5 transition ${
                  billing === "monthly" ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`rounded-md px-4 py-1.5 transition ${
                  billing === "yearly" ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                Anual <span className="ml-1 text-xs opacity-80">(2 meses grátis)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => {
            const price = billing === "yearly" ? Math.round(p.yearly / 12) : p.monthly;
            return (
              <Card
                key={p.key}
                className={`relative flex flex-col p-6 ${
                  p.highlight ? "border-primary shadow-lg ring-1 ring-primary/30" : ""
                }`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Star className="mr-1 h-3 w-3" /> Mais escolhido
                  </Badge>
                )}
                <div className="text-lg font-bold">{p.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{p.tagline}</div>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">{brl(price)}</span>
                  <span className="pb-1 text-sm text-muted-foreground">/mês</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {billing === "yearly" ? `Faturado anualmente · ${brl(p.yearly)}/ano` : "Sem fidelidade"}
                </div>

                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center text-xs">
                  <div>
                    <div className="font-bold">{p.cap.users}</div>
                    <div className="text-muted-foreground">usuários</div>
                  </div>
                  <div>
                    <div className="font-bold">{p.cap.units}</div>
                    <div className="text-muted-foreground">unidades</div>
                  </div>
                  <div>
                    <div className="font-bold">{p.cap.integrations}</div>
                    <div className="text-muted-foreground">integrações</div>
                  </div>
                </div>

                <Button
                  className="mt-5 w-full"
                  variant={p.highlight ? "default" : "outline"}
                >
                  {p.key === "scale" ? "Falar com vendas" : "Começar 14 dias grátis"}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Precisa de algo maior?{" "}
          <span className="font-semibold text-foreground">Enterprise</span> inclui SSO,
          ambiente dedicado, BI white-label, contratos personalizados e SLA 99,99%.{" "}
          <Link to="/contato" className="text-primary underline-offset-4 hover:underline">
            Fale com nosso time →
          </Link>
        </div>
      </section>

      {/* Simulador de ROI */}
      <section className="container mx-auto px-4 py-4">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1fr_1fr]">
            <div className="border-b p-6 md:border-b-0 md:border-r">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Calculator className="h-3 w-3" /> Simulador de ROI
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                Coloque seus números. Veja o payback.
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <Label className="text-sm">Faturamento mensal estimado</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      value={revenue}
                      onChange={(e) => setRevenue(Number(e.target.value) || 0)}
                    />
                    <span className="text-sm text-muted-foreground">R$/mês</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Horas/mês gastas em tarefas manuais</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      value={adminHours}
                      onChange={(e) => setAdminHours(Number(e.target.value) || 0)}
                    />
                    <span className="text-sm text-muted-foreground">h</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">% no-show / clientes perdidos</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      value={noShowPct}
                      onChange={(e) => setNoShowPct(Number(e.target.value) || 0)}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Plano para simular</Label>
                  <div className="mt-2 flex gap-2">
                    {PLANS.map((p) => (
                      <Button
                        key={p.key}
                        size="sm"
                        variant={planForRoi === p.key ? "default" : "outline"}
                        onClick={() => setPlanForRoi(p.key)}
                      >
                        {p.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-6">
              <div className="text-sm text-muted-foreground">Resultado mensal projetado</div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-4xl font-bold text-emerald-600">{brl(roi.net)}</div>
                <div className="pb-1 text-sm text-muted-foreground">de ganho líquido</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                ROI <span className="font-semibold text-emerald-700">{roi.roiPct}%</span> · payback
                em <span className="font-semibold">{roi.paybackDays} dia{roi.paybackDays === 1 ? "" : "s"}</span>
              </div>

              <div className="mt-5 space-y-2">
                <RoiLine
                  icon={Users}
                  label={`Horas economizadas (${roi.hoursSaved}h)`}
                  value={brl(roi.hoursGain)}
                />
                <RoiLine
                  icon={TrendingUp}
                  label="Recuperação de no-shows"
                  value={brl(roi.noShowGain)}
                />
                <RoiLine
                  icon={Sparkles}
                  label="Upsell por CRM + automações"
                  value={brl(roi.upsell)}
                />
                <div className="my-3 border-t" />
                <RoiLine
                  icon={PiggyBank}
                  label="Ganho bruto total"
                  value={brl(roi.totalGain)}
                  strong
                />
                <RoiLine
                  icon={Receipt}
                  label="Custo do plano"
                  value={`- ${brl(roi.monthly)}`}
                />
              </div>

              <Button className="mt-5 w-full">
                Começar 14 dias grátis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Simulação com premissas conservadoras. Resultados variam por nicho e operação.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Comparativo */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Comparativo completo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada plano cobre o anterior — e adiciona o necessário para o próximo estágio.
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Funcionalidade</th>
                  <th className="px-4 py-3 text-center font-medium">Starter</th>
                  <th className="px-4 py-3 text-center font-medium">Pro</th>
                  <th className="px-4 py-3 text-center font-medium">Scale</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) => (
                  <tr key={f.name} className="border-t">
                    <td className="px-4 py-3 font-medium">{f.name}</td>
                    <td className="px-4 py-3 text-center">
                      <Cell value={f.starter} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Cell value={f.pro} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Cell value={f.scale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          {FAQS.map((f) => (
            <Card key={f.q} className="p-5">
              <div className="text-sm font-semibold">{f.q}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/showroom/onboarding">
              Ver onboarding incluso <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/showroom">Voltar ao hub</Link>
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function RoiLine({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof Calculator;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-2.5 text-sm ${
        strong ? "bg-background" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <span className={strong ? "font-bold" : "font-semibold"}>{value}</span>
    </div>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-600" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  return <span className="text-xs">{value}</span>;
}
