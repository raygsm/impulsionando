import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { NICHO_DETAILS } from "@/components/marketing/nichoDetails";
import { NICHE_MODULE_SLUGS, type RecLevel } from "@/data/nicheRecommendations";

const SearchSchema = z.object({
  niche: z.string().optional(),
  plan: z.enum(["essencial", "ideal", "full"]).optional(),
});

export const Route = createFileRoute("/demo/escolher-nicho")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Escolha seu nicho — Demonstração Impulsionando" },
      { name: "description", content: "Selecione seu nicho e veja os módulos inclusos em cada plano antes de explorar a demonstração ao vivo." },
      { property: "og:title", content: "Demo Impulsionando — comece pelo seu nicho" },
      { property: "og:description", content: "Veja os módulos inclusos no Essencial, Ideal e Full do seu nicho e simule sua operação." },
    ],
  }),
  component: EscolherNicho,
});

const MODULE_LABELS: Record<string, string> = {
  pdv: "PDV / Caixa",
  automacao: "Automação & WhatsApp",
  area_cliente: "Área do Cliente",
  crm: "CRM & Funil",
  fidelizacao: "Fidelização / Clube",
  bi: "BI & Relatórios",
  commerce: "E-commerce / Checkout",
  eventos: "Eventos & Ingressos",
  agenda: "Agenda & Reservas",
  saude: "Prontuário & Saúde",
  estoque: "Estoque & Compras",
  parceiros: "Parceiros & Afiliados",
  erp: "ERP & Financeiro",
  white_label: "White-Label",
};

const PLAN_META: Record<RecLevel, { name: string; price: string; tagline: string; accent: string }> = {
  essencial: { name: "Essencial", price: "½ salário mínimo / mês", tagline: "Comece pelo módulo que mais dói", accent: "from-blue-500 to-cyan-500" },
  ideal: { name: "Ideal (Integrado)", price: "1 salário mínimo / mês", tagline: "Módulos integrados com automação", accent: "from-violet-500 to-fuchsia-500" },
  full: { name: "Full (Avançado)", price: "2 salários mínimos / mês", tagline: "Operação multiunidade + IA avançada", accent: "from-pink-500 to-rose-500" },
};

function EscolherNicho() {
  const { niche, plan } = Route.useSearch();
  const navigate = useNavigate();
  const [selectedNiche, setSelectedNiche] = useState<string | undefined>(niche);
  const [selectedPlan, setSelectedPlan] = useState<RecLevel | undefined>(plan);

  const nichosWithPlans = NICHO_DETAILS.filter((n) => NICHE_MODULE_SLUGS[n.slug]);
  const plansForNiche = selectedNiche ? NICHE_MODULE_SLUGS[selectedNiche] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="text-center mb-8">
          <Badge className="bg-gradient-primary mb-3"><Sparkles className="w-3 h-3 mr-1" /> Passo 1 de 3</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Comece pelo seu nicho</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Cada nicho tem módulos sob medida. Escolha o seu para ver o que vem em cada plano — depois você simula tudo ao vivo.
          </p>
        </div>

        <section aria-labelledby="nichos" className="mb-10">
          <h2 id="nichos" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Selecione seu nicho</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {nichosWithPlans.map((n) => (
              <button
                key={n.slug}
                type="button"
                onClick={() => { setSelectedNiche(n.slug); setSelectedPlan(undefined); }}
                className={`text-left rounded-xl border p-4 transition hover:border-primary hover:shadow-md ${
                  selectedNiche === n.slug ? "border-primary bg-primary/5 shadow-md" : "border-border"
                }`}
              >
                <div className="font-semibold">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.subtitle ?? ""}</div>
              </button>
            ))}
          </div>
        </section>

        {selectedNiche && plansForNiche && (
          <section aria-labelledby="planos" className="mb-10">
            <h2 id="planos" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Planos disponíveis para {NICHO_DETAILS.find((n) => n.slug === selectedNiche)?.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {(Object.keys(PLAN_META) as RecLevel[]).map((tier) => {
                const meta = PLAN_META[tier];
                const mods = plansForNiche[tier];
                const active = selectedPlan === tier;
                return (
                  <Card key={tier} className={`relative overflow-hidden cursor-pointer transition ${active ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"}`} onClick={() => setSelectedPlan(tier)}>
                    <div className={`h-1 bg-gradient-to-r ${meta.accent}`} />
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {meta.name}
                        {active && <Badge className="bg-primary">Selecionado</Badge>}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">{meta.tagline}</div>
                      <div className="text-base font-semibold mt-1">{meta.price}</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Módulos inclusos</div>
                      <ul className="space-y-1.5 text-sm">
                        {mods.map((slug) => (
                          <li key={slug} className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                            <span>{MODULE_LABELS[slug] ?? slug}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
          <Button
            size="lg"
            className="bg-gradient-primary"
            disabled={!selectedNiche || !selectedPlan}
            onClick={() => navigate({ to: "/demo/cadastro", search: { niche: selectedNiche!, plan: selectedPlan! } })}
          >
            Continuar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
