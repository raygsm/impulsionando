import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator, Users, FolderOpen, ClipboardList, CalendarClock, BellRing,
  FileText, MessageCircle, ListChecks, Wallet, FileSignature, Megaphone,
  BarChart3, Globe, AlertTriangle, ArrowRight, Building2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/cockpit")({
  head: () => ({
    meta: [{ title: "Cockpit Contábil — Impulsionando" }],
  }),
  component: ContabCockpit,
});

const MODULES = [
  { slug: "contab-clientes", name: "Clientes Contábeis", icon: Building2, route: "/contabilidade/clientes", required: true },
  { slug: "contab-crm", name: "CRM Contábil", icon: Users, route: "/crm/board", required: true },
  { slug: "contab-portal-cliente", name: "Portal do Cliente", icon: Globe, route: "/contabilidade/portal", required: true },
  { slug: "contab-documentos", name: "Documentos", icon: FolderOpen, route: "/contabilidade/documentos", required: true },
  { slug: "contab-calendario-fiscal", name: "Calendário Fiscal", icon: CalendarClock, route: "/contabilidade/calendario", required: true },
  { slug: "contab-cobranca-docs", name: "Cobrança Inteligente de Documentos", icon: BellRing, route: "/contabilidade/cobranca" },
  { slug: "contab-irpf", name: "Imposto de Renda PF", icon: FileText, route: "/contabilidade/irpf" },
  { slug: "contab-atendimento-wpp", name: "Atendimento WhatsApp", icon: MessageCircle, route: "/contabilidade/atendimento" },
  { slug: "contab-tarefas", name: "Tarefas", icon: ListChecks, route: "/contabilidade/tarefas" },
  { slug: "contab-bi", name: "BI Contábil", icon: BarChart3, route: "/contabilidade/relatorios" },
  { slug: "contab-financeiro", name: "Financeiro do Escritório", icon: Wallet, route: "/contabilidade/financeiro" },
  { slug: "contab-contratos-onboarding", name: "Contratos & Onboarding", icon: FileSignature, route: "/contabilidade/contratos" },
  { slug: "contab-comercial", name: "Comercial & Marketing", icon: Megaphone, route: "/contabilidade/comercial" },
];

function ContabCockpit() {
  const { companyId } = useActiveCompany();
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const { data: stats } = useQuery({
    queryKey: ["contab-cockpit-stats", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [c, dp, ou, od] = await Promise.all([
        supabase.from("contab_clients").select("id", { count: "exact", head: true }).eq("company_id", companyId!).eq("status", "active"),
        supabase.from("contab_documents").select("id", { count: "exact", head: true }).eq("company_id", companyId!).eq("status", "pending"),
        supabase.from("contab_obligations").select("id", { count: "exact", head: true }).eq("company_id", companyId!).neq("status", "paid").gte("due_date", today).lte("due_date", in7),
        supabase.from("contab_obligations").select("id", { count: "exact", head: true }).eq("company_id", companyId!).neq("status", "paid").lt("due_date", today),
      ]);
      return {
        clients: c.count ?? 0,
        docsPending: dp.count ?? 0,
        oblUpcoming: ou.count ?? 0,
        oblOverdue: od.count ?? 0,
      };
    },
  });

  return (
    <div>
      <PageHeader
        title="Cockpit Contábil"
        description="Camada inteligente para escritórios de contabilidade — relacionamento, documentos, prazos e atendimento. Complementar aos sistemas contábeis tradicionais."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Badge className="gap-1"><Calculator className="w-3 h-3" /> Nicho · Contabilidade</Badge>
          </div>
        }
      />

      <Card className="p-4 mb-6 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="flex gap-3">
          <BarChart3 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-emerald-900 dark:text-emerald-100">Nicho completo — pronto para instalação</p>
            <p className="text-emerald-800/80 dark:text-emerald-100/80 mt-1">
              Todos os 12 módulos do nicho Contabilidade Inteligente estão operacionais: clientes, documentos, obrigações, calendário fiscal, régua D-7/D-3/D-1/D0/D+5, portal do cliente, tarefas, atendimento WhatsApp por departamento, IRPF (14 etapas), financeiro do escritório, contratos/onboarding e BI gerencial. <strong>Complementa</strong> sistemas contábeis tradicionais (Domínio, Alterdata, Contmatic) com a camada de relacionamento e experiência.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clientes ativos" value={stats?.clients ?? "—"} icon={Users} accent />
        <StatCard label="Documentos pendentes" value={stats?.docsPending ?? "—"} icon={FolderOpen} />
        <StatCard label="Obrigações (7d)" value={stats?.oblUpcoming ?? "—"} icon={ClipboardList} />
        <StatCard label="Obrigações atrasadas" value={stats?.oblOverdue ?? "—"} hint={stats?.oblOverdue ? "Requer atenção" : undefined} icon={AlertTriangle} />
      </div>

      <h2 className="font-semibold mb-3">Módulos do nicho</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.slug} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">{m.name}</span>
                </div>
                {m.required && <Badge variant="outline" className="text-[10px]">Obrigatório</Badge>}
              </div>
              <code className="text-[10px] text-muted-foreground block mb-3">{m.slug}</code>
              <Button asChild variant="ghost" size="sm" className="w-full justify-between h-8">
                <Link to={m.route as never}>
                  Abrir <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-2">Roadmap entregue</h2>
        <ul className="text-sm space-y-1.5 text-muted-foreground">
          <li><strong className="text-foreground">B23</strong> — Fundação: catálogo de 12 módulos e cockpit central.</li>
          <li><strong className="text-foreground">B24</strong> — Tabelas operacionais e régua D-7/D-3/D-1/D0/D+5 automática.</li>
          <li><strong className="text-foreground">B25</strong> — Documentos (storage), obrigações e calendário fiscal.</li>
          <li><strong className="text-foreground">B26</strong> — Portal do cliente (token), tarefas e atendimento WhatsApp por departamento.</li>
          <li><strong className="text-foreground">B27</strong> — IRPF 14 etapas, financeiro do escritório, contratos/onboarding e BI gerencial.</li>
        </ul>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Preços e condições comerciais: consulte sempre o site oficial — <a href="https://impulsionando.com.br" target="_blank" rel="noopener" className="underline">impulsionando.com.br</a>.
      </p>
    </div>
  );
}
