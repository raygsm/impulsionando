import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MailCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/reset-password-sent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verifique seu e-mail — Impulsionando Sistemas" },
      { name: "description", content: "Solicitação de redefinição de senha enviada." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordSentPage,
});

function ResetPasswordSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-semibold tracking-tight">Impulsionando</span>
        </div>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Verifique seu e-mail</h1>
            <p className="text-sm text-muted-foreground">
              Se o endereço informado estiver associado a uma conta, você receberá em breve um e-mail com instruções para redefinir sua senha.
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-2 w-full">
            <p className="font-medium text-foreground">Instruções de segurança:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>O link de redefinição expira em 1 hora.</li>
              <li>Se não receber em alguns minutos, verifique a caixa de spam ou lixo eletrônico.</li>
              <li>Nunca compartilhe o link de redefinição com terceiros.</li>
              <li>Caso não tenha solicitado esta recuperação, ignore o e-mail.</li>
            </ul>
          </div>

          <div className="w-full space-y-2 pt-2">
            <Button asChild className="w-full bg-gradient-primary">
              <Link to="/auth">Voltar para o login</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
