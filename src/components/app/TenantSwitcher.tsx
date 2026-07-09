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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listAdminHubTenants } from "@/lib/admin-menu.functions";
import { logImpersonation } from "@/lib/impersonation-audit.functions";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useCurrentUser } from "@/hooks/use-current-user";

type Tenant = { id: string; name: string; slug?: string | null };

export function TenantSwitcher() {
  const { data: me } = useCurrentUser();
  const isStaff = !!me?.isImpulsionandoStaff || !!me?.isSuperAdmin;
  const { isImpersonating, impersonatedCompanyId, impersonatedCompanyName, startImpersonation, stopImpersonation } =
    useImpersonation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<Tenant | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const fn = useServerFn(listAdminHubTenants);
  const logFn = useServerFn(logImpersonation);
  const queryClient = useQueryClient();

  async function safeLog(input: { targetCompanyId: string; targetCompanyName?: string | null; action: "start" | "stop"; reason?: string | null }) {
    try {
      await logFn({ data: { ...input, userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : null } } as any);
    } catch { /* non-blocking */ }
  }

  async function resetTenantScopedCache() {
    await queryClient.cancelQueries();
    queryClient.clear();
  }

  const query = useQuery({
    queryKey: ["admin-hub-tenants"],
    queryFn: () => fn({ data: {} } as any).catch(() => ({ tenants: [] })),
    enabled: open && isStaff,
    staleTime: 60_000,
  });

  const allTenants = (query.data?.tenants ?? []) as Tenant[];
  const filtered = useMemo(() => {
    if (!q.trim()) return allTenants;
    const needle = q.toLowerCase();
    return allTenants.filter((t) =>
      `${t.name} ${t.slug ?? ""}`.toLowerCase().includes(needle),
    );
  }, [allTenants, q]);
  const tenants = filtered.slice(0, 50);
  const truncated = filtered.length > tenants.length;

  if (!isStaff) return null;

  async function confirmImpersonation() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setReasonError("Informe um motivo (mínimo 3 caracteres).");
      return;
    }
    if (!pending) return;
    await resetTenantScopedCache();
    startImpersonation({ companyId: pending.id, companyName: pending.name });
    void safeLog({
      targetCompanyId: pending.id,
      targetCompanyName: pending.name,
      action: "start",
      reason: trimmed,
    });
    setPending(null);
    setReason("");
    setReasonError(null);
    setOpen(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 max-w-[220px] focus-ring transition-shadow"
            data-tenant-switcher-trigger
            aria-label={isImpersonating ? `Tenant: ${impersonatedCompanyName}` : "Selecionar tenant"}
          >
            <Building2 className="size-4 shrink-0" />
            <span className="truncate hidden xs:inline sm:inline">
              {isImpersonating ? impersonatedCompanyName : "Tenant"}
            </span>
            <ChevronsUpDown className="size-3.5 opacity-60 ml-auto hidden xs:inline sm:inline" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="end">
          <div className="p-2 border-b">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar tenant…"
              className="h-8"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {isImpersonating && (
              <button
                type="button"
                onClick={async () => {
                  if (impersonatedCompanyId) {
                    void safeLog({
                      targetCompanyId: impersonatedCompanyId,
                      targetCompanyName: impersonatedCompanyName,
                      action: "stop",
                    });
                  }
                  await resetTenantScopedCache();
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
                    setPending(t);
                    setReason("");
                    setReasonError(null);
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
            {truncated && (
              <div className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                Exibindo {tenants.length} de {filtered.length}. Refine a busca para ver mais.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={!!pending} onOpenChange={(v) => { if (!v) { setPending(null); setReason(""); setReasonError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonar {pending?.name}</DialogTitle>
            <DialogDescription>
              Informe o motivo desta impersonação. O registro ficará no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="imp-reason">Motivo (obrigatório)</Label>
            <Textarea
              id="imp-reason"
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(null); }}
              placeholder="Ex.: Ticket #1234 — investigar erro no checkout"
              rows={3}
              autoFocus
            />
            {reasonError && <p className="text-sm text-destructive">{reasonError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPending(null); setReason(""); setReasonError(null); }}>Cancelar</Button>
            <Button onClick={confirmImpersonation}>Iniciar impersonação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
