import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Clock, Ban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/schedules")({
  head: () => ({ meta: [{ title: "Horários — Agenda" }] }),
  component: SchedulesPage,
});

const WD = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface Schedule { id: string; professional_id: string; weekday: number; start_time: string; end_time: string; is_active: boolean; }
interface Block { id: string; professional_id: string | null; starts_at: string; ends_at: string; reason: string | null; }
interface Pro { id: string; name: string; color: string; }

function SchedulesPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();

  const { data: pros } = useQuery({
    queryKey: ["agenda-pros-min", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("agenda_professionals").select("id,name,color").eq("company_id", companyId).eq("is_active", true).order("name")).data as Pro[] | null,
  });

  const [proId, setProId] = useState<string>("");
  const activePro = proId || pros?.[0]?.id || "";

  const { data: schedules } = useQuery({
    queryKey: ["agenda-schedules", activePro],
    enabled: !!activePro,
    queryFn: async () => (await supabase.from("agenda_schedules").select("*").eq("professional_id", activePro).order("weekday").order("start_time")).data as Schedule[],
  });

  const { data: blocks } = useQuery({
    queryKey: ["agenda-blocks", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("agenda_blocks").select("*").eq("company_id", companyId).order("starts_at", { ascending: false }).limit(100)).data as Block[],
  });

  // Schedule add form
  const [s, setS] = useState({ weekday: 1, start_time: "08:00", end_time: "18:00" });
  const addSchedule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_schedules").insert({
        company_id: companyId, professional_id: activePro,
        weekday: s.weekday, start_time: s.start_time, end_time: s.end_time,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Horário adicionado"); qc.invalidateQueries({ queryKey: ["agenda-schedules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delSchedule = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("agenda_schedules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-schedules"] }),
  });

  // Block form
  const [openBlock, setOpenBlock] = useState(false);
  const [b, setB] = useState({ professional_id: "__all__", starts_at: "", ends_at: "", reason: "" });
  const addBlock = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_blocks").insert({
        company_id: companyId,
        professional_id: b.professional_id === "__all__" ? null : b.professional_id,
        starts_at: b.starts_at, ends_at: b.ends_at, reason: b.reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio criado");
      qc.invalidateQueries({ queryKey: ["agenda-blocks"] });
      setOpenBlock(false); setB({ professional_id: "__all__", starts_at: "", ends_at: "", reason: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delBlock = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("agenda_blocks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-blocks"] }),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Horários & Bloqueios" description="Define a janela semanal dos profissionais e exceções pontuais."
        action={<CompanyPicker />} />

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly"><Clock className="w-3.5 h-3.5 mr-1" />Horários semanais</TabsTrigger>
          <TabsTrigger value="blocks"><Ban className="w-3.5 h-3.5 mr-1" />Bloqueios pontuais</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4 space-y-4">
          {!pros?.length && <div className="text-sm text-muted-foreground">Cadastre profissionais antes.</div>}
          {!!pros?.length && (
            <>
              <div className="flex items-end gap-3">
                <div className="w-64">
                  <Label>Profissional</Label>
                  <Select value={activePro} onValueChange={setProId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pros.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="shadow-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <Label>Dia</Label>
                    <Select value={String(s.weekday)} onValueChange={(v) => setS({ ...s, weekday: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WD.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Início</Label><Input type="time" value={s.start_time} onChange={(e) => setS({ ...s, start_time: e.target.value })} /></div>
                  <div><Label>Fim</Label><Input type="time" value={s.end_time} onChange={(e) => setS({ ...s, end_time: e.target.value })} /></div>
                  <Button className="self-end bg-gradient-primary shadow-elegant" onClick={() => addSchedule.mutate()}>
                    <Plus className="w-4 h-4 mr-1" />Adicionar
                  </Button>
                </div>

                <div className="divide-y">
                  {!schedules?.length && <div className="p-4 text-center text-sm text-muted-foreground">Sem horários cadastrados.</div>}
                  {schedules?.map((row) => (
                    <div key={row.id} className="py-2 flex items-center gap-3">
                      <div className="w-16 text-sm font-medium">{WD[row.weekday]}</div>
                      <div className="text-sm font-mono">{row.start_time.slice(0,5)} → {row.end_time.slice(0,5)}</div>
                      <div className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => delSchedule.mutate(row.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="blocks" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpenBlock(true)}>
              <Plus className="w-4 h-4 mr-1" />Novo bloqueio
            </Button>
          </div>
          <Card className="shadow-card divide-y">
            {!blocks?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</div>}
            {blocks?.map((row) => {
              const p = pros?.find((pp) => pp.id === row.professional_id);
              return (
                <div key={row.id} className="p-3 flex items-center gap-3">
                  <Ban className="w-4 h-4 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{p?.name ?? "Toda a empresa"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(row.starts_at).toLocaleString("pt-BR")} → {new Date(row.ends_at).toLocaleString("pt-BR")}
                      {row.reason && ` · ${row.reason}`}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => delBlock.mutate(row.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              );
            })}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openBlock} onOpenChange={setOpenBlock}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo bloqueio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Profissional</Label>
              <Select value={b.professional_id} onValueChange={(v) => setB({ ...b, professional_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toda a empresa</SelectItem>
                  {pros?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="datetime-local" value={b.starts_at} onChange={(e) => setB({ ...b, starts_at: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={b.ends_at} onChange={(e) => setB({ ...b, ends_at: e.target.value })} /></div>
            </div>
            <div><Label>Motivo</Label><Input value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} /></div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!b.starts_at || !b.ends_at || addBlock.isPending}
              onClick={() => addBlock.mutate()}>Criar bloqueio</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
