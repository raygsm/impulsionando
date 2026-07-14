import { createFileRoute, notFound } from "@tanstack/react-router";
import { getFictionalBrand } from "@/data/fictional-brands/registry";
import { BrandThemeProvider } from "@/components/fictional-brand/BrandThemeProvider";
import { BrandShell } from "@/components/fictional-brand/BrandShell";
import { BrandAbout } from "@/components/fictional-brand/BrandAbout";

export const Route = createFileRoute("/templates/$brand/sobre")({
  head: ({ params }) => {
    const b = getFictionalBrand(params.brand);
    if (!b) return { meta: [{ title: "Sobre — Impulsionando" }, { name: "robots", content: "noindex" }] };
    const url = `https://impulsionando.com.br/templates/${b.slug}/sobre`;
    return {
      meta: [
        { title: `Sobre — ${b.companyName}` },
        { name: "description", content: b.about.mission },
        { property: "og:title", content: `Sobre — ${b.companyName}` },
        { property: "og:description", content: b.about.mission },
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
  const { brand: slug } = Route.useParams();
  const brand = getFictionalBrand(slug)!;
  return (
    <BrandThemeProvider brand={brand}>
      <BrandShell active="sobre"><BrandAbout /></BrandShell>
    </BrandThemeProvider>
  );
}
