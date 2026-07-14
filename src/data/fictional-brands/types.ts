/**
 * Empresas fictícias da Vitrine Impulsionando.
 * Cada marca é uma empresa completa e navegável.
 */
export type BrandPalette = {
  primary: string; // hex
  primaryFg: string;
  accent: string;
  surface: string;
  ink: string;
  muted: string;
  heroGradient: string; // full CSS gradient
};

export type BrandTypography = {
  heading: string; // font-family stack
  body: string;
};

export type BrandProduct = {
  id: string;
  name: string;
  category: string;
  priceLabel: string; // "R$ 189" | "a partir de R$ 89"
  description: string;
  highlight?: string; // "Mais pedido"
  imageGradient: string; // CSS gradient fallback (no external assets)
  emoji: string; // decorative glyph
};

export type BrandTeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  accent: string; // hex for avatar bg
};

export type BrandTestimonial = {
  author: string;
  role: string;
  quote: string;
  rating: number; // 1-5
};

export type BrandFaq = { question: string; answer: string };

export type BrandStat = { label: string; value: string; hint?: string };

export type BrandNavItem = { to: string; label: string };

export type BrandAdminOrder = {
  id: string;
  customer: string;
  when: string;
  total: string;
  status: "novo" | "producao" | "entregue" | "confirmado" | "concluido";
};

export type BrandAdminAppointment = {
  id: string;
  patient: string;
  service: string;
  when: string;
  professional: string;
};

export type FictionalBrand = {
  slug: string;
  companyName: string;
  tagline: string;
  domainFake: string; // "institutovitalis.com.br"
  sector: string;
  sectorLabel: string; // "Saúde · Multiespecialidade"
  palette: BrandPalette;
  typography: BrandTypography;
  logo: { mark: string; wordmark: string }; // inline SVG strings
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: { label: string; to: string };
    secondaryCta?: { label: string; to: string };
    stats: BrandStat[];
    imageGradient: string; // stylized cover
    imageEmoji: string;
  };
  highlights: { icon: "sparkle" | "shield" | "clock" | "heart" | "bolt" | "trend"; title: string; text: string }[];
  catalog: {
    label: string; // "Serviços" | "Cardápio" | "Imóveis"
    categories: { id: string; label: string }[];
    items: BrandProduct[];
  };
  about: {
    story: string;
    mission: string;
    values: { title: string; text: string }[];
    team: BrandTeamMember[];
  };
  testimonials: BrandTestimonial[];
  faq: BrandFaq[];
  contact: {
    whatsapp: string; // display only
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
  admin: {
    kpis: BrandStat[];
    orders?: BrandAdminOrder[];
    appointments?: BrandAdminAppointment[];
    funnel?: { stage: string; value: number }[];
    revenue?: { month: string; value: number }[];
  };
};
