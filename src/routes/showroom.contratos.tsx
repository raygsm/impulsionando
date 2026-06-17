import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  FileSignature,
  ShieldCheck,
  PenLine,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Sparkles,
  Lock,
  FileText,
  Hash,
  Mail,
  Smartphone,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/showroom/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos digitais por nicho — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Demo navegável de geração, envio e assinatura digital de contratos por nicho — com trilha de auditoria, ICP-Brasil e validade jurídica.",
      },
      { property: "og:title", content: "Contratos digitais — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "Modelos por nicho, variáveis dinâmicas, assinatura eletrônica com hash, IP e geolocalização. Pronto para escalar.",
      },
    ],
  }),
  component: ShowroomContratos,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Template = {
  id: string;
  title: string;
  category: string;
  pages: number;
  signers: number;
  desc: string;
  body: string;
};

type ContractRow = {
  id: string;
  title: string;
  client: string;
  amount: string;
  status: "rascunho" | "enviado" | "visualizado" | "assinado" | "expirado";
  updated: string;
};

type Cfg = {
  brand: string;
  hero: string;
  variables: { key: string; label: string; value: string }[];
  templates: Template[];
  rows: ContractRow[];
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    brand: "Clínica Aurora",
    hero: "Contratos jurídicos para clínicas, planos de tratamento e termos LGPD com 1 clique.",
    variables: [
      { key: "{{paciente}}", label: "Paciente", value: "Marina Costa" },
      { key: "{{cpf}}", label: "CPF", value: "123.456.789-00" },
      { key: "{{procedimento}}", label: "Procedimento", value: "Harmonização Facial" },
      { key: "{{valor}}", label: "Valor", value: "R$ 4.800,00" },
      { key: "{{parcelas}}", label: "Parcelas", value: "6x sem juros" },
    ],
    templates: [
      {
        id: "t1",
        title: "Termo de Consentimento — Harmonização",
        category: "Saúde",
        pages: 4,
        signers: 2,
        desc: "Consentimento informado com riscos, indicações e pós-procedimento.",
        body:
          "Eu, {{paciente}}, CPF {{cpf}}, declaro estar ciente do procedimento de {{procedimento}}, dos riscos, benefícios e contraindicações apresentados pela equipe clínica. Concordo com o valor de {{valor}} pago em {{parcelas}}...",
      },
      {
        id: "t2",
        title: "Contrato de Plano Estético Anual",
        category: "Comercial",
        pages: 6,
        signers: 2,
        desc: "Pacote anual de procedimentos com cláusulas de cancelamento e reagendamento.",
        body:
          "Pelo presente instrumento particular, a Clínica Aurora e {{paciente}} (CPF {{cpf}}) firmam o plano anual no valor de {{valor}}...",
      },
      {
        id: "t3",
        title: "Termo LGPD — Tratamento de Dados",
        category: "Compliance",
        pages: 3,
        signers: 1,
        desc: "Coleta, finalidade, retenção e direitos do titular conforme Lei 13.709/18.",
        body: "O paciente {{paciente}} autoriza o tratamento de seus dados pessoais sensíveis...",
      },
    ],
    rows: [
      { id: "C-1042", title: "Harmonização — M. Costa", client: "Marina Costa", amount: "R$ 4.800", status: "assinado", updated: "há 2h" },
      { id: "C-1041", title: "Plano Anual — R. Lima", client: "Ricardo Lima", amount: "R$ 12.400", status: "visualizado", updated: "há 5h" },
      { id: "C-1040", title: "LGPD — Cadastro", client: "Júlia Mendes", amount: "—", status: "enviado", updated: "ontem" },
      { id: "C-1039", title: "Botox — A. Souza", client: "Ana Souza", amount: "R$ 1.900", status: "expirado", updated: "5 dias" },
    ],
  },
  bares: {
    brand: "Bar Esquina 47",
    hero: "Contratos de eventos, open bar, locação e fornecedores prontos para assinar.",
    variables: [
      { key: "{{cliente}}", label: "Cliente", value: "Pedro Almeida" },
      { key: "{{evento}}", label: "Evento", value: "Aniversário 30 anos" },
      { key: "{{data}}", label: "Data", value: "18/07/2026" },
      { key: "{{convidados}}", label: "Convidados", value: "80 pessoas" },
      { key: "{{valor}}", label: "Valor", value: "R$ 7.200,00" },
    ],
    templates: [
      {
        id: "t1",
        title: "Contrato de Reserva — Evento Privado",
        category: "Eventos",
        pages: 5,
        signers: 2,
        desc: "Reserva de área com sinal, política de cancelamento e consumo mínimo.",
        body:
          "{{cliente}} contrata o Bar Esquina 47 para realização do evento '{{evento}}' em {{data}}, com {{convidados}}. Valor total: {{valor}}...",
      },
      {
        id: "t2",
        title: "Open Bar — Termo de Consumo",
        category: "Operação",
        pages: 3,
        signers: 2,
        desc: "Regras de open bar, cardápio, horário e responsabilidade civil.",
        body: "O contratante {{cliente}} assume responsabilidade pelo consumo do open bar até {{valor}}...",
      },
      {
        id: "t3",
        title: "Fornecedor — Música ao Vivo",
        category: "Fornecedores",
        pages: 4,
        signers: 2,
        desc: "Contrato com artista, repertório, cachê e direitos autorais (ECAD).",
        body: "Contratação de apresentação musical em {{data}} no valor de {{valor}}...",
      },
    ],
    rows: [
      { id: "C-0212", title: "Aniversário P. Almeida", client: "Pedro Almeida", amount: "R$ 7.200", status: "visualizado", updated: "há 1h" },
      { id: "C-0211", title: "Casamento Mini Wedding", client: "Laura & João", amount: "R$ 18.500", status: "assinado", updated: "há 6h" },
      { id: "C-0210", title: "Confraternização TechCo", client: "TechCo Ltda", amount: "R$ 9.800", status: "enviado", updated: "ontem" },
      { id: "C-0209", title: "DJ Residente — Set", client: "DJ Marlon", amount: "R$ 2.400", status: "rascunho", updated: "2 dias" },
    ],
  },
  cervejarias: {
    brand: "Cervejaria Lúpulo Norte",
    hero: "Contratos de revenda, distribuição e parcerias com cláusulas específicas do setor.",
    variables: [
      { key: "{{revendedor}}", label: "Revendedor", value: "Empório Beer SP" },
      { key: "{{cnpj}}", label: "CNPJ", value: "12.345.678/0001-90" },
      { key: "{{produtos}}", label: "Produtos", value: "IPA, Stout, Pilsen" },
      { key: "{{volume}}", label: "Volume/mês", value: "240 litros" },
      { key: "{{valor}}", label: "Valor mínimo", value: "R$ 3.500,00/mês" },
    ],
    templates: [
      {
        id: "t1",
        title: "Contrato de Revenda Autorizada",
        category: "Distribuição",
        pages: 7,
        signers: 2,
        desc: "Volume mínimo, território exclusivo e tabela de preços por categoria.",
        body:
          "A Cervejaria Lúpulo Norte autoriza {{revendedor}} (CNPJ {{cnpj}}) a comercializar os produtos {{produtos}} com volume mínimo de {{volume}}...",
      },
      {
        id: "t2",
        title: "Parceria — Festival/Evento",
        category: "Marketing",
        pages: 4,
        signers: 2,
        desc: "Patrocínio, ativação de marca, exclusividade de chope e contrapartidas.",
        body: "Patrocínio de evento com fornecimento de chope e ativação de marca no valor de {{valor}}...",
      },
      {
        id: "t3",
        title: "Comodato — Chopeira & Equipamentos",
        category: "Equipamentos",
        pages: 5,
        signers: 2,
        desc: "Empréstimo de chopeira, manutenção, devolução e multa por avaria.",
        body: "Comodato de 1 (uma) chopeira modelo Profissional 4 vias para {{revendedor}}...",
      },
    ],
    rows: [
      { id: "C-0078", title: "Revenda — Empório Beer", client: "Empório Beer SP", amount: "R$ 3.500/mês", status: "assinado", updated: "há 3h" },
      { id: "C-0077", title: "Festival Lúpulo Fest", client: "Produtora Norte", amount: "R$ 22.000", status: "enviado", updated: "ontem" },
      { id: "C-0076", title: "Comodato Chopeira #14", client: "Bar do Zé", amount: "R$ 0", status: "visualizado", updated: "2 dias" },
      { id: "C-0075", title: "Distribuição RJ", client: "Distrib. Carioca", amount: "R$ 8.900/mês", status: "rascunho", updated: "3 dias" },
    ],
  },
  servicos: {
    brand: "Studio Forma",
    hero: "Propostas, orçamentos e contratos de serviço prontos com variáveis dinâmicas.",
    variables: [
      { key: "{{cliente}}", label: "Cliente", value: "Sofia Ribeiro" },
      { key: "{{servico}}", label: "Serviço", value: "Pacote Mensal Personal" },
      { key: "{{frequencia}}", label: "Frequência", value: "3x/semana" },
      { key: "{{valor}}", label: "Valor", value: "R$ 980,00/mês" },
      { key: "{{vigencia}}", label: "Vigência", value: "12 meses" },
    ],
    templates: [
      {
        id: "t1",
        title: "Contrato de Prestação de Serviços",
        category: "Comercial",
        pages: 5,
        signers: 2,
        desc: "Escopo, prazo, valores, reajuste anual e SLA com multa rescisória.",
        body:
          "Pelo presente, {{cliente}} contrata o Studio Forma para prestação de {{servico}} com frequência de {{frequencia}}. Valor: {{valor}}, vigência {{vigencia}}...",
      },
      {
        id: "t2",
        title: "Termo de Avaliação Física",
        category: "Operação",
        pages: 3,
        signers: 2,
        desc: "Anamnese, autorização e responsabilidade sobre prática de atividade física.",
        body: "{{cliente}} declara estar apto(a) à prática de atividade física e autoriza avaliação...",
      },
      {
        id: "t3",
        title: "Proposta Comercial — Empresa",
        category: "Vendas",
        pages: 6,
        signers: 2,
        desc: "Wellness corporativo, escopo por colaborador e indicadores de adesão.",
        body: "Proposta de programa corporativo para até 50 colaboradores no valor de {{valor}}...",
      },
    ],
    rows: [
      { id: "C-0331", title: "Personal — S. Ribeiro", client: "Sofia Ribeiro", amount: "R$ 11.760", status: "assinado", updated: "há 30min" },
      { id: "C-0330", title: "Corporativo — TechCo", client: "TechCo Ltda", amount: "R$ 38.500", status: "visualizado", updated: "há 4h" },
      { id: "C-0329", title: "Avaliação Física", client: "Bruno Tavares", amount: "—", status: "enviado", updated: "ontem" },
      { id: "C-0328", title: "Rescisão amigável", client: "Helena Dias", amount: "—", status: "expirado", updated: "4 dias" },
    ],
  },
  ecommerce: {
    brand: "Loja Origem",
    hero: "Contratos B2B, dropshipping e termos de afiliação com geração em massa.",
    variables: [
      { key: "{{parceiro}}", label: "Parceiro", value: "Boutique Verão" },
      { key: "{{cnpj}}", label: "CNPJ", value: "98.765.432/0001-11" },
      { key: "{{comissao}}", label: "Comissão", value: "18%" },
      { key: "{{ticket}}", label: "Ticket médio", value: "R$ 320,00" },
      { key: "{{prazo}}", label: "Prazo pagamento", value: "30 dias" },
    ],
    templates: [
      {
        id: "t1",
        title: "Contrato de Afiliação",
        category: "Marketing",
        pages: 4,
        signers: 2,
        desc: "Comissionamento, cookies, política antifraude e prazo de pagamento.",
        body:
          "A Loja Origem firma com {{parceiro}} (CNPJ {{cnpj}}) contrato de afiliação com comissão de {{comissao}} sobre vendas confirmadas em até {{prazo}}...",
      },
      {
        id: "t2",
        title: "Dropshipping B2B",
        category: "Operação",
        pages: 6,
        signers: 2,
        desc: "Catálogo, integração via API, SLA de expedição e devoluções.",
        body: "Acordo de dropshipping com integração via API e SLA de expedição em até 24h...",
      },
      {
        id: "t3",
        title: "Termo de Uso — Marketplace",
        category: "Compliance",
        pages: 8,
        signers: 1,
        desc: "Regras do seller, taxas, anti-falsificação e suspensão de conta.",
        body: "O seller {{parceiro}} se compromete a cumprir as políticas do marketplace...",
      },
    ],
    rows: [
      { id: "C-2210", title: "Afiliação — Boutique Verão", client: "Boutique Verão", amount: "18% comm.", status: "assinado", updated: "há 1h" },
      { id: "C-2209", title: "Drop — Casa Bella", client: "Casa Bella", amount: "Recorrente", status: "visualizado", updated: "há 3h" },
      { id: "C-2208", title: "Seller Onboarding #88", client: "Diego Faria", amount: "—", status: "enviado", updated: "ontem" },
      { id: "C-2207", title: "Renovação anual — Hub Sul", client: "Hub Sul Ltda", amount: "R$ 28.400", status: "rascunho", updated: "2 dias" },
    ],
  },
};

