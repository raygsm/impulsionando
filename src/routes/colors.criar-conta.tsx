import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import AuthShell from "@/components/colors/AuthShell";
import { Field, inputCls } from "@/routes/colors.entrar";

export const Route = createFileRoute("/colors/criar-conta")({
  head: () => ({
    meta: [
      { title: "Criar conta — Colors Saúde" },
      { name: "description", content: "Crie sua conta Colors Saúde para acompanhar pedidos e receber ofertas oficiais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CriarContaPage,
});

function CriarContaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", pass: "" });
  const [err, setErr] = useState<string | null>(null);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.name || !form.email || !form.pass) { setErr("Preencha todos os campos obrigatórios."); return; }
    if (form.pass.length < 8) { setErr("A senha precisa ter no mínimo 8 caracteres."); return; }
    setLoading(true);
    // MOCK — Codex plugará supabase.auth.signUp aqui.
    setTimeout(() => navigate({ to: "/colors/minha-conta" }), 800);
  }

  return (
    <AuthShell
      title="Criar sua conta Colors"
      subtitle="Leva menos de 1 minuto. Sem letras miúdas."
      footer={
        <>Já tem conta? <Link to="/colors/entrar" className="font-semibold text-emerald-300 hover:text-emerald-200">Entrar</Link></>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome completo">
          <input required value={form.name} onChange={upd("name")} className={inputCls} placeholder="Como devemos te chamar" />
        </Field>
        <Field label="E-mail">
          <input type="email" autoComplete="email" required value={form.email} onChange={upd("email")} className={inputCls} placeholder="voce@email.com" />
        </Field>
        <Field label="WhatsApp (opcional)">
          <input type="tel" value={form.phone} onChange={upd("phone")} className={inputCls} placeholder="(21) 90000-0000" />
        </Field>
        <Field label="Senha (mín. 8 caracteres)">
          <input type="password" autoComplete="new-password" required value={form.pass} onChange={upd("pass")} className={inputCls} placeholder="••••••••" />
        </Field>

        {err && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

        <button type="submit" disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3 text-sm font-black text-black shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {loading ? "Criando..." : "Criar minha conta"}
        </button>
      </form>
    </AuthShell>
  );
}
