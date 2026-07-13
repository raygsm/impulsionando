/**
 * /briefing/site-institucional — Formulário de briefing pós-checkout.
 *
 * Onda 2 (fechamento): dispara o dia 1 dos 10 dias úteis prometidos.
 * Grava em core_briefings (policy public_insert) com source=site-institucional.
 * O time Impulsionando recebe via /admin (staff_read) e via n8n
 * (evento captacao.lead-captado disparado por trigger existente).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/briefing/site-institucional")({
  head: () => ({
    meta: [
      { title: "Briefing do Site Institucional — Impulsionando" },
      { name: "description", content: "Preencha o briefing do seu Site Institucional. Iniciamos a produção assim que recebermos suas respostas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BriefingSite,
});

function BriefingSite() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    contact_name: "",
    contact_email: "",
    contact_whatsapp: "",
    company_name: "",
    niche: "",
    domain: "",
    pages: "",
    references: "",
    tone: "",
    goals: "",
    assets_url: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_name || !form.contact_email || !form.contact_whatsapp || !form.company_name) {
      toast.error("Preencha nome, email, WhatsApp e empresa.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("core_briefings").insert({
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      contact_whatsapp: form.contact_whatsapp,
      company_name: form.company_name,
      niche: form.niche || null,
      goals: form.goals || null,
      source: "site-institucional",
      answers: {
        domain: form.domain,
        pages: form.pages,
        references: form.references,
        tone: form.tone,
        assets_url: form.assets_url,
      },
    } as never);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Briefing enviado! Nosso time inicia a produção em até 1 dia útil.");
  }

  if (done) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1 grid place-items-center px-4 py-16">
          <Card className="max-w-md p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Briefing recebido</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              O time Impulsionando inicia a produção do seu site em até 1 dia útil.
              Você receberá o rascunho navegável no seu subdomínio em até 5 dias.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/">Voltar para a home</Link>
            </Button>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-12">
        <Badge variant="outline" className="mb-2 gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Briefing · Site Institucional
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Vamos começar seu site</h1>
        <p className="mt-2 text-muted-foreground">
          Preencha em 5 minutos. Quanto mais completo, mais rápido entregamos.
        </p>

        <Card className="mt-8 p-6">
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Seu nome *" v={form.contact_name} onChange={set("contact_name")} />
              <Field label="Nome da empresa *" v={form.company_name} onChange={set("company_name")} />
              <Field label="Email *" type="email" v={form.contact_email} onChange={set("contact_email")} />
              <Field label="WhatsApp *" v={form.contact_whatsapp} onChange={set("contact_whatsapp")} placeholder="(21) 99999-9999" />
              <Field label="Segmento / nicho" v={form.niche} onChange={set("niche")} placeholder="Ex.: Clínica, Restaurante, Advocacia…" />
              <Field label="Domínio desejado" v={form.domain} onChange={set("domain")} placeholder="minhaempresa.com.br" />
            </div>

            <TextField label="Páginas desejadas (até 6)" v={form.pages} onChange={set("pages")}
              placeholder="Ex.: Home, Sobre, Serviços, Blog, Contato, LP promocional" />

            <TextField label="Objetivo principal do site" v={form.goals} onChange={set("goals")}
              placeholder="Ex.: Captar leads via formulário, mostrar credibilidade, vender serviço X…" />

            <TextField label="Referências / concorrentes que você gosta" v={form.references} onChange={set("references")}
              placeholder="Cole 2-3 links de sites que servem de inspiração" />

            <TextField label="Tom de comunicação" v={form.tone} onChange={set("tone")}
              placeholder="Ex.: Sério e técnico / Próximo e humano / Premium…" />

            <Field label="Link com logo, fotos e textos (Drive, WeTransfer…)" v={form.assets_url} onChange={set("assets_url")} />

            <Button type="submit" size="lg" disabled={loading} className="gap-2 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar briefing e iniciar produção
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Ao enviar, você autoriza contato do time Impulsionando via WhatsApp e email.
            </p>
          </form>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}

function Field({ label, v, onChange, type = "text", placeholder }: { label: string; v: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      <Input value={v} onChange={onChange} type={type} placeholder={placeholder} />
    </div>
  );
}
function TextField({ label, v, onChange, placeholder }: { label: string; v: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      <Textarea value={v} onChange={onChange} placeholder={placeholder} rows={3} />
    </div>
  );
}
