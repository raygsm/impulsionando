export function isLovableLegacyEnabled(): boolean {
  return process.env.LOVABLE_LEGACY_ENABLED === "true";
}

export function assertLovableLegacyEnabled() {
  if (!isLovableLegacyEnabled()) {
    throw new Error("lovable_legacy_disabled");
  }
}

export function getLovableLegacyApiKey(): string | null {
  if (!isLovableLegacyEnabled()) return null;
  return process.env.LOVABLE_API_KEY || null;
}

export function getRequiredLovableLegacyApiKey(): string {
  const key = getLovableLegacyApiKey();
  if (!key) throw new Error("LOVABLE legacy is disabled or LOVABLE_API_KEY is not configured");
  return key;
}
