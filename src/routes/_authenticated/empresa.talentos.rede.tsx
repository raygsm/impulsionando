import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/empresa/talentos/rede")({
  component: RedeTalentos,
});

const RAIOS = [5, 10, 20, 50, 100];

function RedeTalentos() {
  const [companyId, setCompanyId] = useState<string>("");
  const [participa, setParticipa] = useState(true);
  const [receberAuto, setReceberAuto] = useState(true);
  const [cidades, setCidades] = useState("");
  const [bairros, setBairros] = useState("");
  const [raio, setRaio] = useState(20);
  const [nicho, setNicho] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data: comp } = await sb.from("companies").select("id, niche").eq("owner_id", u.user.id).maybeSingle();
      if (!comp) return;
      setCompanyId(comp.id); setNicho(comp.niche ?? "");
      const { data: cfg } = await sb.from("talentos_company_settings").select("*").eq("company_id", comp.id).maybeSingle();
      if (cfg) {
        setParticipa(cfg.participa ?? true);
        setReceberAuto(cfg.receber_automatico ?? true);
        setCidades((cfg.cidades_interesse ?? []).join(", "));
        setBairros((cfg.bairros_interesse ?? []).join(", "));
        setRaio(cfg.raio_km ?? 20);
      }
    })();
  }, []);

  async function salvar() {
    if (!companyId) { toast.error("Empresa não encontrada"); return; }
    setLoading(true);
    const payload = {
      company_id: companyId, participa, receber_automatico: receberAuto, nicho,
      cidades_interesse: cidades.split(",").map((s) => s.trim()).filter(Boolean),
      bairros_interesse: bairros.split(",").map((s) => s.trim()).filter(Boolean),
      raio_km: raio,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("talentos_company_settings").upsert(payload, { onConflict: "company_id" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Configuração da Rede de Talentos salva");
  }

  return (
    <main className="min-h-dvh bg-background py-10">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Rede de Talentos</h1>
          <p className="text-muted-foreground">Configure como sua empresa recebe candidatos compatíveis.</p>
        </header>

        <Card>
          <CardHeader><CardTitle className="text-lg">Participação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Participar da Rede de Talentos" checked={participa} onChange={setParticipa} />
            <Toggle label="Receber candidatos automaticamente" checked={receberAuto} onChange={setReceberAuto} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Área de cobertura</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="cidades">Cidades de interesse (separe por vírgula)</Label>
              <Input id="cidades" value={cidades} onChange={(e) => setCidades(e.target.value)} placeholder="Rio de Janeiro, Niterói" />
            </div>
            <div>
              <Label htmlFor="bairros">Bairros de interesse (separe por vírgula)</Label>
              <Input id="bairros" value={bairros} onChange={(e) => setBairros(e.target.value)} placeholder="Copacabana, Ipanema" />
            </div>
            <div>
              <Label htmlFor="raio">Raio máximo (km)</Label>
              <Select value={String(raio)} onValueChange={(v) => setRaio(Number(v))}>
                <SelectTrigger id="raio" aria-label="Raio máximo"><SelectValue /></SelectTrigger>
                <SelectContent>{RAIOS.map((r) => <SelectItem key={r} value={String(r)}>{r} km</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button onClick={salvar} disabled={loading} size="lg" className="w-full">
          {loading ? "Salvando…" : "Salvar configuração"}
        </Button>
      </div>
    </main>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="flex-1">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
