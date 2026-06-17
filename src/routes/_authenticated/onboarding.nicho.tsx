import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCurrentUser } from "@/hooks/use-current-user";
import { applyNicheOnboarding } from "@/lib/niche-onboarding.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Beer,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  Stethoscope,
  Wrench,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding/nicho")({
  head: () => ({
    meta: [
      { title: "Configuração por nicho — Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NicheOnboardingPage,
});

type NicheSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

const NICHES: Array<{ slug: NicheSlug; label: string; desc: string; icon: typeof Beer }> = [
  { slug: "clinicas", label: "Clínicas e Saúde", desc: "Agenda, prontuário, pacientes, convênios.", icon: Stethoscope },
  { slug: "bares", label: "Bares e Restaurantes", desc: "PDV, comandas, estoque, reservas.", icon: Beer },
  { slug: "microcervejarias", label: "Microcervejarias", desc: "Produção, B2B, PDV, clube.", icon: Beer },
  { slug: "servicos", label: "Serviços", desc: "OS, técnicos, orçamentos, SLA.", icon: Wrench },
  { slug: "ecommerce", label: "E-commerce", desc: "Catálogo, pedidos, marketing.", icon: ShoppingCart },
];

function NicheOnboardingPage() {
  const { data: me } = useCurrentUser();
  const companyId = me?.memberships?.[0]?.company_id;
  const navigate = useNavigate();
  const applyFn = useServerFn(applyNicheOnboarding);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<NicheSlug | null>(null);
  const [busy, setBusy] = useState(false);
  const [installedCount, setInstalledCount] = useState<number | null>(null);

  if (!companyId) {
    return (
      <Card className="p-6 max-w-xl mx-auto">
        <h2 className="font-semibold mb-2">Empresa não encontrada</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Não foi possível identificar sua empresa.
        </p>
        <Button asChild variant="outline"><Link to="/dashboard">Voltar</Link></Button>
      </Card>
    );
  }

  async function handleApply() {
    if (!selected || !companyId) return;
    setBusy(true);
    try {
      const res = await applyFn({ data: { companyId, nicheSlug: selected } });
      setInstalledCount(res.installedCount);
      setStep(3);
      toast.success(`Template aplicado: ${res.installedCount} módulos configurados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao aplicar template");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuração guiada por nicho</h1>
        <p className="text-sm text-muted-foreground">
          Passo {step} de 3 — escolha o segmento e aplicamos automaticamente os módulos,
          menus e relatórios certos para você.
        </p>
      </div>

      {step === 1 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {NICHES.map((n) => {
            const Icon = n.icon;
            const isSel = selected === n.slug;
            return (
              <button
                key={n.slug}
                type="button"
                onClick={() => setSelected(n.slug)}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  isSel ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {isSel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <div className="font-medium">{n.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.desc}</div>
              </button>
            );
          })}
          <div className="sm:col-span-2 flex justify-end">
            <Button disabled={!selected} onClick={() => setStep(2)}>
              Continuar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && selected && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Pré-configuração
            </Badge>
            <span className="text-sm text-muted-foreground">
              {NICHES.find((x) => x.slug === selected)?.label}
            </span>
          </div>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              Instalar módulos recomendados para o nicho
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              Aplicar menus específicos do segmento
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              Ativar relatórios e dashboards padrão
            </li>
          </ul>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={handleApply} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aplicar configuração
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Tudo pronto!</h2>
            <p className="text-sm text-muted-foreground">
              {installedCount ?? 0} módulos instalados e configuração aplicada à sua empresa.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate({ to: "/dashboard" })}>Ir para o painel</Button>
            <Button variant="outline" asChild>
              <Link to="/onboarding">Voltar ao onboarding</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
