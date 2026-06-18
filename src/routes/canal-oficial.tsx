import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Mail } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  buildOfficialWhatsAppUrl,
  OFFICIAL_WHATSAPP_PHONE_DISPLAY,
  OFFICIAL_EMAIL_DOMAIN,
  trackWhatsAppCTA,
} from "@/lib/whatsapp-cta";

const WHATSAPP_URL = buildOfficialWhatsAppUrl(
  "Olá! Estou na página Canal Oficial e gostaria de confirmar um contato.",
);

export const Route = createFileRoute("/canal-oficial")({
  head: () => ({
    meta: [
      { title: "Canal oficial único — WhatsApp (21) 99307-5000 | Impulsionando" },
      {
        name: "description",
        content:
          "O único canal oficial para envio de documentos, comprovantes e comunicações com a Impulsionando é o WhatsApp (21) 99307-5000. Saiba como identificar mensagens oficiais e o que fazer em caso de tentativa de fraude.",
      },
      { property: "og:title", content: "Canal oficial único — Impulsionando" },
      {
        property: "og:description",
        content:
          "WhatsApp (21) 99307-5000 é o único canal oficial. Veja como identificar mensagens legítimas e como agir em caso de contato suspeito.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/canal-oficial" }],
  }),
  component: CanalOficialPage,
});

const FAQ: { q: string; a: string }[] = [
  {
    q: "Qual é o único canal oficial da Impulsionando?",
    a: `O WhatsApp ${OFFICIAL_WHATSAPP_PHONE_DISPLAY}. Nenhum outro número, perfil em rede social ou e-mail de terceiros é reconhecido como canal oficial para tratativas contratuais, envio de documentos ou comprovantes de pagamento.`,
  },
  {
    q: "Como identificar uma mensagem oficial?",
    a: `A mensagem virá obrigatoriamente do número ${OFFICIAL_WHATSAPP_PHONE_DISPLAY} (DDD 21). E-mails oficiais sempre saem de @${OFFICIAL_EMAIL_DOMAIN}. Em caso de dúvida, encerre a conversa e confirme antes pelo WhatsApp oficial.`,
  },
  {
    q: "Recebi contato por outro número de WhatsApp dizendo ser da Impulsionando. O que faço?",
    a: "Não envie documentos, comprovantes nem efetue pagamentos. Tire um print da conversa e nos envie pelo WhatsApp oficial para verificarmos e, se for o caso, reportarmos como golpe à Meta.",
  },
  {
    q: "A Impulsionando pede senhas, código de verificação ou foto do cartão?",
    a: "Nunca. Não pedimos senhas, códigos de verificação, foto do cartão de crédito ou dados bancários completos por nenhum canal. Qualquer pedido nesse formato é tentativa de fraude.",
  },
  {
    q: "Posso enviar comprovante de pagamento por e-mail ou Instagram?",
    a: `Não. Comprovantes devem ser enviados exclusivamente pelo WhatsApp oficial ${OFFICIAL_WHATSAPP_PHONE_DISPLAY}. Comprovantes recebidos por DMs, e-mails de terceiros ou outros números não são considerados válidos para baixa de pagamento.`,
  },
  {
    q: "Recebi um link de pagamento. Como ter certeza que é da Impulsionando?",
    a: "Confirme pelo WhatsApp oficial antes de pagar. Links de pagamento legítimos são sempre informados, e podem ser revalidados, pelo número (21) 99307-5000.",
  },
  {
    q: "Onde reportar tentativas de golpe usando a marca Impulsionando?",
    a: `Pelo WhatsApp oficial ${OFFICIAL_WHATSAPP_PHONE_DISPLAY} ou pelo e-mail sac@${OFFICIAL_EMAIL_DOMAIN}. Quanto mais detalhes (prints, número de origem, links), melhor.`,
  },
];

function CanalOficialPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <header className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Segurança e confiança
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Canal oficial único da Impulsionando
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Para sua segurança, toda comunicação, envio de documentos e
            comprovantes de pagamento deve ser feita exclusivamente pelo
            WhatsApp oficial <strong>{OFFICIAL_WHATSAPP_PHONE_DISPLAY}</strong>.
            Contatos por outros canais não serão considerados.
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild className="bg-[#25D366] hover:brightness-110 text-white">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="canal-oficial:hero"
                onClick={() =>
                  trackWhatsAppCTA("whatsapp_cta_click", {
                    origin: "canal-oficial-hero",
                  })
                }
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Abrir WhatsApp oficial
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contato">Formulário de contato</Link>
            </Button>
          </div>
        </header>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm mb-3">
              <CheckCircle2 className="w-4 h-4" /> O que é oficial
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                WhatsApp <strong className="text-foreground">{OFFICIAL_WHATSAPP_PHONE_DISPLAY}</strong>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                E-mails do domínio <code className="text-foreground">@{OFFICIAL_EMAIL_DOMAIN}</code>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                Domínios <code className="text-foreground">impulsionando.com.br</code> e <code className="text-foreground">impulsionando.lovable.app</code>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                Formulário em <Link to="/contato" className="underline">/contato</Link> (sem anexos sensíveis)
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm mb-3">
              <ShieldAlert className="w-4 h-4" /> O que NÃO é oficial
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <XCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                Outros números de telefone ou WhatsApp
              </li>
              <li className="flex gap-2">
                <XCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                DMs no Instagram, Facebook, TikTok, LinkedIn, Telegram, Discord
              </li>
              <li className="flex gap-2">
                <XCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                E-mails de domínios diferentes de @{OFFICIAL_EMAIL_DOMAIN}
              </li>
              <li className="flex gap-2">
                <XCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                Links de pagamento não confirmados pelo WhatsApp oficial
              </li>
              <li className="flex gap-2">
                <XCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                Pedidos de senha, código de verificação ou foto do cartão
              </li>
            </ul>
          </Card>
        </div>

        <Card className="p-5 sm:p-6 mb-10">
          <h2 className="text-xl font-semibold tracking-tight mb-2">
            Recebeu contato por outro canal? Faça isto:
          </h2>
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1.5">
            <li>Não envie documentos, comprovantes nem efetue pagamentos.</li>
            <li>Tire um print da conversa (nome, foto, número e mensagem).</li>
            <li>
              Encaminhe o print pelo WhatsApp oficial{" "}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="canal-oficial:report"
                onClick={() =>
                  trackWhatsAppCTA("whatsapp_cta_click", {
                    origin: "canal-oficial-report",
                  })
                }
                className="text-primary underline"
              >
                {OFFICIAL_WHATSAPP_PHONE_DISPLAY}
              </a>{" "}
              ou pelo e-mail{" "}
              <a href={`mailto:sac@${OFFICIAL_EMAIL_DOMAIN}`} className="text-primary underline inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> sac@{OFFICIAL_EMAIL_DOMAIN}
              </a>
              .
            </li>
            <li>Reporte o perfil como golpe diretamente à plataforma (WhatsApp, Instagram, etc.).</li>
          </ol>
        </Card>

        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Veja também a{" "}
          <Link to="/privacidade" className="underline">Política de Privacidade</Link> e os{" "}
          <Link to="/termos" className="underline">Termos de Uso</Link> para a cláusula
          completa do canal oficial.
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
