import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NichoPage } from "@/components/marketing/NichoPage";
import { findNicho, type NichoDetail } from "@/components/marketing/nichoDetails";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

export const Route = createFileRoute("/nichos/$slug")({
  loader: ({ params }): { nicho: NichoDetail } => {
    const nicho = findNicho(params.slug);
    if (!nicho) throw notFound();
    return { nicho };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.nicho;
    const title = n ? `${n.shortLabel} — Impulsionando Tecnologia` : "Nicho — Impulsionando";
    const description = n?.subtitle ?? "Soluções por nicho da Impulsionando.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: NichoSlugPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Nicho não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O nicho que você procura ainda não foi publicado.
          </p>
          <Button asChild>
            <Link to="/nichos">Ver todos os nichos</Link>
          </Button>
        </div>
      </div>
      <PublicFooter />
    </div>
  ),
});

function NichoSlugPage() {
  const { nicho } = Route.useLoaderData() as { nicho: NichoDetail };
  return <NichoPage nicho={nicho} />;
}
