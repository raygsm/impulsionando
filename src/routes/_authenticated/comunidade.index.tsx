import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { listCommunities, upsertCommunity } from "@/lib/community.functions";
import { Users, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/comunidade/")({
  head: () => ({ meta: [{ title: "Comunidades & Associações" }, { name: "robots", content: "noindex" }] }),
  component: CommList,
});

function CommList() {
  const { activeCompanyId } = useCompanyContext();
  const qc = useQueryClient();
  const list = useServerFn(listCommunities);
  const upsert = useServerFn(upsertCommunity);
  const { data } = useQuery({
    queryKey: ["comm_communities", activeCompanyId],
    queryFn: () => list({ data: { companyId: activeCompanyId! } }),
    enabled: !!activeCompanyId,
  });
  const [form, setForm] = useState({
    name: "", slug: "", kind: "comunidade" as const, monthlyFee: "",
  });
  const m = useMutation({
    mutationFn: () => upsert({
      data: {
        companyId: activeCompanyId!, name: form.name, slug: form.slug, kind: form.kind,
        monthlyFee: Number(form.monthlyFee || 0), acceptsDonations: true, isActive: true,
      },
    }),
    onSuccess: () => {
      toast.success("Comunidade criada");
      setForm({ name: "", slug: "", kind: "comunidade", monthlyFee: "" });
      qc.invalidateQueries({ queryKey: ["comm_communities"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!activeCompanyId) return <Card className="p-6">Selecione uma empresa.</Card>;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Comunidades, Associações e Clubes
        </h1>
        <p className="text-sm text-muted-foreground">Membros, mensalidades, presença e doações.</p>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Nova comunidade</h2>
        <div className="grid md:grid-cols-4 gap-2">
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
          <select className="border rounded-md p-2 text-sm bg-background" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}>
            <option value="comunidade">Comunidade</option>
            <option value="associacao">Associação</option>
            <option value="clube">Clube</option>
            <option value="igreja">Igreja</option>
            <option value="ong">ONG</option>
          </select>
          <Input placeholder="Mensalidade (R$)" type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
        </div>
        <Button onClick={() => m.mutate()} disabled={!form.name || !form.slug}>Criar</Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Mensalidade</th><th className="text-left p-3">Doações</th><th></th></tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3"><Badge variant="secondary">{c.kind}</Badge></td>
                <td className="p-3">R$ {Number(c.monthly_fee).toFixed(2)}</td>
                <td className="p-3">{c.accepts_donations ? "Sim" : "Não"}</td>
                <td className="p-3 text-right">
                  <Link to="/comunidade/$id" params={{ id: c.id }}>
                    <Button size="sm" variant="ghost"><ExternalLink className="w-4 h-4" /></Button>
                  </Link>
                </td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma comunidade ainda.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
