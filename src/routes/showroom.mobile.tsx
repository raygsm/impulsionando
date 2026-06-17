import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Smartphone,
  Tablet,
  Bell,
  WifiOff,
  Fingerprint,
  QrCode,
  Camera,
  MapPin,
  Download,
  Apple,
  Play,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Activity,
  Battery,
  Signal,
  Wifi,
} from "lucide-react";

export const Route = createFileRoute("/showroom/mobile")({
  head: () => ({
    meta: [
      { title: "Apps iOS & Android nativos — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Apps nativos iOS e Android com push, modo offline, leitura de QR, biometria e geolocalização — demo navegável por nicho.",
      },
      { property: "og:title", content: "Mobile — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Aplicativos para equipe e cliente final, com push segmentado, modo offline e sincronização inteligente.",
      },
    ],
  }),
  component: ShowroomMobile,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Cfg = {
  label: string;
  appName: string;
  primaryActions: { icon: typeof Smartphone; label: string; desc: string }[];
  pushExamples: { title: string; body: string; cta: string; tone: "info" | "success" | "warn" }[];
  offlineFeatures: string[];
  kpis: { label: string; value: string }[];
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas",
    appName: "MinhaClínica",
    primaryActions: [
      { icon: QrCode, label: "Check-in por QR", desc: "Paciente faz check-in em 3s" },
      { icon: Bell, label: "Lembretes inteligentes", desc: "Reduz no-show em até 38%" },
      { icon: Fingerprint, label: "Prontuário com biometria", desc: "Médico desbloqueia com Face ID" },
      { icon: Camera, label: "Anexar exames", desc: "Foto/PDF direto no prontuário" },
    ],
    pushExamples: [
      { title: "Sua consulta é amanhã às 14h30", body: "Confirme presença ou reagende em 1 toque.", cta: "Confirmar", tone: "info" },
      { title: "Resultado de exame disponível", body: "Dr. Marina liberou o laudo do hemograma.", cta: "Abrir", tone: "success" },
      { title: "Receita renovada", body: "Sua receita digital está pronta para retirada.", cta: "Ver receita", tone: "success" },
    ],
    offlineFeatures: [
      "Agenda do dia disponível sem internet",
      "Prontuário em cache (criptografado AES-256)",
      "Anotações sincronizam quando voltar online",
    ],
    kpis: [
      { label: "No-show", value: "-38%" },
      { label: "NPS app", value: "72" },
      { label: "Sessão média", value: "3,4 min" },
    ],
  },
  bares: {
    label: "Bares & Restaurantes",
    appName: "PedirAqui",
    primaryActions: [
      { icon: QrCode, label: "Cardápio por QR na mesa", desc: "Cliente pede sem garçom" },
      { icon: Bell, label: "Push de promoção happy-hour", desc: "Segmentado por geofence" },
      { icon: MapPin, label: "Delivery com rastreio", desc: "Motoboy em tempo real" },
      { icon: Camera, label: "Avaliação com foto", desc: "Cliente posta o prato" },
    ],
    pushExamples: [
      { title: "Hora do happy-hour 🍻", body: "Chopp em dose dupla até 19h. A 240m de você.", cta: "Ver cardápio", tone: "info" },
      { title: "Seu pedido saiu para entrega", body: "Lucas está a 8 min. Acompanhe no mapa.", cta: "Rastrear", tone: "success" },
      { title: "Esquecemos algo?", body: "Que tal repetir aquele combo de sexta?", cta: "Pedir de novo", tone: "info" },
    ],
    offlineFeatures: [
      "Comanda do garçom funciona sem 4G",
      "Cardápio em cache com fotos otimizadas",
      "Sincronização automática ao reconectar",
    ],
    kpis: [
      { label: "Ticket médio app", value: "+22%" },
      { label: "Pedidos repetidos", value: "61%" },
      { label: "Tempo no app", value: "5,1 min" },
    ],
  },
  cervejarias: {
    label: "Cervejarias",
    appName: "BrewOps",
    primaryActions: [
      { icon: QrCode, label: "QR no tanque/lote", desc: "Cervejeiro registra OG/FG em campo" },
      { icon: Camera, label: "Foto da fermentação", desc: "Anexa ao diário do lote" },
      { icon: Bell, label: "Alerta de temperatura", desc: "Fora da faixa = push imediato" },
      { icon: MapPin, label: "Roteiro do entregador", desc: "Otimizado por bairro" },
    ],
    pushExamples: [
      { title: "FT-02 acima da faixa", body: "26,4°C agora (alvo 22°C). Ajuste o glycol.", cta: "Ver tanque", tone: "warn" },
      { title: "Lote #2412 pronto para envase", body: "FG estável há 48h. Liberar?", cta: "Aprovar", tone: "success" },
      { title: "Pedido B2B do Empório Sul", body: "12 cx Pilsen — solicita entrega quinta.", cta: "Abrir pedido", tone: "info" },
    ],
    offlineFeatures: [
      "Diário de produção offline em galpão sem sinal",
      "Leitura de QR de insumos sem internet",
      "Fotos enviadas em background",
    ],
    kpis: [
      { label: "Erros de digitação", value: "-71%" },
      { label: "Tempo por lote", value: "-18 min" },
      { label: "Adoção da equipe", value: "94%" },
    ],
  },
  servicos: {
    label: "Serviços",
    appName: "JobsHub",
    primaryActions: [
      { icon: Smartphone, label: "Aprovar proposta em 1 toque", desc: "Cliente assina pelo celular" },
      { icon: Bell, label: "Lembrete de etapa do projeto", desc: "Mantém ritmo do entregável" },
      { icon: Camera, label: "Foto da visita técnica", desc: "Documenta com geotag e hora" },
      { icon: MapPin, label: "Check-in em cliente", desc: "Hora exata de chegada/saída" },
    ],
    pushExamples: [
      { title: "Proposta #441 aprovada 🎉", body: "Cliente Acme assinou — projeto iniciado.", cta: "Abrir", tone: "success" },
      { title: "Reunião em 30 min", body: "Acme · Rebranding · sala virtual já liberada.", cta: "Entrar", tone: "info" },
      { title: "Aprovação pendente", body: "Etapa de design aguarda seu feedback há 2 dias.", cta: "Revisar", tone: "warn" },
    ],
    offlineFeatures: [
      "Lista de jobs do dia em cache",
      "Lançamento de horas funciona offline",
      "Fotos de campo sincronizam ao reconectar",
    ],
    kpis: [
      { label: "Lead time de aprovação", value: "-46%" },
      { label: "Horas faturáveis registradas", value: "+19%" },
      { label: "Adoção mobile", value: "82%" },
    ],
  },
  ecommerce: {
    label: "E-commerce",
    appName: "ShopApp",
    primaryActions: [
      { icon: Bell, label: "Push de carrinho abandonado", desc: "Recupera até 14% das sessões" },
      { icon: QrCode, label: "Cupom escaneável em loja", desc: "Omnichannel real" },
      { icon: Fingerprint, label: "Login por biometria", desc: "Conversão checkout +28%" },
      { icon: MapPin, label: "Rastreio do pedido em mapa", desc: "Reduz tickets de SAC" },
    ],
    pushExamples: [
      { title: "Esqueceu algo na sacola?", body: "Sua camiseta preta ainda está esperando.", cta: "Finalizar", tone: "info" },
      { title: "Pedido a caminho 📦", body: "Saiu de Curitiba às 08h12. Chega amanhã.", cta: "Rastrear", tone: "success" },
      { title: "Drop novo — só hoje", body: "Coleção inverno com 20% até 23h59.", cta: "Ver coleção", tone: "info" },
    ],
    offlineFeatures: [
      "Catálogo navegável offline (PWA + Capacitor)",
      "Lista de desejos disponível sem rede",
      "Sincronização do carrinho quando reconectar",
    ],
    kpis: [
      { label: "Conversão app vs web", value: "+32%" },
      { label: "Retenção D30", value: "41%" },
      { label: "ARPU mensal", value: "R$ 184" },
    ],
  },
};

const NICHES: { slug: NicheSlug; label: string }[] = [
  { slug: "clinicas", label: "Clínicas" },
  { slug: "bares", label: "Bares" },
  { slug: "cervejarias", label: "Cervejarias" },
  { slug: "servicos", label: "Serviços" },
  { slug: "ecommerce", label: "E-commerce" },
];

function ShowroomMobile() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [device, setDevice] = useState<"ios" | "android">("ios");
  const [activePushIdx, setActivePushIdx] = useState(0);
  const [offlineMode, setOfflineMode] = useState(false);

  const cfg = DATA[niche];
  const push = cfg.pushExamples[activePushIdx % cfg.pushExamples.length];

  const stats = useMemo(
    () => ({
      installs: "42.8k",
      rating: device === "ios" ? "4,9" : "4,8",
      store: device === "ios" ? "App Store" : "Google Play",
    }),
    [device],
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Smartphone className="h-3 w-3" /> Showroom — Apps nativos
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              iOS e Android com push, offline e biometria
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Apps publicados nas lojas em até 30 dias, com sua marca, push segmentado, modo
              offline real e integração com câmera, QR, geolocalização e Face ID.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {NICHES.map((n) => (
                <Button
                  key={n.slug}
                  size="sm"
                  variant={niche === n.slug ? "default" : "outline"}
                  onClick={() => {
                    setNiche(n.slug);
                    setActivePushIdx(0);
                  }}
                >
                  {n.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cfg.kpis.map((k) => (
            <Card key={k.label} className="p-5">
              <div className="text-sm text-muted-foreground">{k.label}</div>
              <div className="mt-2 text-3xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{cfg.label}</div>
            </Card>
          ))}
          <Card className="p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Loja</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="mt-2 text-base font-semibold">{stats.store}</div>
            <div className="text-xs text-muted-foreground">
              {stats.installs} instalações · {stats.rating} ★
            </div>
          </Card>
        </div>
      </section>

      {/* Phone mockup + ações */}
      <section className="container mx-auto px-4 py-4">
        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          {/* Mock device */}
          <div className="mx-auto w-full max-w-[360px]">
            <div className="mb-3 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant={device === "ios" ? "default" : "outline"}
                onClick={() => setDevice("ios")}
              >
                <Apple className="mr-2 h-4 w-4" /> iOS
              </Button>
              <Button
                size="sm"
                variant={device === "android" ? "default" : "outline"}
                onClick={() => setDevice("android")}
              >
                <Play className="mr-2 h-4 w-4" /> Android
              </Button>
            </div>

            <div
              className={`relative mx-auto aspect-[9/19] w-full overflow-hidden rounded-[44px] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl`}
            >
              {/* Notch */}
              {device === "ios" && (
                <div className="absolute left-1/2 top-2 z-20 h-6 w-28 -translate-x-1/2 rounded-full bg-zinc-900" />
              )}
              {/* Screen */}
              <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-gradient-to-b from-primary/15 via-background to-background">
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <Signal className="h-3 w-3" />
                    {offlineMode ? (
                      <WifiOff className="h-3 w-3" />
                    ) : (
                      <Wifi className="h-3 w-3" />
                    )}
                    <Battery className="h-3 w-3" />
                  </div>
                </div>

                {/* App header */}
                <div className="px-5 pt-6">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {cfg.label}
                  </div>
                  <div className="text-lg font-bold">{cfg.appName}</div>
                </div>

                {/* Push notification floating */}
                <div className="mx-3 mt-4 rounded-xl border border-border/60 bg-background/90 p-3 shadow-lg backdrop-blur">
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                        push.tone === "warn"
                          ? "bg-amber-500/15 text-amber-700"
                          : push.tone === "success"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{push.title}</div>
                      <div className="line-clamp-2 text-[11px] text-muted-foreground">
                        {push.body}
                      </div>
                      <Button size="sm" className="mt-2 h-7 w-full text-xs">
                        {push.cta}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Grid de ações */}
                <div className="grid grid-cols-2 gap-2 px-3 pt-3">
                  {cfg.primaryActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <div
                        key={a.label}
                        className="rounded-lg border bg-background/70 p-2 backdrop-blur"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <div className="mt-1 text-[11px] font-semibold leading-tight">
                          {a.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Offline overlay */}
                {offlineMode && (
                  <div className="absolute inset-x-0 bottom-0 mx-3 mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px]">
                    <div className="flex items-center gap-2 font-semibold text-amber-700">
                      <WifiOff className="h-3 w-3" /> Modo offline ativo
                    </div>
                    <div className="text-amber-700/80">
                      Suas ações serão sincronizadas ao reconectar.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controles do mock */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActivePushIdx((i) => i + 1)}
              >
                <Bell className="mr-2 h-4 w-4" /> Próximo push
              </Button>
              <Button
                size="sm"
                variant={offlineMode ? "default" : "outline"}
                onClick={() => setOfflineMode((v) => !v)}
              >
                <WifiOff className="mr-2 h-4 w-4" />
                {offlineMode ? "Voltar online" : "Simular offline"}
              </Button>
            </div>
          </div>

          {/* Recursos */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recursos nativos — {cfg.label}</h3>
                <Badge variant="outline">{cfg.primaryActions.length} ativos</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {cfg.primaryActions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.label} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-1.5">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-sm font-semibold">{a.label}</div>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Modo offline real</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sincronização inteligente com fila de mudanças e resolução de conflitos.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {cfg.offlineFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Push segmentado</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Audiências dinâmicas + horário ideal por fuso e perfil. Opt-out em 1 toque.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {cfg.pushExamples.map((p, i) => (
                  <button
                    key={p.title}
                    onClick={() => setActivePushIdx(i)}
                    className={`rounded-lg border p-2 text-left text-xs transition ${
                      i === activePushIdx % cfg.pushExamples.length
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="line-clamp-1 font-semibold">{p.title}</div>
                    <div className="line-clamp-2 text-muted-foreground">{p.body}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Métricas de engajamento */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">DAU/MAU</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">48%</div>
            <Progress value={48} className="mt-2 h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              Acima da média do mercado (32%).
            </p>
          </Card>
          <Card className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Crash-free sessions</span>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">99,94%</div>
            <Progress value={99} className="mt-2 h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              Sentry + alertas de regressão por release.
            </p>
          </Card>
          <Card className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tempo de cold start</span>
              <Tablet className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">1,2s</div>
            <Progress value={88} className="mt-2 h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              Targets agressivos: ≤ 1,5s em devices de entrada.
            </p>
          </Card>
        </div>
      </section>

      {/* Distribuição e CTA */}
      <section className="container mx-auto px-4 py-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-8">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Download className="h-3 w-3" /> Publicação nas lojas
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                Sua marca nas lojas em até 30 dias
              </h3>
              <p className="mt-2 text-muted-foreground">
                Cuidamos do build, das fichas técnicas, da submissão e dos updates. Cada release
                passa por checklist de Apple/Google.
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Apple Developer e Google Play console gerenciados
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Builds OTA para hotfix sem nova revisão da loja
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  A/B test de ícones, screenshots e textos da loja
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Deep links e Universal Links configurados
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/showroom/api-publica">
                    Ver API para o app <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/showroom">Voltar ao hub</Link>
                </Button>
              </div>
            </div>

            <div className="border-t bg-muted/30 p-8 md:border-l md:border-t-0">
              <div className="text-sm font-semibold">Distribuição</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-background p-4 text-center">
                  <Apple className="mx-auto h-7 w-7" />
                  <div className="mt-2 text-sm font-semibold">App Store</div>
                  <div className="text-xs text-muted-foreground">iOS 15+</div>
                </div>
                <div className="rounded-lg border bg-background p-4 text-center">
                  <Play className="mx-auto h-7 w-7" />
                  <div className="mt-2 text-sm font-semibold">Google Play</div>
                  <div className="text-xs text-muted-foreground">Android 9+</div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border bg-background p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Compromisso
                </div>
                <p className="mt-1">
                  Revisão da loja em até <span className="font-semibold">7 dias</span> em média.
                  Suporte ativo a apelações.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
