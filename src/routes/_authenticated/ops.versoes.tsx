import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchVersionsRollout,
  setModuleRollout,
  type RolloutStage,
  type RolloutAudience,
} from "@/lib/ops-cockpits.functions";
import { RefreshCw, FileText, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ops/versoes")({
  head: () => ({
    meta: [
      { title: "Versões & Atualizações — Operações" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Erro: {error.message}</p>
        <button className="mt-2 text-xs underline" onClick={() => { reset(); router.invalidate(); }}>
          Tentar novamente
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Não encontrado.</div>,
  component: VersoesPage,
});

const STAGE_LABEL: Record<RolloutStage, string> = {
  sandbox: "Sandbox",
  rollout_5: "Rollout 5%",
  rollout_25: "Rollout 25%",
  rollout_100: "Rollout 100%",
  paused: "Pausado",
};

const STAGE_VARIANT: Record<RolloutStage, "default" | "secondary" | "destructive" | "outline"> = {
  sandbox: "secondary",
  rollout_5: "outline",
  rollout_25: "outline",
  rollout_100: "default",
  paused: "destructive",
};

const ALL_AUDIENCES: RolloutAudience[] = ["core", "white-label", "empresa", "consumidor"];

function VersoesPage() {
  const fn = useServerFn(fetchVersionsRollout);
  const { data, isLoading } = useQuery({
    queryKey: ["ops", "versoes", "rollout"],
    queryFn: () => fn({ data: {} }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Versões & Atualizações"
        description="Notas de release, controle de rollout e sandbox por audiência."
      />

      <Card className="p-3 text-xs text-muted-foreground">
        Pipeline: Sandbox → Rollout 5% → 25% → 100% → Backup automático.{" "}
        <Link to="/saiba-mais/versoes" className="underline">Ver detalhes</Link>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando catálogo…</p>
      ) : (
        <div className="space-y-3">
          {data?.modules.map((m) => (
            <ModuleCard key={m.moduleId} module={m} canEdit={!!data.staff} />
          ))}
        </div>
      )}
    </div>
  );
}

type ModuleData = NonNullable<ReturnType<typeof useFakeType>>;
function useFakeType() {
  // helper to derive type from server function; never called
  return null as unknown as Awaited<ReturnType<typeof fetchVersionsRollout>>["modules"][number];
}

function ModuleCard({ module: m, canEdit }: { module: ModuleData; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<RolloutStage>(m.rollout.stage);
  const [audiences, setAudiences] = useState<RolloutAudience[]>(m.rollout.audiences);
  const [notes, setNotes] = useState(m.rollout.notes);

  const qc = useQueryClient();
  const setFn = useServerFn(setModuleRollout);
  const mutation = useMutation({
    mutationFn: () =>
      setFn({ data: { moduleCode: m.code, stage, audiences, notes } }),
    onSuccess: () => {
      toast.success(`Rollout do módulo ${m.name} atualizado`);
      qc.invalidateQueries({ queryKey: ["ops", "versoes", "rollout"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar rollout"),
  });

  function toggleAudience(a: RolloutAudience) {
    setAudiences((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-sm font-semibold">{m.name}</h3>
          <p className="text-xs text-muted-foreground">{m.code} · v{m.latestVersion}</p>
        </div>
        <Badge variant={STAGE_VARIANT[m.rollout.stage]} className="gap-1">
          <Rocket className="h-3 w-3" /> {STAGE_LABEL[m.rollout.stage]}
        </Badge>
        {m.rollout.audiences.map((a) => (
          <Badge key={a} variant="outline" className="text-[10px] capitalize">{a}</Badge>
        ))}
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3" /> Configurar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rollout — {m.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Estágio</label>
                  <Select value={stage} onValueChange={(v) => setStage(v as RolloutStage)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAGE_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium">Audiências</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {ALL_AUDIENCES.map((a) => (
                      <label key={a} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={audiences.includes(a)}
                          onCheckedChange={() => toggleAudience(a)}
                        />
                        <span className="capitalize">{a}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Notas internas</label>
                  <Textarea
                    className="mt-1"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contexto, gates, rollback plan…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending || audiences.length === 0}
                >
                  {mutation.isPending ? "Salvando…" : "Salvar rollout"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {m.releaseNotes && (
        <div className="rounded border bg-muted/30 p-3 text-xs">
          <p className="mb-1 flex items-center gap-1 font-semibold">
            <FileText className="h-3 w-3" /> Release notes — v{m.latestVersion}
            {m.releasedAt && (
              <span className="ml-2 font-normal text-muted-foreground">
                ({new Date(m.releasedAt).toLocaleDateString("pt-BR")})
              </span>
            )}
          </p>
          <p className="whitespace-pre-wrap text-muted-foreground">{m.releaseNotes}</p>
        </div>
      )}

      {m.history.length > 1 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Histórico de versões ({m.history.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {m.history.map((v) => (
              <li key={v.version} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono">v{v.version}</span>
                  <span className="text-muted-foreground">
                    {v.releasedAt ? new Date(v.releasedAt).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </div>
                {v.notes && <p className="mt-1 text-muted-foreground">{v.notes}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {m.rollout.notes && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Notas de rollout:</span> {m.rollout.notes}
        </p>
      )}
    </Card>
  );
}
