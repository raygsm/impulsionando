import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Impulsionando Tecnologia" },
      { name: "description", content: "Fale com a Impulsionando Tecnologia pelo WhatsApp +55 21 99307-5000, e-mail sac@impulsionando.com.br ou pelo formulário." },
      { property: "og:title", content: "Contato — Impulsionando Tecnologia" },
      { property: "og:description", content: "WhatsApp, e-mail e orçamento personalizado. Fale com nosso time." },
      { property: "og:url", content: "https://impulsionando.com.br/contato" },
    
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/contato" }],
  }),
  component: ContatoPage,
});

const WHATSAPP_URL = "https://wa.me/5521993075000";
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
    if (!name.trim() || (!email.trim() && !phone.trim()) || !message.trim()) {
      toast.error("Preencha nome, e-mail ou WhatsApp e a mensagem.");
      return;
    }
    setLoading(true);
    const { data: inserted, error } = await supabase
      .from("marketing_leads")
      .insert({
        source: "contato",
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error || !inserted) {
      toast.error("Não foi possível enviar agora. Tente novamente.");
      return;
    }
    void fetch("/api/public/hooks/marketing-lead-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: inserted.id }),
    }).catch((e) => console.warn("lead notify failed", e));
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
            Atendimento humano para sistemas, automação e integrações. Responda em poucos minutos no horário comercial.
          </p>
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
                <div className="flex justify-center gap-2 pt-2">
                  <Button asChild className="btn-whatsapp">
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp agora
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
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
                  <Textarea id="c-msg" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ao enviar você concorda com nossa{" "}
                  <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
                </p>
                <Button type="submit" disabled={loading} className="gap-2 bg-gradient-primary shadow-elegant">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar mensagem
                </Button>
              </form>
            )}
          </Card>

          <Card className="p-6 space-y-4 h-fit">
            <div className="text-sm font-semibold">Outros canais</div>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/40 transition-colors">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">WhatsApp</div>
                <div className="text-xs text-muted-foreground">+55 21 99307-5000</div>
              </div>
            </a>
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/40 transition-colors">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">E-mail</div>
                <div className="text-xs text-muted-foreground break-all">{EMAIL}</div>
              </div>
            </a>
            <div className="text-xs text-muted-foreground pt-2">
              Atendimento de segunda a sexta, 9h às 18h.
            </div>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
