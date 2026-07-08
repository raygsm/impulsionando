/**
 * ═══════════════════════════════════════════════════════════════════
 *  Biblioteca de UI compartilhada do Ecossistema Impulsionando
 * ═══════════════════════════════════════════════════════════════════
 *
 * Primitivas visuais reutilizáveis por todos os tenants (CHRISMED,
 * RIOMED, Colors, Garrido, Marocas, Food Service, WMP e futuros).
 *
 * REGRA DE OURO: nenhum componente aqui hardcoda cor. Tudo respeita
 * o token de cor ativado pelo escopo do tenant via
 * `[data-tenant="<slug>"]` (ver src/styles/tokens-tenants.css) e
 * pelos tokens semânticos do design system global.
 *
 * Cada componente aceita `accentColor` opcional (CSS custom property
 * OU cor válida) para permitir tenants que ainda tenham identidade
 * legada. Sem esse override, cai no `--primary` do escopo.
 *
 * Uso típico dentro de um tenant:
 *   <div data-tenant="garrido">
 *     <TenantHero eyebrow="Imobiliária" title="Encontre seu imóvel" ... />
 *     <StatGrid stats={[...]} />
 *     <TestimonialGrid testimonials={[...]} />
 *     <FaqAccordion faqs={[...]} />
 *     <CtaBlock title="Pronto para começar?" ... />
 *   </div>
 *
 * Homologação: qualquer tenant novo criado pelo Core Impulsionando
 * DEVE preferir esses primitivos ao invés de reimplementar.
 */

export { TenantHero } from "./TenantHero";
export { StatGrid, Stat } from "./StatGrid";
export { TestimonialGrid, TestimonialCard } from "./TestimonialGrid";
export { FaqAccordion, buildFaqJsonLd } from "./FaqAccordion";
export { TrustBadges } from "./TrustBadges";
export { CtaBlock } from "./CtaBlock";
export { SectionHeader } from "./SectionHeader";
export { FeatureGrid } from "./FeatureGrid";
export { StepList } from "./StepList";

export type { TenantHeroProps } from "./TenantHero";
export type { StatItem } from "./StatGrid";
export type { Testimonial } from "./TestimonialGrid";
export type { FaqItem } from "./FaqAccordion";
export type { TrustBadge } from "./TrustBadges";
export type { FeatureItem } from "./FeatureGrid";
export type { StepItem } from "./StepList";
