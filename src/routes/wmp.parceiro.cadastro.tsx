import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { submitWmpParceiro } from "@/lib/wmp.functions";

export const Route = createFileRoute("/wmp/parceiro/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro de Parceiro — WMP" }] }),
  component: WmpParceiroCadastro,
});

const CATEGORIAS = [
  { v: "dj", l: "DJ" },
  { v: "musico", l: "Músico / Banda" },
  { v: "tecnico_som", l: "Técnico de som" },
  { v: "tecnico_luz", l: "Técnico de luz" },
  { v: "tecnico_video", l: "Técnico de vídeo" },
  { v: "cerimonialista", l: "Cerimonialista" },
  { v: "fornecedor", l: "Fornecedor (palco, gerador, etc.)" },
  { v: "outro", l: "Outro" },
];

function WmpParceiroCadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "", nome_artistico: "", email: "", telefone: "",
    categoria: "dj", cidade: "", estado: "", experiencia_anos: "",
    bio: "",
  });
  const [links, setLinks] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await submitWmpParceiro({
        data: {
          ...form,
          experiencia_anos: Number(form.experiencia_anos) || null,
          portfolio_links: links.filter((l) => l.trim()),
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          origem: "site_wmp_parceiro",
        },
      });
      navigate({ to: "/wmp/obrigado/$tipo", params: { tipo: "parceiro" }, search: { id: res.id } });
    } catch (err: any) {
      setError(err?.message ?? "Falha ao enviar cadastro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WmpShell>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-3xl px-6 pt-14 pb-10 text-center">
          <h1 className="wmp-display text-3xl md:text-5xl mb-3">Cadastro de Parceiro</h1>
          <p className="opacity-80">Compartilhe seu perfil. Avaliamos em até 5 dias úteis.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 pb-24 -mt-6">
        <form onSubmit={handleSubmit} className="wmp-surface p-6 md:p-10 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nome completo *"><input required value={form.nome} onChange={(e) => up("nome", e.target.value)} /></Field>
            <Field label="Nome artístico"><input value={form.nome_artistico} onChange={(e) => up("nome_artistico", e.target.value)} /></Field>
            <Field label="E-mail *"><input required type="email" value={form.email} onChange={(e) => up("email", e.target.value)} /></Field>
            <Field label="WhatsApp *"><input required value={form.telefone} onChange={(e) => up("telefone", e.target.value)} /></Field>
            <Field label="Categoria *">
              <select required value={form.categoria} onChange={(e) => up("categoria", e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </Field>
            <Field label="Anos de experiência"><input type="number" min={0} value={form.experiencia_anos} onChange={(e) => up("experiencia_anos", e.target.value)} /></Field>
            <Field label="Cidade"><input value={form.cidade} onChange={(e) => up("cidade", e.target.value)} /></Field>
            <Field label="UF"><input maxLength={2} value={form.estado} onChange={(e) => up("estado", e.target.value.toUpperCase())} /></Field>
            <Field label="Sobre você (mini-bio)" full>
              <textarea rows={4} value={form.bio} onChange={(e) => up("bio", e.target.value)} maxLength={1500} />
            </Field>
            <div className="md:col-span-2 space-y-2">
              <span className="block text-sm" style={{ color: "var(--wmp-muted)" }}>Portfólio (Instagram, YouTube, SoundCloud, site…)</span>
              {links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input value={l} onChange={(e) => setLinks((arr) => arr.map((x, j) => j === i ? e.target.value : x))} placeholder="https://…" />
                  {links.length > 1 && (
                    <button type="button" onClick={() => setLinks((arr) => arr.filter((_, j) => j !== i))}
                      className="wmp-cta wmp-cta-outline" style={{ padding: "0.5rem" }}>
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setLinks((arr) => [...arr, ""])}
                className="wmp-cta wmp-cta-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                <Plus className="size-4" /> Adicionar link
              </button>
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "color-mix(in oklab, red 20%, transparent)", color: "white" }}>{error}</div>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="wmp-cta">
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Enviando…</> : <><Check className="size-4" /> Enviar cadastro</>}
            </button>
          </div>
        </form>
      </section>
    </WmpShell>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <span className="block text-sm" style={{ color: "var(--wmp-muted)" }}>{label}</span>
      {children}
    </label>
  );
}
