import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_CONTATO,
  MAROCAS_HORARIOS_SUPORTE,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas/contato";

export const Route = createFileRoute("/marocas/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Marocas" },
      { name: "description", content: "Fale com a Marocas: anfitriões, hóspedes, prestadores e suporte. Endereço, WhatsApp e canais oficiais." },
      { property: "og:title", content: "Contato Marocas" },
      { property: "og:description", content: "Canais oficiais para anfitriões, hóspedes e prestadores." },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: ContatoPage,
});

const CHANNELS = [
  { label: "Anfitriões / proprietários", email: MAROCAS_CONTATO.emailAnfitrioes, cta: "Cadastrar meu imóvel", href: "/marocas/cadastrar-imovel" },
  { label: "Hóspedes", email: MAROCAS_CONTATO.emailHospedes, cta: "Área do hóspede", href: "/marocas/hospedes" },
  { label: "Prestadores de serviço", email: MAROCAS_CONTATO.emailPrestadores, cta: "Cadastrar prestador", href: "/marocas/prestadores" },
  { label: "Suporte geral", email: MAROCAS_CONTATO.emailSuporte, cta: "Ver dúvidas frequentes", href: "/marocas/faq" },
];

function ContatoPage() {
  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Contato" }]}>
      <section className="container mx-auto px-4 md:px-6 py-16 text-center max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Fale com a Marocas</p>
        <h1 className="text-4xl md:text-5xl font-bold mt-3">Canais oficiais</h1>
        <p className="mt-4 text-muted-foreground">
          Escolha o canal certo. WhatsApp é usado apenas para suporte e pós-venda — para cadastrar imóvel ou fazer parte da rede, use os formulários.
        </p>
      </section>

      <section className="container mx-auto px-4 md:px-6 pb-16 grid md:grid-cols-2 gap-4">
        {CHANNELS.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <a href={`mailto:${c.email}`} className="mt-2 flex items-center gap-2 text-lg font-semibold text-primary hover:underline">
              <Mail className="h-5 w-5" /> {c.email}
            </a>
            <a href={c.href} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold underline">
              {c.cta} →
            </a>
          </div>
        ))}
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold">Endereço & atendimento</h2>
            <address className="not-italic mt-6 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">{MAROCAS_CONTATO.enderecoLinha1}</div>
                  <div className="text-muted-foreground">{MAROCAS_CONTATO.enderecoLinha2}</div>
                  <div className="text-muted-foreground">CEP {MAROCAS_CONTATO.cep}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <a href={marocasWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                    {MAROCAS_CONTATO.whatsappHumanizado}
                  </a>
                  <div className="text-muted-foreground">WhatsApp de suporte (SAC)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Instagram className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <a href={MAROCAS_CONTATO.instagramUrl + MAROCAS_CONTATO.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  @{MAROCAS_CONTATO.instagram}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <ul className="space-y-0.5">
                  {MAROCAS_HORARIOS_SUPORTE.map((h) => (
                    <li key={h.dia}>
                      <span className="font-medium">{h.dia}:</span> <span className="text-muted-foreground">{h.horario}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </address>
          </div>
          <div className="rounded-2xl overflow-hidden border shadow aspect-video">
            <iframe
              title="Mapa Marocas"
              src="https://www.google.com/maps?q=Rua+Barata+Ribeiro+500+Copacabana+Rio+de+Janeiro&output=embed"
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
