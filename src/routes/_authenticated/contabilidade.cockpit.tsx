import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useContabMetrics } from "@/hooks/use-contab-metrics";
import { useContabWhiteLabel } from "@/hooks/use-contab-whitelabel";
import { seedHorizonteDemo, purgeHorizonteDemo } from "@/lib/contab-demo";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calculator, Users, FolderOpen, ClipboardList, CalendarClock, BellRing,
  FileText, MessageCircle, ListChecks, Wallet, FileSignature, Megaphone,
  BarChart3, Globe, AlertTriangle, ArrowRight, Building2, Database,
  Sparkles, Trash2, Palette,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit Contábil — Impulsionando" }] }),
  component: ContabCockpit,
});

const MODULES = [
  { slug: "contab-clientes", name: "Clientes Contábeis", icon: Building2, route: "/contabilidade/clientes", required: true },
  { slug: "contab-crm", name: "CRM Contábil", icon: Users, route: "/crm/board", required: true },
  { slug: "contab-portal-cliente", name: "Portal do Cliente", icon: Globe, route: "/contabilidade/portal", required: true },
  { slug: "contab-documentos", name: "Documentos", icon: FolderOpen, route: "/contabilidade/documentos", required: true },
  { slug: "contab-calendario-fiscal", name: "Calendário Fiscal", icon: CalendarClock, route: "/contabilidade/calendario", required: true },
  { slug: "contab-cobranca-docs", name: "Cobrança Inteligente", icon: BellRing, route: "/contabilidade/obrigacoes" },
  { slug: "contab-irpf", name: "Imposto de Renda PF", icon: FileText, route: "/contabilidade/irpf" },
  { slug: "contab-atendimento-wpp", name: "Atendimento WhatsApp", icon: MessageCircle, route: "/contabilidade/atendimento" },
  { slug: "contab-tarefas", name: "Tarefas", icon: ListChecks, route: "/contabilidade/tarefas" },
  { slug: "contab-bi", name: "BI Contábil", icon: BarChart3, route: "/contabilidade/relatorios" },
  { slug: "contab-financeiro", name: "Financeiro do Escritório", icon: Wallet, route: "/contabilidade/financeiro" },
  { slug: "contab-contratos-onboarding", name: "Contratos & Onboarding", icon: FileSignature, route: "/contabilidade/contratos" },
  { slug: "contab-comercial", name: "Comercial & Marketing", icon: Megaphone, route: "/contabilidade/relatorios" },
];

