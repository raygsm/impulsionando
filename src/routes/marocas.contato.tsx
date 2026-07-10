import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  MessageCircle,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_CONTATO,
  MAROCAS_HORARIOS,
  MAROCAS_IMAGENS,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";

const CANONICAL = "https://impulsionando.com.br/marocas/contato";

export const Route = createFileRoute("/marocas/contato")({
  head: () => ({
    meta: [
      { title: "Contato & mapa — Marocas Copacabana" },
      {
        name: "description",
        content:
          "Endereço em Copacabana, WhatsApp, e-mail e horários. Reservas, eventos, SAC e imprensa em canais separados.",
      },
      { property: "og:title", content: "Contato — Marocas Copacabana" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.bairro },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: ContatoPage,
});

const CANAIS = [
  {
    icon: <MessageCircle className="h-5 w-5" />,
    titulo: "WhatsApp da casa",
    resumo: "Reservas, delivery, dúvidas e SAC.",
    href: () => marocasWhatsAppUrl("Olá! Vim do site da Marocas."),
    label: MAROCAS_CONTATO.whatsappHumanizado,
    primary: true,
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    titulo: "Reservas de mesa",
    resumo: "Reserve online em 2 cliques.",
    href: () => "/marocas/reservas",
    label: "Reservar agora",
    internal: true,
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    titulo: "Eventos privados",
    resumo: "Aniversários, corporativos, casamentos.",
    href: () => `mailto:${MAROCAS_CONTATO.eventosEmail}`,
    label: MAROCAS_CONTATO.eventosEmail,
  },
  {
    icon: <Mail className="h-5 w-5" />,
    titulo: "Imprensa & parcerias",
    resumo: "Pautas, colabs e institucional.",
    href: () => `mailto:${MAROCAS_CONTATO.email}`,
    label: MAROCAS_CONTATO.email,
  },
];

function ContatoPage() {
  return (
    <MarocasShell
      breadcrumbs={[
        { label: "Marocas", to: "/marocas" },
        { label: "Contato" },
      ]}
    >
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.bairro}
            alt="Copacabana vista da orla"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-24 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Fale com a gente
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mt-4 leading-[1.05]">
            Estamos em Copacabana, a duas quadras da praia.
          </h1>
          <p className="mt-5 text-lg text-white/85">
            Escolha o canal certo — respondemos rápido no que é operacional e com
            calma no que é estratégico.
          </p>
        </div>
      </section>

      {/* CANAIS */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-4">
          {CANAIS.map((c) => {
            const href = c.href();
            const inner = (
              <>
                <div
                  className={`grid place-items-center h-12 w-12 rounded-2xl ${c.primary ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                >
                  {c.icon}
                </div>
                <div className="mt-4">
                  <div className="font-serif font-bold text-xl">{c.titulo}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.resumo}
                  </p>
                  <div className="mt-3 text-primary font-semibold text-sm">
                    {c.label} →
                  </div>
                </div>
              </>
            );
            return c.internal ? (
              <Link
                key={c.titulo}
                to={href}
                className="rounded-3xl border p-6 hover:border-primary hover:shadow-lg transition bg-card"
              >
                {inner}
              </Link>
            ) : (
              <a
                key={c.titulo}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="rounded-3xl border p-6 hover:border-primary hover:shadow-lg transition bg-card"
              >
                {inner}
              </a>
            );
          })}
        </div>
      </section>

      {/* MAPA + INFO */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden border aspect-[4/3] bg-card">
            <iframe
              title="Marocas em Copacabana"
              src="https://www.google.com/maps?q=Rua+Barata+Ribeiro+500+Copacabana+Rio+de+Janeiro&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Endereço
              </div>
              <p className="mt-2 font-serif text-2xl font-bold">
                {MAROCAS_CONTATO.enderecoLinha1}
              </p>
              <p className="text-muted-foreground">
                {MAROCAS_CONTATO.enderecoLinha2}
              </p>
              <a
                href={MAROCAS_CONTATO.mapaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline mt-2 inline-block"
              >
                Abrir no Google Maps →
              </a>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Horário de funcionamento
              </div>
              <ul className="mt-2 text-sm space-y-1.5">
                {MAROCAS_HORARIOS.map((h) => (
                  <li
                    key={h.dia}
                    className={`flex justify-between max-w-sm ${h.fechado ? "text-muted-foreground" : ""}`}
                  >
                    <span>{h.dia}</span>
                    <span className="font-medium">{h.horario}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> Telefone fixo
              </div>
              <p className="mt-2 text-sm">{MAROCAS_CONTATO.telefone}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <Instagram className="h-3.5 w-3.5" /> Redes
              </div>
              <a
                href={MAROCAS_CONTATO.instagramUrl + MAROCAS_CONTATO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-primary font-semibold"
              >
                @{MAROCAS_CONTATO.instagram}
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
