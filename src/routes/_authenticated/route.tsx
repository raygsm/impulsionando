import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { BillingGate } from "@/components/app/BillingGate";
import { WmpAuthenticatedShell } from "@/components/wmp/WmpAuthenticatedShell";

function isWmpHost() {
  return typeof window !== "undefined" && window.location.hostname.toLowerCase() === "wmp.impulsionando.com.br";
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  if (isWmpHost()) {
    return (
      <WmpAuthenticatedShell>
        <Outlet />
      </WmpAuthenticatedShell>
    );
  }

  return (
    <AppShell>
      <BillingGate />
      <Outlet />
    </AppShell>
  );
}
