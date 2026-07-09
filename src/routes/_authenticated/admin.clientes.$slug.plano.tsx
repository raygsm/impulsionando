import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Crown, Gift, Calendar, Settings2, Loader2, History, ShieldOff, CheckCircle2 } from "lucide-react";
import {
  getFullCourtesy,
  grantFullCourtesy,
  extendFullCourtesy,
  revokeFullCourtesy,
  convertFullCourtesy,
  setDefaultCourtesyDays,
} from "@/lib/courtesy.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/plano")({
  head: () => ({ meta: [{ title: "Plano e cortesia — Impulsionando" }] }),
  component: TenantPlanoTab,
});

// Onda 3.3 — Cortesia Full 30 dias.
// Wireado ao backend mínimo (courtesy.functions.ts + core_courtesy_events).
// Toda ação é restrita à equipe Impulsionando via RPC is_impulsionando_staff.
function TenantPlanoTab() {
  const { slug } = Route.useParams();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancel = false;
    supabase
      .from("companies")
      .select("id")
      .eq("subdomain", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        if (!data?.id) setNotFound(true);
        else setCompanyId(data.id);
      });
    return () => {
      cancel = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cliente <code>{slug}</code> não encontrado.
      </div>
    );
  }
  if (!companyId) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando plano do cliente…
      </div>
    );
  }
  return <PlanoBody companyId={companyId} slug={slug} />;
}

