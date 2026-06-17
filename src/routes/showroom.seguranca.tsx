import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  FileWarning,
  ScrollText,
  UserCog,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  Server,
  Globe,
  ArrowRight,
  Download,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/showroom/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança, LGPD e auditoria — Showroom | Impulsionando" },
      {
        name: "description",
        content:
          "Criptografia ponta a ponta, RBAC granular, trilha de auditoria imutável e conformidade LGPD — demonstração navegável por nicho.",
      },
      { property: "og:title", content: "Segurança — Showroom Impulsionando" },
      {
        property: "og:description",
        content:
          "RBAC, MFA, logs imutáveis, anonimização de PII e relatório LGPD — adaptado ao seu segmento.",
      },
    ],
  }),
  component: ShowroomSeguranca,
});

type NicheSlug = "clinicas" | "bares" | "cervejarias" | "servicos" | "ecommerce";

type Cfg = {
  label: string;
  sensitiveFields: { field: string; classification: "PII" | "PHI" | "Financeiro" | "Operacional" }[];
  roles: { name: string; users: number; perms: string[] }[];
  compliance: { name: string; status: "ok" | "warn" | "fail"; detail: string }[];
};

const DATA: Record<NicheSlug, Cfg> = {
  clinicas: {
    label: "Clínicas",
    sensitiveFields: [
      { field: "Prontuário médico", classification: "PHI" },
      { field: "CPF / RG", classification: "PII" },
      { field: "Cartão de crédito", classification: "Financeiro" },
      { field: "Convênio e número da carteirinha", classification: "PHI" },
      { field: "Exames e laudos", classification: "PHI" },
    ],
    roles: [
      { name: "Recepção", users: 8, perms: ["Agendar", "Ver dados básicos", "Receber pagamento"] },
      { name: "Médico", users: 12, perms: ["Ver prontuário", "Prescrever", "Editar laudo"] },
      { name: "Financeiro", users: 3, perms: ["Faturamento", "Conciliação", "Relatórios"] },
      { name: "Administrador", users: 1, perms: ["Tudo + gestão de usuários + auditoria"] },
    ],
    compliance: [
      { name: "LGPD — Encarregado (DPO) nomeado", status: "ok", detail: "Contato no rodapé do app" },
      { name: "CFM — Prontuário eletrônico com assinatura digital", status: "ok", detail: "ICP-Brasil A3/A1" },
      { name: "ISO 27001 — Controles aplicáveis", status: "warn", detail: "12 de 14 controles implementados" },
      { name: "Backup criptografado fora de região", status: "ok", detail: "RPO 15min · RTO 1h" },
    ],
  },
  bares: {
    label: "Bares & Restaurantes",
    sensitiveFields: [
      { field: "CPF do cliente (NF-e)", classification: "PII" },
      { field: "Endereço de entrega", classification: "PII" },
      { field: "Tokens de gateway", classification: "Financeiro" },
      { field: "Salário e ponto da equipe", classification: "PII" },
    ],
    roles: [
      { name: "Garçom", users: 14, perms: ["Abrir comanda", "Lançar pedido"] },
      { name: "Caixa", users: 4, perms: ["Receber", "Estornar (com PIN)", "Fechar caixa"] },
      { name: "Gerente", users: 2, perms: ["Tudo do caixa + ajustes + descontos"] },
      { name: "Proprietário", users: 1, perms: ["Tudo + financeiro + relatórios fiscais"] },
    ],
    compliance: [
      { name: "PCI-DSS — Tokenização de cartão", status: "ok", detail: "Sem armazenamento de PAN" },
      { name: "LGPD — Consentimento delivery", status: "ok", detail: "Checkbox + log de aceite" },
      { name: "SAT/NFC-e — Contingência", status: "warn", detail: "Configurar emissor de backup" },
      { name: "Cofre de senhas operacionais", status: "ok", detail: "Rotação a cada 90 dias" },
    ],
  },
  cervejarias: {
    label: "Cervejarias",
    sensitiveFields: [
      { field: "CNPJ e contratos B2B", classification: "PII" },
      { field: "Custos de receita", classification: "Operacional" },
      { field: "Pix recebido", classification: "Financeiro" },
      { field: "Notas fiscais emitidas", classification: "Financeiro" },
    ],
    roles: [
      { name: "Produção", users: 6, perms: ["Lançar lote", "Mover estoque interno"] },
      { name: "Comercial B2B", users: 5, perms: ["CRM", "Emitir pedido", "Tabela de preços"] },
      { name: "Fiscal", users: 2, perms: ["Emitir NF", "Conferir tributos", "Relatórios SPED"] },
      { name: "Diretor", users: 1, perms: ["Tudo + DRE + acesso ao cofre"] },
    ],
    compliance: [
      { name: "SPED Fiscal e Contribuições", status: "ok", detail: "Geração mensal automatizada" },
      { name: "Rastreabilidade lote → cliente (MAPA)", status: "ok", detail: "Auditável em 1 clique" },
      { name: "LGPD — Dados de motoristas/terceiros", status: "warn", detail: "Revisar contratos de operador" },
      { name: "Backup off-site criptografado", status: "ok", detail: "Diário, retenção 90 dias" },
    ],
  },
  servicos: {
    label: "Serviços",
    sensitiveFields: [
      { field: "Propostas e contratos", classification: "Financeiro" },
      { field: "Dados bancários do cliente", classification: "Financeiro" },
      { field: "Documentos de projetos (NDA)", classification: "Operacional" },
      { field: "E-mails do cliente", classification: "PII" },
    ],
    roles: [
      { name: "Operacional", users: 9, perms: ["Ver jobs atribuídos", "Lançar horas"] },
      { name: "Gerente de conta", users: 3, perms: ["Ver carteira", "Emitir proposta"] },
      { name: "Financeiro", users: 2, perms: ["Faturar", "Receber", "Repassar comissões"] },
      { name: "Sócio", users: 2, perms: ["Tudo + auditoria + exportar dados"] },
    ],
    compliance: [
      { name: "LGPD — Política de privacidade publicada", status: "ok", detail: "Versionada e auditável" },
      { name: "NDA por projeto com assinatura", status: "ok", detail: "ICP-Brasil ou e-mail+IP" },
      { name: "ISO 27001 — Em adequação", status: "warn", detail: "Auditoria interna concluída" },
      { name: "Cofre de credenciais (clientes)", status: "ok", detail: "Acesso por solicitação + log" },
    ],
  },
  ecommerce: {
    label: "E-commerce",
    sensitiveFields: [
      { field: "Cartão tokenizado", classification: "Financeiro" },
      { field: "CPF e endereço", classification: "PII" },
      { field: "Histórico de compras", classification: "PII" },
      { field: "Tokens de API (marketplaces)", classification: "Operacional" },
    ],
    roles: [
      { name: "Atendimento", users: 7, perms: ["Ver pedido", "Abrir reembolso (com aprovação)"] },
      { name: "Logística", users: 4, perms: ["Despachar", "Atualizar tracking"] },
      { name: "Marketing", users: 3, perms: ["Cupons", "Campanhas", "Segmentos (sem PII bruto)"] },
      { name: "Admin", users: 1, perms: ["Tudo + chaves + relatórios financeiros"] },
    ],
    compliance: [
      { name: "PCI-DSS SAQ-A", status: "ok", detail: "Pagamentos via gateway certificado" },
      { name: "LGPD — Direitos do titular (DSR)", status: "ok", detail: "Portal de auto-atendimento" },
      { name: "Anti-fraude no checkout", status: "ok", detail: "Score + 3DS 2.0" },
      { name: "WAF e rate-limit no storefront", status: "warn", detail: "Revisar regras a cada release" },
    ],
  },
};

