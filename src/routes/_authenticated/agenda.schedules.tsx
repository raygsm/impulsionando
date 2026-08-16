import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { Plus, Trash2, Clock, Ban, Settings2, Save, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/schedules")({
  head: () => ({ meta: [{ title: "Agenda — Horários e parâmetros" }] }),
  component: SchedulesPage,
});

const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";
const WD = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface Schedule { id: string; professional_id: string; weekday: number; start_time: string; end_time: string; is_active: boolean; }
interface Block { id: string; professional_id: string | null; starts_at: string; ends_at: string; reason: string | null; }
interface Pro { id: string; name: string; color: string; }
interface OfferingConfig { id: string; slug: string; name: string; modality: string; duration_minutes: number; price_cents: number; active: boolean; display_order: number; }
interface AgendaConfig { company_id: string; shared_calendar: boolean; slot_grid_minutes: number; min_advance_minutes: number; offerings: OfferingConfig[]; }

function SchedulesPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const isChrismed = companyId === CHRISMED_COMPANY_ID;

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

  const { data: chrismedConfig, isLoading: configLoading } = useQuery({
    queryKey: ["chrismed-agenda-management-settings", companyId],
    enabled: isChrismed,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("chrismed_get_agenda_management_settings");
      if (error) throw error;
      return data as unknown as AgendaConfig;
    },
  });

  const [agendaDraft, setAgendaDraft] = useState<AgendaConfig | null>(null);
  useEffect(() => {
    if (chrismedConfig) setAgendaDraft(JSON.parse(JSON.stringify(chrismedConfig)) as AgendaConfig);
  }, [chrismedConfig]);

  const saveAgendaConfig = useMutation({
    mutationFn: async () => {
      if (!agendaDraft) return;
      const { error } = await supabase.rpc("chrismed_update_agenda_management_settings", {
        p_settings: {
          slot_grid_minutes: Number(agendaDraft.slot_grid_minutes),
          min_advance_minutes: Number(agendaDraft.min_advance_minutes),
          offerings: agendaDraft.offerings.map((o) => ({ id: o.id, duration_minutes: Number(o.duration_minutes), price_cents: Number(o.price_cents), active: Boolean(o.active) })),
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Parâmetros da agenda CHRISMED atualizados.");
      await qc.invalidateQueries({ queryKey: ["chrismed-agenda-management-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [s, setS] = useState({ weekday: 1, start_time: "08:00", end_time: "18:00" });
  const addSchedule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_schedules").insert({ company_id: companyId, professional_id: activePro, weekday: s.weekday, start_time: s.start_time, end_time: s.end_time });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Horário adicionado"); qc.invalidateQueries({ queryKey: ["agenda-schedules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delSchedule = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("agenda_schedules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-schedules"] }),
  });

  const [openBlock, setOpenBlock] = useState(false);
  const [b, setB] = useState({ professional_id: "__all__", starts_at: "", ends_at: "", reason: "" });
  const addBlock = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_blocks").insert({ company_id: companyId, professional_id: b.professional_id === "__all__" ? null : b.professional_id, starts_at: b.starts_at, ends_at: b.ends_at, reason: b.reason || null });
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
      <PageHeader title="Agenda — Horários, bloqueios e parâmetros" description="Gerencie a disponibilidade dos profissionais e, na CHRISMED, as regras da agenda única compartilhada entre todos os serviços." action={<CompanyPicker />} />

      {isChrismed && (
        <Card className="mb-5 border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div>
              <div className="font-semibold text-emerald-950">Agenda única por profissional</div>
              <p className="mt-1 text-sm leading-6 text-emerald-900">ASO, teleconsulta, consulta presencial, domiciliar e perícia disputam o mesmo tempo do médico. Qualquer reserva ou bloqueio ocupa o intervalo completo e impede sobreposição em todas as demais modalidades.</p>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue={isChrismed ? "parameters" : "weekly"}>
        <TabsList className="flex h-auto flex-wrap">
          {isChrismed && <TabsTrigger value="parameters"><Settings2 className="mr-1 h-3.5 w-3.5" />Parâmetros da agenda</TabsTrigger>}
          <TabsTrigger value="weekly"><Clock className="mr-1 h-3.5 w-3.5" />Horários semanais</TabsTrigger>
          <TabsTrigger value="blocks"><Ban className="mr-1 h-3.5 w-3.5" />Bloqueios pontuais</TabsTrigger>
        </TabsList>

        {isChrismed && (
          <TabsContent value="parameters" className="mt-4 space-y-4">
            {configLoading || !agendaDraft ? (
              <Card className="p-6 text-sm text-muted-foreground">Carregando parâmetros da agenda CHRISMED…</Card>
            ) : (
              <>
                <Card className="p-5">
                  <h2 className="text-lg font-semibold">Regras gerais</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Esses valores passam a valer imediatamente na consulta pública de disponibilidade e no backend de reserva.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Grade de início dos horários</Label>
                      <Select value={String(agendaDraft.slot_grid_minutes)} onValueChange={(v) => setAgendaDraft({ ...agendaDraft, slot_grid_minutes: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{[5,10,15,20,30,60].map((v) => <SelectItem key={v} value={String(v)}>A cada {v} minutos</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Antecedência mínima para reservar</Label>
                      <Input type="number" min={0} max={1440} value={agendaDraft.min_advance_minutes} onChange={(e) => setAgendaDraft({ ...agendaDraft, min_advance_minutes: Number(e.target.value) })} />
                      <p className="mt-1 text-xs text-muted-foreground">Em minutos. Ex.: 30 = não permitir agendamento para menos de 30 minutos a partir de agora.</p>
                    </div>
                  </div>
                </Card>

                <Card className="overflow-hidden">
                  <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">Serviços, duração e preço</h2>
                    <p className="mt-1 text-sm text-muted-foreground">A duração define o bloqueio real da agenda compartilhada. O preço é utilizado pelo checkout oficial.</p>
                  </div>
                  <div className="divide-y">
                    {agendaDraft.offerings.map((offering, index) => (
                      <div key={offering.id} className="grid gap-4 p-5 md:grid-cols-[1.5fr_160px_180px_120px] md:items-end">
                        <div>
                          <div className="font-medium">{offering.name}</div>
                          <div className="text-xs text-muted-foreground">{offering.modality} · {offering.slug}</div>
                        </div>
                        <div>
                          <Label>Duração (min)</Label>
                          <Input type="number" min={5} max={240} step={5} value={offering.duration_minutes} onChange={(e) => {
                            const offerings = [...agendaDraft.offerings];
                            offerings[index] = { ...offerings[index], duration_minutes: Number(e.target.value) };
                            setAgendaDraft({ ...agendaDraft, offerings });
                          }} />
                        </div>
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input type="number" min={0} step="0.01" value={(offering.price_cents / 100).toFixed(2)} onChange={(e) => {
                            const offerings = [...agendaDraft.offerings];
                            offerings[index] = { ...offerings[index], price_cents: Math.round(Number(e.target.value || 0) * 100) };
                            setAgendaDraft({ ...agendaDraft, offerings });
                          }} />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select value={offering.active ? "active" : "inactive"} onValueChange={(v) => {
                            const offerings = [...agendaDraft.offerings];
                            offerings[index] = { ...offerings[index], active: v === "active" };
                            setAgendaDraft({ ...agendaDraft, offerings });
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-amber-200 bg-amber-50 p-5">
                  <h2 className="font-semibold text-amber-950">Checkout e bloqueio temporário</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-900">Ao iniciar o checkout, o horário fica reservado temporariamente por 90 segundos. A reserva definitiva só ocorre após o pagamento aprovado. Se o pagamento não for concluído nesse prazo, o horário volta à agenda e o contato pode entrar na jornada de recuperação de abandono.</p>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => saveAgendaConfig.mutate()} disabled={saveAgendaConfig.isPending} className="bg-gradient-primary shadow-elegant"><Save className="mr-2 h-4 w-4" />Salvar parâmetros</Button>
                </div>
              </>
            )}
          </TabsContent>
        )}

        <TabsContent value="weekly" className="mt-4 space-y-4">
          {!pros?.length && <div className="text-sm text-muted-foreground">Cadastre profissionais antes.</div>}
          {!!pros?.length && (
            <>
              <div className="flex items-end gap-3"><div className="w-64"><Label>Profissional</Label><Select value={activePro} onValueChange={setProId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{pros.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div></div>
              <Card className="shadow-card p-4">
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div><Label>Dia</Label><Select value={String(s.weekday)} onValueChange={(v) => setS({ ...s, weekday: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WD.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Início</Label><Input type="time" value={s.start_time} onChange={(e) => setS({ ...s, start_time: e.target.value })} /></div>
                  <div><Label>Fim</Label><Input type="time" value={s.end_time} onChange={(e) => setS({ ...s, end_time: e.target.value })} /></div>
                  <Button className="self-end bg-gradient-primary shadow-elegant" onClick={() => addSchedule.mutate()}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
                </div>
                <div className="divide-y">{!schedules?.length && <div className="p-4 text-center text-sm text-muted-foreground">Sem horários cadastrados.</div>}{schedules?.map((row) => <div key={row.id} className="flex items-center gap-3 py-2"><div className="w-16 text-sm font-medium">{WD[row.weekday]}</div><div className="font-mono text-sm">{row.start_time.slice(0,5)} → {row.end_time.slice(0,5)}</div><div className="flex-1" /><Button size="sm" variant="ghost" onClick={() => delSchedule.mutate(row.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>)}</div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="blocks" className="mt-4">
          <div className="mb-3 flex justify-end"><Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpenBlock(true)}><Plus className="mr-1 h-4 w-4" />Novo bloqueio</Button></div>
          <Card className="shadow-card divide-y">{!blocks?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</div>}{blocks?.map((row) => { const p = pros?.find((pp) => pp.id === row.professional_id); return <div key={row.id} className="flex items-center gap-3 p-3"><Ban className="h-4 w-4 text-red-500" /><div className="min-w-0 flex-1"><div className="text-sm font-medium">{p?.name ?? "Toda a empresa"}</div><div className="text-xs text-muted-foreground">{new Date(row.starts_at).toLocaleString("pt-BR")} → {new Date(row.ends_at).toLocaleString("pt-BR")}{row.reason && ` · ${row.reason}`}</div></div><Button size="sm" variant="ghost" onClick={() => delBlock.mutate(row.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>; })}</Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openBlock} onOpenChange={setOpenBlock}>
        <DialogContent><DialogHeader><DialogTitle>Novo bloqueio</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Profissional</Label><Select value={b.professional_id} onValueChange={(v) => setB({ ...b, professional_id: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">Toda a empresa</SelectItem>{pros?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div><Label>Início</Label><Input type="datetime-local" value={b.starts_at} onChange={(e) => setB({ ...b, starts_at: e.target.value })} /></div><div><Label>Fim</Label><Input type="datetime-local" value={b.ends_at} onChange={(e) => setB({ ...b, ends_at: e.target.value })} /></div></div><div><Label>Motivo</Label><Input value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} /></div><Button className="w-full bg-gradient-primary shadow-elegant" disabled={!b.starts_at || !b.ends_at || addBlock.isPending} onClick={() => addBlock.mutate()}>Criar bloqueio</Button></div></DialogContent>
      </Dialog>
    </div>
  );
}
