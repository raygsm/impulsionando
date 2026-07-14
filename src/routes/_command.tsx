import { createFileRoute, redirect } from "@tanstack/react-router";
import { CommandShell } from "@/components/command/CommandShell";

export const Route = createFileRoute("/_command")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Command · Impulsionando" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: CommandShell,
});
