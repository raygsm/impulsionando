import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "Pagamento confirmado | Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-bold">Pagamento confirmado!</h1>
        <p className="text-muted-foreground">
          Sua assinatura foi ativada. Em instantes você recebe os acessos por
          e-mail e WhatsApp. Já pode entrar no painel.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">Ir para o painel</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
