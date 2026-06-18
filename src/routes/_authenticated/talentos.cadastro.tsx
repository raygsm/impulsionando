import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/talentos/cadastro")({
  component: CadastroTalento,
});

const FAIXAS = ["18-25", "26-35", "36-45", "46-55", "56-65", "66-75", "76+"] as const;
const EXPERIENCIAS = ["Sem experiência", "Até 1 ano", "1 a 3 anos", "3 a 5 anos", "5 a 10 anos", "Mais de 10 anos"];
const ESCOLARIDADES = [
  "Fundamental incompleto","Fundamental completo","Médio incompleto","Médio completo",
  "Técnico em andamento","Técnico completo","Superior em andamento","Superior completo",
  "Pós-graduação em andamento","Pós-graduação completa","Mestrado","Doutorado",
];
const DISPO = ["Imediata", "Até 15 dias", "Até 30 dias", "Até 60 dias"];
const MODELOS = ["Presencial", "Híbrido", "Remoto", "Indiferente"];
const SALARIO = [
  "Até 1 salário mínimo","1 a 2 salários","2 a 3 salários","3 a 5 salários","5 a 10 salários","Acima de 10 salários",
];

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(8).max(20),
  cep: z.string().trim().min(8).max(9),
  cargo_desejado: z.string().trim().min(2).max(120),
});

