/**
 * ═══════════════════════════════════════════════════════════════════
 *  Primitivos CHRISMED — Onda V1 (Quiet Luxury)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Design system CHRISMED consolidado em 11/07/2026. Direção aprovada:
 * "B — Quiet Luxury" (marfim + carvão + champagne, editorial premium).
 *
 * REGRAS DE OURO:
 * 1. Só usar dentro de escopo [data-tenant="chrismed"] (ChrismedShell).
 * 2. NUNCA hardcodar cores fora dos tokens --chrismed-*.
 * 3. Placeholders técnicos ({{...}}, "pendente", preços fake) são PROIBIDOS.
 *    Conteúdo não validado é ocultado, não exibido como placeholder.
 * 4. Oliver é o ÚNICO ponto de conversa. Nenhum primitivo aponta ao WhatsApp.
 * 5. Retrato da Dra. Cristiane só é publicado se `src` autorizado for passado.
 *    Fallback é uma superfície bone silenciosa — nunca rosto genérico.
 *
 * Tokens: src/styles/tokens-tenants.css (bloco CHRISMED V1).
 * Fontes: Cormorant Garamond (serif) + Inter (sans), carregadas em __root.tsx.
 */

export { ChrismedContainer } from "./ChrismedContainer";
export { ChrismedSection } from "./ChrismedSection";
export { ChrismedHeading } from "./ChrismedHeading";
export { ChrismedEyebrow } from "./ChrismedEyebrow";
export { ChrismedButton } from "./ChrismedButton";
export type { ChrismedButtonProps } from "./ChrismedButton";
export { ChrismedCard } from "./ChrismedCard";
export { ChrismedPortrait } from "./ChrismedPortrait";
export { ChrismedStat } from "./ChrismedStat";
export { ChrismedModalityCard } from "./ChrismedModalityCard";
export { ChrismedOliverLauncher } from "./ChrismedOliverLauncher";
export { ChrismedLanguageSelector } from "./ChrismedLanguageSelector";
export { ChrismedTrustBar } from "./ChrismedTrustBar";
export { ChrismedFollowUpCard } from "./ChrismedFollowUpCard";
