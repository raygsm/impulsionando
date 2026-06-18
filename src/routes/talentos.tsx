import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/talentos")({
  head: () => ({
    meta: [
      { title: "Impulsionando Talentos — Conecte sua carreira ao ecossistema" },
      {
        name: "description",
        content:
          "Cadastre-se uma vez e seja encontrado por empresas da sua região. Saúde, Jurídico, Restaurantes, Eventos, Educação e mais.",
      },
    ],
  }),
  component: TalentosLanding,
});

function TalentosLanding() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Impulsionando Talentos</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Sua carreira, encontrada pelas empresas certas.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Um único cadastro. Empresas de Saúde, Jurídico, Contabilidade, Restaurantes, Eventos, Veículos, Comércio e
          Educação encontram você por cidade, experiência e disponibilidade.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/talentos/cadastro">Cadastrar meu perfil</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/empresas">Sou empresa, quero contratar</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sparkles, t: "2 minutos", d: "Cadastro guiado por IA, sem formulários longos." },
            { icon: MapPin, t: "Geolocalização", d: "Empresas te encontram por cidade, bairro e raio." },
            { icon: Briefcase, t: "Multi-nicho", d: "Saúde, Jurídico, Restaurantes, Eventos e mais." },
            { icon: Users, t: "Rede ativa", d: "Você controla seus dados e visibilidade." },
          ].map(({ icon: Icon, t, d }) => (
            <Card key={t}>
              <CardHeader>
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <CardTitle className="text-lg">{t}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{d}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
