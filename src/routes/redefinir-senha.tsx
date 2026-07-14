import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import {
  resolveRecoverySession,
  SUPABASE_REDIRECT_ALLOWLIST_PATTERN,
  validatePasswordConfirmation,
  type RecoverySessionStatus,
} from "@/lib/password-recovery";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Impulsionando" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta Impulsionando." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:url", content: "https://impulsionando.com.br/redefinir-senha" },
    ],
  }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RecoverySessionStatus>("missing");
  const [message, setMessage] = useState("Validando link de recuperação...");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validationMessage = useMemo(
    () => validatePasswordConfirmation(password, confirmation),
    [password, confirmation],
  );

  useEffect(() => {
    let active = true;
    resolveRecoverySession(supabase.auth, window.location)
      .then((result) => {
        if (!active) return;
        setStatus(result.status);
        setMessage(result.message ?? "Link validado. Defina sua nova senha.");
        if (result.status === "ready" && (window.location.hash || window.location.search.includes("code="))) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus("invalid");
        setMessage("Não foi possível validar o link de recuperação. Solicite um novo link e tente novamente.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting || status !== "ready") return;

    const invalid = validatePasswordConfirmation(password, confirmation);
    if (invalid) {
      setMessage(invalid);
      return;
    }

    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      setMessage("Não foi possível redefinir sua senha. Solicite um novo link ou tente novamente em instantes.");
      return;
    }

    setSuccess(true);
    setMessage("Senha redefinida com sucesso. Faça login novamente para continuar.");
    await supabase.auth.signOut({ scope: "local" });
    window.setTimeout(() => {
      navigate({ to: "/auth", search: { passwordReset: "success" } as never });
    }, 1800);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-elegant">
        <div className="mb-6 flex justify-center">
          <LogoImpulsionando variant="light" size="md" />
        </div>
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {success ? <CheckCircle2 className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">
            Use o link enviado por e-mail para cadastrar uma nova senha de acesso.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={status !== "ready" || submitting || success}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={status !== "ready" || submitting || success}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>

          {message ? (
            <p className={success ? "text-sm text-emerald-600" : "text-sm text-muted-foreground"} role="status">
              {message}
            </p>
          ) : null}
          {validationMessage && password && confirmation && !success ? (
            <p className="text-sm text-muted-foreground">{validationMessage}</p>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-gradient-primary shadow-elegant"
            disabled={status !== "ready" || submitting || Boolean(validationMessage) || success}
          >
            {submitting ? "Redefinindo..." : "Salvar nova senha"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/auth" className="text-primary hover:underline">
            Voltar para o login
          </Link>
        </div>
        <p className="sr-only">Allowlist Supabase configurada para {SUPABASE_REDIRECT_ALLOWLIST_PATTERN}</p>
      </Card>
    </main>
  );
}
