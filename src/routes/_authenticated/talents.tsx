import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/talents")({
  head: () => ({ meta: [{ title: "Banco de Talentos — Impulsionando" }] }),
  component: TalentsAdmin,
});

interface TalentRow {
  id: string;
  niche_slug: string;
  role: string;
  full_name: string;
  email: string;
  phone: string;
  state: string | null;
  city: string | null;
  availability: string;
  experience_years: string;
  specializations: string[];
  certifications: string[];
  languages: string[];
  resume_path: string | null;
  resume_filename: string | null;
  status: string;
  created_at: string;
}

const STATUS = ["new", "reviewing", "contacted", "approved", "rejected", "archived"];

function TalentsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["talent_applications"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("talent_applications" as never) as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as TalentRow[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from("talent_applications" as never) as any)
        .update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["talent_applications"] });
      toast.success("Status atualizado");
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  async function downloadResume(path: string | null, filename: string | null) {
    if (!path) return;
    const { data, error } = await supabase.storage.from("talent-resumes").createSignedUrl(path, 60);
    if (error) { toast.error("Não foi possível gerar link"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = filename ?? "curriculo";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  return (
    <div>
      <PageHeader title="Banco de Talentos" description="Candidaturas recebidas pelo site (todos os nichos)." />
      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidato</TableHead>
              <TableHead>Nicho / Cargo</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Currículo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}>Carregando…</TableCell></TableRow>}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">Nenhuma candidatura ainda.</TableCell></TableRow>
            )}
            {data?.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-medium">{t.full_name}</div>
                  <div className="text-xs text-muted-foreground">{t.email} · {t.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t.niche_slug}</Badge>
                  <div className="text-xs mt-1">{t.role}</div>
                </TableCell>
                <TableCell className="text-sm">{t.city ?? "—"}/{t.state ?? "—"}</TableCell>
                <TableCell className="text-xs max-w-xs">
                  <div><b>Exp:</b> {t.experience_years} · <b>Disp:</b> {t.availability}</div>
                  {t.specializations?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.specializations.slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                      {t.specializations.length > 4 && <span className="text-muted-foreground">+{t.specializations.length - 4}</span>}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {t.resume_path ? (
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadResume(t.resume_path, t.resume_filename)}>
                      <Download className="w-3 h-3" /> Baixar
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> sem arquivo</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select value={t.status} onValueChange={(v) => setStatus.mutate({ id: t.id, status: v })}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
