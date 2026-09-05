import type { CSSProperties } from "react";

import { APP_CONFIG } from "@/config/app-config";

/**
 * Optional tenant/login chrome personalization.
 * Extension point only — no Nest/API wiring yet. Pass from a future loader when tenant branding is available.
 */
export type LoginPersonalization = {
  /** Display name under the mark. Defaults to Impulsionando. */
  name?: string;
  /** Logo src (SVG/PNG). Defaults to Impulsionando mark. */
  logoSrc?: string;
  /** Contrast-safe action hex. When set, remaps --primary / --ring / --imp-action on the login root. */
  actionColor?: string;
  /** Short supporting line. Defaults to product meta description. */
  tagline?: string;
};

export const DEFAULT_LOGIN_PERSONALIZATION = {
  name: APP_CONFIG.name,
  logoSrc: "/brand/impulsionando/mark.svg",
  tagline: APP_CONFIG.meta.description,
} as const satisfies Required<Pick<LoginPersonalization, "name" | "logoSrc" | "tagline">>;

export function resolveLoginPersonalization(overrides?: LoginPersonalization) {
  return {
    name: overrides?.name?.trim() || DEFAULT_LOGIN_PERSONALIZATION.name,
    logoSrc: overrides?.logoSrc?.trim() || DEFAULT_LOGIN_PERSONALIZATION.logoSrc,
    tagline: overrides?.tagline?.trim() || DEFAULT_LOGIN_PERSONALIZATION.tagline,
    actionColor: overrides?.actionColor?.trim() || undefined,
  };
}

/** Inline style for optional tenant action color without inventing a Nest API. */
export function loginActionStyle(actionColor?: string): CSSProperties | undefined {
  if (!actionColor) return undefined;
  return {
    ["--imp-action" as string]: actionColor,
    ["--primary" as string]: actionColor,
    ["--ring" as string]: actionColor,
    ["--sidebar-primary" as string]: actionColor,
    ["--sidebar-ring" as string]: actionColor,
  };
}
