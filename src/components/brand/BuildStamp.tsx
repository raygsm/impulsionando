import { BUILD_INFO } from "@/generated/build-info";
import { Link } from "@tanstack/react-router";

function rel(iso: string) {
  const t = new Date(iso).getTime();
  if (!t || Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

export function BuildStamp({ className = "" }: { className?: string }) {
  const { commitShort, builtAt, branch } = BUILD_INFO;
  return (
    <Link
      to="/admin/deploy-status"
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/80 hover:text-foreground transition-colors ${className}`}
      title={`commit ${BUILD_INFO.commit}\nbranch ${branch}\npublicado em ${builtAt}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>v.{commitShort}</span>
      <span className="opacity-60">·</span>
      <span>{rel(builtAt)}</span>
    </Link>
  );
}
