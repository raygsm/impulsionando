import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Check, ChevronsUpDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { listAdminHubTenants } from "@/lib/admin-menu.functions";
import { logImpersonation } from "@/lib/impersonation-audit.functions";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useCurrentUser } from "@/hooks/use-current-user";


export function TenantSwitcher() {
  const { data: me } = useCurrentUser();
  const isStaff = !!me?.isImpulsionandoStaff || !!me?.isSuperAdmin;
  const { isImpersonating, impersonatedCompanyId, impersonatedCompanyName, startImpersonation, stopImpersonation } =
    useImpersonation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const fn = useServerFn(listAdminHubTenants);
  const logFn = useServerFn(logImpersonation);

  async function safeLog(input: { targetCompanyId: string; targetCompanyName?: string | null; action: "start" | "stop"; reason?: string | null }) {
    try {
      await logFn({ data: { ...input, userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : null } } as any);
    } catch { /* non-blocking */ }
  }


  const query = useQuery({
    queryKey: ["admin-hub-tenants"],
    queryFn: () => fn({ data: {} } as any).catch(() => ({ tenants: [] })),
    enabled: open && isStaff,
    staleTime: 60_000,
  });

  const tenants = useMemo(() => {
    const list = (query.data?.tenants ?? []) as any[];
    if (!q.trim()) return list.slice(0, 50);
    const needle = q.toLowerCase();
    return list.filter((t) =>
      `${t.name} ${t.slug ?? ""}`.toLowerCase().includes(needle),
    ).slice(0, 50);
  }, [query.data, q]);

  if (!isStaff) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[220px]">
          <Building2 className="size-4 shrink-0" />
          <span className="truncate">
            {isImpersonating ? impersonatedCompanyName : "Tenant"}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-60 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <div className="p-2 border-b">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tenant…"
            className="h-8"
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {isImpersonating && (
            <button
              type="button"
              onClick={() => {
                if (impersonatedCompanyId) {
                  void safeLog({
                    targetCompanyId: impersonatedCompanyId,
                    targetCompanyName: impersonatedCompanyName,
                    action: "stop",
                  });
                }
                stopImpersonation();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive"
            >
              <LogOut className="size-4" /> Sair da impersonação
            </button>
          )}
          {query.isLoading && (
            <div className="px-3 py-4 text-sm text-muted-foreground">Carregando…</div>
          )}
          {!query.isLoading && tenants.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground">Nenhum tenant.</div>
          )}
          {tenants.map((t) => {
            const active = t.id === impersonatedCompanyId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const reason = typeof window !== "undefined"
                    ? window.prompt(`Motivo para impersonar ${t.name}? (opcional)`) ?? null
                    : null;
                  startImpersonation({ companyId: t.id, companyName: t.name });
                  void safeLog({
                    targetCompanyId: t.id,
                    targetCompanyName: t.name,
                    action: "start",
                    reason,
                  });
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              >
                <Building2 className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate text-left">{t.name}</span>
                {active && <Check className="size-4 text-primary" />}
              </button>
            );

          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
