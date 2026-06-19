import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { isMaintenanceOn, setMaintenance } from "@/lib/maintenance";

export const Route = createFileRoute("/manutencao")({
  head: () => ({
    meta: [
      { title: "Em manutenção — Impulsionando" },
      { name: "description", content: "Estamos realizando uma atualização. Voltaremos em instantes." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Em manutenção — Impulsionando" },
      { property: "og:description", content: "Atualização em andamento. Voltaremos em instantes." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(isMaintenanceOn());
    const handler = () => setOn(isMaintenanceOn());
    window.addEventListener("maintenance:changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("maintenance:changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <LogoImpulsionando variant="light" size="lg" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Estamos atualizando o sistema
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          A nova plataforma está sendo publicada e o endereço{" "}
          <strong className="text-foreground">agenda.chrismed.com.br</strong> estará disponível em
          instantes. Agradecemos a paciência — nenhuma informação foi perdida.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Se você é um colaborador e precisa acessar o sistema agora, peça ao administrador para
          desativar o modo manutenção.
        </p>

        {!on && (
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Voltar ao sistema
            </Link>
          </div>
        )}

        {on && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                setMaintenance(false);
                setOn(false);
              }}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              Desativar manutenção (admin)
            </button>
            <Link
              to="/admin/manutencao"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              Abrir painel
            </Link>
          </div>
        )}

        <p className="mt-10 text-xs text-muted-foreground/70">
          Status: monitorável em{" "}
          <a href="/healthz" className="underline hover:text-foreground">
            /healthz
          </a>
        </p>
      </div>
    </div>
  );
}
