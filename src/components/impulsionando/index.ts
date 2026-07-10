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
 * Uso típico dentro de um tenant:
 *   <div data-tenant="garrido">
 *     <TenantHero eyebrow="Imobiliária" title="Encontre seu imóvel" ... />
 *     <StatGrid stats={[...]} />
 *     <TestimonialGrid testimonials={[...]} />
 *     <FaqAccordion faqs={[...]} />
 *     <CtaBlock title="Pronto para começar?" ... />
 *     <MoreContentFab bg="var(--garrido-ink)" accent="var(--garrido-gold)" />
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
export { MoreContentFab } from "./MoreContentFab";
export { Breadcrumbs, buildBreadcrumbJsonLd } from "./Breadcrumbs";
export { SupportFab } from "./SupportFab";
export { CoreSection } from "./CoreSection";
export { LoadingState } from "./LoadingState";
export { EmptyState } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export { SkipLink } from "./SkipLink";
export { PageHeader } from "./PageHeader";
export { MetricCard } from "./MetricCard";
export { KpiGrid } from "./KpiGrid";
export { StatusBanner } from "./StatusBanner";

export type { TenantHeroProps } from "./TenantHero";
export type { StatItem } from "./StatGrid";
export type { Testimonial } from "./TestimonialGrid";
export type { FaqItem } from "./FaqAccordion";
export type { TrustBadge } from "./TrustBadges";
export type { FeatureItem } from "./FeatureGrid";
export type { StepItem } from "./StepList";
export type { MoreContentFabProps } from "./MoreContentFab";
export type { Crumb, BreadcrumbsProps } from "./Breadcrumbs";
export type { SupportOption, SupportFabProps } from "./SupportFab";
export type { CoreSectionProps } from "./CoreSection";
export type { LoadingStateProps } from "./LoadingState";
export type { EmptyStateProps } from "./EmptyState";
export type { ErrorStateProps } from "./ErrorState";
export type { PageHeaderProps } from "./PageHeader";
export type { MetricCardProps, MetricTone } from "./MetricCard";
export type { KpiGridProps } from "./KpiGrid";
export type { StatusBannerProps, BannerTone } from "./StatusBanner";
