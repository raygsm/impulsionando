import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Stethoscope, Users } from "lucide-react";
import { ChrismedShell } from "@/components/chrismed/ChrismedShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CHRISMED_DOCTORS, CHRISMED_SPECIALTIES } from "@/data/chrismed-mock";

/** Rota legada mantida para links antigos; a área de cadastro oficial é /alth. */
export const Route = createFileRoute("/chrismed/medicos")({
  head: () => ({
    meta: [
      { title: "Rede de Profissionais da Saúde — CHRISMED" },
      {
        name: "description",
        content:
          "Conheça a rede multiprofissional CHRISMED e acesse a Área dos Profissionais da Saúde.",
      },
      { property: "og:title", content: "Rede de Profissionais da Saúde · CHRISMED" },
    ],
  }),
  component: HealthProfessionalNetwork,
});

function HealthProfessionalNetwork() {
  return (
    <ChrismedShell>
      <section className="chrismed-bleed chrismed-page-forest border-b border-white/10">
        <div className="container max-w-5xl py-16 md:py-20">
          <Badge className="mb-5 border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)]">
            REDE MULTIPROFISSIONAL
          </Badge>
          <h1 className="chrismed-serif max-w-3xl text-4xl leading-tight text-[var(--chrismed-ink)] md:text-6xl">
            Profissionais da saúde CHRISMED
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--chrismed-graphite)]">
            Médicos, fisioterapeutas, psicólogos, nutricionistas, enfermeiros, dentistas e outras
            categorias atuando em uma jornada integrada de cuidado.
          </p>
          <Button asChild className="mt-7 bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]">
            <Link to="/alth">
              <Users className="mr-2 h-4 w-4" />
              Acessar a Área dos Profissionais da Saúde
            </Link>
          </Button>
        </div>
      </section>
      <section className="container max-w-6xl py-12 md:py-16">
        <div className="mb-6 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-[var(--chrismed-ink)]" />
          <h2 className="chrismed-serif text-2xl text-[var(--chrismed-ink)]">
            Profissionais em destaque
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CHRISMED_DOCTORS.map((professional) => (
            <article
              key={professional.slug}
              className="flex flex-col rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6"
            >
              <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)]">
                {professional.name}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-[var(--chrismed-mist)]">
                {professional.crm}
              </p>
              <p className="mt-3 flex-1 text-sm text-[var(--chrismed-graphite)]">
                {professional.title}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {professional.specialtySlugs.map((slug) => (
                  <span
                    key={slug}
                    className="rounded-full border border-[var(--chrismed-sand)] px-2 py-1 text-xs"
                  >
                    {CHRISMED_SPECIALTIES.find((item) => item.slug === slug)?.name ?? slug}
                  </span>
                ))}
              </div>
              <Button
                asChild
                className="mt-5 bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]"
              >
                <Link to="/chrismed/agendar" search={{ doctor: professional.slug }}>
                  Agendar atendimento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </ChrismedShell>
  );
}
