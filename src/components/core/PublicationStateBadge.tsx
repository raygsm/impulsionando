import { Badge } from "@/components/ui/badge";

export type PublicationStateName = "Homologação" | "Pronto para Publicação" | "Publicado";

export function derivePublicationState(state: {
  domain_ok?: boolean;
  dns_ok?: boolean;
  ssl_ok?: boolean;
  supabase_ok?: boolean;
  env_ok?: boolean;
  approved_at?: string | null;
  snapshot_id?: string | null;
} | null): PublicationStateName {
  if (!state) return "Homologação";
  const allOk =
    state.domain_ok && state.dns_ok && state.ssl_ok && state.supabase_ok && state.env_ok;
  if (!allOk) return "Homologação";
  if (state.approved_at && state.snapshot_id) return "Publicado";
  return "Pronto para Publicação";
}

const STYLES: Record<PublicationStateName, string> = {
  Homologação: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "Pronto para Publicação": "bg-sky-500/15 text-sky-700 border-sky-500/30",
  Publicado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

export function PublicationStateBadge({ state }: { state: PublicationStateName }) {
  return (
    <Badge variant="outline" className={STYLES[state]}>
      {state}
    </Badge>
  );
}
