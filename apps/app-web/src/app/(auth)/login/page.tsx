import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="mb-2 text-2xl font-semibold">Impulsionando</h1>
      <p className="mb-6 text-sm text-muted-foreground">Acesso ao painel autenticado.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
