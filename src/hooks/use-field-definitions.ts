import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FieldType =
  | "text" | "longtext" | "number" | "currency" | "date" | "time" | "datetime"
  | "document" | "phone" | "whatsapp" | "email" | "address" | "postal_code"
  | "city" | "department" | "country" | "select" | "multiselect" | "checkbox"
  | "file" | "image" | "signature" | "url" | "product_code" | "qrcode"
  | "barcode" | "photo_required" | "geolocation";

export type FieldVisibility = "public" | "team" | "manager";

export interface FieldOption {
  id: string;
  field_id: string;
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface FieldDefinition {
  id: string;
  company_id: string;
  entity: string;
  section: string | null;
  key: string;
  label: string;
  field_type: FieldType;
  is_required: boolean;
  is_active: boolean;
  is_system: boolean;
  visibility: FieldVisibility;
  validation: Record<string, unknown>;
  help_text: string | null;
  placeholder: string | null;
  example: string | null;
  default_value: unknown;
  sort_order: number;
  conditional: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  options?: FieldOption[];
}

export function useFieldDefinitions(companyId: string | null | undefined, entity: string) {
  return useQuery({
    queryKey: ["field-definitions", companyId, entity],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data: fields, error } = await supabase
        .from("core_field_definitions")
        .select("*")
        .eq("company_id", companyId!)
        .eq("entity", entity)
        .order("sort_order");
      if (error) throw error;

      const ids = (fields ?? []).map((f) => f.id);
      if (ids.length === 0) return (fields ?? []) as FieldDefinition[];

      const { data: opts } = await supabase
        .from("core_field_options")
        .select("*")
        .in("field_id", ids)
        .order("sort_order");

      const byField = new Map<string, FieldOption[]>();
      (opts ?? []).forEach((o) => {
        const list = byField.get(o.field_id) ?? [];
        list.push(o as FieldOption);
        byField.set(o.field_id, list);
      });

      return (fields ?? []).map((f) => ({
        ...f,
        options: byField.get(f.id) ?? [],
      })) as FieldDefinition[];
    },
  });
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto curto",
  longtext: "Texto longo",
  number: "Número",
  currency: "Moeda",
  date: "Data",
  time: "Hora",
  datetime: "Data e hora",
  document: "Documento (CI/NIT/CPF)",
  phone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  address: "Endereço",
  postal_code: "Código postal",
  city: "Cidade",
  department: "Departamento",
  country: "País",
  select: "Lista suspensa",
  multiselect: "Múltipla escolha",
  checkbox: "Checkbox",
  file: "Upload de arquivo",
  image: "Upload de imagem",
  signature: "Assinatura",
  url: "URL",
  product_code: "Código de produto",
  qrcode: "QR Code",
  barcode: "Código de barras",
  photo_required: "Foto obrigatória",
  geolocation: "Geolocalização",
};

export const FIELD_TYPES: FieldType[] = Object.keys(FIELD_TYPE_LABELS) as FieldType[];
