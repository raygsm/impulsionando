import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seguranca/mfa")({
  component: MfaPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Página não encontrada.</div>,
});

type Factor = { id: string; friendly_name?: string | null; status: string; factor_type: string };

function MfaPage() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qr, setQr] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) toast.error(error.message);
    setFactors(((data?.all ?? []) as Factor[]).filter((f) => f.factor_type === "totp"));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function startEnroll() {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Impulsionando · ${new Date().toLocaleDateString("pt-BR")}`,
    });
    setEnrolling(false);
    if (error || !data) {
      toast.error(error?.message ?? "Falha ao iniciar MFA");
      return;
    }
    setQr({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verifyEnroll() {
    if (!qr) return;
    setVerifying(true);
    const { data: chal, error: cErr } = await supabase.auth.mfa.challenge({ factorId: qr.id });
    if (cErr || !chal) {
      setVerifying(false);
      toast.error(cErr?.message ?? "Falha no desafio");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: qr.id,
      challengeId: chal.id,
      code,
    });
    setVerifying(false);
    if (vErr) {
      toast.error(vErr.message);
      return;
    }
    toast.success("MFA ativado com sucesso");
    setQr(null);
    setCode("");
    await refresh();
  }

  async function unenroll(factorId: string) {
    if (!confirm("Remover este fator MFA?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) return toast.error(error.message);
    toast.success("Fator removido");
    await refresh();
  }

  const verified = factors.some((f) => f.status === "verified");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Autenticação em Duas Etapas (MFA)</h1>
        <p className="text-muted-foreground">
          Obrigatório para administradores. Use um app TOTP (Google Authenticator, 1Password, Authy).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {verified ? (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            )}
            Status
          </CardTitle>
          <CardDescription>
            {verified ? "MFA está ativo na sua conta." : "MFA ainda não foi ativado."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {!loading &&
            factors.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{f.friendly_name ?? "TOTP"}</div>
                  <div className="text-muted-foreground">
                    Status: {f.status === "verified" ? "verificado" : "pendente"}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => unenroll(f.id)}>
                  Remover
                </Button>
              </div>
            ))}

          {!qr && (
            <Button onClick={startEnroll} disabled={enrolling}>
              {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar novo fator TOTP
            </Button>
          )}

          {qr && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="text-sm">
                Escaneie o QR code com seu app de autenticação e digite o código de 6 dígitos:
              </div>
              <img src={qr.qr} alt="QR Code MFA" className="mx-auto h-48 w-48" />
              <div className="text-xs text-muted-foreground break-all">
                Ou digite manualmente: <code className="font-mono">{qr.secret}</code>
              </div>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <div className="flex gap-2">
                <Button onClick={verifyEnroll} disabled={verifying || code.length !== 6}>
                  {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verificar e ativar
                </Button>
                <Button variant="ghost" onClick={() => setQr(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Ao ativar o MFA, você precisará digitar o código do seu app a cada novo login em novos
        dispositivos. Você pode alterar sua senha e reconfigurar o MFA a qualquer momento.
      </p>
    </div>
  );
}
