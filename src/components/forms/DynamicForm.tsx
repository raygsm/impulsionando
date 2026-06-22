import type { FieldDefinition } from "@/hooks/use-field-definitions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressBO } from "./AddressBO";
import { PhoneBO } from "./PhoneBO";
import { DocumentBO } from "./DocumentBO";

interface Props {
  field: FieldDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}

export function DynamicField({ field, value, onChange, disabled }: Props) {
  const common = (
    <Label htmlFor={field.key}>
      {field.label}
      {field.is_required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
  const help = field.help_text ? (
    <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
  ) : null;

  const wrap = (input: React.ReactNode) => (
    <div className="space-y-1">
      {common}
      {input}
      {help}
    </div>
  );

  const v = value as never;

  switch (field.field_type) {
    case "text":
    case "url":
    case "product_code":
    case "postal_code":
    case "qrcode":
    case "barcode":
      return wrap(
        <Input id={field.key} value={(v ?? "") as string} placeholder={field.placeholder ?? field.example ?? ""}
          onChange={(e) => onChange(e.target.value)} disabled={disabled} />,
      );

    case "longtext":
      return wrap(
        <Textarea id={field.key} value={(v ?? "") as string} placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)} disabled={disabled} rows={4} />,
      );

    case "number":
    case "currency":
      return wrap(
        <Input id={field.key} type="number" inputMode="decimal" value={(v ?? "") as string}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} disabled={disabled} />,
      );

    case "date":
    case "time":
    case "datetime":
      return wrap(
        <Input id={field.key}
          type={field.field_type === "date" ? "date" : field.field_type === "time" ? "time" : "datetime-local"}
          value={(v ?? "") as string}
          onChange={(e) => onChange(e.target.value)} disabled={disabled} />,
      );

    case "email":
      return wrap(
        <Input id={field.key} type="email" value={(v ?? "") as string} placeholder={field.placeholder ?? "nome@empresa.com"}
          onChange={(e) => onChange(e.target.value)} disabled={disabled} />,
      );

    case "phone":
    case "whatsapp":
      return wrap(<PhoneBO value={(v ?? "") as string} onChange={(s) => onChange(s)} placeholder={field.placeholder ?? undefined} />);

    case "document":
      return wrap(<DocumentBO value={v as never} onChange={(d) => onChange(d)} />);

    case "address":
      return wrap(<AddressBO value={v as never} onChange={(a) => onChange(a)} required={field.is_required} />);

    case "checkbox":
      return (
        <div className="flex items-start gap-2">
          <Checkbox id={field.key} checked={Boolean(v)} onCheckedChange={(c) => onChange(Boolean(c))} disabled={disabled} />
          <div>
            <Label htmlFor={field.key} className="cursor-pointer">{field.label}</Label>
            {help}
          </div>
        </div>
      );

    case "select":
    case "country":
    case "department":
    case "city":
      return wrap(
        <Select value={(v ?? "") as string} onValueChange={(val) => onChange(val)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder={field.placeholder ?? "Selecione"} /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).filter((o) => o.is_active).map((o) => (
              <SelectItem key={o.id} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>,
      );

    case "multiselect": {
      const arr = Array.isArray(v) ? (v as string[]) : [];
      return wrap(
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).filter((o) => o.is_active).map((o) => {
            const on = arr.includes(o.value);
            return (
              <button type="button" key={o.id}
                onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={`px-3 py-1 rounded-full text-sm border ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                {o.label}
              </button>
            );
          })}
        </div>,
      );
    }

    case "file":
    case "image":
    case "photo_required":
    case "signature":
      return wrap(
        <Input id={field.key} type="file" accept={field.field_type === "file" ? undefined : "image/*"}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)} disabled={disabled} />,
      );

    case "geolocation":
      return wrap(
        <div className="flex gap-2">
          <Input placeholder="Latitude" value={((v as { lat?: number } | null)?.lat ?? "") as never}
            onChange={(e) => onChange({ ...((v as object) ?? {}), lat: Number(e.target.value) })} />
          <Input placeholder="Longitude" value={((v as { lng?: number } | null)?.lng ?? "") as never}
            onChange={(e) => onChange({ ...((v as object) ?? {}), lng: Number(e.target.value) })} />
        </div>,
      );

    default:
      return wrap(
        <Input id={field.key} value={(v ?? "") as string} onChange={(e) => onChange(e.target.value)} disabled={disabled} />,
      );
  }
}

interface DynamicFormProps {
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, v: unknown) => void;
  disabled?: boolean;
}

export function DynamicForm({ fields, values, onChange, disabled }: DynamicFormProps) {
  // Agrupa por seção
  const sections = new Map<string, FieldDefinition[]>();
  fields.filter((f) => f.is_active).forEach((f) => {
    const s = f.section ?? "Geral";
    const list = sections.get(s) ?? [];
    list.push(f);
    sections.set(s, list);
  });

  return (
    <div className="space-y-6">
      {[...sections.entries()].map(([section, items]) => (
        <div key={section} className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((f) => (
              <div key={f.id} className={f.field_type === "address" || f.field_type === "longtext" ? "md:col-span-2" : ""}>
                <DynamicField field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} disabled={disabled} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
