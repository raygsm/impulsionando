import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Building2, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { getMarocasPlano } from "@/components/marocas/marocasPlanos";
import { MarocasHelpFab } from "@/components/marocas/MarocasHelpFab";

export const Route = createFileRoute("/marocas/contratar/$plano")({
  loader: ({ params }) => {
    const plano = getMarocasPlano(params.plano);
    if (!plano) throw notFound();
    return { plano };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Contratar ${loaderData.plano.nome} — Marocas` : "Contratar — Marocas" },
      { name: "description", content: "Solicite contratação do plano Marocas em 3 passos: imóvel, perfil e confirmação." },
    ],
  }),
  notFoundComponent: () => (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Plano não encontrado</h1>
        <p className="text-muted-foreground mt-2">Confira os planos disponíveis.</p>
        <Link to="/marocas/planos" className="inline-block mt-4 underline">Ver planos</Link>
      </div>
    </main>
  ),
  component: ContratarPage,
});

type Step = 1 | 2 | 3 | 4;

function ContratarPage() {
  const { plano } = Route.useLoaderData();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    imovelTipo: "apartamento",
    bairro: "",
    metragem: "",
    quartos: "1",
    ocupacaoMedia: "",
    nome: "",
    email: "",
    telefone: "",
    observacoes: "",
    aceite: false,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrar com createServerFn de leads. Por ora apenas avança para confirmação.
    setStep(4);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/marocas" className="flex items-center gap-2 font-bold text-xl">
            <Building2 className="h-6 w-6 text-primary" /> Marocas
          </Link>
          <Link to="/marocas/planos" className="text-sm underline">Comparar planos</Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 grid lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <Link to="/marocas/planos" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Voltar para planos
          </Link>
          <h1 className="text-3xl font-bold mt-2">Contratar {plano.nome}</h1>
          <p className="text-muted-foreground mt-2">{plano.resumo}</p>

          <ol className="flex items-center gap-2 mt-8 text-xs">
            {(["Imóvel", "Perfil", "Confirmação", "Pronto"] as const).map((label, i) => {
              const n = (i + 1) as Step;
              const active = step === n;
              const done = step > n;
              return (
                <li key={label} className="flex items-center gap-2 flex-1">
                  <span
                    className={`flex items-center justify-center h-7 w-7 rounded-full font-semibold ${
                      done ? "bg-emerald-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : n}
                  </span>
                  <span className={active ? "font-semibold" : "text-muted-foreground"}>{label}</span>
                  {i < 3 && <span className="flex-1 h-px bg-border" />}
                </li>
              );
            })}
          </ol>

          <form onSubmit={submit} className="mt-8 rounded-2xl border bg-card p-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Conte sobre o imóvel</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Tipo de imóvel">
                    <select className="input" value={form.imovelTipo} onChange={(e) => update("imovelTipo", e.target.value)}>
                      <option value="apartamento">Apartamento</option>
                      <option value="cobertura">Cobertura</option>
                      <option value="loft">Loft / Studio</option>
                      <option value="casa">Casa</option>
                    </select>
                  </Field>
                  <Field label="Bairro">
                    <input className="input" required value={form.bairro} onChange={(e) => update("bairro", e.target.value)} placeholder="Copacabana" />
                  </Field>
                  <Field label="Metragem (m²)">
                    <input className="input" required type="number" value={form.metragem} onChange={(e) => update("metragem", e.target.value)} />
                  </Field>
                  <Field label="Quartos">
                    <select className="input" value={form.quartos} onChange={(e) => update("quartos", e.target.value)}>
                      {["1", "2", "3", "4+"].map((q) => (
                        <option key={q}>{q}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ocupação média (%)">
                    <input className="input" type="number" value={form.ocupacaoMedia} onChange={(e) => update("ocupacaoMedia", e.target.value)} placeholder="Ex: 70" />
                  </Field>
                </div>
                <StepNav onNext={next} canNext={!!form.bairro && !!form.metragem} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Seus dados</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nome completo">
                    <input className="input" required value={form.nome} onChange={(e) => update("nome", e.target.value)} />
                  </Field>
                  <Field label="E-mail">
                    <input className="input" required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                  </Field>
                  <Field label="Telefone / WhatsApp">
                    <input className="input" required value={form.telefone} onChange={(e) => update("telefone", e.target.value)} placeholder="(21) 9..." />
                  </Field>
                </div>
                <Field label="Observações (opcional)">
                  <textarea className="input min-h-24" value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} />
                </Field>
                <StepNav onBack={back} onNext={next} canNext={!!form.nome && !!form.email && !!form.telefone} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Revisar e confirmar</h2>
                <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-1">
                  <div><strong>Plano:</strong> {plano.nome}</div>
                  <div><strong>Imóvel:</strong> {form.imovelTipo} · {form.bairro} · {form.metragem}m² · {form.quartos} quarto(s)</div>
                  <div><strong>Contato:</strong> {form.nome} · {form.email} · {form.telefone}</div>
                  {form.observacoes && <div><strong>Observações:</strong> {form.observacoes}</div>}
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={form.aceite} onChange={(e) => update("aceite", e.target.checked)} className="mt-1" />
                  <span>
                    Autorizo a Marocas a entrar em contato para apresentar a proposta e agendar visita técnica.
                    Concordo com a política de privacidade.
                  </span>
                </label>
                <StepNav onBack={back} submit canNext={form.aceite} nextLabel="Solicitar contratação" />
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-8">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold mt-4">Solicitação recebida!</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Um consultor Marocas vai entrar em contato em até 1 dia útil para apresentar a proposta de
                  <strong> {plano.nome}</strong> e agendar visita técnica.
                </p>
                <div className="flex gap-3 justify-center mt-6">
                  <button type="button" onClick={() => navigate({ to: "/marocas" })} className="rounded-md border px-4 py-2 font-semibold">
                    Voltar
                  </button>
                  <Link to="/marocas/assistente" className="rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold">
                    Falar com o Assistente
                  </Link>
                </div>
              </div>
            )}
          </form>
        </div>

        <aside className="lg:sticky lg:top-6 h-fit rounded-2xl border bg-gradient-to-b from-primary/5 to-background p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">{plano.tagline}</div>
          <h3 className="font-bold text-lg mt-1">{plano.nome}</h3>
          <div className="text-xl font-bold mt-2">{plano.preco}</div>
          {plano.precoNota && <div className="text-xs text-muted-foreground">{plano.precoNota}</div>}
          <ul className="mt-5 space-y-1.5 text-sm">
            {plano.inclui.slice(0, 6).map((i) => (
              <li key={i} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" /> {i}</li>
            ))}
          </ul>
        </aside>
      </div>

      <MarocasHelpFab />

      <style>{`
        .input { width: 100%; border: 1px solid hsl(var(--border)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; background: hsl(var(--background)); }
        .input:focus { outline: 2px solid hsl(var(--primary)); outline-offset: 1px; }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function StepNav({
  onBack,
  onNext,
  canNext = true,
  submit = false,
  nextLabel = "Continuar",
}: {
  onBack?: () => void;
  onNext?: () => void;
  canNext?: boolean;
  submit?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex justify-between pt-4">
      {onBack ? (
        <button type="button" onClick={onBack} className="rounded-md border px-4 py-2 text-sm font-medium">
          Voltar
        </button>
      ) : <span />}
      {submit ? (
        <button type="submit" disabled={!canNext} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {nextLabel}
        </button>
      ) : (
        <button type="button" onClick={onNext} disabled={!canNext} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {nextLabel} <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      )}
    </div>
  );
}
