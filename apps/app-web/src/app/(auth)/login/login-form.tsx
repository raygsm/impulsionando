"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@impulsionando/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setError("Supabase público não configurado (nomes: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
      setBusy(false);
      return;
    }
    const supabase = createBrowserSupabase({ url, anonKey: key });
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    if (signError) {
      setError(signError.message);
      setBusy(false);
      return;
    }
    router.push(next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível entrar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link href="/reset-password" className="underline">
          Esqueci a senha
        </Link>
      </p>
    </form>
  );
}
