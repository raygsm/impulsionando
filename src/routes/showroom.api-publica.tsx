import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Code2,
  KeyRound,
  Webhook,
  PlayCircle,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Clock,
  Sparkles,
  ArrowRight,
  Terminal,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/showroom/api-publica")({
  head: () => ({
    meta: [
      { title: "API pública REST & GraphQL — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "API REST + GraphQL com playground ao vivo, gestão de tokens, webhooks, rate limits e SDKs oficiais — adaptado por nicho.",
      },
      { property: "og:title", content: "API pública — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Documentação interativa, OpenAPI 3.1, webhooks assinados HMAC e SDKs em 5 linguagens.",
      },
    ],
  }),
  component: ShowroomApi,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  scopes: string[];
};

type Cfg = {
  label: string;
  endpoints: Endpoint[];
  webhooks: { event: string; desc: string }[];
  sampleResource: Record<string, unknown>;
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas",
    endpoints: [
      { method: "GET", path: "/v1/patients", summary: "Lista pacientes", scopes: ["patients.read"] },
      { method: "POST", path: "/v1/appointments", summary: "Agendar consulta", scopes: ["appointments.write"] },
      { method: "PATCH", path: "/v1/appointments/{id}", summary: "Reagendar/cancelar", scopes: ["appointments.write"] },
      { method: "GET", path: "/v1/medical-records/{patient_id}", summary: "Prontuário (PHI)", scopes: ["records.read"] },
      { method: "POST", path: "/v1/billing/charges", summary: "Cobrar paciente", scopes: ["billing.write"] },
    ],
    webhooks: [
      { event: "appointment.created", desc: "Novo agendamento confirmado" },
      { event: "appointment.no_show", desc: "Paciente faltou à consulta" },
      { event: "payment.succeeded", desc: "Pagamento confirmado" },
    ],
    sampleResource: {
      id: "appt_8f21",
      patient_id: "pat_4821",
      professional_id: "doc_19",
      starts_at: "2026-06-22T14:30:00-03:00",
      duration_min: 30,
      status: "confirmed",
    },
  },
  bares: {
    label: "Bares & Restaurantes",
    endpoints: [
      { method: "GET", path: "/v1/menu/items", summary: "Itens do cardápio", scopes: ["menu.read"] },
      { method: "POST", path: "/v1/orders", summary: "Criar pedido (salão/delivery)", scopes: ["orders.write"] },
      { method: "PATCH", path: "/v1/orders/{id}/status", summary: "Atualizar status do pedido", scopes: ["orders.write"] },
      { method: "GET", path: "/v1/cash-sessions/current", summary: "Caixa aberto", scopes: ["finance.read"] },
      { method: "POST", path: "/v1/payments", summary: "Receber pagamento", scopes: ["payments.write"] },
    ],
    webhooks: [
      { event: "order.created", desc: "Pedido criado em qualquer canal" },
      { event: "order.ready", desc: "Pedido pronto na cozinha (KDS)" },
      { event: "cash.closed", desc: "Caixa fechado com conciliação" },
    ],
    sampleResource: {
      id: "ord_31a9",
      channel: "ifood",
      table: null,
      items: [
        { sku: "burger-classic", qty: 2, unit_cents: 3490 },
        { sku: "fries-large", qty: 1, unit_cents: 1890 },
      ],
      total_cents: 8870,
      status: "in_kitchen",
    },
  },
  cervejarias: {
    label: "Cervejarias",
    endpoints: [
      { method: "GET", path: "/v1/batches", summary: "Lotes de produção", scopes: ["production.read"] },
      { method: "POST", path: "/v1/batches", summary: "Iniciar novo lote", scopes: ["production.write"] },
      { method: "GET", path: "/v1/stock/movements", summary: "Movimentações de estoque", scopes: ["stock.read"] },
      { method: "POST", path: "/v1/b2b/orders", summary: "Criar pedido B2B", scopes: ["orders.write"] },
      { method: "GET", path: "/v1/invoices/{id}", summary: "NF-e emitida", scopes: ["fiscal.read"] },
    ],
    webhooks: [
      { event: "batch.fermenting", desc: "Lote entrou em fermentação" },
      { event: "stock.low", desc: "SKU abaixo do mínimo" },
      { event: "invoice.issued", desc: "Nota fiscal autorizada" },
    ],
    sampleResource: {
      id: "batch_2412",
      recipe: "IPA West Coast",
      volume_l: 1000,
      og: 1.062,
      fg: 1.012,
      stage: "fermenting",
      started_at: "2026-06-10T09:00:00-03:00",
    },
  },
  servicos: {
    label: "Serviços",
    endpoints: [
      { method: "GET", path: "/v1/projects", summary: "Projetos / jobs", scopes: ["projects.read"] },
      { method: "POST", path: "/v1/proposals", summary: "Emitir proposta", scopes: ["proposals.write"] },
      { method: "POST", path: "/v1/time-entries", summary: "Lançar horas", scopes: ["time.write"] },
      { method: "POST", path: "/v1/invoices", summary: "Faturar projeto", scopes: ["billing.write"] },
      { method: "GET", path: "/v1/customers/{id}/activity", summary: "Linha do tempo do cliente", scopes: ["crm.read"] },
    ],
    webhooks: [
      { event: "proposal.accepted", desc: "Cliente aceitou a proposta" },
      { event: "invoice.paid", desc: "Fatura paga" },
      { event: "project.deadline_near", desc: "Prazo a vencer em 48h" },
    ],
    sampleResource: {
      id: "proj_7710",
      customer_id: "cus_220",
      name: "Rebranding 2026",
      status: "in_progress",
      hours_logged: 84.5,
      budget_hours: 120,
    },
  },
  ecommerce: {
    label: "E-commerce",
    endpoints: [
      { method: "GET", path: "/v1/products", summary: "Catálogo de produtos", scopes: ["catalog.read"] },
      { method: "POST", path: "/v1/products", summary: "Criar produto/variação", scopes: ["catalog.write"] },
      { method: "GET", path: "/v1/orders", summary: "Pedidos com filtros", scopes: ["orders.read"] },
      { method: "POST", path: "/v1/refunds", summary: "Criar reembolso", scopes: ["payments.write"] },
      { method: "GET", path: "/v1/customers/{id}", summary: "Cliente 360", scopes: ["customers.read"] },
    ],
    webhooks: [
      { event: "order.paid", desc: "Pedido aprovado pelo gateway" },
      { event: "order.shipped", desc: "Pedido despachado" },
      { event: "cart.abandoned", desc: "Carrinho abandonado > 1h" },
    ],
    sampleResource: {
      id: "ord_a8c2",
      customer_id: "cus_9120",
      items: [{ sku: "tee-blk-m", qty: 1, unit_cents: 8900 }],
      shipping_cents: 1990,
      total_cents: 10890,
      payment_status: "paid",
      fulfillment_status: "processing",
    },
  },
};

type TokenRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
};

const INITIAL_TOKENS: TokenRow[] = [
  {
    id: "tk_1",
    name: "Backend produção",
    prefix: "sk_live_4f••••••a91c",
    scopes: ["read", "write"],
    createdAt: "10 abr 2026",
    lastUsed: "há 2 min",
  },
  {
    id: "tk_2",
    name: "Integração contabilidade",
    prefix: "sk_live_91••••••22fd",
    scopes: ["read"],
    createdAt: "02 mar 2026",
    lastUsed: "há 1 dia",
  },
  {
    id: "tk_3",
    name: "Sandbox QA",
    prefix: "sk_test_aa••••••0011",
    scopes: ["read", "write"],
    createdAt: "18 fev 2026",
    lastUsed: "há 6 dias",
  },
];

const NICHES: { slug: NicheSlug; label: string }[] = [
  { slug: "clinicas", label: "Clínicas" },
  { slug: "bares", label: "Bares" },
  { slug: "cervejarias", label: "Cervejarias" },
  { slug: "servicos", label: "Serviços" },
  { slug: "ecommerce", label: "E-commerce" },
];

const LANGS = ["cURL", "Node.js", "Python", "PHP", "Go"] as const;
type Lang = (typeof LANGS)[number];

function snippetFor(lang: Lang, endpoint: Endpoint) {
  const base = "https://api.impulsionando.com.br";
  switch (lang) {
    case "cURL":
      return `curl -X ${endpoint.method} '${base}${endpoint.path}' \\\n  -H 'Authorization: Bearer sk_live_...' \\\n  -H 'Content-Type: application/json'`;
    case "Node.js":
      return `import { Impulsionando } from '@impulsionando/sdk'\nconst client = new Impulsionando({ apiKey: process.env.IMP_API_KEY })\nconst res = await client.request({\n  method: '${endpoint.method}',\n  path: '${endpoint.path}',\n})`;
    case "Python":
      return `from impulsionando import Client\nclient = Client(api_key=os.environ['IMP_API_KEY'])\nres = client.request('${endpoint.method}', '${endpoint.path}')`;
    case "PHP":
      return `$client = new Impulsionando\\Client(getenv('IMP_API_KEY'));\n$res = $client->request('${endpoint.method}', '${endpoint.path}');`;
    case "Go":
      return `client := impulsionando.New(os.Getenv("IMP_API_KEY"))\nres, err := client.Request("${endpoint.method}", "${endpoint.path}", nil)`;
  }
}

