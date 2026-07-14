import type { DemoTemplate } from "@/data/demo-templates/types";

export const DEMO_SITE_DRAFTS_KEY = "impulsionando:demo-site-drafts";

export type DemoOnboardingInput = {
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  teamSize: string;
  monthlyRevenue: string;
  goal: string;
  planLabel: string;
};

export type DemoGeneratedSiteDraft = {
  id: string;
  createdAt: string;
  templateId: string;
  macro: string;
  sub: string;
  companyName: string;
  contactName: string;
  contact: { email: string; phone: string; city: string };
  qualification: { teamSize: string; monthlyRevenue: string; goal: string; planLabel: string };
  hero: { title: string; subtitle: string; image?: string; cta: string };
  sections: { title: string; description: string; bullets: string[] }[];
  seo: { title: string; description: string; ogImage?: string };
};

const clean = (value: string | undefined | null) => value?.trim() ?? "";

export function buildDemoSiteDraft(template: DemoTemplate, input: DemoOnboardingInput): DemoGeneratedSiteDraft {
  const companyName = clean(input.company) || template.branding.businessName;
  const goal = clean(input.goal) || `organizar ${template.terminology.order.toLowerCase()} e converter mais clientes`;
  const city = clean(input.city);
  const plan = template.plans[template.recommendedPlan];
  const primaryTable = template.tables[0];
  const tableBullets = primaryTable?.rows
    .slice(0, 3)
    .map((row) => String(row[primaryTable.columns[0]?.key] ?? ""))
    .filter(Boolean) ?? [];

  return {
    id: `demo-draft-${template.id}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    templateId: template.id,
    macro: template.macro,
    sub: template.sub,
    companyName,
    contactName: clean(input.name),
    contact: {
      email: clean(input.email),
      phone: clean(input.phone),
      city,
    },
    qualification: {
      teamSize: clean(input.teamSize),
      monthlyRevenue: clean(input.monthlyRevenue),
      goal,
      planLabel: input.planLabel,
    },
    hero: {
      title: `${companyName}: ${template.branding.tagline}`,
      subtitle: `${template.subLabel}${city ? ` em ${city}` : ""} com experiência digital pronta para captar, qualificar e converter. Foco inicial: ${goal}.`,
      image: template.branding.coverImage,
      cta: template.conversion.primaryCTA,
    },
    sections: [
      {
        title: `Experiência para ${template.terminology.customer.toLowerCase()}`,
        description: plan.headline,
        bullets: plan.extraFeatures.slice(0, 4),
      },
      {
        title: `${template.terminology.product} em destaque`,
        description: primaryTable?.title ?? `Principais ${template.terminology.product.toLowerCase()}s organizados para conversão.`,
        bullets: tableBullets.length ? tableBullets : template.actions.slice(0, 3).map((a) => a.label),
      },
      {
        title: "Provas de operação",
        description: "Indicadores do template viram argumentos comerciais e blocos de confiança no site.",
        bullets: template.indicators.slice(0, 3).map((indicator) => `${indicator.label}: ${indicator.value}`),
      },
      {
        title: "Conversão e relacionamento",
        description: `Fluxo recomendado no plano ${input.planLabel}: captura, atendimento, automação e acompanhamento pelo funil Impulsionando.`,
        bullets: template.alerts.slice(0, 3).map((alert) => alert.title),
      },
    ],
    seo: {
      title: `${companyName} — ${template.subLabel} | Impulsionando`,
      description: `${template.subLabel} com site, automação e funil comercial: ${plan.benefit}`.slice(0, 155),
      ogImage: template.seo.ogImage ?? template.branding.coverImage,
    },
  };
}

export function loadDemoSiteDrafts(): DemoGeneratedSiteDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_SITE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDemoSiteDraft(draft: DemoGeneratedSiteDraft): void {
  if (typeof window === "undefined") return;
  const drafts = loadDemoSiteDrafts();
  window.localStorage.setItem(DEMO_SITE_DRAFTS_KEY, JSON.stringify([draft, ...drafts].slice(0, 30)));
}