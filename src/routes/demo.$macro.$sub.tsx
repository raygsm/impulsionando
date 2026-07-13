import { createFileRoute, notFound } from "@tanstack/react-router";
import { SmartDemoShell } from "@/components/demo/smart/SmartDemoShell";
import { getDemoTemplate } from "@/data/demo-templates/registry";

export const Route = createFileRoute("/demo/$macro/$sub")({
  loader: ({ params }) => {
    const template = getDemoTemplate(params.macro, params.sub);
    if (!template) throw notFound();
    return { template };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Demonstração não encontrada" }, { name: "robots", content: "noindex" }] };
    }
    const { seo, branding } = loaderData.template;
    const url = `https://impulsionando.com.br/demo/${loaderData.template.macro}/${loaderData.template.sub}`;
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        ...(seo.ogImage ? [{ property: "og:image", content: seo.ogImage }] : []),
        ...(seo.ogImage ? [{ name: "twitter:image", content: seo.ogImage }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: branding.businessName },
        { name: "twitter:description", content: seo.description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-2xl font-semibold">Demonstração indisponível</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este nicho ainda não possui uma demo inteligente publicada. Novos templates são liberados
        semanalmente.
      </p>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-2xl font-semibold">Não conseguimos carregar a demo</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button className="mt-4 text-sm underline" onClick={reset}>Tentar novamente</button>
    </div>
  ),
  component: DemoPage,
});

function DemoPage() {
  const { template } = Route.useLoaderData();
  return <SmartDemoShell template={template} />;
}
