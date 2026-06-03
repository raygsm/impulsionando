import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — Impulsionando" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [companyId, setCompanyId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: "", value_type: "boolean" as "boolean" | "text" | "number", value: "" });

  const { data: companies } = useQuery({
    queryKey: ["companies-opt"],
    queryFn: async () => {
      const data = (await supabase.from("companies").select("id, name").order("name")).data ?? [];
      if (data.length && !companyId) setCompanyId(data[0].id);
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["company-settings", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("company_settings").select("*").eq("company_id", companyId).order("key")).data ?? [],
  });

  const upsert = useMutation({
    mutationFn: async (payload: { key: string; value_type: string; value: string | number | boolean | null }) => {
      const { error } = await supabase.from("company_settings").upsert(
        { company_id: companyId, key: payload.key, value_type: payload.value_type, value: payload.value },
        { onConflict: "company_id,key" }
      );
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Configuração salva"); qc.invalidateQueries({ queryKey: ["company-settings"] }); setOpen(false); setForm({ key: "", value_type: "boolean", value: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (key: string) => { const { error } = await supabase.from("company_settings").delete().eq("company_id", companyId).eq("key", key); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-settings"] }),
  });

  function parseValue(): string | number | boolean | null {
    if (form.value_type === "boolean") return form.value === "true";
    if (form.value_type === "number") return Number(form.value);
    return form.value;
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Parâmetros chave/valor por empresa. Expansão completa na Sprint 2."
        action={
          <div className="flex gap-2">
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>{companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-gradient-primary shadow-elegant"><Plus className="w-4 h-4 mr-2" />Nova configuração</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova configuração</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Chave</Label><Input placeholder="ex: white_label.enabled" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Tipo</Label>
                    <Select value={form.value_type} onValueChange={(v) => setForm({ ...form, value_type: v as typeof form.value_type, value: "" })}>
                      <SelectTrigger /><SelectContent>
                        <SelectItem value="boolean">SIM/NÃO</SelectItem>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Valor</Label>
                    {form.value_type === "boolean" ? (
                      <div className="flex items-center gap-3 border rounded-md p-3">
                        <Switch checked={form.value === "true"} onCheckedChange={(v) => setForm({ ...form, value: String(v) })} />
                        <span className="text-sm">{form.value === "true" ? "SIM" : "NÃO"}</span>
                      </div>
                    ) : (
                      <Input type={form.value_type === "number" ? "number" : "text"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button disabled={!form.key} onClick={() => upsert.mutate({ key: form.key, value_type: form.value_type, value: parseValue() })}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      {settings?.length === 0 ? (
        <EmptyState title="Nenhuma configuração definida" description="Crie a primeira configuração desta empresa." />
      ) : (
        <Card className="shadow-card divide-y">
          {settings?.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 gap-4">
              <div className="min-w-0">
                <div className="font-mono text-sm">{s.key}</div>
                <div className="text-xs text-muted-foreground">tipo: {s.value_type}</div>
              </div>
              <div className="text-sm font-medium flex items-center gap-3">
                <span>{typeof s.value === "boolean" ? (s.value ? "SIM" : "NÃO") : String(s.value ?? "—")}</span>
                {me?.isSuperAdmin && (
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.key)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
