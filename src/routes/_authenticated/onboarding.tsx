import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { OnboardingWizard } from "@/components/core/OnboardingWizard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Configuração inicial — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { data: me } = useCurrentUser();
  const companyId = me?.memberships?.[0]?.company_id;

  if (!companyId) {
    return (
      <Card className="p-6 max-w-xl mx-auto">
        <h2 className="font-semibold mb-2">Empresa não encontrada</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Não foi possível identificar sua empresa. Entre em contato com o suporte.
        </p>
        <Button asChild variant="outline"><Link to="/dashboard">Voltar</Link></Button>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Configuração inicial</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo ao Impulsionando! Vamos configurar o domínio e os e-mails da sua empresa.
        </p>
      </div>
      <OnboardingWizard companyId={companyId} />
    </div>
  );
}
