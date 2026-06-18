import { Badge } from "@/components/ui/badge";
import { useAudience } from "@/hooks/use-audience";
import { Building2, Crown, Layers, UserRound } from "lucide-react";

const ICONS = {
  core: Crown,
  "white-label": Layers,
  empresa: Building2,
  consumidor: UserRound,
} as const;

const VARIANTS = {
  core: "default",
  "white-label": "secondary",
  empresa: "outline",
  consumidor: "outline",
} as const;

/**
 * Selo visual da audiência atual. Ajuda o usuário (e o suporte) a
 * entender em que "camada" do ecossistema ele está navegando.
 */
export function AudienceBadge({ className }: { className?: string }) {
  const { audience, label, isViewingAs } = useAudience();
  const Icon = ICONS[audience];
  return (
    <Badge
      variant={VARIANTS[audience]}
      className={`hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium ${className ?? ""}`}
      title={isViewingAs ? `${label} (visualizando como cliente)` : label}
    >
      <Icon className="w-3 h-3" aria-hidden />
      <span>{label}</span>
      {isViewingAs ? <span className="opacity-70">· view-as</span> : null}
    </Badge>
  );
}
