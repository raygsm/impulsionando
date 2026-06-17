import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Plug,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Clock,
  Upload,
  Download,
  GitMerge,
  Lock,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/showroom/migracao")({
  head: () => ({
    meta: [
      { title: "Migração de dados de sistemas legados — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Conectores prontos, mapeamento visual de campos, simulação de rollback e auditoria pós-migração — adaptado ao seu nicho.",
      },
      { property: "og:title", content: "Migração — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Demo navegável: importação de planilhas, APIs e bancos legados com mapeamento visual, deduplicação e auditoria.",
      },
    ],
  }),
  component: ShowroomMigracao,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type LegacySystem = {
  name: string;
  kind: "ERP" | "Planilha" | "SaaS" | "Banco" | "API";
  records: number;
  status: "ready" | "beta" | "manual";
};

type FieldMap = {
  source: string;
  target: string;
  confidence: number; // 0-100
  transform?: string;
};

type Cfg = {
  label: string;
  legacy: LegacySystem[];
  entities: { name: string; rows: number; size: string }[];
  fieldMap: FieldMap[];
  risks: { label: string; severity: "low" | "med" | "high"; mitigation: string }[];
  successKpi: string;
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas",
    legacy: [
      { name: "iClinic", kind: "SaaS", records: 18420, status: "ready" },
      { name: "Doctoralia Pro", kind: "API", records: 6210, status: "ready" },
      { name: "Planilha de pacientes (XLSX)", kind: "Planilha", records: 3240, status: "ready" },
      { name: "Sistema próprio (MySQL)", kind: "Banco", records: 22100, status: "beta" },
    ],
    entities: [
      { name: "Pacientes", rows: 18420, size: "62 MB" },
      { name: "Atendimentos", rows: 94210, size: "318 MB" },
      { name: "Prontuários (anexos)", rows: 41200, size: "4.2 GB" },
      { name: "Convênios", rows: 38, size: "12 KB" },
    ],
    fieldMap: [
      { source: "paciente.nm_completo", target: "patient.full_name", confidence: 100 },
      { source: "paciente.dt_nascto", target: "patient.birth_date", confidence: 98, transform: "DD/MM/YYYY → ISO" },
      { source: "paciente.cpf", target: "patient.document", confidence: 100, transform: "remover máscara" },
      { source: "convenio.cd", target: "insurance.code", confidence: 87 },
      { source: "atend.obs", target: "appointment.notes", confidence: 72 },
    ],
    risks: [
      { label: "LGPD: dados sensíveis de saúde", severity: "high", mitigation: "Criptografia AES-256 em trânsito e repouso + DPA assinado" },
      { label: "Duplicidade de pacientes por CPF nulo", severity: "med", mitigation: "Match fuzzy por nome + telefone + data de nascimento" },
      { label: "Anexos com tamanho > 25 MB", severity: "low", mitigation: "Compressão automática + alerta no relatório" },
    ],
    successKpi: "0 registros perdidos · 100% prontuários acessíveis · paridade financeira ≥ 99,8%",
  },
  bares: {
    label: "Bares & Restaurantes",
    legacy: [
      { name: "Colibri POS", kind: "ERP", records: 12400, status: "ready" },
      { name: "iFood Gestor", kind: "API", records: 8900, status: "ready" },
      { name: "Planilha cardápio (CSV)", kind: "Planilha", records: 420, status: "ready" },
      { name: "Sistema antigo (Access)", kind: "Banco", records: 6700, status: "manual" },
    ],
    entities: [
      { name: "Produtos / Cardápio", rows: 420, size: "1.8 MB" },
      { name: "Pedidos (12 meses)", rows: 84210, size: "210 MB" },
      { name: "Clientes (delivery)", rows: 9120, size: "8 MB" },
      { name: "Insumos / Estoque", rows: 1320, size: "2 MB" },
    ],
    fieldMap: [
      { source: "produto.descricao", target: "menu_item.name", confidence: 100 },
      { source: "produto.vl_unit", target: "menu_item.price", confidence: 100, transform: "BRL → cents" },
      { source: "pedido.dt", target: "order.created_at", confidence: 99 },
      { source: "pedido.canal", target: "order.channel", confidence: 88, transform: "mapear iFood/Salão/Balcão" },
      { source: "cliente.tel", target: "customer.phone", confidence: 92, transform: "E.164 BR" },
    ],
    risks: [
      { label: "Pedidos sem cliente associado", severity: "med", mitigation: "Criar cliente 'avulso' por canal e manter rastreabilidade" },
      { label: "SKUs duplicados no cardápio", severity: "low", mitigation: "Deduplicação por nome + categoria + preço" },
      { label: "Histórico de comandas abertas", severity: "high", mitigation: "Congelar sistema antigo por 48h e fechar todas as comandas antes do go-live" },
    ],
    successKpi: "Fechamento de caixa idêntico nos 7 primeiros dias · 100% cardápio publicado",
  },
  cervejarias: {
    label: "Cervejarias",
    legacy: [
      { name: "Bling ERP", kind: "ERP", records: 21000, status: "ready" },
      { name: "Tiny ERP", kind: "ERP", records: 14800, status: "ready" },
      { name: "Planilha de lotes (XLSX)", kind: "Planilha", records: 980, status: "ready" },
      { name: "MES próprio (Postgres)", kind: "Banco", records: 6400, status: "beta" },
    ],
    entities: [
      { name: "SKUs / Receitas", rows: 184, size: "920 KB" },
      { name: "Lotes de produção", rows: 980, size: "12 MB" },
      { name: "Movimentações de estoque", rows: 64200, size: "180 MB" },
      { name: "Pedidos B2B", rows: 9200, size: "32 MB" },
    ],
    fieldMap: [
      { source: "sku.codigo", target: "product.sku", confidence: 100 },
      { source: "lote.ibu", target: "batch.ibu", confidence: 100 },
      { source: "lote.og_fg", target: "batch.gravity", confidence: 96, transform: "split OG/FG" },
      { source: "mov.cd_natop", target: "stock_move.kind", confidence: 84, transform: "mapear CFOP" },
      { source: "pedido.cliente_cnpj", target: "order.customer_document", confidence: 100 },
    ],
    risks: [
      { label: "Rastreabilidade de lote → pedido", severity: "high", mitigation: "Importar tabela de vínculo lote↔nota fiscal antes dos pedidos" },
      { label: "Custos de receita desatualizados", severity: "med", mitigation: "Recalcular custo padrão por insumo na data do go-live" },
      { label: "Saldo de estoque divergente", severity: "high", mitigation: "Inventário físico obrigatório no dia anterior à virada" },
    ],
    successKpi: "Saldo de estoque com divergência < 0,5% · rastreabilidade 100% dos lotes",
  },
  servicos: {
    label: "Serviços",
    legacy: [
      { name: "Trello / Asana", kind: "SaaS", records: 4200, status: "ready" },
      { name: "Conta Azul", kind: "ERP", records: 8600, status: "ready" },
      { name: "Planilha de clientes (XLSX)", kind: "Planilha", records: 1820, status: "ready" },
      { name: "E-mails legados (IMAP)", kind: "API", records: 22400, status: "beta" },
    ],
    entities: [
      { name: "Clientes / Contas", rows: 1820, size: "4 MB" },
      { name: "Projetos / Jobs", rows: 4200, size: "18 MB" },
      { name: "Propostas / Orçamentos", rows: 2100, size: "9 MB" },
      { name: "Notas e recebimentos", rows: 8600, size: "24 MB" },
    ],
    fieldMap: [
      { source: "card.title", target: "project.name", confidence: 100 },
      { source: "card.due", target: "project.deadline", confidence: 95 },
      { source: "cliente.razao", target: "customer.legal_name", confidence: 100 },
      { source: "nota.valor_liq", target: "invoice.net_amount", confidence: 100 },
      { source: "email.thread", target: "activity.note", confidence: 68, transform: "extrair assunto + corpo" },
    ],
    risks: [
      { label: "Anexos de propostas em links externos", severity: "med", mitigation: "Baixar e re-hospedar em storage com link assinado" },
      { label: "Status de cards heterogêneo", severity: "low", mitigation: "Mapeamento assistido por IA para 5 status padrão" },
    ],
    successKpi: "Pipeline reconstruído com 100% dos jobs ativos · histórico financeiro de 24 meses",
  },
  ecommerce: {
    label: "E-commerce",
    legacy: [
      { name: "Shopify", kind: "API", records: 32100, status: "ready" },
      { name: "VTEX", kind: "API", records: 48200, status: "ready" },
      { name: "Tray", kind: "API", records: 12800, status: "ready" },
      { name: "Planilha de SKUs (CSV)", kind: "Planilha", records: 2400, status: "ready" },
    ],
    entities: [
      { name: "Produtos / Variações", rows: 2400, size: "12 MB" },
      { name: "Pedidos (24 meses)", rows: 124000, size: "640 MB" },
      { name: "Clientes", rows: 32100, size: "44 MB" },
      { name: "Cupons e descontos", rows: 820, size: "1 MB" },
    ],
    fieldMap: [
      { source: "product.handle", target: "product.slug", confidence: 100 },
      { source: "variant.sku", target: "variant.sku", confidence: 100 },
      { source: "order.financial_status", target: "order.payment_status", confidence: 96, transform: "mapear paid/pending/refunded" },
      { source: "customer.tags", target: "customer.segments", confidence: 80 },
      { source: "discount.code", target: "coupon.code", confidence: 100 },
    ],
    risks: [
      { label: "Reescrever URLs sem perder SEO", severity: "high", mitigation: "Gerar 301 automático por handle/slug e sitemap novo" },
      { label: "Estoque divergente entre canais", severity: "med", mitigation: "Snapshot único no momento do switch + reconciliação D+1" },
      { label: "Tokens de gateway não migráveis", severity: "high", mitigation: "Fluxo de re-autorização do cartão no primeiro login" },
    ],
    successKpi: "Conversão pós-migração ≥ baseline em 14 dias · 0 quebra de SEO (301 cobrindo top 100 URLs)",
  },
};

