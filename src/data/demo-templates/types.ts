// Motor de templates de demonstração — fonte única de verdade.
// Cada template descreve um subnicho e é adaptável por plano (Essencial | Ideal | Full).

export type DemoPlanId = "essential" | "ideal" | "full";

export const PLAN_LABEL: Record<DemoPlanId, string> = {
  essential: "Essencial",
  ideal: "Ideal",
  full: "Full",
};

export const PLAN_ORDER: DemoPlanId[] = ["essential", "ideal", "full"];

export type DemoIndicator = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "flat";
  minPlan?: DemoPlanId;
};

export type DemoAlert = {
  id: string;
  severity: "info" | "warning" | "critical" | "opportunity";
  title: string;
  message: string;
  minPlan?: DemoPlanId;
};

export type DemoAction = {
  id: string;
  label: string;
  helper?: string;
  minPlan?: DemoPlanId;
};

export type DemoMenuItem = {
  id: string;
  label: string;
  icon?: string;
  minPlan?: DemoPlanId;
  description?: string;
};

export type DemoPlanConfig = {
  headline: string;
  benefit: string;
  extraFeatures: string[];
};

export type DemoSampleRow = Record<string, string | number>;

export type DemoSampleTable = {
  id: string;
  title: string;
  columns: { key: string; label: string }[];
  rows: DemoSampleRow[];
  minPlan?: DemoPlanId;
};

export type DemoTemplate = {
  id: string;
  macro: string; // slug macro-nicho ex: "alimentacao"
  sub: string; // slug subnicho ex: "restaurante"
  macroLabel: string;
  subLabel: string;
  version: number;
  status: "draft" | "active" | "archived";
  branding: {
    businessName: string;
    tagline: string;
    coverImage?: string;
  };
  terminology: Record<string, string>;
  menu: DemoMenuItem[];
  indicators: DemoIndicator[];
  alerts: DemoAlert[];
  actions: DemoAction[];
  tables: DemoSampleTable[];
  plans: Record<DemoPlanId, DemoPlanConfig>;
  recommendedPlan: DemoPlanId;
  conversion: {
    primaryCTA: string;
    secondaryCTA: string;
  };
  seo: {
    title: string;
    description: string;
    ogImage?: string;
  };
};
