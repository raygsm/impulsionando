import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applyGlobalSetting, listClientsForGovernance } from "@/lib/governance.functions";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/parametros")({
  head: () => ({ meta: [{ title: "Parâmetros Globais — Core" }, { name: "robots", content: "noindex" }] }),
  component: ParametrosPage,
});

function ParametrosPage() {
  const apply = useServerFn(applyGlobalSetting);
  const listClients = useServerFn(listClientsForGovernance);
  const { data: clients } = useQuery({ queryKey: ["gov-clients"], queryFn: () => listClients() });

  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [valueType, setValueType] = useState<"text" | "number" | "boolean" | "json">("text");
  const [category, setCategory] = useState("geral");
  const [scope, setScope] = useState<"all" | "white_label" | "company">("all");
  const [targetId, setTargetId] = useState<string>("");
  const [segment, setSegment] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onApply() {
    if (!key.trim()) return toast.error("Informe a chave");
    setLoading(true);
    try {
      let parsed: any = value;
      if (valueType === "number") parsed = Number(value);
      else if (valueType === "boolean") parsed = value === "true";
      else if (valueType === "json") parsed = JSON.parse(value || "null");
      const res = await apply({
        data: {
          key: key.trim(),
          value: parsed,
          value_type: valueType,
          category,
          scope,
          target_id: scope === "company" ? targetId || null : null,
          segment_filter: scope === "white_label" ? segment || null : null,
        },
      });
      toast.success(`Aplicado em ${res.affected} cliente(s)`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aplicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Matriz Global de Parâmetros</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Aplique um parâmetro (valor padrão, texto padrão, flag) em todos os clientes, em um segmento (white-label) ou em um cliente específico.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Chave</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="ex: whatsapp_number" />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="geral" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={valueType} onValueChange={(v) => setValueType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="boolean">Booleano (true/false)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder='ex: "ativo" ou 30' />
          </div>

          <div>
            <Label>Escopo</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                <SelectItem value="white_label">Por segmento (white-label)</SelectItem>
                <SelectItem value="company">Cliente específico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === "company" && (
            <div>
              <Label>Cliente</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  {(clients?.companies ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {scope === "white_label" && (
            <div>
              <Label>Segmento</Label>
              <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="ex: clinica, academia" />
            </div>
          )}
        </div>

        <div className="mt-4">
          <Button onClick={onApply} disabled={loading}>
            {loading ? "Aplicando…" : "Aplicar parâmetro"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
