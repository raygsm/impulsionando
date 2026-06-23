import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NichoPage } from "@/components/marketing/NichoPage";
import { findNicho, type NichoDetail } from "@/components/marketing/nichoDetails";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

/**
 * Aliases para slugs antigos/variações comuns digitadas em links externos.
 * Mantém /nichos/<alias> funcional redirecionando para o slug canônico.
 */
const SLUG_ALIASES: Record<string, string> = {
  "clinicas-medicas": "clinicas",
  "clinica": "clinicas",
  "clinica-medica": "clinicas",
  "consultorio": "clinicas",
  "consultorios": "clinicas",
  "restaurantes": "bares-restaurantes",
  "bares": "bares-restaurantes",
  "bar": "bares-restaurantes",
  "restaurante": "bares-restaurantes",
  "cervejaria": "microcervejarias",
  "cervejarias": "microcervejarias",
  "imoveis": "imobiliaria",
  "imobiliarias": "imobiliaria",
  "advocacia": "juridico",
  "escritorio-advocacia": "juridico",
  "psicologos": "psicologia",
  "psicologo": "psicologia",
  "contador": "contabilidade",
  "contadores": "contabilidade",
  "academia": "fitness",
  "academias": "fitness",
  "escola": "educacao",
  "escolas": "educacao",
  "auto": "veiculos",
  "automotivo": "veiculos",
  "ecomerce": "ecommerce",
  "loja-virtual": "ecommerce",
};

export const Route = createFileRoute("/nichos/$slug")({
  loader: ({ params }): { nicho: NichoDetail } => {
    const slug = params.slug;
    const canonical = SLUG_ALIASES[slug] ?? slug;
    const nicho = findNicho(canonical);
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
