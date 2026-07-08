import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { registerDemoAccess } from "@/lib/demo-access.functions";
import { toast } from "sonner";

const SearchSchema = z.object({
  niche: z.string().min(1),
  plan: z.enum(["essencial", "ideal", "full"]),
});

export const Route = createFileRoute("/demo/cadastro")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Cadastro rápido — Demonstração Impulsionando" },
      { name: "description", content: "Em 30 segundos, libere o simulador completo do Impulsionando com seus dados básicos." },
      { property: "og:title", content: "Cadastro rápido — Demo Impulsionando" },
      { property: "og:description", content: "Cadastro mínimo para liberar a simulação ao vivo dos módulos integrados." },
    ],
  }),
  component: DemoCadastro,
});

const FormSchema = z.object({
  firstName: z.string().trim().min(2, "Informe seu nome"),
  lastName: z.string().trim().min(2, "Informe seu sobrenome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  phone: z.string().trim().min(10, "WhatsApp inválido"),
});

function DemoCadastro() {
  const { niche, plan } = Route.useSearch();
  const navigate = useNavigate();
  const register = useServerFn(registerDemoAccess);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = FormSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
      const res = await register({
        data: {
          name: fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          sourcePath: `/demo/simulador?niche=${niche}&plan=${plan}`,
          niche,
        },
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "demoSession",
          JSON.stringify({ leadId: res.leadId, name: fullName, email: parsed.data.email, niche, plan, ts: Date.now() }),
        );
      }
      toast.success("Acesso liberado! Abrindo o simulador...");
      navigate({ to: "/demo/simulador", search: { niche, plan } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="text-center mb-6">
          <Badge className="bg-gradient-primary mb-3"><Sparkles className="w-3 h-3 mr-1" /> Passo 2 de 3</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Quase lá</h1>
          <p className="mt-2 text-muted-foreground">
            Cadastro mínimo para liberar o simulador ao vivo do plano <strong>{plan}</strong> no nicho <strong>{niche}</strong>.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} autoComplete="given-name" />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} autoComplete="family-name" />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">WhatsApp (com DDD)</Label>
                <Input id="phone" inputMode="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
              <div className="flex items-center justify-between pt-2">
                <Link to="/demo/escolher-nicho" search={{ niche, plan }} className="text-sm text-muted-foreground hover:text-foreground">← Voltar</Link>
                <Button type="submit" size="lg" className="bg-gradient-primary" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Liberando...</> : <>Liberar simulador <ArrowRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Ao continuar você concorda em receber dicas e atualizações da Impulsionando. Sem spam, cancele quando quiser.
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