function ContabCockpit() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const { config: wl, update: updateWl, reset: resetWl } = useContabWhiteLabel();
  const { metrics, dataStatus, isLoading } = useContabMetrics(companyId);
  const [wlOpen, setWlOpen] = useState(false);
  const [busy, setBusy] = useState<"seed" | "purge" | null>(null);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["contab-metrics"] });
    qc.invalidateQueries({ queryKey: ["contab-clients-list"] });
    qc.invalidateQueries({ queryKey: ["contab-clients-min"] });
  };

  const handleSeed = async () => {
    if (!companyId) return;
    setBusy("seed");
    try {
      const r = await seedHorizonteDemo(companyId);
      toast.success(`Demo carregada: ${r.clients} clientes fictícios`);
      invalidateAll();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(null); }
  };
  const handlePurge = async () => {
    if (!companyId) return;
    if (!confirm("Remover todos os dados de demo (Contabilidade Horizonte)?")) return;
    setBusy("purge");
    try {
      await purgeHorizonteDemo(companyId);
      toast.success("Dados de demo removidos");
      invalidateAll();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(null); }
  };

  return (
    <div>
      <PageHeader
        title={wl.enabled ? wl.brandName : "Cockpit Contábil"}
        description={wl.enabled ? wl.tagline : "Camada inteligente para escritórios — relacionamento, documentos, prazos e atendimento."}
        action={
          <div className="flex gap-2 items-center flex-wrap">
            <CompanyPicker />
            {wl.enabled ? (
              <Badge style={{ backgroundColor: wl.primaryColor, color: "white" }} className="gap-1">
                <Palette className="w-3 h-3" /> {wl.logoText}
              </Badge>
            ) : (
              <Badge className="gap-1"><Calculator className="w-3 h-3" /> Nicho · Contabilidade</Badge>
            )}
          </div>
        }
      />

      {/* Painel de demo + white-label */}
      <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">Demo "Contabilidade Horizonte" & White-label</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Carregue 5 clientes fictícios (Pão Dourado, Sorriso Saudável, TechWave, Boutique Estilo, Bom Preço) com obrigações, IRPF, financeiro e contratos. Toggle de white-label aplica branding customizado.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-2">
              <Switch checked={wl.enabled} onCheckedChange={(v) => updateWl({ enabled: v })} />
              <span className="text-xs">White-label</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setWlOpen(true)}>
              <Palette className="w-3.5 h-3.5 mr-1" /> Configurar marca
            </Button>
            <Button size="sm" onClick={handleSeed} disabled={!companyId || busy === "seed"} className="bg-gradient-primary shadow-elegant">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> {busy === "seed" ? "Carregando…" : "Carregar demo"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handlePurge} disabled={!companyId || busy === "purge"}>
              <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" /> Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Status de dados — mesma fonte do BI */}
      <Card className="p-3 mb-6 flex items-center gap-3 flex-wrap text-xs">
        <Badge variant="outline" className="gap-1">
          <Database className="w-3 h-3" /> Fonte única (contab_*)
        </Badge>
        {isLoading ? <span className="text-muted-foreground">Carregando…</span> : (
          <>
            <span><strong>{dataStatus.counts?.clients ?? 0}</strong> clientes</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.docs ?? 0}</strong> documentos</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.obls ?? 0}</strong> obrigações</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.tasks ?? 0}</strong> tarefas</span>
            <span>·</span>
            <span><strong>{dataStatus.counts?.finance ?? 0}</strong> financeiros</span>
            <Badge variant={dataStatus.hasData ? "default" : "secondary"} className="ml-auto">
              {dataStatus.hasData ? "Ativo" : "Sem dados"}
            </Badge>
          </>
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clientes ativos" value={metrics?.active ?? "—"} icon={Users} accent />
        <StatCard label="Documentos pendentes" value={metrics?.docsPending ?? "—"} icon={FolderOpen} />
        <StatCard label="Obrigações (7d)" value={metrics?.oblUpcoming7 ?? "—"} icon={ClipboardList} />
        <StatCard label="Obrigações atrasadas" value={metrics?.oblOverdue ?? "—"} hint={metrics?.oblOverdue ? "Requer atenção" : undefined} icon={AlertTriangle} />
      </div>

      <h2 className="font-semibold mb-3">Módulos do nicho</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.slug} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" style={wl.enabled ? { color: wl.primaryColor } : undefined} />
                  <span className="font-medium text-sm">{m.name}</span>
                </div>
                {m.required && <Badge variant="outline" className="text-[10px]">Obrigatório</Badge>}
              </div>
              <code className="text-[10px] text-muted-foreground block mb-3">{m.slug}</code>
              <Button asChild variant="ghost" size="sm" className="w-full justify-between h-8">
                <Link to={m.route as never}>Abrir <ArrowRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-2">Roadmap entregue</h2>
        <ul className="text-sm space-y-1.5 text-muted-foreground">
          <li><strong className="text-foreground">B23</strong> — Fundação e cockpit central.</li>
          <li><strong className="text-foreground">B24</strong> — Tabelas operacionais + régua D-7/D-3/D-1/D0/D+5.</li>
          <li><strong className="text-foreground">B25</strong> — Documentos (storage), obrigações e calendário fiscal.</li>
          <li><strong className="text-foreground">B26</strong> — Portal do cliente, tarefas e atendimento por departamento.</li>
          <li><strong className="text-foreground">B27</strong> — IRPF 14 etapas, financeiro, contratos, BI gerencial, demo "Horizonte" e white-label.</li>
        </ul>
      </Card>

      <Dialog open={wlOpen} onOpenChange={setWlOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar marca (white-label)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded border p-3">
              <div>
                <Label>Ativar white-label</Label>
                <p className="text-xs text-muted-foreground">Aplica nome, cor e logo na cockpit, BI e PDFs.</p>
              </div>
              <Switch checked={wl.enabled} onCheckedChange={(v) => updateWl({ enabled: v })} />
            </div>
            <div><Label>Nome da marca</Label>
              <Input value={wl.brandName} onChange={(e) => updateWl({ brandName: e.target.value })} />
            </div>
            <div><Label>Tagline</Label>
              <Input value={wl.tagline} onChange={(e) => updateWl({ tagline: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Iniciais (logo)</Label>
                <Input value={wl.logoText} maxLength={4} onChange={(e) => updateWl({ logoText: e.target.value })} />
              </div>
              <div><Label>Cor primária</Label>
                <div className="flex gap-2">
                  <Input type="color" value={wl.primaryColor} className="w-14 p-1"
                    onChange={(e) => updateWl({ primaryColor: e.target.value })} />
                  <Input value={wl.primaryColor} onChange={(e) => updateWl({ primaryColor: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="rounded border p-3 flex items-center gap-3" style={{ backgroundColor: wl.primaryColor + "12" }}>
              <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: wl.primaryColor }}>{wl.logoText}</div>
              <div>
                <div className="font-medium">{wl.brandName}</div>
                <div className="text-xs text-muted-foreground">{wl.tagline}</div>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={resetWl}>Restaurar padrão</Button>
              <Button size="sm" onClick={() => { setWlOpen(false); toast.success("Configuração salva"); }}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Métricas exibidas vêm da mesma fonte (<code>useContabMetrics</code>) consumida pelo BI — sem divergências.
      </p>
    </div>
  );
}
