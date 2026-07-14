import { createFileRoute, notFound } from "@tanstack/react-router";
import { getFictionalBrand } from "@/data/fictional-brands/registry";
import { BrandThemeProvider } from "@/components/fictional-brand/BrandThemeProvider";
import { BrandShell } from "@/components/fictional-brand/BrandShell";
import { BrandCatalog } from "@/components/fictional-brand/BrandCatalog";

export const Route = createFileRoute("/templates/$brand/catalogo")({
  head: ({ params }) => {
    const b = getFictionalBrand(params.brand);
    if (!b) return { meta: [{ title: "Catálogo — Impulsionando" }, { name: "robots", content: "noindex" }] };
    const url = `https://impulsionando.com.br/templates/${b.slug}/catalogo`;
    return {
      meta: [
        { title: `${b.catalog.label} — ${b.companyName}` },
        { name: "description", content: `Explore o ${b.catalog.label.toLowerCase()} completo da ${b.companyName}.` },
        { property: "og:title", content: `${b.catalog.label} — ${b.companyName}` },
        { property: "og:url", content: url },
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
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error)}</div>,
});

function Page() {
  const { slug } = Route.useLoaderData();
  const brand = getFictionalBrand(slug)!;
  return (
    <BrandThemeProvider brand={brand}>
      <BrandShell active="catalogo"><BrandCatalog /></BrandShell>
    </BrandThemeProvider>
  );
}
