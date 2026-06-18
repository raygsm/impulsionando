import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitDemoSurvey } from "@/lib/demo-access.functions";
import { CheckCircle2, MessageSquare, Sparkles } from "lucide-react";

type Search = { lead?: string };

export const Route = createFileRoute("/pesquisa")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    lead: typeof search.lead === "string" ? search.lead : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pesquisa de satisfação — Impulsionando" },
      {
        name: "description",
        content:
          "Conte o que podemos melhorar e descubra o plano ideal para impulsionar o seu negócio.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SurveyPage,
});

function SurveyPage() {
  const search = Route.useSearch();
  const submit = useServerFn(submitDemoSurvey);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [planInterest, setPlanInterest] = useState<string>("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (name.trim().length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.trim().length < 5) {
      toast.error("Preencha nome, e-mail válido e a sua resposta.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          leadId: search.lead ?? null,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          planInterest: planInterest || null,
          sourcePath: "/pesquisa",
        },
      });
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não conseguimos registrar agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
        <div className="max-w-lg text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold">Obrigado pelo seu feedback!</h1>
          <p className="text-muted-foreground">
            Sua resposta foi registrada. Vamos usar cada observação para melhorar a experiência da
            Impulsionando.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild>
              <Link to="/planos">Ver planos e contratar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pesquisa de satisfação</h1>
            <p className="text-sm text-muted-foreground">
              Sua opinião nos ajuda a evoluir a Impulsionando. Leva 2 minutos.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Seu nome</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">E-mail</Label>
              <Input
                id="s-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-msg">O que podemos melhorar?</Label>
            <Textarea
              id="s-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Conte o que mais te chamou atenção, o que faltou, o que pode evoluir..."
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Campo livre. Quanto mais detalhe, melhor.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-plan">Tem interesse em algum plano? (opcional)</Label>
            <select
              id="s-plan"
              value={planInterest}
              onChange={(e) => setPlanInterest(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Ainda estou avaliando</option>
              <option value="essencial">Essencial — ½ salário mínimo/mês</option>
              <option value="integrado">Ideal (Integrado) — 1 salário mínimo/mês</option>
              <option value="avancado">Full (Avançado) — 2 salários mínimos/mês</option>
              <option value="sob-medida">Sob medida / White label</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" className="sm:flex-1" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar resposta"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/planos" className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Ver planos
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
