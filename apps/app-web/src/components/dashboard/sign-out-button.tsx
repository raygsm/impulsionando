"use client";

import { createBrowserSupabase } from "@impulsionando/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && key) {
      const supabase = createBrowserSupabase({ url, anonKey: key });
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }
  return (
    <Button variant="ghost" size="sm" onClick={() => void signOut()}>
      Sair
    </Button>
  );
}