function PlanoBody({ companyId, slug }: { companyId: string; slug: string }) {
  const qc = useQueryClient();
  const fetcher = useServerFn(getFullCourtesy);
  const grant = useServerFn(grantFullCourtesy);
  const extend = useServerFn(extendFullCourtesy);
  const revoke = useServerFn(revokeFullCourtesy);
  const convert = useServerFn(convertFullCourtesy);
  const setDefault = useServerFn(setDefaultCourtesyDays);

  const { data, isLoading, error } = useQuery({
    queryKey: ["full-courtesy", companyId],
    queryFn: () => fetcher({ data: { companyId } }),
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["full-courtesy", companyId] });

  const grantMut = useMutation({
    mutationFn: (days?: number) => grant({ data: { companyId, days } }),
    onSuccess: () => {
      toast.success("Cortesia Full concedida.");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao conceder cortesia"),
  });
  const extendMut = useMutation({
    mutationFn: (extra: number) => extend({ data: { companyId, extraDays: extra } }),
    onSuccess: () => {
      toast.success("Cortesia estendida.");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao estender"),
  });
  const revokeMut = useMutation({
    mutationFn: (note?: string) => revoke({ data: { companyId, note } }),
    onSuccess: () => {
      toast.success("Cortesia revogada.");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao revogar"),
  });
  const convertMut = useMutation({
    mutationFn: (note?: string) => convert({ data: { companyId, note } }),
    onSuccess: () => {
      toast.success("Cortesia convertida em cobrança.");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao converter"),
  });
  const setDefaultMut = useMutation({
    mutationFn: (days: number) => setDefault({ data: { days } }),
    onSuccess: () => {
      toast.success("Padrão global atualizado.");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao atualizar padrão"),
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Consultando cortesia…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-6 text-sm text-destructive">
        {error instanceof Error ? error.message : "Falha ao consultar cortesia."}
      </div>
    );
  }

  const c = data.company;
  const daysLeft = data.daysLeft;
  const status = c.full_courtesy_status ?? "none";
  const statusMap: Record<string, { label: string; variant: "default" | "outline" | "destructive" | "secondary" }> = {
    none: { label: "Sem cortesia", variant: "outline" },
    active: { label: "Cortesia ativa", variant: "default" },
    converted: { label: "Convertida em cobrança", variant: "secondary" },
    expired: { label: "Expirada", variant: "outline" },
    revoked: { label: "Revogada", variant: "destructive" },
  };
  const badge = statusMap[status] ?? statusMap.none;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Crown className="h-5 w-5" /> Plano e cortesia
        </h2>
        <p className="text-sm text-muted-foreground">
          Plano Full em cortesia inicial e parametrização para <code>{slug}</code>.
        </p>
      </header>

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 text-primary p-2">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">
                Plano Full {status === "active" ? "— Cortesia inicial" : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                Padrão global: {data.defaultDays} dias · plano de referência:{" "}
                <code>{data.fullPlan?.name ?? "Full"}</code>
              </div>
            </div>
          </div>
          <Badge variant={badge.variant}>
            {badge.label}
            {status === "active" && daysLeft !== null ? ` · ${daysLeft} d restantes` : ""}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <Metric icon={<Gift className="h-4 w-4" />} label="Duração aplicada" value={c.full_courtesy_days ? `${c.full_courtesy_days} dias` : "—"} />
          <Metric icon={<Calendar className="h-4 w-4" />} label="Início" value={fmt(c.full_courtesy_started_at)} />
          <Metric icon={<Calendar className="h-4 w-4" />} label="Fim previsto" value={fmt(c.full_courtesy_ends_at)} />
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-3">
          {status === "active" ? (
            <>
              <Button size="sm" onClick={() => extendMut.mutate(30)} disabled={extendMut.isPending}>
                {extendMut.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Gift className="h-3.5 w-3.5 mr-1" />}
                Estender +30 dias
              </Button>
              <Button size="sm" variant="outline" onClick={() => extendMut.mutate(7)} disabled={extendMut.isPending}>
                +7 dias
              </Button>
              <Button size="sm" variant="secondary" onClick={() => convertMut.mutate(undefined)} disabled={convertMut.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Converter em cobrança
              </Button>
              <Button size="sm" variant="destructive" onClick={() => revokeMut.mutate(undefined)} disabled={revokeMut.isPending}>
                <ShieldOff className="h-3.5 w-3.5 mr-1" />
                Revogar
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => grantMut.mutate(undefined)} disabled={grantMut.isPending}>
              {grantMut.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Gift className="h-3.5 w-3.5 mr-1" />}
              Conceder cortesia Full ({data.defaultDays} dias)
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-3 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Settings2 className="h-4 w-4" /> Parametrização global
        </div>
        <p className="text-xs text-muted-foreground">
          Duração padrão da cortesia aplicada a novos clientes conectados ao Core. Ajustes aqui não
          alteram cortesias já concedidas.
        </p>
        <DefaultDaysForm
          current={data.defaultDays}
          pending={setDefaultMut.isPending}
          onSubmit={(d) => setDefaultMut.mutate(d)}
        />
      </Card>

      <Card className="p-6 space-y-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <History className="h-4 w-4" /> Histórico de cortesia
        </div>
        {data.events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.events.map((e: any) => (
              <li key={e.id} className="border-b last:border-0 py-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{e.event_type}</Badge>
                <span className="text-xs">
                  {e.previous_status ?? "—"} → <strong>{e.new_status ?? "—"}</strong>
                  {e.days ? ` · ${e.days}d` : ""}
                </span>
                {e.ends_at ? <span className="text-[11px] text-muted-foreground">até {fmt(e.ends_at)}</span> : null}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/clientes/$slug/financeiro" params={{ slug }}>Ir para Financeiro</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/clientes/$slug/mercado-pago" params={{ slug }}>Ir para Mercado Pago</Link>
        </Button>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function DefaultDaysForm({
  current,
  pending,
  onSubmit,
}: {
  current: number;
  pending: boolean;
  onSubmit: (days: number) => void;
}) {
  const [days, setDays] = useState<number>(current);
  useEffect(() => setDays(current), [current]);
  return (
    <form
      className="flex flex-wrap gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (days >= 1 && days <= 365) onSubmit(days);
      }}
    >
      <div>
        <label className="text-xs text-muted-foreground">Dias padrão</label>
        <Input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Number(e.target.value) || 0)}
          className="w-28"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || days === current || days < 1 || days > 365}>
        {pending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
        Salvar padrão
      </Button>
    </form>
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _KeepImport = Textarea; // reserva para futura nota; import mantido para lint estável