type AuditEvent = {
  ts: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  ip: string;
  severity: "info" | "warn" | "alert";
};

const AUDIT: AuditEvent[] = [
  { ts: "16:42:08", actor: "ana.silva", role: "Recepção", action: "Visualizou prontuário", target: "Paciente #4821", ip: "189.45.x.x", severity: "info" },
  { ts: "16:38:55", actor: "carlos.med", role: "Médico", action: "Editou laudo", target: "Exame #9120", ip: "189.45.x.x", severity: "info" },
  { ts: "16:35:12", actor: "fin.bot", role: "Financeiro", action: "Exportou CSV (812 linhas)", target: "Recebíveis maio/26", ip: "10.0.0.4", severity: "warn" },
  { ts: "16:31:40", actor: "admin", role: "Administrador", action: "Concedeu permissão", target: "User #221 → role Médico", ip: "200.158.x.x", severity: "warn" },
  { ts: "16:28:02", actor: "—", role: "Sistema", action: "Bloqueio de login (5x senha errada)", target: "user@dominio.com", ip: "45.221.x.x", severity: "alert" },
  { ts: "16:21:17", actor: "ana.silva", role: "Recepção", action: "Login OK (MFA TOTP)", target: "sessão #b8a1", ip: "189.45.x.x", severity: "info" },
];

