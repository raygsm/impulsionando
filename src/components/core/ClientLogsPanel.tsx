import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ClientLogsPanel({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["client-logs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity, entity_id, user_id, created_at, before, after")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Card className="p-4">Carregando logs…</Card>;
  const list = data ?? [];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Logs de auditoria (últimos 100)</h3>
      {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum log registrado.</p>}
      <div className="space-y-2">
        {list.map((l) => (
          <div key={l.id} className="border-b last:border-0 pb-2 last:pb-0 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge
                  variant="outline"
                  className={
                    l.action === "DELETE"
                      ? "border-destructive text-destructive"
                      : l.action === "INSERT"
                      ? "border-green-600 text-green-700"
                      : ""
                  }
                >
                  {l.action}
                </Badge>
                <span className="font-mono text-xs truncate">{l.entity}</span>
                {l.entity_id && <span className="font-mono text-[10px] text-muted-foreground truncate">#{String(l.entity_id).slice(0, 8)}</span>}
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {new Date(l.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
