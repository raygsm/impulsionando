/**
 * /onboarding-site — Wizard client-side que gera um rascunho de site
 * a partir de um template escolhido + dados do cliente. Rascunho é
 * armazenado em localStorage (frontend-only lock).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { breadcrumbJsonLd } from "@/lib/seo";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { VITRINE_TEMPLATES, getVitrineSubniche, getVitrineTemplate, type VitrineTemplate } from "@/data/vitrine-templates";
import { VitrineTemplateView } from "@/components/vitrine/VitrineTemplateView";
import { DeviceFrame } from "@/components/vitrine/DeviceFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding-site")({
  head: () => ({
    meta: [
      { title: "Onboarding · Gere seu site em minutos — Impulsionando" },
      { name: "description", content: "Escolha um template por nicho, preencha os dados da sua marca e gere automaticamente um rascunho do site." },
      { property: "og:title", content: "Onboarding · Gere seu site — Impulsionando" },
      { property: "og:description", content: "Rascunho automático a partir de templates por nicho." },
      { property: "og:url", content: "https://impulsionando.com.br/onboarding-site" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/onboarding-site" }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Onboarding de Site", path: "/onboarding-site" },
      ]),
    ],
  }),
  component: OnboardingSitePage,
});

type Draft = {
  id: string;
  createdAt: string;
  macro: string;
  sub?: string;
  brandName: string;
  tagline: string;
  headline: string;
  subtitle: string;
  whatsapp: string;
  email: string;
  address: string;
  accent: string;
};

const STORAGE_KEY = "impulsionando:site-drafts";

function loadDrafts(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveDraft(d: Draft) {
  const all = loadDrafts();
  all.unshift(d);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)));
}

function OnboardingSitePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [macro, setMacro] = useState<string>(VITRINE_TEMPLATES[0].macro);
  const [sub, setSub] = useState<string>("");
  const [form, setForm] = useState({
    brandName: "",
    tagline: "",
    headline: "",
    subtitle: "",
    whatsapp: "",
    email: "",
    address: "",
    accent: "",
  });

  const base = getVitrineTemplate(macro)!;
  const subOptions = base.subniches ?? [];

  const merged: VitrineTemplate = useMemo(() => {
    const start = sub ? getVitrineSubniche(macro, sub)?.merged ?? base : base;
    return {
      ...start,
      brand: {
        ...start.brand,
        name: form.brandName || start.brand.name,
        tagline: form.tagline || start.brand.tagline,
      },
      palette: {
        ...start.palette,
        accent: form.accent || start.palette.accent,
      },
      hero: {
        ...start.hero,
        title: form.headline || start.hero.title,
        subtitle: form.subtitle || start.hero.subtitle,
      },
      contact: {
        whatsapp: form.whatsapp || start.contact.whatsapp,
        email: form.email || start.contact.email,
        address: form.address || start.contact.address,
      },
    };
  }, [base, macro, sub, form]);

  function handleGenerate() {
    const draft: Draft = {
      id: `draft-${Date.now()}`,
      createdAt: new Date().toISOString(),
      macro,
      sub: sub || undefined,
      ...form,
    };
    saveDraft(draft);
    toast.success("Rascunho gerado e salvo localmente!", {
      description: "Você pode enviá-lo ao time Impulsionando para publicação.",
    });
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Gere um rascunho do seu site
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Escolha um template, personalize os dados da sua marca e visualize um rascunho pronto para o time Impulsionando publicar.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setStep(n as 1 | 2 | 3)}
                className={`px-3 py-1.5 rounded-full border transition ${
                  step === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}. {n === 1 ? "Template" : n === 2 ? "Sua marca" : "Preview & gerar"}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          {step === 1 && (
            <Card className="p-6">
              <Label className="text-sm">Macro-nicho</Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {VITRINE_TEMPLATES.map((t) => (
                  <button
                    key={t.macro}
                    onClick={() => { setMacro(t.macro); setSub(""); }}
                    className={`text-left overflow-hidden rounded-xl border transition ${
                      macro === t.macro
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={t.hero.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
                      <div className="font-semibold text-sm mt-0.5">{t.templateName}</div>
                    </div>
                  </button>
                ))}
              </div>

              {subOptions.length > 0 && (
                <>
                  <Label className="text-sm mt-6 block">Subnicho (opcional)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSub("")}
                      className={`px-3 py-1.5 rounded-full text-xs border ${sub === "" ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}
                    >
                      Padrão do macro
                    </button>
                    {subOptions.map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => setSub(s.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${sub === s.slug ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep(2)} className="gap-2">
                  Próximo <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="p-6 grid gap-4 sm:grid-cols-2">
              <Field label="Nome da marca" value={form.brandName} onChange={(v) => setForm({ ...form, brandName: v })} placeholder={base.brand.name} />
              <Field label="Slogan / tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} placeholder={base.brand.tagline} />
              <Field label="Título do hero" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} placeholder={base.hero.title} className="sm:col-span-2" />
              <TextArea label="Subtítulo do hero" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} placeholder={base.hero.subtitle} className="sm:col-span-2" />
              <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder={base.contact.whatsapp} />
              <Field label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder={base.contact.email} />
              <Field label="Endereço" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder={base.contact.address} className="sm:col-span-2" />
              <div>
                <Label className="text-sm">Cor primária</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accent || base.palette.accent}
                    onChange={(e) => setForm({ ...form, accent: e.target.value })}
                    className="h-10 w-16 rounded border border-border bg-transparent"
                  />
                  <span className="text-xs text-muted-foreground">{form.accent || base.palette.accent}</span>
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={() => setStep(3)} className="gap-2">
                  Ver preview <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Rascunho</div>
                  <h2 className="font-serif text-2xl font-semibold">{merged.brand.name}</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(2)}>Editar dados</Button>
                  <Button onClick={handleGenerate} className="gap-2">
                    <Save className="h-4 w-4" /> Salvar rascunho
                  </Button>
                </div>
              </div>
              <DeviceFrame>
                <VitrineTemplateView t={merged} />
              </DeviceFrame>
              <Card className="p-5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  Rascunhos ficam salvos neste navegador. Quando quiser publicar,{" "}
                  <Link to="/quero-comecar" className="text-primary underline">fale com o time Impulsionando</Link>{" "}
                  — nós assumimos o setup completo.
                </div>
              </Card>
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-sm">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-sm">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="mt-1" />
    </div>
  );
}
