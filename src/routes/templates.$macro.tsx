/**
 * /vitrine/$macro — Renderiza o template do macro-nicho selecionado.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getVitrineTemplate, VITRINE_TEMPLATES } from "@/data/vitrine-templates";
import { VitrineTemplateView } from "@/components/vitrine/VitrineTemplateView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/templates/$macro")({
  head: ({ params }) => {
    const t = getVitrineTemplate(params.macro);
    if (!t) return { meta: [{ title: "Template não encontrado — Impulsionando" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${t.templateName} — Vitrine Impulsionando` },
        { name: "description", content: t.hero.subtitle },
        { property: "og:title", content: `${t.templateName} — Vitrine Impulsionando` },
        { property: "og:description", content: t.hero.subtitle },
        { property: "og:image", content: t.hero.image },
        { property: "og:url", content: `https://impulsionando.com.br/vitrine/${t.macro}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: t.hero.image },
      ],
      links: [{ rel: "canonical", href: `https://impulsionando.com.br/vitrine/${t.macro}` }],
    };
  },
  loader: ({ params }) => {
    const t = getVitrineTemplate(params.macro);
    if (!t) throw notFound();
    return { macro: t.macro };
  },
  component: VitrineMacroPage,
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">Template não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha um macro-nicho na vitrine principal.
        </p>
        <Button asChild className="mt-4"><Link to="/vitrine">Voltar à vitrine</Link></Button>
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

function VitrineMacroPage() {
  const { macro } = Route.useLoaderData();
  const t = VITRINE_TEMPLATES.find((x) => x.macro === macro)!;
  return <VitrineTemplateView t={t} />;
}
