import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        <p className="text-sm text-muted-foreground">Esta página está sendo construída em fases. Em breve, conteúdo completo aqui.</p>
      </main>
      <PublicFooter />
    </div>
  );
}

export { ComingSoon };

export const Route = createFileRoute("/solucoes")({
  head: () => ({
    meta: [
      { title: "Soluções para empresas — Atendimento, Vendas, Gestão | Impulsionando Tecnologia" },
      { name: "description", content: "Soluções modulares para atendimento, agenda, vendas, pagamentos, gestão e crescimento. Sistemas que conversam entre si, sem retrabalho." },
      { property: "og:title", content: "Soluções — Impulsionando Tecnologia" },
      { property: "og:description", content: "Atendimento, agenda, vendas, pagamentos e gestão em um só sistema." },
      { name: "twitter:title", content: "Soluções — Impulsionando Tecnologia" },
      { name: "twitter:description", content: "Tudo o que sua empresa precisa para crescer com organização." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Soluções"
      description="Atendimento, agenda, vendas, pagamentos, gestão e crescimento — organizados em módulos integráveis."
    />
  ),
});