const NICHE_LABELS: Record<NicheSlug, string> = {
  clinicas: "Clínicas & Estética",
  bares: "Bares & Restaurantes",
  cervejarias: "Cervejarias",
  servicos: "Serviços & Studios",
  ecommerce: "E-commerce",
};

const STATUS_STYLES: Record<ContractRow["status"], string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  visualizado: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  assinado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  expirado: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function applyVars(body: string, vars: { key: string; value: string }[]) {
  return vars.reduce((acc, v) => acc.split(v.key).join(v.value), body);
}

function ShowroomContratos() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const cfg = DATA[niche];
  const [tplId, setTplId] = useState(cfg.templates[0].id);
  const tpl = useMemo(
    () => cfg.templates.find((t) => t.id === tplId) ?? cfg.templates[0],
    [cfg, tplId],
  );
  const [vars, setVars] = useState(cfg.variables);
  const [signed, setSigned] = useState(false);
  const [sigName, setSigName] = useState("");

  // reset state on niche change
  const switchNiche = (slug: NicheSlug) => {
    setNiche(slug);
    setTplId(DATA[slug].templates[0].id);
    setVars(DATA[slug].variables);
    setSigned(false);
    setSigName("");
  };

  const filled = useMemo(() => applyVars(tpl.body, vars), [tpl, vars]);
  const signedCount = cfg.rows.filter((r) => r.status === "assinado").length;
  const pendingCount = cfg.rows.filter((r) => r.status === "enviado" || r.status === "visualizado").length;
  const conversion = Math.round((signedCount / cfg.rows.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <FileSignature className="h-3 w-3" /> Showroom · Contratos digitais
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Contratos jurídicos por nicho, prontos para assinar
            </h1>
            <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
              Modelos especialistas, variáveis dinâmicas, assinatura eletrônica com{" "}
              <strong>hash, IP e geolocalização</strong>. Validade jurídica (MP 2.200-2/01) com
              opção ICP-Brasil quando exigido.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(Object.keys(NICHE_LABELS) as NicheSlug[]).map((slug) => (
                <Button
                  key={slug}
                  size="sm"
                  variant={niche === slug ? "default" : "outline"}
                  onClick={() => switchNiche(slug)}
                >
                  {NICHE_LABELS[slug]}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Nicho atual: <strong className="text-foreground">{cfg.brand}</strong> — {cfg.hero}
            </p>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-3 md:grid-cols-4">
            <KPI icon={<FileText className="h-4 w-4" />} label="Contratos no mês" value={`${cfg.rows.length * 28}`} hint="+12% vs mês ant." />
            <KPI icon={<CheckCircle2 className="h-4 w-4" />} label="Taxa de assinatura" value={`${conversion}%`} hint="média do nicho" />
            <KPI icon={<Clock className="h-4 w-4" />} label="Tempo médio p/ assinar" value="00:14:32" hint="do envio à última assinatura" />
            <KPI icon={<ShieldCheck className="h-4 w-4" />} label="Trilha de auditoria" value="100%" hint="hash SHA-256 + IP + geo" />
          </div>
        </div>
      </section>

      {/* Editor + Preview */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Sidebar — templates + variáveis */}
          <div className="space-y-5">
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Modelos do nicho</h3>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" /> IA
                </Badge>
              </div>
              <div className="space-y-2">
                {cfg.templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTplId(t.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      tplId === t.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">{t.title}</span>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {t.category}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.desc}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {t.pages} págs
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <PenLine className="h-3 w-3" /> {t.signers} assinantes
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Variáveis dinâmicas</h3>
              <div className="space-y-3">
                {vars.map((v, i) => (
                  <div key={v.key}>
                    <label className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{v.label}</span>
                      <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{v.key}</code>
                    </label>
                    <Input
                      value={v.value}
                      onChange={(e) => {
                        const next = [...vars];
                        next[i] = { ...v, value: e.target.value };
                        setVars(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Conformidade</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-500" /> MP 2.200-2/01 — validade jurídica
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 text-emerald-500" /> ICP-Brasil opcional (A1/A3)
                </li>
                <li className="flex items-start gap-2">
                  <Hash className="mt-0.5 h-4 w-4 text-emerald-500" /> Hash SHA-256 do documento
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> Trilha de auditoria com IP, dispositivo e geo
                </li>
              </ul>
            </Card>
          </div>

          {/* Preview + assinatura */}
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{tpl.title}</span>
                  <Badge variant="outline" className="text-xs">
                    Pré-visualização
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Eye className="mr-1 h-3.5 w-3.5" /> Visualizar
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="mr-1 h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </div>
              <div className="bg-white p-8 text-sm leading-relaxed text-zinc-800 dark:bg-zinc-50">
                <div className="mb-6 border-b pb-4">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    {cfg.brand} · {tpl.category}
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-zinc-900">{tpl.title}</h2>
                </div>
                <p className="whitespace-pre-wrap text-zinc-700">{filled}</p>
                <div className="mt-8 grid gap-6 border-t pt-6 md:grid-cols-2">
                  <SignatureBlock label="Contratante" name={cfg.brand} signed />
                  <SignatureBlock
                    label="Contratado(a)"
                    name={signed ? sigName || vars[0].value : "Aguardando assinatura"}
                    signed={signed}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Assinatura eletrônica</h3>
                <Badge variant={signed ? "default" : "secondary"} className="gap-1">
                  {signed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {signed ? "Assinado" : "Pendente"}
                </Badge>
              </div>
              {!signed ? (
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Digite seu nome completo para assinar
                    </label>
                    <Input
                      placeholder="Ex: Marina Costa"
                      value={sigName}
                      onChange={(e) => setSigName(e.target.value)}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ao assinar, registramos IP, dispositivo, geolocalização aproximada e hash
                      SHA-256 do documento.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setSigned(true)}
                    disabled={sigName.trim().length < 3}
                  >
                    <PenLine className="mr-2 h-4 w-4" /> Assinar agora
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <AuditRow label="Assinante" value={sigName} />
                  <AuditRow label="Data/hora" value="17/06/2026 14:32:08 (BRT)" />
                  <AuditRow label="IP" value="187.34.122.18" />
                  <AuditRow label="Dispositivo" value="iPhone 15 · Safari" />
                  <AuditRow label="Geolocalização" value="São Paulo, SP" />
                  <AuditRow label="Hash SHA-256" value="a1f3…9c84" mono />
                  <div className="md:col-span-2 flex items-center justify-between rounded-lg border bg-emerald-500/5 p-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" /> Documento assinado com validade jurídica.
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-3.5 w-3.5" /> Baixar PDF assinado
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSigned(false)}>
                        Resetar demo
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Funil */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Funil de assinaturas</h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe do envio à assinatura — com lembretes automáticos por e-mail e WhatsApp.
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> Lembretes inteligentes ativos
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <FunnelStep icon={<Send className="h-4 w-4" />} label="Enviados" value={cfg.rows.length * 28} pct={100} />
            <FunnelStep icon={<Eye className="h-4 w-4" />} label="Visualizados" value={Math.round(cfg.rows.length * 28 * 0.86)} pct={86} />
            <FunnelStep icon={<PenLine className="h-4 w-4" />} label="Iniciaram assinatura" value={Math.round(cfg.rows.length * 28 * 0.72)} pct={72} />
            <FunnelStep icon={<CheckCircle2 className="h-4 w-4" />} label="Assinados" value={Math.round(cfg.rows.length * 28 * (conversion / 100))} pct={conversion} />
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Contratos recentes</h2>
            <p className="text-sm text-muted-foreground">
              {pendingCount} aguardando ação · {signedCount} concluídos esta semana
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button variant="outline" size="sm">
              <Mail className="mr-1 h-3.5 w-3.5" /> Reenviar por e-mail
            </Button>
            <Button variant="outline" size="sm">
              <Smartphone className="mr-1 h-3.5 w-3.5" /> Lembrete WhatsApp
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Contrato</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Atualizado</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cfg.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.client}</td>
                    <td className="px-4 py-3">{r.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status === "assinado" && <CheckCircle2 className="h-3 w-3" />}
                        {r.status === "expirado" && <XCircle className="h-3 w-3" />}
                        {r.status === "visualizado" && <Eye className="h-3 w-3" />}
                        {r.status === "enviado" && <Send className="h-3 w-3" />}
                        {r.status === "rascunho" && <FileText className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.updated}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost">
                        Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Pronto para digitalizar seus contratos?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Modelos por nicho, assinatura eletrônica com validade jurídica e funil
                  acompanhado em tempo real — tudo integrado ao seu CRM, financeiro e WhatsApp.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="lg">
                  <Link to="/trial">Começar grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/showroom">Voltar ao showroom</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function SignatureBlock({ label, name, signed }: { label: string; name: string; signed: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={`mt-2 flex h-16 items-center justify-center rounded-md border ${
          signed ? "border-emerald-500/40 bg-emerald-500/5" : "border-dashed border-zinc-300"
        }`}
      >
        {signed ? (
          <span className="font-[cursive] text-lg italic text-emerald-700">{name}</span>
        ) : (
          <span className="text-xs text-zinc-400">{name}</span>
        )}
      </div>
      <div className="mt-1 border-t pt-1 text-xs text-zinc-500">{signed ? "Assinado digitalmente" : "—"}</div>
    </div>
  );
}

function AuditRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
    </div>
  );
}

function FunnelStep({
  icon,
  label,
  value,
  pct,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-xs font-medium">{pct}%</span>
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value.toLocaleString("pt-BR")}</div>
      <Progress value={pct} className="mt-2 h-1.5" />
    </Card>
  );
}
