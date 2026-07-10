import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Home as HomeIcon } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_IMAGENS,
  MAROCAS_SERVICOS,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas/cadastrar-imovel";

export const Route = createFileRoute("/marocas/cadastrar-imovel")({
  head: () => ({
    meta: [
      { title: "Cadastrar meu imóvel — Marocas" },
      { name: "description", content: "Cadastre seu imóvel de temporada com a Marocas. Diagnóstico gratuito, onboarding em 7 dias e operação com padrão auditado." },
      { property: "og:title", content: "Cadastrar imóvel — Marocas" },
      { property: "og:description", content: "Anfitriões que querem profissionalizar a operação sem cuidar dela todos os dias." },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.chave },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: CadastrarImovelPage,
});

interface FormState {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  bairro: string;
  quartos: string;
  capacidade: string;
  checkin: string;
  checkout: string;
  regras: string;
  servicos: string[];
  plano: string;
  mensagem: string;
}

const INITIAL: FormState = {
  nome: "",
  email: "",
  telefone: "",
  endereco: "",
  bairro: "",
  quartos: "2",
  capacidade: "4",
  checkin: "15:00",
  checkout: "11:00",
  regras: "",
  servicos: [],
  plano: "gestao",
  mensagem: "",
};

function CadastrarImovelPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [ok, setOk] = useState(false);

  const toggle = (id: string) =>
    setForm((f) => ({
      ...f,
      servicos: f.servicos.includes(id) ? f.servicos.filter((s) => s !== id) : [...f.servicos, id],
    }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO Codex: gravar em marketing_leads via createServerFn e disparar N8N (fluxo cadastro_imovel).
    setOk(true);
  };

  if (ok) {
    return (
      <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Cadastrar imóvel" }]}>
        <section className="container mx-auto px-4 md:px-6 py-24 max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Recebemos seu cadastro!</h1>
          <p className="mt-4 text-muted-foreground">
            Um consultor Marocas entra em contato em até 1 dia útil para agendar o diagnóstico gratuito do seu imóvel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a
              href={marocasWhatsAppUrl(`Olá, acabei de cadastrar o imóvel ${form.endereco || "(pendente)"}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold"
            >
              Adiantar contato pelo WhatsApp
            </a>
            <Link to="/marocas/planos" className="rounded-full border px-6 py-3 font-semibold">
              Ver planos
            </Link>
          </div>
        </section>
      </MarocasShell>
    );
  }

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Cadastrar imóvel" }]}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={MAROCAS_IMAGENS.chave} alt="Chaves de apartamento" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-slate-900/30" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-16 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Anfitriões</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3">Cadastre seu imóvel em 3 minutos.</h1>
          <p className="mt-4 text-white/85 text-lg">
            Diagnóstico gratuito, plano sugerido e onboarding em 7 dias. Sem fidelidade.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <form onSubmit={submit} className="rounded-2xl bg-card border p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-semibold text-lg">Dados do proprietário</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <Field label="Nome completo" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} required />
              <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Field label="WhatsApp" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} required placeholder="(21) 99999-9999" />
              <Field label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} required placeholder="Copacabana" />
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg">Sobre o imóvel</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <Field label="Endereço completo" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} required />
              <Field label="Nº de quartos" type="number" value={form.quartos} onChange={(v) => setForm({ ...form, quartos: v })} required />
              <Field label="Capacidade máxima (pessoas)" type="number" value={form.capacidade} onChange={(v) => setForm({ ...form, capacidade: v })} required />
              <Field label="Horário check-in" type="time" value={form.checkin} onChange={(v) => setForm({ ...form, checkin: v })} />
              <Field label="Horário check-out" type="time" value={form.checkout} onChange={(v) => setForm({ ...form, checkout: v })} />
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Regras da casa</label>
                <textarea
                  value={form.regras}
                  onChange={(e) => setForm({ ...form, regras: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2 min-h-24"
                  placeholder="Ex.: sem festas, permitido pet até 10kg, silêncio após 22h..."
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg">Serviços desejados</h2>
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {MAROCAS_SERVICOS.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                    form.servicos.includes(s.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.servicos.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-lg mr-1">{s.emoji}</span>
                    <span className="font-medium text-sm">{s.titulo}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{s.resumo}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Plano de interesse</label>
            <select
              value={form.plano}
              onChange={(e) => setForm({ ...form, plano: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="essencial">Essencial — comunicação + agenda</option>
              <option value="gestao">Gestão — operação executada pela Marocas</option>
              <option value="full">Full — gestão completa + captação + IA</option>
              <option value="indefinido">Ainda não sei, quero um diagnóstico</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Mensagem (opcional)</label>
            <textarea
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 min-h-20"
              placeholder="Conte um pouco sobre o imóvel e sua expectativa..."
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-semibold hover:opacity-90 transition"
          >
            Solicitar diagnóstico gratuito <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Ao enviar você concorda com nossa política de privacidade. Nenhuma cobrança acontece agora.
          </p>
        </form>

        <aside className="rounded-2xl bg-card border p-6 space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 text-primary">
            <HomeIcon className="h-5 w-5" /> <span className="text-xs font-semibold uppercase tracking-widest">O que vem depois</span>
          </div>
          <ol className="space-y-4 text-sm">
            <li>
              <div className="font-semibold">1. Contato em 1 dia útil</div>
              <div className="text-muted-foreground">Consultor liga para entender expectativa e agendar visita.</div>
            </li>
            <li>
              <div className="font-semibold">2. Diagnóstico do imóvel</div>
              <div className="text-muted-foreground">Sugerimos plano, precificação e checklist inicial.</div>
            </li>
            <li>
              <div className="font-semibold">3. Contrato & onboarding</div>
              <div className="text-muted-foreground">Fotos, kit de boas-vindas, comunicação automatizada em 7 dias.</div>
            </li>
            <li>
              <div className="font-semibold">4. Operação Marocas</div>
              <div className="text-muted-foreground">Você acompanha tudo no painel do proprietário.</div>
            </li>
          </ol>
          <Link to="/marocas/planos" className="block text-sm text-primary underline">
            Ver detalhes dos planos →
          </Link>
        </aside>
      </section>
    </MarocasShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}{required && " *"}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
