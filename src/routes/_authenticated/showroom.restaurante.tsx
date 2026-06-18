/**
 * /showroom/restaurante — Painel do vendedor (Super Admin) com 6 QR Codes reais.
 *
 * O vendedor abre essa tela no notebook, o lead aponta o celular para o QR Code
 * e o painel de "Atividade ao vivo" mostra a leitura registrada em segundos.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, RefreshCw, QrCode, Activity, Smartphone } from "lucide-react";
import { QrPng } from "@/components/demo/QrPng";
import { getDemoScenario, listLiveDemoActivity } from "@/lib/demo-restaurante.functions";

export const Route = createFileRoute("/_authenticated/showroom/restaurante")({
  component: ShowroomRestaurantePage,
});

const SCENARIO_SLUG = "boteco-aurora";
const ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://impulsionando.com.br";

const KIND_LABEL: Record<string, string> = {
  mesa: "Mesa",
  delivery: "Delivery",
  evento: "Evento",
  pesquisa: "Pesquisa",
  clube: "Clube",
};

const KIND_BADGE: Record<string, string> = {
  mesa: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  delivery: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  evento: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  pesquisa: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  clube: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
};

function ShowroomRestaurantePage() {
  const fetchScenario = useServerFn(getDemoScenario);
  const fetchLive = useServerFn(listLiveDemoActivity);

  const scenarioQ = useQuery({
    queryKey: ["demo-resto-scenario", SCENARIO_SLUG],
    queryFn: () => fetchScenario({ data: { slug: SCENARIO_SLUG } }),
    staleTime: 5 * 60_000,
  });

  const liveQ = useQuery({
    queryKey: ["demo-resto-live", SCENARIO_SLUG],
    queryFn: () => fetchLive({ data: { scenarioSlug: SCENARIO_SLUG, sinceMinutes: 60 } }),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Showroom · Bar & Restaurante</div>
          <h1 className="text-2xl font-semibold">{scenarioQ.data?.scenario.name ?? "Boteco Aurora"}</h1>
          <p className="text-sm text-muted-foreground">
            {scenarioQ.data?.scenario.tagline ?? ""}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-emerald-400 text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          Demonstração segura — nenhum pedido ou pagamento real
        </Badge>
      </header>

      <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
        <div className="flex gap-3 items-start">
          <Smartphone className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-100 space-y-1">
            <p className="font-medium">Como demonstrar para o lead:</p>
            <p>
              1) Mostre os 6 QR Codes abaixo. 2) Peça ao lead para apontar o celular para qualquer um deles.
              3) Olhe o painel <strong>Atividade ao vivo</strong> à direita — em segundos a leitura aparece registrada,
              provando que cada visita vira dado, relacionamento e oportunidade de receita.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* QR Codes */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4" /> Pontos de contato escaneáveis
          </h2>
          {scenarioQ.isLoading && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 h-80 animate-pulse bg-muted" />
              ))}
            </div>
          )}
          {scenarioQ.data && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {scenarioQ.data.qrs.map((q) => {
                const url = `${ORIGIN}/demo/restaurante/${SCENARIO_SLUG}/${q.slug}`;
                return (
                  <Card key={q.slug} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={KIND_BADGE[q.kind] ?? ""}>{KIND_LABEL[q.kind] ?? q.kind}</Badge>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Demo segura</span>
                    </div>
                    <div className="flex justify-center bg-background border rounded-lg p-3">
                      <QrPng value={url} size={200} alt={`QR Code ${q.title}`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold leading-tight">{q.title}</h3>
                      <p className="text-xs text-muted-foreground">{q.instruction}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t">
                      <code className="text-[10px] text-muted-foreground truncate">{url.replace(/^https?:\/\//, "")}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard?.writeText(url)}
                        aria-label={`Copiar URL do QR Code ${q.title}`}
                      >
                        Copiar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Atividade ao vivo */}
        <aside className="lg:sticky lg:top-20 space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Atividade ao vivo
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => liveQ.refetch()}
                disabled={liveQ.isFetching}
                aria-label="Atualizar atividade"
              >
                <RefreshCw className={`w-4 h-4 ${liveQ.isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {liveQ.data && (
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <Stat label="Eventos" value={liveQ.data.totals.events} />
                <Stat label="Scans" value={liveQ.data.totals.scans} />
                <Stat label="Sessões" value={liveQ.data.totals.sessions} />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mb-3">
              Atualiza a cada 3 segundos · últimos 60 minutos
            </p>
            <ul className="space-y-2 max-h-[480px] overflow-auto pr-1">
              {(liveQ.data?.events ?? []).length === 0 && (
                <li className="text-xs text-muted-foreground py-6 text-center border border-dashed rounded">
                  Aguardando a primeira leitura…
                </li>
              )}
              {(liveQ.data?.events ?? []).map((e) => {
                const payload = e.payload as { qr_slug?: string; title?: string; kind?: string };
                return (
                  <li key={e.id} className="text-xs border rounded p-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{labelForAction(e.action_key)}</span>
                      <time className="text-muted-foreground tabular-nums">
                        {new Date(e.created_at).toLocaleTimeString("pt-BR")}
                      </time>
                    </div>
                    <div className="text-muted-foreground truncate">
                      {payload.title ?? payload.qr_slug ?? "—"}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function labelForAction(key: string): string {
  switch (key) {
    case "qr.scan": return "QR Code lido";
    case "menu.view": return "Cardápio visualizado";
    case "item.view": return "Item visualizado";
    case "cart.add": return "Item no carrinho";
    case "checkout.attempt": return "Checkout simulado";
    case "lead.captured": return "Lead capturado";
    default: return key;
  }
}
