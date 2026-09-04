import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";
import { Separator } from "@/components/ui/separator";
import { AppSidebarNav } from "@/components/navigation/app-sidebar-nav";
import { BrandingStyle } from "@/components/dashboard/branding-style";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { readAccessToken } from "@/lib/auth/session";
import { loadDashboardManifest } from "@/lib/modules/load-manifest";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { AgentChatBridge } from "@/components/agents/agent-chat-bridge";

export default async function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const token = await readAccessToken();
  if (!token) redirect("/login");

  const loaded = await loadDashboardManifest(token);
  if (!loaded.ok && loaded.reason === "unauthenticated") redirect("/login");

  if (!loaded.ok) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Alert variant="destructive" data-state={loaded.reason}>
          <AlertTitle>Painel indisponível</AlertTitle>
          <AlertDescription>{loaded.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { manifest, tenantId } = loaded;

  return (
    <SidebarProvider>
      <BrandingStyle manifest={manifest} />
      <AppSidebarNav manifest={manifest} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{manifest.tenant.name}</p>
          <SignOutButton />
        </header>
        <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <AgentChatBridge tenantId={tenantId} agent={manifest.agent} />
    </SidebarProvider>
  );
}