const NICHES: { slug: NicheSlug; label: string }[] = [
  { slug: "clinicas", label: "Clínicas" },
  { slug: "bares", label: "Bares" },
  { slug: "cervejarias", label: "Cervejarias" },
  { slug: "servicos", label: "Serviços" },
  { slug: "ecommerce", label: "E-commerce" },
];

function ShowroomSeguranca() {
  const [niche, setNiche] = useState<NicheSlug>("clinicas");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [maskPII, setMaskPII] = useState(true);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(30);

  const cfg = DATA[niche];

  const score = useMemo(() => {
    const okCount = cfg.compliance.filter((c) => c.status === "ok").length;
    const base = Math.round((okCount / cfg.compliance.length) * 100);
    const bonus = (mfaEnabled ? 4 : 0) + (maskPII ? 3 : 0) + (sessionTimeoutMin <= 30 ? 2 : 0);
    return Math.min(100, base + bonus);
  }, [cfg, mfaEnabled, maskPII, sessionTimeoutMin]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3 gap-1">
              <ShieldCheck className="h-3 w-3" /> Showroom — Segurança & LGPD
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Seus dados protegidos em todas as camadas
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Criptografia em trânsito e repouso, RBAC granular, MFA obrigatório, trilha imutável
              de auditoria e conformidade LGPD — com painel ao vivo do seu nicho.
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

      {/* KPI score */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Security score — {cfg.label}</span>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-4xl font-bold">{score}</div>
              <div className="pb-1 text-sm text-muted-foreground">/ 100</div>
            </div>
            <Progress value={score} className="mt-3 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Calculado em tempo real com base nos controles ativos e nas políticas do nicho.
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Criptografia</span>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-base font-semibold">AES-256 + TLS 1.3</div>
            <div className="text-xs text-muted-foreground">Em repouso e em trânsito</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trilha de auditoria</span>
              <ScrollText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-base font-semibold">Imutável (hash-chain)</div>
            <div className="text-xs text-muted-foreground">Retenção 5 anos</div>
          </Card>
        </div>
      </section>

      {/* Políticas interativas */}
      <section className="container mx-auto px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">MFA obrigatório</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              TOTP, WebAuthn (passkey) ou SMS de fallback para todos os usuários administrativos.
            </p>
            <Button
              className="mt-4 w-full"
              variant={mfaEnabled ? "default" : "outline"}
              onClick={() => setMfaEnabled((v) => !v)}
            >
              {mfaEnabled ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Ativo
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" /> Desativado
                </>
              )}
            </Button>
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Mascaramento de PII</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Telefones, documentos e cartões aparecem mascarados; visualização completa exige
              justificativa registrada.
            </p>
            <div className="mt-4 rounded-md border bg-muted/30 p-3 font-mono text-sm">
              {maskPII ? "CPF: ***.***.***-21" : "CPF: 412.398.776-21"}
            </div>
            <Button
              className="mt-3 w-full"
              variant={maskPII ? "default" : "outline"}
              onClick={() => setMaskPII((v) => !v)}
            >
              <Eye className="mr-2 h-4 w-4" /> {maskPII ? "Mascarado" : "Visível"}
            </Button>
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Timeout de sessão</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Sessões inativas são encerradas e exigem novo login + MFA.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {[15, 30, 60, 120].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={sessionTimeoutMin === m ? "default" : "outline"}
                  onClick={() => setSessionTimeoutMin(m)}
                >
                  {m}min
                </Button>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Recomendado: 30min para perfis administrativos.
            </div>
          </Card>
        </div>
      </section>

      {/* RBAC + Dados sensíveis */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">RBAC granular — {cfg.label}</h3>
                <p className="text-sm text-muted-foreground">
                  Papéis e permissões pré-configurados para o nicho.
                </p>
              </div>
              <Badge variant="outline">
                <UserCog className="mr-1 h-3 w-3" /> {cfg.roles.length} papéis
              </Badge>
            </div>
            <div className="space-y-2">
              {cfg.roles.map((r) => (
                <div key={r.name} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{r.name}</div>
                    <Badge variant="secondary">{r.users} usuários</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.perms.map((p) => (
                      <Badge key={p} variant="outline" className="text-[11px] font-normal">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Dados sensíveis mapeados</h3>
                <p className="text-sm text-muted-foreground">
                  Inventário automático com classificação e regras de acesso.
                </p>
              </div>
              <Badge variant="outline">
                <FileWarning className="mr-1 h-3 w-3" /> {cfg.sensitiveFields.length} campos
              </Badge>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Campo</th>
                    <th className="px-3 py-2 text-left font-medium">Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.sensitiveFields.map((f) => {
                    const tone =
                      f.classification === "PHI"
                        ? "bg-red-500/10 text-red-700"
                        : f.classification === "PII"
                        ? "bg-amber-500/10 text-amber-700"
                        : f.classification === "Financeiro"
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-muted text-muted-foreground";
                    return (
                      <tr key={f.field} className="border-t">
                        <td className="px-3 py-2 font-medium">{f.field}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs ${tone}`}>
                            {f.classification}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Auditoria + compliance */}
      <section className="container mx-auto px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Trilha de auditoria — ao vivo</h3>
                <p className="text-sm text-muted-foreground">
                  Eventos encadeados por hash; qualquer alteração quebra a corrente.
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Exportar (CSV)
              </Button>
            </div>
            <div className="space-y-2">
              {AUDIT.map((e, i) => {
                const tone =
                  e.severity === "alert"
                    ? "border-red-500/40 bg-red-500/5"
                    : e.severity === "warn"
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "";
                const Icon =
                  e.severity === "alert"
                    ? AlertTriangle
                    : e.severity === "warn"
                    ? Activity
                    : CheckCircle2;
                const iconTone =
                  e.severity === "alert"
                    ? "text-red-600"
                    : e.severity === "warn"
                    ? "text-amber-600"
                    : "text-emerald-600";
                return (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${tone}`}>
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone}`} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{e.ts}</span>
                        <span className="font-medium">{e.actor}</span>
                        <Badge variant="outline" className="text-[11px]">
                          {e.role}
                        </Badge>
                        <span className="text-muted-foreground">→ {e.action}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {e.target} · IP {e.ip}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Conformidade</h3>
            </div>
            <div className="space-y-2">
              {cfg.compliance.map((c) => {
                const Icon =
                  c.status === "ok"
                    ? CheckCircle2
                    : c.status === "warn"
                    ? AlertTriangle
                    : FileWarning;
                const tone =
                  c.status === "ok"
                    ? "text-emerald-600"
                    : c.status === "warn"
                    ? "text-amber-600"
                    : "text-red-600";
                return (
                  <div key={c.name} className="rounded-lg border p-3">
                    <div className="flex items-start gap-2">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.detail}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Arquitetura e garantias */}
      <section className="container mx-auto px-4 py-10">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
            <div className="p-8">
              <Badge variant="secondary" className="mb-3 gap-1">
                <Server className="h-3 w-3" /> Arquitetura
              </Badge>
              <h3 className="text-2xl font-bold tracking-tight">
                Defesa em profundidade — 7 camadas
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-emerald-600" />
                  WAF + anti-DDoS na borda (rate-limit por IP/sessão)
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 text-emerald-600" />
                  TLS 1.3 obrigatório · HSTS · cookies SameSite=Strict
                </li>
                <li className="flex items-start gap-2">
                  <KeyRound className="mt-0.5 h-4 w-4 text-emerald-600" />
                  MFA, SSO (SAML/OIDC) e passkeys WebAuthn
                </li>
                <li className="flex items-start gap-2">
                  <UserCog className="mt-0.5 h-4 w-4 text-emerald-600" />
                  RBAC granular + segregação por unidade/filial
                </li>
                <li className="flex items-start gap-2">
                  <EyeOff className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Mascaramento de PII em UI e exports
                </li>
                <li className="flex items-start gap-2">
                  <ScrollText className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Auditoria imutável (hash-chain) com retenção 5 anos
                </li>
                <li className="flex items-start gap-2">
                  <Server className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Backup criptografado off-site (RPO 15min · RTO 1h)
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/showroom/migracao">
                    Ver migração de dados <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/showroom">Voltar ao hub</Link>
                </Button>
              </div>
            </div>

            <div className="border-t bg-muted/30 p-8 md:border-l md:border-t-0">
              <div className="text-sm font-semibold">Certificações & práticas</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {[
                  "LGPD",
                  "ISO 27001 (em adequação)",
                  "PCI-DSS SAQ-A",
                  "SOC 2 Type II (roadmap)",
                  "OWASP ASVS L2",
                  "Pentest anual",
                  "Bug bounty privado",
                  "DPO designado",
                ].map((c) => (
                  <div key={c} className="flex items-center gap-2 rounded-md border bg-background p-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{c}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border bg-background p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Compromisso
                </div>
                <p className="mt-1 text-sm">
                  Notificamos o titular em até <span className="font-semibold">48h</span> em caso
                  de incidente que envolva dados pessoais, conforme art. 48 da LGPD.
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
