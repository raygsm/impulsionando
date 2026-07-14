import { createFileRoute, notFound } from "@tanstack/react-router";
import { getFictionalBrand } from "@/data/fictional-brands/registry";
import { BrandThemeProvider } from "@/components/fictional-brand/BrandThemeProvider";
import { BrandShell } from "@/components/fictional-brand/BrandShell";
import { BrandContact } from "@/components/fictional-brand/BrandContact";

export const Route = createFileRoute("/templates/$brand/contato")({
  head: ({ params }) => {
    const b = getFictionalBrand(params.brand);
    if (!b) return { meta: [{ title: "Contato — Impulsionando" }, { name: "robots", content: "noindex" }] };
    const url = `https://impulsionando.com.br/templates/${b.slug}/contato`;
    return {
      meta: [
        { title: `Contato — ${b.companyName}` },
        { name: "description", content: `Fale com a ${b.companyName}. ${b.contact.hours}.` },
        { property: "og:title", content: `Contato — ${b.companyName}` },
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
      <BrandShell active="contato"><BrandContact /></BrandShell>
    </BrandThemeProvider>
  );
}
