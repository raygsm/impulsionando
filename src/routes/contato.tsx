import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { breadcrumbJsonLd } from "@/lib/seo";
import { Loader2, Mail, Send, Sparkles, Layers, Rocket, LifeBuoy } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OfficialChannelNotice } from "@/components/marketing/OfficialChannelNotice";
import { validateOfficialChannelMessage, trackWhatsAppCTA } from "@/lib/whatsapp-cta";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contato")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Contato — Impulsionando Tecnologia" },
      { name: "description", content: "Fale com a Impulsionando Tecnologia pelo WhatsApp +55 21 99307-5000, e-mail sac@impulsionando.com.br ou pelo formulário." },
      { property: "og:title", content: "Contato — Impulsionando Tecnologia" },
      { property: "og:description", content: "WhatsApp, e-mail e orçamento personalizado. Fale com nosso time." },
      { property: "og:url", content: "https://impulsionando.com.br/contato" },

    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/contato" }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Contato", path: "/contato" },
      ]),
    ],
  }),
  component: ContatoPage,
});


const EMAIL = "sac@impulsionando.com.br";

function ContatoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || (!trimmedEmail && !trimmedPhone) || !trimmedMessage) {
      toast.error("Preencha nome, e-mail ou WhatsApp e a mensagem.");
      return;
    }
    if (trimmedName.length > 100 || trimmedEmail.length > 255 || trimmedMessage.length > 1000) {
      toast.error("Algum campo ultrapassou o limite permitido.");
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("E-mail inválido.");
      return;
    }

    // Validador compartilhado: bloqueia outros telefones, e-mails de
    // terceiros, links/handles de redes sociais e WhatsApps alternativos.
    const channelError = validateOfficialChannelMessage(trimmedMessage);
    if (channelError) {
      toast.error(channelError);
      return;
    }
    trackWhatsAppCTA("whatsapp_form_submit", { origin: "contato-form" });


    setLoading(true);
    const leadId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : undefined;
    const { error } = await supabase
      .from("marketing_leads")
      .insert({
        ...(leadId ? { id: leadId } : {}),
        source: "contato",
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
    setLoading(false);
    if (error) {
      console.error("marketing_leads insert failed", error);
      toast.error("Não foi possível enviar agora. Tente novamente.");
      return;
    }
    if (leadId) {
      void fetch("/api/public/hooks/marketing-lead-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      }).catch((e) => console.warn("lead notify failed", e));
    }

    setSent(true);
    toast.success("Mensagem recebida! Vamos responder em breve.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Fale com a Impulsionando Tecnologia</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Atendimento humano para sistemas, automação e integrações. Para dúvidas comerciais, o Impulsionito responde na hora — para suporte técnico, abra um ticket.
          </p>
        </div>

        {/* Atalhos comerciais — direcionam antes do formulário */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin: "contato-atalho" } }))}
            className="group text-left rounded-lg border border-border bg-card p-4 hover-lift focus-ring transition-all"
          >
            <Sparkles className="w-5 h-5 text-primary mb-2" />
            <div className="text-sm font-semibold">Falar com Impulsionito</div>
            <div className="text-xs text-muted-foreground mt-0.5">Assistente consultivo — responde na hora.</div>
          </button>
          <Link
            to="/planos"
            className="group text-left rounded-lg border border-border bg-card p-4 hover-lift focus-ring transition-all"
          >
            <Layers className="w-5 h-5 text-primary mb-2" />
            <div className="text-sm font-semibold">Ver planos</div>
            <div className="text-xs text-muted-foreground mt-0.5">Essencial, Ideal, Full e Sob Medida.</div>
          </Link>
          <Link
            to="/escolher-nicho"
            className="group text-left rounded-lg border border-border bg-card p-4 hover-lift focus-ring transition-all"
          >
            <Rocket className="w-5 h-5 text-primary mb-2" />
            <div className="text-sm font-semibold">Começar agora</div>
            <div className="text-xs text-muted-foreground mt-0.5">Escolha seu nicho e monte sua operação.</div>
          </Link>
          <Link
            to="/abrir-ticket"
            className="group text-left rounded-lg border border-border bg-card p-4 hover-lift focus-ring transition-all"
          >
            <LifeBuoy className="w-5 h-5 text-primary mb-2" />
            <div className="text-sm font-semibold">Abrir ticket</div>
            <div className="text-xs text-muted-foreground mt-0.5">Suporte técnico ou financeiro com protocolo.</div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 lg:col-span-2">
            {sent ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 grid place-content-center">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Mensagem enviada</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Recebemos sua solicitação. Nossa equipe vai responder no e-mail e/ou WhatsApp informado.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button
                    className="btn-alive focus-ring"
                    onClick={() => window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin: "contato-sent" } }))}
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Enquanto isso, fale com o Impulsionito
                  </Button>
                  <Button asChild variant="outline" className="focus-ring">
                    <Link to="/planos">Ver planos</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <OfficialChannelNotice />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="c-name">Nome *</Label>
                    <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-company">Empresa</Label>
                    <Input id="c-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-email">E-mail</Label>
                    <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-phone">WhatsApp</Label>
                    <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(21) 99999-9999" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-msg">Como podemos ajudar? *</Label>
                  <Textarea
                    id="c-msg"
                    rows={5}
                    value={message}
                    maxLength={1000}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva sua dúvida em até 1000 caracteres. NÃO inclua senhas, dados bancários, comprovantes ou documentos — envie esses arquivos apenas pelo WhatsApp oficial (21) 99307-5000."
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Não inclua senhas, dados bancários, anexos ou comprovantes nesta mensagem. {message.length}/1000
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ao enviar você concorda com nossa{" "}
                  <Link to="/privacidade" className="underline">Política de Privacidade</Link>{" "}
                  e confirma que documentos e comprovantes serão enviados apenas pelo WhatsApp oficial{" "}
                  <strong>(21) 99307-5000</strong>.
                </p>
                <Button type="submit" disabled={loading} className="gap-2 bg-gradient-primary shadow-elegant focus-ring">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar mensagem
                </Button>
              </form>
            )}
          </Card>

          <Card className="p-6 space-y-4 h-fit">
            <div className="text-sm font-semibold">Canais oficiais</div>
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/40 focus-ring transition-colors">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">E-mail</div>
                <div className="text-xs text-muted-foreground break-all">{EMAIL}</div>
              </div>
            </a>
            <div className="rounded-md border border-dashed border-border p-3">
              <div className="text-sm font-medium">WhatsApp oficial regulatório</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                +55 21 99307-5000 — exclusivo para envio de documentos, comprovantes e assuntos regulatórios já em andamento. Para vendas e dúvidas, use o Impulsionito acima.
              </div>
            </div>
            <div className="text-xs text-muted-foreground pt-2">
              Atendimento humano de segunda a sexta, 9h às 18h.
            </div>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
