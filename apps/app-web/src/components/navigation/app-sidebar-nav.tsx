"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardManifest } from "@impulsionando/contracts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getInitials } from "@/lib/utils";
import {
  Headset,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

const ICONS = {
  home: LayoutDashboard,
  growth: TrendingUp,
  customers: Users,
  operations: Wrench,
  management: Warehouse,
  help: Headset,
  settings: Settings,
} as const;

export function AppSidebarNav({ manifest }: { manifest: DashboardManifest }) {
  const pathname = usePathname();
  const initials = getInitials(manifest.tenant.name);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(manifest.tenant.logo_url) && !logoFailed;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-3 py-3">
        <div className="flex items-center gap-2">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={manifest.tenant.logo_url ?? ""}
              alt=""
              className="size-8 rounded-md object-cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{manifest.tenant.name}</p>
            <p className="truncate text-xs text-muted-foreground">Impulsionando</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Áreas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manifest.navigation.map((item) => {
                const Icon = ICONS[item.id];
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={active} disabled={!item.enabled} tooltip={item.label}>
                      <Link href={item.enabled ? item.href : "#"} aria-disabled={!item.enabled}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3 text-xs text-muted-foreground">
        {manifest.transitional ? "Manifesto transicional (não autoriza)" : null}
      </SidebarFooter>
    </Sidebar>
  );
}
