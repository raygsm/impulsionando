/**
 * Onda 2.9 — Breadcrumbs Garrido agora reexporta o primitivo compartilhado
 * `Breadcrumbs` de `@/components/impulsionando`. Mantido para retro-compat
 * com rotas Garrido; novas rotas devem importar direto do shared.
 */
export {
  Breadcrumbs as GarridoBreadcrumbs,
  buildBreadcrumbJsonLd as buildGarridoBreadcrumbJsonLd,
} from "@/components/impulsionando";
export type { Crumb } from "@/components/impulsionando";
