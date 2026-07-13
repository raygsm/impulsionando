/**
 * /templates/$macro/$sub — Variação de template por subnicho.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getVitrineSubniche } from "@/data/vitrine-templates";
import { VitrineTemplateView } from "@/components/vitrine/VitrineTemplateView";
import { DeviceFrame } from "@/components/vitrine/DeviceFrame";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/templates/$macro/$sub")({
  head: ({ params }) => {
    const found = getVitrineSubniche(params.macro, params.sub);
    if (!found) return { meta: [{ title: "Template não encontrado — Impulsionando" }, { name: "robots", content: "noindex" }] };
    const { merged: t, base } = found;
    const url = `https://impulsionando.com.br/templates/${base.macro}/${params.sub}`;
    return {
      meta: [
        { title: `${t.templateName} — Vitrine Impulsionando` },
        { name: "description", content: t.hero.subtitle },
        { property: "og:title", content: `${t.templateName} — Vitrine Impulsionando` },
        { property: "og:description", content: t.hero.subtitle },
        { property: "og:image", content: t.hero.image },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: t.hero.image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: ({ params }) => {
    const found = getVitrineSubniche(params.macro, params.sub);
    if (!found) throw notFound();
    return { macro: params.macro, sub: params.sub };
  },
  component: SubnichePage,
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">Subnicho não encontrado</h1>
        <Button asChild className="mt-4"><Link to="/templates">Voltar à vitrine</Link></Button>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <p className="text-destructive">Erro: {String(error)}</p>
        <Button onClick={reset} className="mt-4">Tentar novamente</Button>
      </div>
    </div>
  ),
});

function SubnichePage() {
  const { macro, sub } = Route.useLoaderData();
  const found = getVitrineSubniche(macro, sub)!;
  return (
    <DeviceFrame>
      <VitrineTemplateView t={found.merged} />
    </DeviceFrame>
  );
}