type Step = {
  key: string;
  title: string;
  desc: string;
  icon: typeof Database;
  duration: string;
};

const STEPS: Step[] = [
  { key: "discovery", title: "Discovery", desc: "Inventário de sistemas, volumes e regras de negócio", icon: Database, duration: "1-2 dias" },
  { key: "extract", title: "Extração", desc: "Conectores prontos puxam dados do sistema legado", icon: Download, duration: "Automático" },
  { key: "map", title: "Mapeamento", desc: "De/Para visual de campos com sugestão por IA", icon: GitMerge, duration: "0,5 dia" },
  { key: "dryrun", title: "Dry-run", desc: "Simulação completa em ambiente isolado", icon: PlayCircle, duration: "1 dia" },
  { key: "cutover", title: "Cutover", desc: "Virada de produção com janela controlada", icon: ArrowLeftRight, duration: "2-4 h" },
  { key: "audit", title: "Auditoria", desc: "Reconciliação D+1 e D+7 com relatórios", icon: ShieldCheck, duration: "7 dias" },
];

const NICHES: { slug: NicheSlug; label: string }[] = [
  { slug: "clinicas", label: "Clínicas" },
  { slug: "bares", label: "Bares" },
  { slug: "cervejarias", label: "Cervejarias" },
  { slug: "servicos", label: "Serviços" },
  { slug: "ecommerce", label: "E-commerce" },
];

