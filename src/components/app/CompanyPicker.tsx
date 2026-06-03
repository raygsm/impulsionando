import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveCompany } from "@/hooks/use-active-company";

export function CompanyPicker({ className }: { className?: string }) {
  const { companyId, setCompanyId, options } = useActiveCompany();
  if (options.length <= 1) return null;
  return (
    <Select value={companyId} onValueChange={setCompanyId}>
      <SelectTrigger className={className ?? "w-56"}><SelectValue placeholder="Empresa" /></SelectTrigger>
      <SelectContent>
        {options.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
