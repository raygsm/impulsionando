import { notFound } from "next/navigation";
import { composeDashboardManifest } from "@/lib/modules/manifest";
import { getFixture } from "@/lib/modules/fixtures";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebarNav } from "@/components/navigation/app-sidebar-nav";
import { BrandingStyle } from "@/components/dashboard/branding-style";
import { AreaWidgets } from "@/components/dashboard/area-widgets";
import { InternalAgentDock } from "@/components/agents/internal-agent-dock";
import type { DashboardAreaId } from "@impulsionando/contracts";

/**
 * Development/visual fixture only. 404 in production.
 * Not authorization. Not live tenant data.
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ fixture: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { fixture } = await params;
  const { area } = await searchParams;
  const row = getFixture(fixture);
  if (!row) notFound();
  const manifest = composeDashboardManifest({
    config: row.config,
    entitlements: row.entitlements,
    role: row.role,
    agent: null,
  });
  const areaId = (area ?? "home") as DashboardAreaId;
  return (
    <SidebarProvider>
      <BrandingStyle manifest={manifest} />
      <AppSidebarNav manifest={manifest} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            Preview · {row.label} · {manifest.tenant.name}
          </p>
        </header>
        <div className="space-y-6 p-4 md:p-6">
          <p className="text-xs text-muted-foreground">Fixture de UI — não é dado de produção nem autorização.</p>
          <AreaWidgets manifest={manifest} area={["home", "growth", "customers", "operations", "management"].includes(areaId) ? areaId : "home"} />
        </div>
      </SidebarInset>
      <InternalAgentDock agent={manifest.agent} />
    </SidebarProvider>
  );
}
