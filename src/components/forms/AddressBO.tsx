import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Department {
  code: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  department_code: string;
}

export interface AddressBOValue {
  country?: string;
  department?: string;
  city?: string;
  zone?: string;
  street?: string;
  number?: string;
  complement?: string;
  reference?: string;
  map_url?: string;
  lat?: number;
  lng?: number;
}

interface Props {
  value?: AddressBOValue;
  onChange: (v: AddressBOValue) => void;
  required?: boolean;
}

export function AddressBO({ value = {}, onChange, required }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    supabase
      .from("geo_bo_departments")
      .select("code,name")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setDepartments(data ?? []));
  }, []);

  useEffect(() => {
    if (!value.department) {
      setCities([]);
      return;
    }
    supabase
      .from("geo_bo_cities")
      .select("id,name,department_code")
      .eq("department_code", value.department)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setCities(data ?? []));
  }, [value.department]);

  const upd = (patch: Partial<AddressBOValue>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <Label>País</Label>
        <Input value={value.country ?? "Bolivia"} onChange={(e) => upd({ country: e.target.value })} />
      </div>
      <div>
        <Label>Departamento {required && <span className="text-destructive">*</span>}</Label>
        <Select value={value.department ?? ""} onValueChange={(v) => upd({ department: v, city: undefined })}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {departments.map((d) => <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Cidade {required && <span className="text-destructive">*</span>}</Label>
        <Select value={value.city ?? ""} onValueChange={(v) => upd({ city: v })} disabled={!value.department}>
          <SelectTrigger><SelectValue placeholder={value.department ? "Selecione" : "Escolha o depto"} /></SelectTrigger>
          <SelectContent>
            {cities.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Zona / Bairro</Label>
        <Input value={value.zone ?? ""} onChange={(e) => upd({ zone: e.target.value })} />
      </div>
      <div>
        <Label>Avenida / Rua</Label>
        <Input value={value.street ?? ""} onChange={(e) => upd({ street: e.target.value })} />
      </div>
      <div>
        <Label>Número</Label>
        <Input value={value.number ?? ""} onChange={(e) => upd({ number: e.target.value })} />
      </div>
      <div>
        <Label>Complemento</Label>
        <Input value={value.complement ?? ""} onChange={(e) => upd({ complement: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <Label>Referência</Label>
        <Input
          value={value.reference ?? ""}
          onChange={(e) => upd({ reference: e.target.value })}
          placeholder="Ex.: frente ao mercado, esquina com..."
        />
      </div>
      <div className="md:col-span-2">
        <Label>Link do mapa (Google Maps / Waze)</Label>
        <Input
          value={value.map_url ?? ""}
          onChange={(e) => upd({ map_url: e.target.value })}
          placeholder="https://maps.google.com/..."
        />
      </div>
    </div>
  );
}
