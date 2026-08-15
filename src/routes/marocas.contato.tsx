import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Instagram, Clock, ShieldCheck } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { MAROCAS_CONTATO, MAROCAS_HORARIOS_SUPORTE, marocasWhatsAppUrl } from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas/contato";
export const Route = createFileRoute("/marocas/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Marocas" },
      { name: "description", content: "Canais e formulários da Marocas para anfitriões, hóspedes e prestadores." },
      { property: "og:title", content: "Contato Marocas" },
      { property: "og:description", content: "Formulários e canais validados da Marocas." },
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
  const validated = MAROCAS_CONTATO.validated;
  return <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Contato" }]}>
    <section className="container mx-auto px-4 md:px-6 py-16 text-center max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Fale com a Marocas</p>
      <h1 className="text-4xl md:text-5xl font-bold mt-3">Atendimento por jornada</h1>
      <p className="mt-4 text-muted-foreground">Use o formulário correspondente ao seu perfil. Dados externos de contato só são exibidos depois de validação cadastral.</p>
    </section>

    <section className="container mx-auto px-4 md:px-6 pb-16 grid md:grid-cols-2 gap-4">
      {CHANNELS.map(c => <div key={c.label} className="rounded-2xl border bg-card p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
        {validated && c.email ? <a href={`mailto:${c.email}`} className="mt-2 flex items-center gap-2 text-lg font-semibold text-primary hover:underline"><Mail className="h-5 w-5" />{c.email}</a> : <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" />Canal externo aguardando validação</div>}
        <Link to={c.href} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold underline">{c.cta} →</Link>
      </div>)}
    </section>

    <section className="bg-muted/30 py-16"><div className="container mx-auto px-4 md:px-6 max-w-4xl">
      {!validated ? <div className="rounded-2xl border bg-card p-8 text-center"><ShieldCheck className="h-8 w-8 mx-auto text-primary" /><h2 className="text-2xl font-bold mt-3">Dados públicos em validação</h2><p className="mt-2 text-muted-foreground">Endereço, telefone, WhatsApp, e-mails, Instagram e horários não serão publicados com dados de demonstração. Até a validação, os fluxos internos acima são o canal de entrada.</p></div> : <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div><h2 className="text-2xl font-bold">Endereço & atendimento</h2><address className="not-italic mt-6 space-y-4 text-sm">
          {MAROCAS_CONTATO.enderecoLinha1 && <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" /><div><div className="font-medium">{MAROCAS_CONTATO.enderecoLinha1}</div>{MAROCAS_CONTATO.enderecoLinha2 && <div className="text-muted-foreground">{MAROCAS_CONTATO.enderecoLinha2}</div>}{MAROCAS_CONTATO.cep && <div className="text-muted-foreground">CEP {MAROCAS_CONTATO.cep}</div>}</div></div>}
          {MAROCAS_CONTATO.whatsapp && <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" /><a href={marocasWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{MAROCAS_CONTATO.whatsappHumanizado}</a></div>}
          {MAROCAS_CONTATO.instagram && MAROCAS_CONTATO.instagramUrl && <div className="flex items-start gap-3"><Instagram className="h-5 w-5 text-primary shrink-0 mt-0.5" /><a href={`${MAROCAS_CONTATO.instagramUrl}${MAROCAS_CONTATO.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:underline">@{MAROCAS_CONTATO.instagram}</a></div>}
          {MAROCAS_HORARIOS_SUPORTE.length > 0 && <div className="flex items-start gap-3"><Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" /><ul>{MAROCAS_HORARIOS_SUPORTE.map(h => <li key={h.dia}><span className="font-medium">{h.dia}:</span> <span className="text-muted-foreground">{h.horario}</span></li>)}</ul></div>}
        </address></div>
        {MAROCAS_CONTATO.mapaUrl ? <div className="rounded-2xl overflow-hidden border shadow aspect-video"><iframe title="Mapa Marocas" src={MAROCAS_CONTATO.mapaUrl} className="w-full h-full" loading="lazy" /></div> : <div className="rounded-2xl border bg-card min-h-60 grid place-items-center p-8 text-center text-muted-foreground">Mapa disponível após validação do endereço oficial.</div>}
      </div>}
    </div></section>
  </MarocasShell>;
}