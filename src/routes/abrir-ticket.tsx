import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, LifeBuoy, Loader2, Sparkles, Layers, Compass } from "lucide-react";
import { toast } from "sonner";

const TIPOS = [
  { value: "question", label: "Dúvida geral" },
  { value: "technical", label: "Problema técnico" },
  { value: "financial", label: "Financeiro / pagamento" },
  { value: "commercial", label: "Comercial / contratação" },
  { value: "suggestion", label: "Sugestão / melhoria" },
  { value: "other", label: "Outro" },
] as const;

const PRIORIDADES = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
] as const;

function PageContent() {
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "",
    description: "", type: "question", priority: "medium",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/public/support/create-ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          page: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "erro");
      setProtocol(j.protocol);
      toast.success(`Ticket aberto: ${j.protocol}`);
    } catch (err: any) {
      toast.error("Não conseguimos abrir o ticket. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (protocol) {
    return (
      <Card className="max-w-xl mx-auto mt-12">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-2" />
          <CardTitle>Ticket registrado</CardTitle>
          <CardDescription>Anote seu protocolo. Você receberá retorno por e-mail.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-2xl font-mono font-semibold tracking-wider bg-muted py-3 rounded-lg">
            {protocol}
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => { setProtocol(null); setForm({ name: "", email: "", phone: "", subject: "", description: "", type: "question", priority: "medium" }); }} variant="outline">
              Abrir outro
            </Button>
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-primary" />
          <CardTitle>Central de suporte</CardTitle>
        </div>
        <CardDescription>
          Fale com nosso time. Retornamos por e-mail em até 1 dia útil. Para urgências, use o WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome*</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">E-mail*</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp (opcional)</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="subject">Assunto*</Label>
              <Input id="subject" required minLength={4} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descreva sua situação*</Label>
              <Textarea id="description" required minLength={10} rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : "Abrir ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SuportePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8 pb-24">
        <PageContent />
      </main>
    </div>
  );
}

export const Route = createFileRoute("/abrir-ticket")({
  head: () => ({
    meta: [
      { title: "Suporte | Impulsionando" },
      { name: "description", content: "Abra um ticket com nosso time de suporte. Resposta em até 1 dia útil." },
    ],
  }),
  component: SuportePage,
});
