import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getFictionalBrand } from "@/data/fictional-brands/registry";
import { BrandThemeProvider } from "@/components/fictional-brand/BrandThemeProvider";
import { BrandShell } from "@/components/fictional-brand/BrandShell";
import { BrandHome } from "@/components/fictional-brand/BrandHome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/templates/$brand/")({
  head: ({ params }) => {
    const b = getFictionalBrand(params.brand);
    if (!b) return { meta: [{ title: "Empresa não encontrada — Impulsionando" }, { name: "robots", content: "noindex" }] };
    const url = `https://impulsionando.com.br/templates/${b.slug}`;
    return {
      meta: [
        { title: `${b.companyName} — ${b.tagline}` },
        { name: "description", content: b.hero.subtitle },
        { property: "og:title", content: `${b.companyName} — ${b.tagline}` },
        { property: "og:description", content: b.hero.subtitle },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: ({ params }) => {
    const b = getFictionalBrand(params.brand);
    if (!b) throw notFound();
    return { slug: b.slug };
  },
  component: Page,
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <p className="text-destructive">Erro: {String(error)}</p>
        <Button onClick={reset} className="mt-4">Tentar novamente</Button>
      </div>
    </div>
  ),
});

function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">Empresa fictícia não encontrada</h1>
        <Button asChild className="mt-4"><Link to="/templates">Ver todas as empresas</Link></Button>
      </div>
    </div>
  );
}

function Page() {
  const { brand: slug } = Route.useParams();
  const brand = getFictionalBrand(slug)!;
  return (
    <BrandThemeProvider brand={brand}>
      <BrandShell active="index"><BrandHome /></BrandShell>
    </BrandThemeProvider>
  );
}
