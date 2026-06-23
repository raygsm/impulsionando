/**
 * /demo/feira — Landing comercial para feiras e reuniões presenciais.
 *
 * Fluxo: visitante escolhe o nicho, preenche nome + WhatsApp + e-mail e ganha
 * acesso imediato a uma demonstração viva. Em background:
 *   - cria demo_visit_sessions (anônima) e demo_leads
 *   - dispara e-mail interno para o time comercial (marketing-lead-new)
 *   - envia e-mail real de boas-vindas (demo-feira-welcome) para o lead
 *
 * Toda a captura passa pelo endpoint público /api/public/demo/feira-lead.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Sparkles, ShieldCheck, Mail, MessageSquare, ArrowRight, CheckCircle2,
  UtensilsCrossed, Stethoscope, Home as HomeIcon, CalendarDays, Store,
  Wrench, Users, Beer, ShoppingBag, Megaphone, AlertCircle,
} from "lucide-react";
import { isValidEmail, isValidPhoneBR, maskPhone } from "@/lib/validators";

type NicheCard = { slug: string; name: string; icon: React.ElementType; tagline: string };

const NICHES: NicheCard[] = [
  { slug: "bares", name: "Bares e Restaurantes", icon: UtensilsCrossed, tagline: "PDV, mesas, QR Code e ficha técnica" },
  { slug: "saude", name: "Clínicas e Saúde", icon: Stethoscope, tagline: "Agenda, prontuário e cobrança recorrente" },
  { slug: "imobiliaria", name: "Imobiliárias", icon: HomeIcon, tagline: "CRM de imóveis, vitrine e propostas" },
  { slug: "eventos", name: "Eventos e Produtores", icon: CalendarDays, tagline: "Ingressos, check-in e produção" },
  { slug: "comercio", name: "Comércio e Varejo", icon: Store, tagline: "Estoque, vendas e financeiro integrado" },
  { slug: "servicos", name: "Empresas de Serviços", icon: Wrench, tagline: "Propostas, contratos e cobrança" },
  { slug: "comunidade", name: "Comunidades", icon: Users, tagline: "Associados, eventos e mensalidade" },
  { slug: "cervejarias", name: "Microcervejarias", icon: Beer, tagline: "Produção, distribuição e clube" },
  { slug: "ecommerce", name: "E-commerce", icon: ShoppingBag, tagline: "Catálogo, pedidos e fulfillment" },
  { slug: "marketing-tecnologia", name: "Marketing & Tech", icon: Megaphone, tagline: "Funil, CRM e automações" },
];

export const Route = createFileRoute("/demo/feira")({
  head: () => ({
    meta: [
      { title: "Demonstração ao vivo — Feira | Impulsionando" },
      { name: "description", content: "Escolha o seu nicho e receba acesso imediato a uma demonstração real da plataforma Impulsionando." },
      { property: "og:title", content: "Demonstração ao vivo — Impulsionando" },
      { property: "og:description", content: "Plataforma única de gestão para o seu segmento. Conheça em 5 minutos." },
      { property: "og:url", content: "https://impulsionando.com.br/demo/feira" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/demo/feira" }],
  }),
  component: FeiraLanding,
});

function FeiraLanding() {
  const navigate = useNavigate();
  const [nicheSlug, setNicheSlug] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ leadId: string; demoUrl: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);

  const selectedNiche = useMemo(() => NICHES.find((n) => n.slug === nicheSlug), [nicheSlug]);

  // captura UTM da URL para enriquecer o lead
  const utm = useMemo<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const u = new URL(window.location.href);
    const out: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "feira"].forEach((k) => {
      const v = u.searchParams.get(k);
      if (v) out[k] = v.slice(0, 60);
    });
    return out;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const n = new URL(window.location.href).searchParams.get("n");
    if (n && NICHES.some((x) => x.slug === n)) setNicheSlug(n);
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!nicheSlug) errs.niche = "Escolha o nicho da sua empresa.";
    if (!name.trim() || name.trim().length < 3) errs.name = "Informe seu nome completo.";
    if (!isValidEmail(email)) errs.email = "E-mail inválido.";
    if (!isValidPhoneBR(phone)) errs.phone = "WhatsApp inválido. Use (DDD) + número.";
    if (!consent) errs.consent = "Você precisa aceitar o contato para liberar a demo.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Verifique os campos destacados.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/public/demo/feira-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, email, phone,
          niche: nicheSlug,
          company: company || undefined,
          notes: notes || undefined,
          origin: utm.feira ? `feira:${utm.feira}` : "feira",
          utm,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "Falha ao registrar.");
      setDone({ leadId: j.lead_id, demoUrl: j.demo_url });
      toast.success("Tudo certo! Acesso liberado e e-mail enviado.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <header className="text-center max-w-3xl mx-auto mb-10">
          <Badge className="bg-gradient-primary mb-4">
            <Sparkles className="w-3 h-3 mr-1" /> Demonstração ao vivo · acesso imediato
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Veja a Impulsionando funcionando no seu segmento
          </h1>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg">
            Escolha o nicho, deixe seu contato e em segundos abrimos uma demonstração
            real — com agenda, CRM, vendas, financeiro, WhatsApp e BI.
          </p>
        </header>

        {!done ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            {/* Niches */}
            <section>
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                1. Escolha o seu segmento
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {NICHES.map((n) => {
                  const Icon = n.icon;
                  const active = nicheSlug === n.slug;
                  return (
                    <button
                      key={n.slug}
                      type="button"
                      onClick={() => setNicheSlug(n.slug)}
                      className={[
                        "text-left rounded-xl border p-3 transition-all hover:shadow-md",
                        active
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40",
                      ].join(" ")}
                    >
                      <Icon className={["w-5 h-5 mb-2", active ? "text-primary" : "text-muted-foreground"].join(" ")} />
                      <div className="font-semibold text-sm leading-tight">{n.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.tagline}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Form */}
            <section>
              <Card className="p-6 shadow-lg border-primary/20">
                <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  2. Seus dados (acesso imediato)
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" aria-invalid={!!errors.name} className={errors.name ? "border-destructive" : ""} />
                    {errors.name && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" aria-invalid={!!errors.email} className={errors.email ? "border-destructive" : ""} />
                      {errors.email && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">WhatsApp *</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(21) 99999-9999" aria-invalid={!!errors.phone} className={errors.phone ? "border-destructive" : ""} />
                      {errors.phone && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company">Empresa (opcional)</Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da sua empresa" />
                  </div>
                  <div>
                    <Label htmlFor="notes">O que mais te interessa? (opcional)</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex.: integrar agenda com WhatsApp" />
                  </div>

                  <label className="flex items-start gap-2 text-xs text-muted-foreground pt-1 cursor-pointer">
                    <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
                    <span>
                      Aceito receber o link da demonstração e contato comercial da Impulsionando.{" "}
                      <Link to="/privacidade" className="underline">LGPD</Link>.
                    </span>
                  </label>
                  {errors.consent && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.consent}</p>}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <ShieldCheck className="w-4 h-4" />
                    Validamos CPF/CNPJ/CEP em formulários completos. Aqui só pedimos o essencial.
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-gradient-primary" disabled={submitting}>
                    {submitting ? "Liberando acesso..." : (
                      <>Abrir demonstração {selectedNiche ? `· ${selectedNiche.name}` : ""} <ArrowRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                  {errors.niche && <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" />{errors.niche}</p>}
                </form>
              </Card>
              <ul className="mt-4 text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><Mail className="w-3 h-3" /> Você recebe o link da demo por e-mail.</li>
                <li className="flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Nosso time comercial recebe sua manifestação em tempo real.</li>
              </ul>
            </section>
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto p-8 text-center border-primary/30">
            <CheckCircle2 className="w-14 h-14 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso liberado!</h2>
            <p className="text-muted-foreground mb-6">
              Enviamos um e-mail para <strong>{email}</strong> com o link e nossa equipe já foi notificada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-gradient-primary" onClick={() => navigate({ to: done.demoUrl.replace("https://impulsionando.com.br", "") as any })}>
                Abrir demonstração agora <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://wa.me/5521993075000" target="_blank" rel="noreferrer">
                  Falar com consultor no WhatsApp
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Lead #{done.leadId.slice(0, 8)} · Ambiente isolado de demonstração.
            </p>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