function methodTone(m: Endpoint["method"]) {
  switch (m) {
    case "GET":
      return "bg-emerald-500/15 text-emerald-700";
    case "POST":
      return "bg-blue-500/15 text-blue-700";
    case "PATCH":
      return "bg-amber-500/15 text-amber-700";
    case "DELETE":
      return "bg-red-500/15 text-red-700";
  }
}

function ShowroomApi() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [lang, setLang] = useState<Lang>("cURL");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showSecrets, setShowSecrets] = useState(false);
  const [tokens, setTokens] = useState<TokenRow[]>(INITIAL_TOKENS);
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const cfg = DATA[niche];
  const endpoint = cfg.endpoints[selectedIdx] ?? cfg.endpoints[0];
  const snippet = useMemo(() => snippetFor(lang, endpoint), [lang, endpoint]);

  function runPlayground() {
    setRunning(true);
    setResponse(null);
    setTimeout(() => {
      setResponse(JSON.stringify({ ok: true, data: cfg.sampleResource }, null, 2));
      setRunning(false);
    }, 600);
  }

  function copySnippet() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(snippet).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function revokeToken(id: string) {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }

  function addToken() {
    const id = `tk_${Math.floor(Math.random() * 9000) + 1000}`;
    setTokens((prev) => [
      {
        id,
        name: "Novo token",
        prefix: `sk_live_${Math.random().toString(36).slice(2, 4)}••••••${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        scopes: ["read"],
        createdAt: "agora",
        lastUsed: "—",
      },
      ...prev,
    ]);
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Code2 className="h-3 w-3" /> Showroom — API pública
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Construa em cima da plataforma — REST + GraphQL
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Documentação interativa OpenAPI 3.1, playground ao vivo, webhooks assinados HMAC e
              SDKs oficiais em 5 linguagens. Selecione um nicho e explore endpoints reais.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {NICHES.map((n) => (
                <Button
                  key={n.slug}
                  size="sm"
                  variant={niche === n.slug ? "default" : "outline"}
                  onClick={() => {
                    setNiche(n.slug);
                    setSelectedIdx(0);
                    setResponse(null);
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Latência p95</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">84ms</div>
            <Progress value={84} className="mt-2 h-1.5" />
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uptime (90d)</span>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">99,98%</div>
            <div className="text-xs text-muted-foreground">SLA 99,9% contratual</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rate limit</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">600 req/min</div>
            <div className="text-xs text-muted-foreground">por token · burst 1.200</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SDKs oficiais</span>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">5</div>
            <div className="text-xs text-muted-foreground">Node, Python, PHP, Go, Ruby</div>
          </Card>
        </div>
      </section>

      {/* Endpoints + Playground */}
      <section className="container mx-auto px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Endpoints — {cfg.label}</h3>
              <Badge variant="outline" className="text-[11px]">
                v1
              </Badge>
            </div>
            <div className="space-y-1">
              {cfg.endpoints.map((e, i) => (
                <button
                  key={e.path + e.method}
                  onClick={() => {
                    setSelectedIdx(i);
                    setResponse(null);
                  }}
                  className={`w-full rounded-md p-2 text-left text-sm transition ${
                    i === selectedIdx ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${methodTone(
                        e.method,
                      )}`}
                    >
                      {e.method}
                    </span>
                    <code className="truncate text-xs">{e.path}</code>
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {e.summary}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${methodTone(
                    endpoint.method,
                  )}`}
                >
                  {endpoint.method}
                </span>
                <code className="text-sm">{endpoint.path}</code>
                <Badge variant="secondary" className="ml-auto text-[11px]">
                  scopes: {endpoint.scopes.join(", ")}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{endpoint.summary}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2">
              <div className="flex flex-wrap gap-1">
                {LANGS.map((l) => (
                  <Button
                    key={l}
                    size="sm"
                    variant={lang === l ? "default" : "ghost"}
                    onClick={() => setLang(l)}
                    className="h-7"
                  >
                    {l}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copySnippet}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" /> Copiar
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={runPlayground} disabled={running}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {running ? "Executando…" : "Rodar"}
                </Button>
              </div>
            </div>

            <pre className="overflow-x-auto bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              <code>{snippet}</code>
            </pre>

            <div className="border-t p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Terminal className="h-4 w-4" /> Resposta
              </div>
              <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                <code>
                  {response ??
                    "// Clique em Rodar para executar contra o sandbox e ver o JSON real."}
                </code>
              </pre>
            </div>
          </Card>
        </div>
      </section>

      {/* Tokens + Webhooks */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <KeyRound className="h-5 w-5 text-primary" /> Tokens de API
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crie, rotacione e revogue chaves com escopo limitado.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSecrets((v) => !v)}
                >
                  {showSecrets ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" /> Revelar
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={addToken}>
                  <Plus className="mr-2 h-4 w-4" /> Novo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {tokens.length === 0 && (
                <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                  Nenhum token ativo.
                </div>
              )}
              {tokens.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{t.name}</span>
                      {t.scopes.map((s) => (
                        <Badge key={s} variant="outline" className="text-[11px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <code className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                      {showSecrets ? t.prefix.replace(/•+/g, "a91cdef02244") : t.prefix}
                    </code>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      criado {t.createdAt} · último uso {t.lastUsed}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revokeToken(t.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Webhook className="h-5 w-5 text-primary" /> Webhooks
                </h3>
                <p className="text-sm text-muted-foreground">
                  Assinados com HMAC SHA-256 · retry com backoff exponencial.
                </p>
              </div>
              <Badge variant="outline">{cfg.webhooks.length} eventos</Badge>
            </div>

            <div className="space-y-2">
              {cfg.webhooks.map((w) => (
                <div key={w.event} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{w.event}</code>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{w.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                URL de destino
              </div>
              <div className="mt-1 flex gap-2">
                <Input placeholder="https://seu-dominio.com/webhooks/impulsionando" />
                <Button>Salvar</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Assinatura enviada no header{" "}
                <code className="rounded bg-muted px-1">X-Impulsionando-Signature</code>.
                Verifique com timing-safe compare.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Documentação e CTA */}
      <section className="container mx-auto px-4 py-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-8">
              <Badge variant="secondary" className="mb-3 gap-1">
                <BookOpen className="h-3 w-3" /> Documentação
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                OpenAPI 3.1, GraphQL e MCP — tudo navegável
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Code2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Spec OpenAPI 3.1 gerada automaticamente a cada release
                </li>
                <li className="flex items-start gap-2">
                  <Code2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  GraphQL com introspection e persisted queries
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  OAuth 2.0 + escopos granulares + chave por ambiente
                </li>
                <li className="flex items-start gap-2">
                  <Activity className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Status page pública e changelog versionado
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Servidor MCP oficial para agentes de IA
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/showroom/integracoes-premium">
                    Ver integrações prontas <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/showroom">Voltar ao hub</Link>
                </Button>
              </div>
            </div>

            <div className="border-t bg-muted/30 p-8 md:border-l md:border-t-0">
              <div className="text-sm font-semibold">Snippet de verificação HMAC (Node)</div>
              <pre className="mt-3 overflow-x-auto rounded-lg border bg-background p-3 text-xs leading-relaxed">
                <code>{`import { createHmac, timingSafeEqual } from 'crypto'

export function verify(req, secret) {
  const sig = req.headers['x-impulsionando-signature']
  const body = req.rawBody // string
  const expected = createHmac('sha256', secret)
    .update(body).digest('hex')
  return sig && timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(expected),
  )
}`}</code>
              </pre>
              <div className="mt-4 rounded-lg border bg-background p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Política de versionamento
                </div>
                <p className="mt-1">
                  Breaking changes só em major (v2, v3…). Deprecação anunciada com{" "}
                  <span className="font-semibold">12 meses</span> de antecedência.
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
