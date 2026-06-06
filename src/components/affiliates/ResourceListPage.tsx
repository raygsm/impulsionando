import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveCompany } from "@/hooks/use-active-company";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "textarea" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
};

type Props<T extends { id: string }> = {
  /** Public schema table name */
  table: string;
  title: string;
  description?: string;
  /** Columns to render in the table */
  columns: { key: keyof T | string; label: string; render?: (row: T) => ReactNode }[];
  /** Fields to render in the "new" dialog */
  fields: FieldDef[];
  /** Additional select used to filter / list */
  selectColumns?: string;
  /** Order by clause */
  orderBy?: { col: string; ascending?: boolean };
  /** Extra defaults injected when inserting */
  extraInsert?: Record<string, unknown>;
  /** Disable delete */
  noDelete?: boolean;
};

export function ResourceListPage<T extends { id: string }>({
  table, title, description, columns, fields, selectColumns,
  orderBy, extraInsert, noDelete,
}: Props<T>) {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""]))
  );

  const key = [table, companyId] as const;
  const { data, isLoading } = useQuery({
    queryKey: key,
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from(table as never).select(selectColumns ?? "*").eq("company_id", companyId!);
      if (orderBy) q = q.order(orderBy.col, { ascending: orderBy.ascending ?? false });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { company_id: companyId, ...extraInsert };
      for (const f of fields) {
        const v = form[f.name];
        if (f.required && (v === "" || v === undefined || v === null)) {
          throw new Error(`Campo obrigatório: ${f.label}`);
        }
        if (v === "" || v === undefined) continue;
        payload[f.name] = f.type === "number" ? Number(v) : v;
      }
      const { error } = await supabase.from(table as never).insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro criado");
      setOpen(false);
      setForm(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])));
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo {title.toLowerCase()}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label>{f.label}{f.required && " *"}</Label>
                  {f.type === "select" ? (
                    <select
                      className="w-full border rounded-md h-9 px-2 bg-background text-sm"
                      value={String(form[f.name] ?? "")}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    >
                      <option value="">—</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      className="w-full border rounded-md p-2 bg-background text-sm min-h-[80px]"
                      value={String(form[f.name] ?? "")}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      type={f.type ?? "text"}
                      value={String(form[f.name] ?? "")}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={create.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => <TableHead key={String(c.key)}>{c.label}</TableHead>)}
                {!noDelete && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>
              )}
              {!isLoading && data?.length === 0 && (
                <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">Nenhum registro ainda. Clique em "Novo" para começar.</TableCell></TableRow>
              )}
              {data?.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={String(c.key)}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key as string] ?? "—")}
                    </TableCell>
                  ))}
                  {!noDelete && (
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => {
                        if (confirm("Remover este registro?")) remove.mutate(row.id);
                      }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
