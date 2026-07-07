import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageElements";
import { AllAreasPanel } from "@/components/app/AllAreasPanel";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Core Impulsionando" },
      {
        name: "description",
        content:
          "Todos os recursos do Core Impulsionando organizados em 11 áreas empresariais.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InicioPage,
});

function InicioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Início"
        description="Sua central única de navegação. Encontre qualquer recurso em segundos."
      />
      <AllAreasPanel />
    </div>
  );
}
