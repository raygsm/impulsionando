"use client";

import { useState, type FormEvent } from "react";
import { createBrowserSupabase } from "@impulsionando/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setError("Supabase público não configurado.");
      return;
    }
    const supabase = createBrowserSupabase({ url, anonKey: key });
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/login`,
    });
    if (resetError) setError(resetError.message);
    else setDone(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="mb-4 text-2xl font-semibold">Redefinir senha</h1>
      {done ? (
        <Alert>
          <AlertDescription>Se o e-mail existir, enviaremos o link de redefinição.</AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          {error ? <Alert variant="destructive">{error}</Alert> : null}
          <div className="grid gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit">Enviar link</Button>
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link href="/login" className="underline">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
