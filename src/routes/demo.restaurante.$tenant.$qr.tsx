/**
 * /demo/restaurante/$tenant/$qr — Shell mobile-first do QR Code de demonstração.
 *
 * Fase 1: registra a leitura via server fn e mostra cabeçalho com a identidade do
 * cenário, o tipo de QR (mesa/delivery/evento/etc) e o aviso obrigatório de demo.
 * O cardápio interativo, carrinho e checkout simulado entram na Fase 2.
 *
 * Rota PÚBLICA — não exige login. Toda escrita é via server fn validada com Zod.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { getDemoScenario, recordDemoScan } from "@/lib/demo-restaurante.functions";

export const Route = createFileRoute("/demo/restaurante/$tenant/$qr")({
  head: ({ params }) => ({
    meta: [
      { title: `Demo · ${params.tenant} — ${params.qr} | Impulsionando` },
      { name: "description", content: "Ambiente de demonstração do nicho Bar & Restaurante. Nenhum pedido real é processado." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Demonstração Bar & Restaurante" },
      { property: "og:url", content: `https://impulsionando.com.br/demo/restaurante/${params.tenant}/${params.qr}` },
    ],
    links: [
      { rel: "canonical", href: `https://impulsionando.com.br/demo/restaurante/${params.tenant}/${params.qr}` },
    ],
  }),
  component: DemoQrShell,
});

const KIND_LABEL: Record<string, string> = {
  mesa: "Mesa",
  delivery: "Delivery",
  evento: "Evento",
  pesquisa: "Pesquisa",
  clube: "Clube",
};

function DemoQrShell() {
  const { tenant, qr } = Route.useParams();
  const fetchScenario = useServerFn(getDemoScenario);
  const recordScan = useServerFn(recordDemoScan);
  const scanFired = useRef(false);

  const scenarioQ = useQuery({
    queryKey: ["demo-resto-scenario-public", tenant],
    queryFn: () => fetchScenario({ data: { slug: tenant } }),
    staleTime: 5 * 60_000,
  });

  const currentQr = scenarioQ.data?.qrs.find((q) => q.slug === qr);

  // Dispara o scan exatamente uma vez por montagem, após o cenário carregar.
  useEffect(() => {
    if (scanFired.current || !scenarioQ.data || !currentQr) return;
    scanFired.current = true;
    const stored = (() => {
      try { return localStorage.getItem(`demo-resto-session:${tenant}`) ?? undefined; } catch { return undefined; }
    })();
    recordScan({
      data: {
        scenarioSlug: tenant,
        qrSlug: qr,
        sessionId: stored,
        userAgent: navigator.userAgent.slice(0, 500),
      },
    })
      .then((r) => {
        try { localStorage.setItem(`demo-resto-session:${tenant}`, r.sessionId); } catch { /* ignore */ }
      })
      .catch(() => { /* silencioso na demo */ });
  }, [scenarioQ.data, currentQr, tenant, qr, recordScan]);

  if (scenarioQ.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando demonstração…</div>;
  }

  if (!scenarioQ.data || !currentQr) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-sm text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto text-amber-600" />
          <h1 className="text-lg font-semibold">QR Code não reconhecido</h1>
          <p className="text-sm text-muted-foreground">
            Esse QR Code não pertence à demonstração ativa. Volte ao showroom e tente novamente.
          </p>
        </Card>
      </main>
    );
  }

  const { scenario } = scenarioQ.data;

  return (
    <main
      className="min-h-screen pb-16"
      style={{ background: `linear-gradient(180deg, ${scenario.primary_color}14, transparent 220px)` }}
    >
      {/* Banner obrigatório de demo */}
      <div className="bg-amber-500 text-amber-950 text-center text-xs sm:text-sm font-medium py-2 px-4 flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        Ambiente de demonstração — nenhum pedido, Pix ou cobrança será processado.
      </div>

      <header className="px-4 pt-6 pb-4 max-w-md mx-auto">
        <Badge variant="outline" className="mb-2">{KIND_LABEL[currentQr.kind] ?? currentQr.kind} · {currentQr.slug}</Badge>
        <h1 className="text-2xl font-bold leading-tight">{scenario.name}</h1>
        <p className="text-sm text-muted-foreground">{scenario.tagline}</p>
      </header>

      <section className="px-4 max-w-md mx-auto space-y-4">
        <Card className="p-4 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">{currentQr.title}</p>
            <p className="text-muted-foreground">{currentQr.instruction}</p>
          </div>
        </Card>

        <Card className="p-4 space-y-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" /> Leitura registrada
          </div>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80">
            No painel do vendedor essa leitura já apareceu como evento em tempo real, provando que cada
            visita anônima vira identificável.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> Próximas etapas da demo
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Cardápio digital com IPAs, massas e harmonizações sugeridas</li>
            <li>Carrinho com taxa, voucher e total simulado</li>
            <li>Checkout com Pix, cartão e pagamento na entrega — tudo bloqueado para dados reais</li>
            <li>Captura de nome e WhatsApp para o CRM do restaurante</li>
            <li>Pesquisa de preferências, vouchers e jornada pós-consumo</li>
          </ul>
          <p className="text-[11px] text-muted-foreground pt-2 border-t">
            Esta etapa é a fundação da demo (Fase 1). As demais entram nas próximas iterações.
          </p>
        </Card>
      </section>
    </main>
  );
}
