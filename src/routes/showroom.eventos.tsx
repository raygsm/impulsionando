import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Ticket, Users, ArrowLeftRight, ClipboardCheck, BarChart3, Star, MessageCircle,
  CheckCircle2, Clock, History, TrendingUp, Calendar, ArrowRight, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/showroom/eventos")({
  head: () => ({
    meta: [
      { title: "Showroom Eventos & Ingressos — Impulsionando Tecnologia" },
      { name: "description", content: "Demo navegável do módulo Eventos & Ingressos: transferência de titular, histórico do participante, pesquisa pós-evento e dashboards de satisfação." },
      { property: "og:title", content: "Showroom Eventos — Impulsionando Tecnologia" },
      { property: "og:description", content: "Veja como funciona o módulo Eventos & Ingressos: transferência de titular, histórico e dashboards." },
    ],
  }),
  component: ShowroomEventos,
});

const DEMO_BADGE = "Demonstração — dados fictícios, sem impacto em dados reais.";

type Titular = { nome: string; whatsapp: string; email: string; data: string; status: "atual" | "anterior" };

function ShowroomEventos() {
  // ------ Configuração do evento (parametrizável) ------
  const [permitirTransfer, setPermitirTransfer] = useState(true);
  const [permitirComprador, setPermitirComprador] = useState(true);
  const [exigirAprovacao, setExigirAprovacao] = useState(false);
  const [umaUnicaVez, setUmaUnicaVez] = useState(false);
  const [bloquearAposCheckin, setBloquearAposCheckin] = useState(true);
  const [prazoLimite, setPrazoLimite] = useState("24h");
  const [maxAlteracoes, setMaxAlteracoes] = useState(2);
  const [motivoObrigatorio, setMotivoObrigatorio] = useState(false);

  // ------ Estado do ingresso demo ------
  const [titulares, setTitulares] = useState<Titular[]>([
    { nome: "Marina Costa", whatsapp: "(21) 99999-0001", email: "marina@email.com", data: "12/05/2026", status: "atual" },
  ]);
  const [novoNome, setNovoNome] = useState("");
  const [novoWhats, setNovoWhats] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [motivo, setMotivo] = useState("");
  const [checkinFeito, setCheckinFeito] = useState(false);

  const alteracoesRealizadas = titulares.filter((t) => t.status === "anterior").length;
  const podeAlterar = useMemo(() => {
    if (!permitirTransfer || !permitirComprador) return { ok: false, msg: "Transferência desativada pela organização." };
    if (bloquearAposCheckin && checkinFeito) return { ok: false, msg: "Check-in já realizado — alteração bloqueada." };
    if (umaUnicaVez && alteracoesRealizadas >= 1) return { ok: false, msg: "Apenas uma alteração permitida por ingresso." };
    if (alteracoesRealizadas >= maxAlteracoes) return { ok: false, msg: `Limite de ${maxAlteracoes} alteração(ões) atingido.` };
    return { ok: true, msg: "" };
  }, [permitirTransfer, permitirComprador, bloquearAposCheckin, checkinFeito, umaUnicaVez, alteracoesRealizadas, maxAlteracoes]);

  function transferir() {
    if (!podeAlterar.ok) { toast.error(podeAlterar.msg); return; }
    if (!novoNome.trim() || !novoWhats.trim()) { toast.error("Informe nome e WhatsApp do novo titular."); return; }
    if (motivoObrigatorio && !motivo.trim()) { toast.error("Motivo da alteração é obrigatório."); return; }
    setTitulares((prev) => [
      ...prev.map((t) => ({ ...t, status: "anterior" as const })),
      { nome: novoNome, whatsapp: novoWhats, email: novoEmail, data: new Date().toLocaleDateString("pt-BR"), status: "atual" },
    ]);
    const acao = exigirAprovacao ? "enviada para aprovação da organização" : "realizada automaticamente";
    toast.success(`Alteração de titular ${acao}. Novo titular notificado.`);
    setNovoNome(""); setNovoWhats(""); setNovoEmail(""); setMotivo("");
  }

  // ------ Pesquisa pós-evento ------
  const [nps, setNps] = useState(9);
  const [notaGeral, setNotaGeral] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviada, setEnviada] = useState(false);

  // ------ Dashboard mock ------
  const dash = {
    vendidos: 320, receita: 28800, checkins: 287, taxaPresenca: 89.7,
    transferidos: 14, pesquisasEnviadas: 287, pesquisasRespondidas: 198,
    npsMedio: 78, notaInfra: 4.6, notaAtendimento: 4.8, notaAlimentacao: 4.4,
    notaOrganizacao: 4.7, intencaoRetorno: 92, intencaoIndicacao: 87,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <Badge variant="secondary" className="mb-3"><AlertTriangle className="w-3 h-3 mr-1" />{DEMO_BADGE}</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Showroom — Eventos & Ingressos</h1>
            <p className="text-muted-foreground mt-3 max-w-3xl">
              Demonstração interativa: <strong>Degustação Exclusiva — Cervejas Especiais & Harmonização</strong>.
              Configure regras de transferência de titular, simule alterações, dispare a pesquisa pós-evento e
              veja os dashboards de satisfação, presença e recorrência.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Button asChild className="bg-gradient-primary shadow-elegant">
                <Link to="/orcamento">Quero esse módulo no meu sistema <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button asChild variant="outline"><Link to="/modulos">Ver todos os módulos</Link></Button>
              <Button asChild className="bg-gradient-primary">
                <Link to="/demo/nicho/$slug" params={{ slug: "eventos" }}>
                  Abrir demo do nicho Eventos / WMP <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <Tabs defaultValue="config" className="space-y-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="config"><ClipboardCheck className="w-4 h-4 mr-1" /> Regras do evento</TabsTrigger>
              <TabsTrigger value="transfer"><ArrowLeftRight className="w-4 h-4 mr-1" /> Alterar titular</TabsTrigger>
              <TabsTrigger value="historico"><History className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
              <TabsTrigger value="pesquisa"><Star className="w-4 h-4 mr-1" /> Pesquisa pós-evento</TabsTrigger>
              <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard</TabsTrigger>
            </TabsList>

            {/* ============ REGRAS ============ */}
            <TabsContent value="config">
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold">Configuração de transferência de ingresso</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    A organização define se o ingresso pode ser transferido, até quando e se a troca exige aprovação manual.
                    Todas as alterações ficam registradas no histórico do ingresso.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <ToggleRow label="Permitir transferência de ingresso" value={permitirTransfer} onChange={setPermitirTransfer} />
                  <ToggleRow label="Permitir alteração pelo comprador" value={permitirComprador} onChange={setPermitirComprador} />
                  <ToggleRow label="Exigir aprovação da organização" value={exigirAprovacao} onChange={setExigirAprovacao} />
                  <ToggleRow label="Permitir apenas uma alteração" value={umaUnicaVez} onChange={setUmaUnicaVez} />
                  <ToggleRow label="Bloquear após check-in realizado" value={bloquearAposCheckin} onChange={setBloquearAposCheckin} />
                  <ToggleRow label="Motivo obrigatório na alteração" value={motivoObrigatorio} onChange={setMotivoObrigatorio} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label>Prazo limite para alteração</Label>
                    <Select value={prazoLimite} onValueChange={setPrazoLimite}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inicio">Até o início do evento</SelectItem>
                        <SelectItem value="1h">Até 1 hora antes</SelectItem>
                        <SelectItem value="6h">Até 6 horas antes</SelectItem>
                        <SelectItem value="12h">Até 12 horas antes</SelectItem>
                        <SelectItem value="24h">Até 24 horas antes</SelectItem>
                        <SelectItem value="48h">Até 48 horas antes</SelectItem>
                        <SelectItem value="7d">Até 7 dias antes</SelectItem>
                        <SelectItem value="custom">Prazo personalizado</SelectItem>
                        <SelectItem value="sem">Sem prazo definido</SelectItem>
                        <SelectItem value="nao">Não permitir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Quantidade máxima de alterações</Label>
                    <Input type="number" min={1} max={10} value={maxAlteracoes} onChange={(e) => setMaxAlteracoes(Number(e.target.value) || 1)} />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground border border-border">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Estado simulado do ingresso:{" "}
                  <button onClick={() => setCheckinFeito((v) => !v)} className="underline text-primary">
                    {checkinFeito ? "Check-in realizado" : "Aguardando check-in"} (clique para alternar)
                  </button>
                </div>
              </Card>
            </TabsContent>

            {/* ============ TRANSFERIR ============ */}
            <TabsContent value="transfer">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-primary" /> Alterar titular</h2>
                  {!podeAlterar.ok && (
                    <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {podeAlterar.msg}
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Nome completo do novo titular</Label>
                      <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Rafael Almeida" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>WhatsApp</Label>
                        <Input value={novoWhats} onChange={(e) => setNovoWhats(e.target.value)} placeholder="(21) 99999-0000" />
                      </div>
                      <div className="space-y-1">
                        <Label>E-mail</Label>
                        <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="rafael@email.com" />
                      </div>
                    </div>
                    {motivoObrigatorio && (
                      <div className="space-y-1">
                        <Label>Motivo da alteração</Label>
                        <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
                      </div>
                    )}
                    <Button onClick={transferir} disabled={!podeAlterar.ok} className="bg-gradient-primary shadow-elegant">
                      {exigirAprovacao ? "Solicitar alteração" : "Confirmar transferência"}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Status da titularidade</h3>
                  <div className="space-y-2">
                    {titulares.map((t, i) => (
                      <div key={i} className={`p-3 rounded-md border ${t.status === "atual" ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{t.nome}</div>
                            <div className="text-xs text-muted-foreground">{t.whatsapp} · {t.email || "—"}</div>
                          </div>
                          <Badge variant={t.status === "atual" ? "default" : "secondary"}>
                            {t.status === "atual" ? "Titular atual" : "Anterior"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Alterado em {t.data}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    O valor pago e o histórico financeiro original permanecem com o comprador inicial.
                    O novo titular passa a ser quem realiza o check-in e recebe a pesquisa pós-evento.
                  </p>
                </Card>
              </div>
            </TabsContent>

            {/* ============ HISTÓRICO ============ */}
            <TabsContent value="historico">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6 space-y-3">
                  <h2 className="text-xl font-bold">Histórico do ingresso</h2>
                  <ul className="space-y-2 text-sm">
                    <LinhaHist label="Comprador original" value="Marina Costa" />
                    <LinhaHist label="Data da compra" value="12/05/2026" />
                    <LinhaHist label="Valor pago" value="R$ 180,00" />
                    <LinhaHist label="Forma de pagamento" value="Pix" />
                    <LinhaHist label="Lote" value="2º lote — promocional" />
                    <LinhaHist label="Status do pagamento" value="Aprovado" />
                    <LinhaHist label="Titular atual" value={titulares.find((t) => t.status === "atual")?.nome ?? "—"} />
                    <LinhaHist label="Alterações de titular" value={String(alteracoesRealizadas)} />
                    <LinhaHist label="Check-in" value={checkinFeito ? "Realizado" : "Pendente"} />
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2">
                    O histórico do ingresso acompanha toda a jornada: compra, pagamento, titularidade,
                    transferência, check-in, presença e avaliação pós-evento.
                  </p>
                </Card>

                <Card className="p-6 space-y-3">
                  <h2 className="text-xl font-bold">Histórico do participante</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <KpiMini label="Eventos comprados" value="7" />
                    <KpiMini label="Eventos comparecidos" value="6" />
                    <KpiMini label="Total gasto" value="R$ 1.240" />
                    <KpiMini label="Ticket médio" value="R$ 177" />
                    <KpiMini label="Taxa de presença" value="86%" />
                    <KpiMini label="Nota média dada" value="4.7" />
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    Último evento: <strong>Festival Gastronômico — Mar/2026</strong> · Perfil: cervejas especiais, harmonização, gastronomia premium.
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["Comprador recorrente", "Alta satisfação", "Cervejas", "Respondeu pesquisa", "Indicou amigos"].map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* ============ PESQUISA ============ */}
            <TabsContent value="pesquisa">
              <Card className="p-6 space-y-5 max-w-3xl">
                <div>
                  <h2 className="text-xl font-bold">Pesquisa de avaliação do evento</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Obrigado por participar do nosso evento. Sua opinião nos ajuda a construir
                    experiências cada vez melhores. Leva menos de 2 minutos.
                  </p>
                </div>

                {enviada ? (
                  <div className="text-center py-10 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                    <h3 className="font-semibold">Obrigado pela sua avaliação!</h3>
                    <p className="text-sm text-muted-foreground">Sua opinião foi enviada para o dashboard da organização.</p>
                  </div>
                ) : (
                  <>
                    <CampoNota label="Como você avalia o evento de forma geral? (1 a 5)" value={notaGeral} onChange={setNotaGeral} max={5} />
                    <CampoNota label="De 0 a 10, qual a chance de indicar este evento? (NPS)" value={nps} onChange={setNps} max={10} />

                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <BlocoSecao titulo="Infraestrutura" itens={["Local", "Conforto", "Limpeza", "Som e iluminação"]} />
                      <BlocoSecao titulo="Atendimento" itens={["Recepção/Check-in", "Tempo de espera", "Cordialidade", "Clareza de informações"]} />
                      <BlocoSecao titulo="Alimentação e bebidas" itens={["Qualidade", "Variedade", "Tempo de serviço", "Custo-benefício"]} />
                      <BlocoSecao titulo="Experiência" itens={["Programação", "Cumprimento do prometido", "Recomendaria?", "Voltaria?"]} />
                    </div>

                    <div className="space-y-1">
                      <Label>O que mais gostou? O que podemos melhorar?</Label>
                      <Textarea rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} />
                    </div>

                    <Button onClick={() => { setEnviada(true); toast.success("Pesquisa enviada — dados consolidados no dashboard."); }} className="bg-gradient-primary shadow-elegant">
                      Enviar avaliação
                    </Button>
                  </>
                )}
                <p className="text-[11px] text-muted-foreground pt-2">
                  Comunicação preparada — integração com WhatsApp/E-mail depende de credenciais externas.
                </p>
              </Card>
            </TabsContent>

            {/* ============ DASHBOARD ============ */}
            <TabsContent value="dashboard">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Kpi label="Ingressos vendidos" value={dash.vendidos} icon={<Ticket className="w-4 h-4" />} />
                  <Kpi label="Receita total" value={`R$ ${dash.receita.toLocaleString("pt-BR")}`} icon={<TrendingUp className="w-4 h-4" />} />
                  <Kpi label="Check-ins" value={dash.checkins} icon={<ClipboardCheck className="w-4 h-4" />} />
                  <Kpi label="Taxa de presença" value={`${dash.taxaPresenca}%`} icon={<Users className="w-4 h-4" />} />
                  <Kpi label="Ingressos transferidos" value={dash.transferidos} icon={<ArrowLeftRight className="w-4 h-4" />} />
                  <Kpi label="Pesquisas respondidas" value={`${dash.pesquisasRespondidas}/${dash.pesquisasEnviadas}`} icon={<Star className="w-4 h-4" />} />
                  <Kpi label="NPS" value={dash.npsMedio} icon={<BarChart3 className="w-4 h-4" />} />
                  <Kpi label="Intenção de retorno" value={`${dash.intencaoRetorno}%`} icon={<Calendar className="w-4 h-4" />} />
                </div>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Notas médias por categoria</h3>
                  <div className="space-y-3">
                    <BarraNota label="Infraestrutura" valor={dash.notaInfra} />
                    <BarraNota label="Atendimento" valor={dash.notaAtendimento} />
                    <BarraNota label="Alimentação & bebidas" valor={dash.notaAlimentacao} />
                    <BarraNota label="Organização" valor={dash.notaOrganizacao} />
                  </div>
                </Card>

                <Card className="p-6 space-y-2">
                  <h3 className="font-semibold">Dashboard histórico da organizadora</h3>
                  <p className="text-sm text-muted-foreground">
                    Consolida todos os eventos realizados — receita por evento, ticket médio,
                    taxa de presença, eventos mais bem avaliados, NPS médio, participantes
                    recorrentes, canais com maior conversão e principais elogios/reclamações.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <KpiMini label="Eventos realizados" value="18" />
                    <KpiMini label="Participantes recorrentes" value="42%" />
                    <KpiMini label="Ticket médio" value="R$ 165" />
                    <KpiMini label="NPS médio" value="74" />
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-border">
      <Label className="text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function LinhaHist({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3 py-1 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon} {label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}

function CampoNota({ label, value, onChange, max }: { label: string; value: number; onChange: (n: number) => void; max: number }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: max + (max === 10 ? 1 : 0) }).map((_, i) => {
          const n = max === 10 ? i : i + 1;
          return (
            <button key={n} onClick={() => onChange(n)}
              className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors ${value === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlocoSecao({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div className="rounded-md border border-border p-3 space-y-1">
      <div className="font-semibold text-sm">{titulo}</div>
      <ul className="text-xs text-muted-foreground space-y-0.5">
        {itens.map((i) => <li key={i}>• {i}</li>)}
      </ul>
    </div>
  );
}

function BarraNota({ label, valor }: { label: string; valor: number }) {
  const pct = (valor / 5) * 100;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{valor.toFixed(1)} / 5</span></div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
