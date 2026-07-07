import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  passwordSchema,
  scorePasswordStrength,
  validatePasswordAgainstEmail,
  PASSWORD_MIN_LENGTH,
} from "@/lib/security/password-policy";

export const Route = createFileRoute("/_authenticated/seguranca/senha")({
  component: PasswordPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Página não encontrada.</div>,
});

function PasswordPage() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const strength = scorePasswordStrength(pwd);
  const barColor = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"][
    strength.score
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    const parsed = passwordSchema.safeParse(pwd);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    const { data: user } = await supabase.auth.getUser();
    const emailErr = validatePasswordAgainstEmail(pwd, user.user?.email);
    if (emailErr) return toast.error(emailErr);

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso.");
    setPwd("");
    setConfirm("");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Alterar Senha</h1>
        <p className="text-muted-foreground">
          Mínimo {PASSWORD_MIN_LENGTH} caracteres com maiúscula, minúscula, número e especial.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>Você pode alterá-la novamente a qualquer momento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input
              type="password"
              placeholder="Nova senha"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
              required
            />
            {pwd && (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                  <div
                    className={`h-full ${barColor} transition-all`}
                    style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">Força: {strength.label}</div>
              </div>
            )}
            <Input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
