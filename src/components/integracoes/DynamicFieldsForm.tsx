import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationField } from "@/data/integracoes-catalog";

/**
 * Renderiza os campos declarados por integração.
 * Não valida nem envia — apenas visual.
 */
export function DynamicFieldsForm({ fields }: { fields: IntegrationField[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.id} className="space-y-1.5">
          <Label htmlFor={f.id} className="text-xs font-medium">
            {f.label}
            {f.optional && <span className="ml-1 text-muted-foreground">(opcional)</span>}
          </Label>
          <Input
            id={f.id}
            type={f.type === "password" ? "password" : f.type === "url" ? "url" : "text"}
            placeholder={f.placeholder}
            autoComplete="off"
          />
          {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
        </div>
      ))}
    </div>
  );
}
