import { createFileRoute, notFound } from "@tanstack/react-router";
import { getFictionalBrand } from "@/data/fictional-brands/registry";
import { BrandThemeProvider } from "@/components/fictional-brand/BrandThemeProvider";
import { BrandShell } from "@/components/fictional-brand/BrandShell";
import { BrandAdmin } from "@/components/fictional-brand/BrandAdmin";

export const Route = createFileRoute("/templates/$brand/admin")({
  head: ({ params }) => {
    const b = getFictionalBrand(params.brand);
    if (!b) return { meta: [{ title: "Painel — Impulsionando" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `Painel — ${b.companyName}` },
        { name: "description", content: `Prévia do painel administrativo Impulsionando aplicado à ${b.companyName}.` },
        { name: "robots", content: "noindex" },
      ],
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
      <BrandShell active="admin"><BrandAdmin /></BrandShell>
    </BrandThemeProvider>
  );
}
