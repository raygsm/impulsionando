import type { DashboardManifest } from "@impulsionando/contracts";

/** Applies tenant primary/accent as CSS variables without a per-tenant stylesheet. */
export function BrandingStyle({ manifest }: { manifest: DashboardManifest }) {
  const primary = manifest.tenant.primary_color;
  if (!primary) return null;
  const css = `:root { --primary: ${primary}; --sidebar-primary: ${primary}; --ring: ${primary}; }`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
