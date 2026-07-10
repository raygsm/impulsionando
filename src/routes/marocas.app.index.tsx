import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, UserRound, HardHat, ArrowRight } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";

export const Route = createFileRoute("/marocas/app/")({
  head: () => ({
    meta: [
      { title: "Painel Marocas — escolha o seu perfil" },
      { name: "description", content: "Selecione seu perfil (anfitrião, hóspede ou prestador) para acessar a área logada da Marocas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PickerPage,
});

const OPTS = [
  { to: "/marocas/app/anfitriao", label: "Sou anfitrião / proprietário", desc: "Gerencie imóveis, reservas, operação e financeiro.", icon: Building2 },
  { to: "/marocas/app/hospede",   label: "Sou hóspede",                    desc: "Acesse sua reserva, dados do imóvel e suporte 24h.",     icon: UserRound },
  { to: "/marocas/app/prestador", label: "Sou prestador de serviço",       desc: "Agenda, serviços disponíveis, valores e histórico.",     icon: HardHat },
] as const;

function PickerPage() {
  return (
    <MarocasShell breadcrumbs={[{ label: "Painel", to: "/marocas/app" }]}>
      <section className="container mx-auto px-4 md:px-6 py-16 max-w-4xl">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">Painel Marocas</span>
          <h1 className="font-serif text-3xl md:text-4xl">Como você quer entrar hoje?</h1>
          <p className="text-muted-foreground">Selecione seu perfil para acessar a experiência certa. Você pode alternar depois pelo menu lateral.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {OPTS.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              className="group rounded-2xl border bg-card p-6 hover:border-primary hover:shadow-md transition"
            >
              <o.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{o.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                Entrar <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </MarocasShell>
  );
}