function ShowroomMigracao() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [activeStep, setActiveStep] = useState<string>("map");
  const [dryRunProgress, setDryRunProgress] = useState<number>(0);
  const [dryRunRunning, setDryRunRunning] = useState(false);

  const cfg = DATA[niche];

  const totals = useMemo(() => {
    const records = cfg.entities.reduce((s, e) => s + e.rows, 0);
    const systems = cfg.legacy.length;
    const ready = cfg.legacy.filter((l) => l.status === "ready").length;
    const avgConfidence = Math.round(
      cfg.fieldMap.reduce((s, m) => s + m.confidence, 0) / cfg.fieldMap.length,
    );
    return { records, systems, ready, avgConfidence };
  }, [cfg]);

  function startDryRun() {
    if (dryRunRunning) return;
    setDryRunRunning(true);
    setDryRunProgress(0);
    const id = setInterval(() => {
      setDryRunProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setDryRunRunning(false);
          return 100;
        }
        return Math.min(100, p + 7);
      });
    }, 180);
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Database className="h-3 w-3" /> Showroom — Migração de dados
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Sai do legado sem perder um único registro
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Conectores prontos, mapeamento visual, dry-run em ambiente isolado e auditoria
              automática D+1/D+7 — com janela de cutover controlada.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {NICHES.map((n) => (
                <Button
                  key={n.slug}
                  size="sm"
                  variant={niche === n.slug ? "default" : "outline"}
                  onClick={() => setNiche(n.slug)}
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
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sistemas conectáveis</span>
              <Plug className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">{totals.systems}</div>
            <div className="text-xs text-muted-foreground">
              {totals.ready} prontos · {totals.systems - totals.ready} em beta/manual
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Registros estimados</span>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">
              {totals.records.toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-muted-foreground">
              {cfg.entities.length} entidades principais
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Confiança do mapeamento</span>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">{totals.avgConfidence}%</div>
            <Progress value={totals.avgConfidence} className="mt-2 h-1.5" />
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SLA cutover</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold">≤ 4h</div>
            <div className="text-xs text-muted-foreground">janela noturna · rollback 1 clique</div>
          </Card>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-4">
        <h2 className="text-2xl font-bold tracking-tight">Pipeline de migração</h2>
        <p className="mt-1 text-muted-foreground">
          6 etapas auditáveis. Clique para inspecionar cada fase.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = s.key === activeStep;
            return (
              <button
                key={s.key}
                onClick={() => setActiveStep(s.key)}
                className={`relative rounded-lg border p-4 text-left transition ${
                  active ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Icon
                    className={`h-5 w-5 ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">{i + 1}/6</span>
                </div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.desc}</div>
                <div className="mt-2 text-[11px] text-muted-foreground">{s.duration}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sistemas legados */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Sistemas legados — {cfg.label}</h3>
                <p className="text-sm text-muted-foreground">
                  Conectores oficiais e adaptadores genéricos.
                </p>
              </div>
              <Badge variant="outline">
                <Plug className="mr-1 h-3 w-3" /> {cfg.legacy.length} fontes
              </Badge>
            </div>
            <div className="space-y-2">
              {cfg.legacy.map((l) => (
                <div
                  key={l.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{l.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.kind} · {l.records.toLocaleString("pt-BR")} registros
                      </div>
                    </div>
                  </div>
                  {l.status === "ready" && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
                      Pronto
                    </Badge>
                  )}
                  {l.status === "beta" && <Badge variant="secondary">Beta</Badge>}
                  {l.status === "manual" && <Badge variant="outline">Assistido</Badge>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Entidades & volumes</h3>
                <p className="text-sm text-muted-foreground">
                  Estimativa de dados a migrar nesta operação.
                </p>
              </div>
              <Badge variant="outline">
                <FileSpreadsheet className="mr-1 h-3 w-3" /> {cfg.entities.length} tabelas
              </Badge>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Entidade</th>
                    <th className="px-3 py-2 text-right font-medium">Registros</th>
                    <th className="px-3 py-2 text-right font-medium">Tamanho</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.entities.map((e) => (
                    <tr key={e.name} className="border-t">
                      <td className="px-3 py-2 font-medium">{e.name}</td>
                      <td className="px-3 py-2 text-right">{e.rows.toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{e.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Mapeamento de campos */}
      <section className="container mx-auto px-4 py-4">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">De/Para de campos com sugestão por IA</h3>
              <p className="text-sm text-muted-foreground">
                Confiança calculada por similaridade de schema + amostras reais.
              </p>
            </div>
            <Badge variant="outline">
              <Sparkles className="mr-1 h-3 w-3" /> {totals.avgConfidence}% médio
            </Badge>
          </div>

          <div className="space-y-2">
            {cfg.fieldMap.map((m) => {
              const tone =
                m.confidence >= 95
                  ? "text-emerald-600"
                  : m.confidence >= 80
                  ? "text-amber-600"
                  : "text-red-600";
              return (
                <div
                  key={m.source}
                  className="grid grid-cols-1 items-center gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto_1fr_auto]"
                >
                  <code className="rounded bg-muted px-2 py-1 text-xs">{m.source}</code>
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                  <div>
                    <code className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                      {m.target}
                    </code>
                    {m.transform && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        ↳ {m.transform}
                      </div>
                    )}
                  </div>
                  <div className={`text-sm font-semibold ${tone} text-right`}>
                    {m.confidence}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Dry-run + Riscos */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Dry-run em ambiente isolado</h3>
                <p className="text-sm text-muted-foreground">
                  Roda a migração inteira contra um clone — zero impacto em produção.
                </p>
              </div>
              <Button onClick={startDryRun} disabled={dryRunRunning}>
                <PlayCircle className="mr-2 h-4 w-4" />
                {dryRunRunning
                  ? "Executando…"
                  : dryRunProgress === 100
                  ? "Rodar novamente"
                  : "Iniciar dry-run"}
              </Button>
            </div>

            <Progress value={dryRunProgress} className="h-2" />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {dryRunProgress < 100
                  ? "Lendo, transformando e validando registros…"
                  : "Concluído — relatório disponível abaixo."}
              </span>
              <span>{dryRunProgress}%</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Migrados
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {Math.round((totals.records * dryRunProgress) / 100).toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Avisos
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {Math.round((totals.records * dryRunProgress) / 100 * 0.012).toLocaleString(
                    "pt-BR",
                  )}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Erros
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {Math.round((totals.records * dryRunProgress) / 100 * 0.0008).toLocaleString(
                    "pt-BR",
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Baixar relatório
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Rollback simulado
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" /> Re-tentar registros com aviso
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Riscos & mitigação</h3>
            </div>
            <div className="space-y-3">
              {cfg.risks.map((r) => {
                const tone =
                  r.severity === "high"
                    ? "border-red-500/40 bg-red-500/5"
                    : r.severity === "med"
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-emerald-500/40 bg-emerald-500/5";
                const label =
                  r.severity === "high" ? "Alto" : r.severity === "med" ? "Médio" : "Baixo";
                return (
                  <div key={r.label} className={`rounded-lg border p-3 ${tone}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{r.label}</div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">↳ {r.mitigation}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Auditoria & garantias */}
      <section className="container mx-auto px-4 py-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-8">
              <Badge variant="secondary" className="mb-3 gap-1">
                <ShieldCheck className="h-3 w-3" /> Garantias contratuais
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                Auditoria automática D+1 e D+7
              </h3>
              <p className="mt-2 text-muted-foreground">
                Reconciliamos saldos, contagens e amostras de registros entre o sistema antigo e
                o novo. Qualquer divergência abre um ticket prioritário com SLA de 4h.
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Hash de integridade por entidade migrada
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Trilha de auditoria imutável (quem migrou, quando, o quê)
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Conformidade LGPD: DPA, criptografia em trânsito/repouso e expurgo programado
                </li>
                <li className="flex items-start gap-2">
                  <RotateCcw className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Rollback em 1 clique até D+7 do cutover
                </li>
              </ul>

              <div className="mt-5 rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  KPI de sucesso — {cfg.label}
                </div>
                <div className="mt-1 font-medium">{cfg.successKpi}</div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/showroom/onboarding">
                    Continuar para Onboarding <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/showroom">Voltar ao hub</Link>
                </Button>
              </div>
            </div>

            <div className="border-t bg-muted/30 p-8 md:border-l md:border-t-0">
              <div className="text-sm font-semibold">Cronograma típico</div>
              <ol className="mt-3 space-y-3 text-sm">
                {STEPS.map((s, i) => (
                  <li key={s.key} className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.duration} · {s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
