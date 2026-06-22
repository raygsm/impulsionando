import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type BODocKind = "ci" | "ci_ext" | "nit" | "passport" | "other";

export interface BODocValue {
  kind: BODocKind;
  number: string;
  complement?: string;
}

const LABELS: Record<BODocKind, string> = {
  ci: "Cédula de Identidad (CI)",
  ci_ext: "CI Extranjería",
  nit: "NIT",
  passport: "Pasaporte",
  other: "Outro",
};

export function DocumentBO({
  value,
  onChange,
}: {
  value?: BODocValue;
  onChange: (v: BODocValue) => void;
}) {
  const v: BODocValue = value ?? { kind: "ci", number: "" };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <Label>Tipo</Label>
        <Select value={v.kind} onValueChange={(k) => onChange({ ...v, kind: k as BODocKind })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(LABELS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Número</Label>
        <Input
          value={v.number}
          onChange={(e) => onChange({ ...v, number: e.target.value.replace(/[^0-9A-Za-z-]/g, "") })}
          placeholder={v.kind === "nit" ? "1234567019" : "1234567"}
        />
      </div>
      <div>
        <Label>Complemento</Label>
        <Input
          value={v.complement ?? ""}
          onChange={(e) => onChange({ ...v, complement: e.target.value })}
          placeholder={v.kind === "ci" ? "Ex.: 1A, LP" : ""}
        />
      </div>
    </div>
  );
}
