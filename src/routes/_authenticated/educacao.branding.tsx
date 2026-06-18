import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useEducBranding } from "@/lib/educ-branding";

export const Route = createFileRoute("/_authenticated/educacao/branding")({
  component: BrandingPage,
});

type Form = {
  id?: string;
  nome_exibicao: string;
  logo_url: string;
  favicon_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_fundo: string;
  dominio_personalizado: string;
  hero_titulo: string;
  hero_subtitulo: string;
  cta_label: string;
  cta_url: string;
  rodape_texto: string;
  ativo: boolean;
};

const EMPTY: Form = {
  nome_exibicao: "",
  logo_url: "", favicon_url: "",
  cor_primaria: "#0F172A", cor_secundaria: "#3B82F6", cor_fundo: "#FFFFFF",
  dominio_personalizado: "",
  hero_titulo: "", hero_subtitulo: "",
  cta_label: "", cta_url: "", rodape_texto: "",
  ativo: true,
};

function BrandingPage() {
  useEducBranding(); // aplica branding atual nas variáveis CSS
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("educ_white_label_branding")
        .select("*").order("created_at", { ascending: false }).limit(1);
      const row = data?.[0];
      if (row) setForm({ ...EMPTY, ...row });
      setLoading(false);
    }
    load();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_exibicao.trim()) { toast.error("Informe o nome de exibição"); return; }
    setSaving(true);
    const payload = { ...form };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (supabase as any).from("educ_white_label_branding");
    const op = form.id ? table.update(payload).eq("id", form.id) : table.insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Branding salvo");
  }

  if (loading) return <main className="p-8"><p className="text-sm text-muted-foreground">Carregando…</p></main>;

  return (
    <main className="min-h-dvh bg-background py-8">
      <div className="mx-auto max-w-3xl px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">White Label — Educação</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalize marca, cores e textos exibidos na sua área educacional.
          </p>
        </header>

        <form onSubmit={onSave} className="space-y-6" noValidate>
          <Card>
            <CardHeader><CardTitle className="text-base">Identidade</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Nome de exibição" id="nome" required value={form.nome_exibicao}
                onChange={(v) => setForm({ ...form, nome_exibicao: v })} />
              <Field label="Domínio personalizado" id="dom" value={form.dominio_personalizado}
                onChange={(v) => setForm({ ...form, dominio_personalizado: v })} placeholder="ead.suaempresa.com.br" />
              <Field label="URL do logo" id="logo" value={form.logo_url}
                onChange={(v) => setForm({ ...form, logo_url: v })} />
              <Field label="URL do favicon" id="fav" value={form.favicon_url}
                onChange={(v) => setForm({ ...form, favicon_url: v })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cores</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <ColorField label="Primária" id="cp" value={form.cor_primaria}
                onChange={(v) => setForm({ ...form, cor_primaria: v })} />
              <ColorField label="Secundária" id="cs" value={form.cor_secundaria}
                onChange={(v) => setForm({ ...form, cor_secundaria: v })} />
              <ColorField label="Fundo" id="cb" value={form.cor_fundo}
                onChange={(v) => setForm({ ...form, cor_fundo: v })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Hero e CTA</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Título do hero" id="ht" value={form.hero_titulo}
                onChange={(v) => setForm({ ...form, hero_titulo: v })} />
              <Field label="Subtítulo do hero" id="hs" value={form.hero_subtitulo}
                onChange={(v) => setForm({ ...form, hero_subtitulo: v })} />
              <Field label="Texto do CTA" id="cl" value={form.cta_label}
                onChange={(v) => setForm({ ...form, cta_label: v })} />
              <Field label="Link do CTA" id="cu" value={form.cta_url}
                onChange={(v) => setForm({ ...form, cta_url: v })} />
              <div className="md:col-span-2">
                <Label htmlFor="rod">Texto do rodapé</Label>
                <Textarea id="rod" value={form.rodape_texto}
                  onChange={(e) => setForm({ ...form, rodape_texto: e.target.value })} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <Label htmlFor="ativo" className="text-base">Branding ativo</Label>
                <p className="text-xs text-muted-foreground">Quando desligado, a área de Educação volta ao tema padrão.</p>
              </div>
              <Switch id="ativo" checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Salvando…" : "Salvar branding"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, id, value, onChange, required, placeholder }: {
  label: string; id: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}{required ? " *" : ""}</Label>
      <Input id={id} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorField({ label, id, value, onChange }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (seletor de cor)`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
        />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}