function CadastroTalento() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "", email: "", whatsapp: "", cep: "",
    bairro: "", cidade: "", estado: "",
    foto_url: "", video_url: "",
    cargo_desejado: "", experiencia: EXPERIENCIAS[0],
    faixa_etaria: "26-35", escolaridade: ESCOLARIDADES[6],
    curso_superior: "", instituicao: "",
    cursando: "", cursando_instituicao: "", cursando_previsao: "",
    disponibilidade: DISPO[0], modelo_trabalho: MODELOS[0],
    pretensao_salarial: SALARIO[1],
    habilidades: "", idiomas: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const j = await r.json();
      if (!j.erro) setForm((f) => ({ ...f, bairro: j.bairro ?? "", cidade: j.localidade ?? "", estado: j.uf ?? "" }));
    } catch { /* noop */ }
  }

  async function uploadTo(bucket: string, file: File, userId: string) {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Faça login"); return; }
    try {
      const path = await uploadTo("talentos-fotos", f, u.user.id);
      setForm((s) => ({ ...s, foto_url: path }));
      toast.success("Foto enviada");
    } catch (err) { toast.error((err as Error).message); }
  }

  async function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast.error("Vídeo deve ter no máximo 50 MB"); return; }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    try {
      const path = await uploadTo("talentos-videos", f, u.user.id);
      setForm((s) => ({ ...s, video_url: path }));
      toast.success("Vídeo enviado");
    } catch (err) { toast.error((err as Error).message); }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos"); return; }
    if (!form.foto_url) { toast.error("Envie sua foto de perfil"); return; }

    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user_id = userRes.user?.id;
    if (!user_id) { toast.error("Faça login"); setLoading(false); return; }

    const payload = {
      ...form,
      user_id,
      habilidades: form.habilidades ? form.habilidades.split(",").map((s) => s.trim()).filter(Boolean) : [],
      idiomas: form.idiomas ? form.idiomas.split(",").map((s) => s.trim()).filter(Boolean) : [],
      cursando_previsao: form.cursando_previsao || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cand, error } = await (supabase as any)
      .from("talentos_candidatos").insert(payload).select("id").single();
    if (error) { setLoading(false); toast.error(error.message); return; }

    if (cvFile && cand?.id) {
      try {
        const path = await uploadTo("talentos-curriculos", cvFile, user_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("talentos_curriculos").insert({
          candidato_id: cand.id, arquivo_url: path,
          formato: cvFile.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
        });
      } catch (err) { toast.warning("Perfil criado, mas falha no currículo: " + (err as Error).message); }
    }

    setLoading(false);
    toast.success("Perfil criado! Empresas da sua região poderão te encontrar.");
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-dvh bg-background py-10">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold">Cadastro de Talento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Leva 2 a 3 minutos. Você controla quando estar visível.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
          <Card>
            <CardHeader><CardTitle className="text-lg">1. Identificação</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div><Label htmlFor="cep">CEP</Label>
                <Input id="cep" required value={form.cep}
                  onChange={(e) => { setForm({ ...form, cep: e.target.value }); lookupCep(e.target.value); }} /></div>
              <div className="text-sm text-muted-foreground self-end">
                {form.cidade ? `${form.bairro ? form.bairro + " · " : ""}${form.cidade}/${form.estado}` : "Cidade detectada pelo CEP"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">2. Foto de rosto</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="foto">Foto recente, sem óculos escuros e sem filtros</Label>
              <Input id="foto" type="file" accept="image/*" onChange={handleFoto} />
              {form.foto_url && <p className="mt-2 text-sm text-success">✓ Foto enviada</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">3. Perfil profissional</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="cargo">Cargo desejado</Label>
                <Input id="cargo" required placeholder="Ex.: Garçom, Recepcionista, Advogado"
                  value={form.cargo_desejado} onChange={(e) => setForm({ ...form, cargo_desejado: e.target.value })} /></div>
              <Field label="Experiência" id="exp" value={form.experiencia} options={EXPERIENCIAS} onChange={(v) => setForm({ ...form, experiencia: v })} />
              <Field label="Faixa etária" id="faixa" value={form.faixa_etaria} options={FAIXAS as unknown as string[]} onChange={(v) => setForm({ ...form, faixa_etaria: v })} />
              <Field label="Escolaridade" id="esc" value={form.escolaridade} options={ESCOLARIDADES} onChange={(v) => setForm({ ...form, escolaridade: v })} />
              <Field label="Disponibilidade" id="dispo" value={form.disponibilidade} options={DISPO} onChange={(v) => setForm({ ...form, disponibilidade: v })} />
              <Field label="Modelo de trabalho" id="modelo" value={form.modelo_trabalho} options={MODELOS} onChange={(v) => setForm({ ...form, modelo_trabalho: v })} />
              <Field label="Pretensão salarial" id="sal" value={form.pretensao_salarial} options={SALARIO} onChange={(v) => setForm({ ...form, pretensao_salarial: v })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">4. Formação</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="curso">Curso superior (se houver)</Label>
                <Input id="curso" value={form.curso_superior} onChange={(e) => setForm({ ...form, curso_superior: e.target.value })} /></div>
              <div><Label htmlFor="inst">Instituição</Label>
                <Input id="inst" value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} /></div>
              <div><Label htmlFor="cursando">Cursando atualmente</Label>
                <Input id="cursando" value={form.cursando} onChange={(e) => setForm({ ...form, cursando: e.target.value })} /></div>
              <div><Label htmlFor="cinst">Instituição (cursando)</Label>
                <Input id="cinst" value={form.cursando_instituicao} onChange={(e) => setForm({ ...form, cursando_instituicao: e.target.value })} /></div>
              <div><Label htmlFor="prev">Previsão de conclusão</Label>
                <Input id="prev" type="date" value={form.cursando_previsao} onChange={(e) => setForm({ ...form, cursando_previsao: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">5. Habilidades e idiomas</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div><Label htmlFor="hab">Habilidades (separe por vírgula)</Label>
                <Textarea id="hab" value={form.habilidades} onChange={(e) => setForm({ ...form, habilidades: e.target.value })} /></div>
              <div><Label htmlFor="idi">Idiomas (separe por vírgula)</Label>
                <Input id="idi" value={form.idiomas} onChange={(e) => setForm({ ...form, idiomas: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">6. Currículo (PDF ou DOCX)</CardTitle></CardHeader>
            <CardContent>
              <Input id="cv" type="file" accept=".pdf,.docx" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
              {cvFile && <p className="mt-2 text-sm text-muted-foreground">{cvFile.name}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">7. Vídeo opcional (até 60s)</CardTitle></CardHeader>
            <CardContent>
              <Label htmlFor="video">Conte brevemente quem você é e o que procura</Label>
              <Input id="video" type="file" accept="video/*" onChange={handleVideo} />
              {form.video_url && <p className="mt-2 text-sm text-success">✓ Vídeo enviado</p>}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Salvando…" : "Salvar perfil"}
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, id, value, options, onChange }: {
  label: string; id: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
