import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Monitor, Smartphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listDemoTemplates } from "@/data/demo-templates/registry";
import { PLAN_LABEL, type DemoTemplate } from "@/data/demo-templates/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo/templates")({
  head: () => ({
    meta: [
      { title: "Templates de Demonstração — Impulsionando" },
      {
        name: "description",
        content: "Vitrine de demonstrações inteligentes por nicho, com previews mobile e desktop e geração de rascunho de site a partir do template escolhido.",
      },
      { property: "og:title", content: "Templates de Demonstração — Impulsionando" },
      {
        property: "og:description",
        content: "Compare demos por subnicho, veja previews responsivos e inicie um rascunho comercial pronto para conversão.",
      },
      { property: "og:url", content: "https://impulsionando.com.br/demo/templates" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/templates" }],
  }),
  component: DemoTemplatesVitrine,
});

type Viewport = "desktop" | "mobile";

function DemoTemplatesVitrine() {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const templates = listDemoTemplates();

  return (
    <main className="min-h-screen bg-muted/30">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-3 gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Demos inteligentes
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Vitrine técnica por subnicho
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Cada template mostra o produto com dados, plano recomendado, SEO próprio e fluxo de rascunho automático após a captura do lead.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Alternar viewport dos templates"
            className="inline-flex rounded-lg border bg-card p-1 text-sm shadow-sm"
          >
            <ViewportButton active={viewport === "desktop"} onClick={() => setViewport("desktop")} icon={Monitor} label="Desktop" />
            <ViewportButton active={viewport === "mobile"} onClick={() => setViewport("mobile")} icon={Smartphone} label="Mobile" />
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          {templates.map((template) => (
            <TemplateShowcase key={template.id} template={template} viewport={viewport} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ViewportButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Monitor; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-2 transition",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function TemplateShowcase({ template, viewport }: { template: DemoTemplate; viewport: Viewport }) {
  return (
    <Card className="grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="bg-background p-4 sm:p-6">
        <div className="flex justify-center">
          <div
            className={cn(
              "overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300",
              viewport === "mobile" ? "w-[360px] max-w-full" : "w-full",
            )}
          >
            <SmartPreview template={template} compact={viewport === "mobile"} />
          </div>
        </div>
      </div>

      <aside className="border-t bg-card p-5 lg:border-l lg:border-t-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {template.macroLabel} · {template.subLabel}
        </div>
        <h2 className="mt-2 text-xl font-semibold">{template.branding.businessName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{template.plans[template.recommendedPlan].benefit}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">Plano {PLAN_LABEL[template.recommendedPlan]}</Badge>
          <Badge variant="outline">SEO + Open Graph</Badge>
          <Badge variant="outline">Rascunho automático</Badge>
        </div>

        <div className="mt-5 grid gap-2 text-sm">
          {template.plans[template.recommendedPlan].extraFeatures.slice(0, 4).map((feature) => (
            <div key={feature} className="rounded-md border bg-background px-3 py-2">
              {feature}
            </div>
          ))}
        </div>

        <Button asChild className="mt-5 w-full gap-2">
          <Link to="/demo/$macro/$sub" params={{ macro: template.macro, sub: template.sub }}>
            Abrir demo e gerar rascunho <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </aside>
    </Card>
  );
}

function SmartPreview({ template, compact }: { template: DemoTemplate; compact: boolean }) {
  const indicators = template.indicators.slice(0, compact ? 2 : 4);
  return (
    <div className="min-h-[420px] bg-background">
      <div className="relative h-44 overflow-hidden sm:h-52">
        {template.branding.coverImage && (
          <img src={template.branding.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-background/30" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-flex rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
            {template.subLabel}
          </div>
          <h3 className="mt-2 max-w-xl text-xl font-semibold text-card-foreground sm:text-2xl">
            {template.branding.tagline}
          </h3>
        </div>
      </div>
      <div className={cn("grid gap-3 p-4", compact ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4")}>
        {indicators.map((indicator) => (
          <div key={indicator.id} className="rounded-md border bg-card p-3">
            <div className="text-xs text-muted-foreground">{indicator.label}</div>
            <div className="mt-1 text-lg font-semibold">{indicator.value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-2 px-4 pb-4">
        {template.alerts.slice(0, compact ? 2 : 3).map((alert) => (
          <div key={alert.id} className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="font-medium">{alert.title}</div>
            {!compact && <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}