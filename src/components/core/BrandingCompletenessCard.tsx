import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBrandingCompleteness } from "@/lib/branding-completeness.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

export function BrandingCompletenessCard({
  companyId,
  compact = false,
}: {
  companyId: string;
  compact?: boolean;
}) {
  const fn = useServerFn(getBrandingCompleteness);
  const { data, isLoading } = useQuery({
    queryKey: ["branding-completeness", companyId],
    queryFn: () => fn({ data: { companyId } }),
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Calculando completude…</CardContent>
      </Card>
    );
  }

  const tone =
    data.percent >= 90 ? "default" : data.percent >= 60 ? "secondary" : "outline";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> Completude da marca
          </CardTitle>
          <Badge variant={tone as "default" | "secondary" | "outline"}>
            {data.done}/{data.total} · {data.percent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={data.percent} />
        {!compact && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-sm">
            {data.checks.map((c) => (
              <li key={c.key} className="flex items-start gap-2">
                {c.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <span className={c.done ? "line-through text-muted-foreground" : ""}>
                    {c.label}
                  </span>
                  {c.hint && <div className="text-xs text-muted-foreground">{c.hint}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
