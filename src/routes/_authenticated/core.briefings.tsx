import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listBriefings, updateBriefingStatus } from "@/lib/core-integrations.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageElements";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/briefings")({
  head: () => ({ meta: [{ title: "Briefings Sob Medida" }, { name: "robots", content: "noindex" }] }),
  component: BriefingsPage,
});

const STATUS_LABEL: Record<string, string> = {
  new: "Novo", reviewing: "Em análise", quoted: "Proposta enviada",
  won: "Fechado", lost: "Perdido", archived: "Arquivado",
};

function BriefingsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listBriefings);
  const update = useServerFn(updateBriefingStatus);
  const { data } = useQuery({ queryKey: ["briefings"], queryFn: () => list(), refetchInterval: 15000 });
  const items: any[] = (data as any)?.items ?? [];
  const [open, setOpen] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: (input: { id: string; status: any; notes?: string }) => update({ data: input }),
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["briefings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Briefings Sob Medida"
        description={`${items.length} briefing(s) recebidos. Atualize o status e adicione notas internas para o time comercial.`}
      />
      <Card className="p-4">
        <div className="divide-y">
          {items.map((b) => {
            const isOpen = open === b.id;
            return (
              <div key={b.id} className="py-3">
                <button
                  className="w-full text-left flex items-center gap-3"
                  onClick={() => setOpen(isOpen ? null : b.id)}
                >
                  <Badge variant={b.status === "new" ? "default" : "outline"} className="text-[10px]">
                    {STATUS_LABEL[b.status] ?? b.status}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{b.company_name} · {b.contact_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {b.contact_email} · {b.contact_whatsapp} · {b.niche ?? "—"} · {b.budget_range ?? "sem orçamento"}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleString("pt-BR")}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 grid gap-3 pl-4 border-l-2 border-primary/30">
                    <Field label="Objetivos" value={b.goals} />
                    <Field label="Ferramentas atuais" value={b.current_tools} />
                    <Field label="Integrações necessárias" value={b.integrations_needed} />
                    <Field label="Equipe" value={b.team_size} />
                    <Field label="Urgência" value={b.urgency} />
                    <Field label="Módulos requeridos" value={(b.required_modules ?? []).join(", ")} />
                    <Field label="Notas adicionais do cliente" value={b.notes} />

                    <div className="flex items-end gap-2 mt-2">
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Status</div>
                        <Select
                          defaultValue={b.status}
                          onValueChange={(v) => mut.mutate({ id: b.id, status: v })}
                        >
                          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABEL).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <NotesField id={b.id} initial={b.notes ?? ""} onSave={(notes) => mut.mutate({ id: b.id, status: b.status, notes })} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!items.length && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum briefing recebido ainda. O formulário público está em <code>/contratar/sob-medida</code>.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{String(value)}</div>
    </div>
  );
}

function NotesField({ id, initial, onSave }: { id: string; initial: string; onSave: (n: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex-1 space-y-1">
      <div className="text-xs font-medium">Notas internas</div>
      <div className="flex gap-2">
        <Textarea value={v} onChange={(e) => setV(e.target.value)} rows={2} className="text-xs" />
        <Button size="sm" onClick={() => onSave(v)}>Salvar</Button>
      </div>
    </div>
  );
}
