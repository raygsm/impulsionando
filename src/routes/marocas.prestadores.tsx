import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Star, Calendar } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_IMAGENS,
  MAROCAS_PRESTADORES_CATEGORIAS,
} from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas/prestadores";

export const Route = createFileRoute("/marocas/prestadores")({
  head: () => ({
    meta: [
      { title: "Prestadores — Marocas" },
      { name: "description", content: "Cadastre-se como prestador Marocas: camareiras, eletricistas, encanadores, gesseiros, pintores, marceneiros, vistoriadores e mais." },
      { property: "og:title", content: "Cadastro de prestadores — Marocas" },
      { property: "og:description", content: "Trabalho recorrente, agenda organizada e pagamento em dia." },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.prestador },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: PrestadoresPage,
});

function PrestadoresPage() {
  const [ok, setOk] = useState(false);
  const [especialidade, setEspecialidade] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO Codex: gravar prestador em service_providers via createServerFn.
    setOk(true);
  };

  if (ok) {
    return (
      <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Prestadores" }]}>
        <section className="container mx-auto px-4 md:px-6 py-24 max-w-2xl text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-600" />
          <h1 className="text-3xl md:text-4xl font-bold mt-6">Cadastro enviado!</h1>
          <p className="mt-4 text-muted-foreground">
            Vamos analisar seus dados e retornar com o processo de homologação em até 3 dias úteis.
          </p>
          <Link to="/marocas" className="inline-block mt-8 rounded-full border px-6 py-3 font-semibold">
            Voltar para a Marocas
          </Link>
        </section>
      </MarocasShell>
    );
  }

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Prestadores" }]}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={MAROCAS_IMAGENS.prestador} alt="Prestador Marocas em serviço" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 to-slate-900/30" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-20 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Rede Marocas</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3">Trabalho recorrente. Agenda organizada. Pagamento em dia.</h1>
          <p className="mt-4 text-white/85 text-lg">
            Cadastre-se como prestador homologado: camareiras, lavanderia, eletricistas, encanadores, ar-condicionado, pintores, gesseiros e mais.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Especialidades que buscamos</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {MAROCAS_PRESTADORES_CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setEspecialidade(c.titulo)}
              className={`rounded-2xl border p-4 text-left transition ${
                especialidade === c.titulo ? "border-primary bg-primary/5" : "hover:bg-muted"
              }`}
            >
              <div className="text-2xl">{c.emoji}</div>
              <div className="font-semibold text-sm mt-2">{c.titulo}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 pb-16 grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <form onSubmit={submit} className="rounded-2xl bg-card border p-6 md:p-8 space-y-5">
          <h2 className="font-semibold text-lg">Seus dados</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nome / Razão social" required />
            <Field label="CPF ou CNPJ" required />
            <Field label="WhatsApp" required placeholder="(21) 99999-9999" />
            <Field label="E-mail" type="email" required />
            <Field label="Especialidade" value={especialidade} onChange={setEspecialidade} required placeholder="Ex.: Camareira" />
            <Field label="Cidade / regiões atendidas" required placeholder="Copacabana, Ipanema, Leblon" />
            <Field label="Valor de referência (R$)" required placeholder="150" />
            <div>
              <label className="text-sm font-medium">Disponibilidade *</label>
              <select required className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="">Selecione…</option>
                <option>Comercial (seg–sex)</option>
                <option>Comercial + sábado</option>
                <option>Todos os dias</option>
                <option>Plantão / emergências 24h</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Experiência resumida</label>
            <textarea className="mt-1 w-full rounded-lg border px-3 py-2 min-h-24" placeholder="Descreva sua experiência, portfólio ou principais clientes..." />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1" />
            <span>Concordo em passar por processo de homologação (documentação, referências, avaliação prática) antes de receber serviços.</span>
          </label>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-semibold hover:opacity-90 transition"
          >
            Enviar cadastro <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <aside className="rounded-2xl bg-card border p-6 space-y-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 text-primary">
            <Star className="h-5 w-5" /> <span className="text-xs font-semibold uppercase tracking-widest">Por que virar Marocas</span>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> Trabalho recorrente, distribuído por agenda</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> Pagamento mensal via PIX (fechamento dia 5, pgto dia 10)</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> Sem cliente final para negociar — Marocas centraliza</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> Substituição automática se você não puder atender</li>
          </ul>
          <div className="pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> Sua agenda, sua disponibilidade.
          </div>
        </aside>
      </section>
    </MarocasShell>
  );
}

function Field({
  label,
  required,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}{required && " *"}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
