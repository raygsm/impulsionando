import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2, Lock, Search, Sparkles, ShieldCheck, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  MOTHER_MODULES,
  MOTHER_MODULE_CATEGORIES,
  resolveSlug,
  type MotherModule,
} from "@/data/motherModules";

export const Route = createFileRoute("/_authenticated/modules")({
  head: () => ({
    meta: [
      { title: "Módulos & Contratação — Impulsionando" },
      {
        name: "description",
        content:
          "Visão consolidada dos módulos disponíveis, contratados e ativos para a empresa. Solicite a contratação de módulos adicionais.",
      },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const isSuper = !!me?.isSuperAdmin;
  const myCompanyId = me?.memberships?.[0]?.company_id ?? "";
  const [companyId, setCompanyId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");

  // Super admin: pode trocar empresa. Cliente: trava na própria.
  const { data: companies } = useQuery({
    queryKey: ["companies-opt"],
    enabled: isSuper,
    queryFn: async () => {
      const data =
        (await supabase.from("companies").select("id, name").order("name")).data ?? [];
      if (data.length && !companyId) setCompanyId(data[0].id);
      return data;
    },
  });

  const effectiveCompanyId = isSuper ? companyId : myCompanyId;

  const { data: dbModules } = useQuery({
    queryKey: ["modules"],
    queryFn: async () =>
      (await supabase.from("modules").select("*").order("sort_order")).data ?? [],
  });

  const { data: active } = useQuery({
    queryKey: ["company-modules", effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () =>
      (
        await supabase
          .from("company_modules")
          .select("module_id, is_enabled")
          .eq("company_id", effectiveCompanyId)
      ).data ?? [],
  });

  // Map DB modules by slug (já resolvendo aliases)
  const dbBySlug = useMemo(() => {
    const map = new Map<string, { id: string; slug: string; is_enabled?: boolean }>();
    (dbModules ?? []).forEach((m: any) => {
      const slug = resolveSlug(m.slug);
      map.set(slug, { id: m.id, slug });
    });
    return map;
  }, [dbModules]);

  const enabledByModuleId = useMemo(() => {
    const map = new Map<string, boolean>();
    (active ?? []).forEach((a: any) => map.set(a.module_id, a.is_enabled));
    return map;
  }, [active]);

  // Quais slugs estão contratados pela empresa ativa
  const contractedSlugs = useMemo(() => {
    const set = new Set<string>();
    (dbModules ?? []).forEach((m: any) => {
      const slug = resolveSlug(m.slug);
      const en = enabledByModuleId.get(m.id);
      if (en) set.add(slug);
    });
    return set;
  }, [dbModules, enabledByModuleId]);

  const toggle = useMutation({
    mutationFn: async ({ moduleId, enabled, slug }: { moduleId: string; enabled: boolean; slug: string }) => {
      const { error } = await supabase.from("company_modules").upsert(
        { company_id: effectiveCompanyId, module_id: moduleId, is_enabled: enabled },
        { onConflict: "company_id,module_id" },
      );
      if (error) throw error;
      // Registra no log de auditoria e checklist (best-effort)
      await supabase.from("audit_logs").insert({
        company_id: effectiveCompanyId,
        action: enabled ? "module_installed" : "module_uninstalled",
        entity: "module",
        entity_id: moduleId,
        details: { slug },
      } as never);
      if (enabled) {
        await supabase.from("onboarding_checklist").upsert(
          { company_id: effectiveCompanyId, item_key: "modules_activated", status: "done", completed_at: new Date().toISOString() },
          { onConflict: "company_id,item_key" },
        );
      }
    },
    onSuccess: () => {
      toast.success("Módulo atualizado");
      qc.invalidateQueries({ queryKey: ["company-modules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOTHER_MODULES.filter((m) => {
      if (category !== "Todas" && m.category !== category) return false;
      if (!q) return true;
      return (
        m.shortName.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.submodules.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const counts = useMemo(() => {
    const total = MOTHER_MODULES.length;
    const contracted = MOTHER_MODULES.filter((m) => contractedSlugs.has(m.slug)).length;
    return { total, contracted, locked: total - contracted };
  }, [contractedSlugs]);

  return (
    <TooltipProvider delayDuration={200}>
      <PageHeader
        title="Módulos & Contratação"
        description={
          isSuper
            ? "Ative ou desative módulos por empresa cliente. Cada slug do catálogo principal corresponde a um módulo da tabela modules."
            : "Veja os módulos do seu plano e solicite contratação dos demais. Tudo respeita seu contrato vigente."
        }
        action={
          isSuper ? (
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/planos">
                Ver planos <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )
        }
      />

      {/* Resumo */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Summary label="Módulos disponíveis" value={counts.total} hint="Catálogo da plataforma" />
        <Summary
          label="Contratados / ativos"
          value={counts.contracted}
          hint="Liberados para a empresa"
          accent
        />
        <Summary
          label="Não contratados"
          value={counts.locked}
          hint='Use "Solicitar contratação" para liberar'
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo, recurso ou termo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(["Todas", ...MOTHER_MODULE_CATEGORIES] as const).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((m) => {
          const dbEntry = dbBySlug.get(m.slug);
          const isContracted = contractedSlugs.has(m.slug);
          return (
            <ModuleAdminCard
              key={m.slug}
              module={m}
              isContracted={isContracted}
              isSuper={isSuper}
              canToggle={isSuper && !!dbEntry && !!effectiveCompanyId}
              onToggle={(enabled) =>
                dbEntry && toggle.mutate({ moduleId: dbEntry.id, enabled })
              }
            />
          );
        })}
        {visible.length === 0 && (
          <Card className="p-8 col-span-full text-center text-sm text-muted-foreground">
            Nenhum módulo encontrado para esses filtros.
          </Card>
        )}
      </div>

      <Card className="mt-8 p-6 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Como funciona o bloqueio:</strong> rotas dos módulos não contratados
            redirecionam para <Link to="/planos" className="underline">Planos</Link> via
            <code className="mx-1 px-1 py-0.5 rounded bg-muted">requiredModuleFor</code>
            no <em>AppShell</em>. Permissões de usuário e perfil continuam sendo aplicadas
            por cima desta camada.
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}

function Summary({
  label, value, hint, accent,
}: { label: string; value: number; hint: string; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </Card>
  );
}

function ModuleAdminCard({
  module: m,
  isContracted,
  isSuper,
  canToggle,
  onToggle,
}: {
  module: MotherModule;
  isContracted: boolean;
  isSuper: boolean;
  canToggle: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const Icon = m.icon;
  return (
    <Card className={`p-5 flex flex-col ${isContracted ? "border-primary/40" : ""}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isContracted
              ? "bg-gradient-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{m.shortName}</h3>
            {isContracted ? (
              <Badge className="bg-primary/15 text-primary border-primary/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Contratado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <Lock className="w-3 h-3 mr-1" /> Não contratado
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.tagline}</p>
        </div>
        {isSuper && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={isContracted}
                  disabled={!canToggle}
                  onCheckedChange={(v) => onToggle(v)}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {canToggle
                ? "Ativar/desativar módulo para a empresa selecionada."
                : "Selecione uma empresa e verifique se o slug existe no catálogo."}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {m.pitch}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {m.submodules.slice(0, 6).map((s) => (
          <span
            key={s}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
          >
            {s}
          </span>
        ))}
        {m.submodules.length > 6 && (
          <span className="text-[10px] text-muted-foreground">
            +{m.submodules.length - 6} recursos
          </span>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center gap-2">
        {isContracted ? (
          <Button asChild size="sm" className="bg-gradient-primary flex-1">
            <Link to="/dashboard">
              <Sparkles className="w-4 h-4 mr-1" /> Acessar módulo
            </Link>
          </Button>
        ) : isSuper ? (
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to="/modulos/$slug" params={{ slug: m.slug }}>
              Ver detalhes
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild size="sm" className="bg-gradient-primary flex-1">
              <Link to="/contato" search={{ modulo: m.slug } as never}>
                Solicitar contratação
              </Link>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="sm" variant="outline">
                  <Link to="/modulos/$slug" params={{ slug: m.slug }}>
                    Detalhes
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Ver descrição comercial completa, recursos e nichos onde o módulo brilha.
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </Card>
  );
}
