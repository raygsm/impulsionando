import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle, Check } from "lucide-react";
import { contrastRatio, wcagLevel, type WcagLevel } from "@/lib/brand-kit-utils";

interface Props {
  primary: string;
  secondary: string;
}

/**
 * w25 — Auditoria de contraste WCAG 2.x.
 * Verifica os pares mais comuns usados pelo branding:
 *   primary↔branco, primary↔preto, secondary↔branco, secondary↔preto,
 *   primary↔secondary (texto sobre acentuação).
 */
export function ContrastReport({ primary, secondary }: Props) {
  const pairs: { label: string; fg: string; bg: string; minLevel: WcagLevel }[] = [
    { label: "Texto branco sobre Primária", fg: "#ffffff", bg: primary, minLevel: "AA" },
    { label: "Texto preto sobre Primária", fg: "#0f172a", bg: primary, minLevel: "AA" },
    { label: "Texto branco sobre Secundária", fg: "#ffffff", bg: secondary, minLevel: "AA" },
    { label: "Texto preto sobre Secundária", fg: "#0f172a", bg: secondary, minLevel: "AA" },
    { label: "Primária sobre Secundária", fg: primary, bg: secondary, minLevel: "AA Large" },
  ];

  const results = pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    return { ...p, ratio, level: wcagLevel(ratio) };
  });

  const failing = results.filter((r) => r.level === "Fail").length;
  const warnings = results.filter((r) => r.level === "AA Large").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Acessibilidade & contraste (WCAG)
          {failing > 0 ? (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" /> {failing} falha{failing > 1 ? "s" : ""}
            </Badge>
          ) : warnings > 0 ? (
            <Badge variant="secondary" className="ml-2">{warnings} alerta{warnings > 1 ? "s" : ""}</Badge>
          ) : (
            <Badge variant="default" className="ml-2 bg-emerald-600 hover:bg-emerald-600">
              <Check className="h-3 w-3 mr-1" /> OK
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AA = ≥ 4.5 (texto normal) · AA Large = ≥ 3 (títulos grandes) · AAA = ≥ 7.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {results.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between gap-3 rounded-md border p-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-10 w-20 rounded grid place-items-center text-xs font-semibold shrink-0 border"
                  style={{ background: r.bg, color: r.fg }}
                >
                  Aa
                </div>
                <div className="min-w-0">
                  <div className="text-sm truncate">{r.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.fg} sobre {r.bg}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm tabular-nums">{r.ratio.toFixed(2)}:1</span>
                <Badge variant={levelVariant(r.level)}>{r.level}</Badge>
              </div>
            </div>
          ))}
        </div>

        {failing > 0 && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-destructive">Contraste insuficiente em {failing} combinação(ões).</p>
                <p className="text-muted-foreground mt-1">
                  Considere escurecer a cor primária ou clarear a secundária. Botões e badges com esses pares ficarão difíceis de ler.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function levelVariant(l: WcagLevel): "default" | "secondary" | "destructive" | "outline" {
  if (l === "AAA") return "default";
  if (l === "AA") return "default";
  if (l === "AA Large") return "secondary";
  return "destructive";
}
