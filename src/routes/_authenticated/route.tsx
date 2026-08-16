import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { BillingGate } from "@/components/app/BillingGate";
import { WmpAuthenticatedShell } from "@/components/wmp/WmpAuthenticatedShell";

const WMP_TENANT_ID = "16f48d6b-b74a-4299-af9f-a8eba16d8e9c";

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

    if (isWmpHost()) {
      const { data: membership, error: membershipError } = await supabase
        .from("communication_tenant_members")
        .select("role")
        .eq("tenant_id", WMP_TENANT_ID)
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (membershipError || !membership) {
        await supabase.auth.signOut();
        throw redirect({ to: "/auth" });
      }
    }

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
