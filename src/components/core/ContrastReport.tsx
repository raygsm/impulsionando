import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, AlertTriangle, Check } from "lucide-react";
import { contrastRatio } from "@/lib/brand-kit-utils";

interface Props {
  primary: string;
  secondary: string;
}

/**
 * w25 — Auditoria de contraste WCAG 2.x, ciente de tamanho de fonte.
 *
 * Regra WCAG: texto é "large" quando ≥ 18pt regular OU ≥ 14pt bold (≈ 24px reg / 18.66px bold).
 * Para large: AA = 3, AAA = 4.5. Para normal: AA = 4.5, AAA = 7.
 *
 * O usuário pode editar o texto de teste, alterar o tamanho (px) e marcar bold —
 * a classificação se ajusta em tempo real.
 */
export function ContrastReport({ primary, secondary }: Props) {
  const [sampleText, setSampleText] = useState("Texto de exemplo");
  const [fontSize, setFontSize] = useState(16);
  const [bold, setBold] = useState(false);

  // WCAG: large = 18pt regular (~24px) ou 14pt bold (~18.66px)
  const isLarge = bold ? fontSize >= 18.66 : fontSize >= 24;

  const pairs = useMemo(
    () => [
      { label: "Texto branco sobre Primária", fg: "#ffffff", bg: primary },
      { label: "Texto preto sobre Primária", fg: "#0f172a", bg: primary },
      { label: "Texto branco sobre Secundária", fg: "#ffffff", bg: secondary },
      { label: "Texto preto sobre Secundária", fg: "#0f172a", bg: secondary },
      { label: "Primária sobre Secundária", fg: primary, bg: secondary },
    ],
    [primary, secondary],
  );

  const results = pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    return { ...p, ratio, level: classify(ratio, isLarge) };
  });

  const failing = results.filter((r) => r.level === "Fail").length;
  const warnings = results.filter((r) => r.level === "AA Large only").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <Eye className="h-4 w-4" />
          Acessibilidade & contraste (WCAG)
          {failing > 0 ? (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" /> {failing} falha{failing > 1 ? "s" : ""}
            </Badge>
          ) : warnings > 0 ? (
            <Badge variant="secondary" className="ml-2">{warnings} alerta{warnings > 1 ? "s" : ""}</Badge>
          ) : (
            <Badge className="ml-2 bg-emerald-600 hover:bg-emerald-600">
              <Check className="h-3 w-3 mr-1" /> OK
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isLarge
            ? "Avaliando como texto grande: AA ≥ 3, AAA ≥ 4.5."
            : "Avaliando como texto normal: AA ≥ 4.5, AAA ≥ 7."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles do texto de teste */}
        <div className="grid sm:grid-cols-[1fr_120px_auto] gap-3 items-end p-3 rounded-md border bg-muted/30">
          <div className="space-y-1.5">
            <Label htmlFor="ctr-text" className="text-xs">Texto de teste</Label>
            <Input
              id="ctr-text"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Texto de exemplo"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-size" className="text-xs">Tamanho (px)</Label>
            <Input
              id="ctr-size"
              type="number"
              min={10}
              max={96}
              value={fontSize}
              onChange={(e) => setFontSize(Math.max(10, Math.min(96, Number(e.target.value) || 16)))}
            />
          </div>
          <div className="flex items-center gap-2 pb-1.5">
            <Switch id="ctr-bold" checked={bold} onCheckedChange={setBold} />
            <Label htmlFor="ctr-bold" className="text-xs cursor-pointer">Negrito</Label>
          </div>
        </div>

        {/* Presets rápidos */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground self-center">Presets:</span>
          {[
            { label: "Corpo (16px)", size: 16, b: false },
            { label: "Botão (14px bold)", size: 14, b: true },
            { label: "Subtítulo (18px bold)", size: 18, b: true },
            { label: "Headline (32px bold)", size: 32, b: true },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              className="px-2 py-1 rounded border hover:bg-accent transition-colors"
              onClick={() => { setFontSize(p.size); setBold(p.b); }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Resultados */}
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 rounded-md border p-2 flex-wrap">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="rounded shrink-0 border px-3 py-1 grid place-items-center"
                  style={{
                    background: r.bg,
                    color: r.fg,
                    fontSize: `${fontSize}px`,
                    fontWeight: bold ? 700 : 400,
                    minWidth: 120,
                    minHeight: Math.max(40, fontSize + 12),
                    lineHeight: 1.1,
                  }}
                >
                  <span className="truncate max-w-[260px]">{sampleText || "Aa"}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm truncate">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.fg} sobre {r.bg}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm tabular-nums">{r.ratio.toFixed(2)}:1</span>
                <Badge variant={levelVariant(r.level)} className={r.level === "AAA" || r.level === "AA" ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
                  {r.level}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {failing > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-destructive">
                  Contraste insuficiente em {failing} combinação(ões) {isLarge ? "para texto grande" : "para texto normal"}.
                </p>
                <p className="text-muted-foreground mt-1">
                  Aumente o tamanho da fonte, marque como negrito, ou escurece a cor primária / clareie a secundária.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type Level = "AAA" | "AA" | "AA Large only" | "Fail";

function classify(ratio: number, isLarge: boolean): Level {
  if (isLarge) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large only";
  return "Fail";
}

function levelVariant(l: Level): "default" | "secondary" | "destructive" | "outline" {
  if (l === "AAA" || l === "AA") return "default";
  if (l === "AA Large only") return "secondary";
  return "destructive";
}
