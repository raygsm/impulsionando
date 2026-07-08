import { useEffect, useState } from "react";
import { getVisitorId, getSessionId } from "@/lib/session-id";

/**
 * Watermark visual do ecossistema Impulsionando — assinatura persistente por
 * host + data + visitor_id sobreposta em todas as páginas de produção
 * (core + tenants). Objetivo: desencorajar screenshots/gravações e provar
 * rastreabilidade em vazamentos. Não interfere na navegação (pointer-events
 * desligado) e é ocultada em ambientes de dev/preview.
 */

const UNPROTECTED_HOSTS = new Set<string>(["localhost", "127.0.0.1", "0.0.0.0"]);
function isProtectedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (UNPROTECTED_HOSTS.has(h)) return false;
  if (h.endsWith(".lovable.dev")) return false;
  if (h.includes("-preview--")) return false;
  return true;
}

export function CoreWatermark() {
  const [ready, setReady] = useState(false);
  const [meta, setMeta] = useState({ host: "", stamp: "", vid: "", sid: "" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isProtectedHost(window.location.hostname)) return;
    const now = new Date();
    setMeta({
      host: window.location.hostname,
      stamp: now.toISOString().slice(0, 16).replace("T", " "),
      vid: getVisitorId().slice(0, 8),
      sid: getSessionId().slice(0, 6),
    });
    setReady(true);
  }, []);

  if (!ready) return null;

  const label = `IMPULSIONANDO · ${meta.host} · ${meta.stamp} · v:${meta.vid}/s:${meta.sid}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2147483000] overflow-hidden select-none"
      style={{ mixBlendMode: "difference", opacity: 0.08 }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: "rotate(-24deg) scale(1.4)",
          transformOrigin: "center",
          color: "#ffffff",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "11px",
          lineHeight: "3rem",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i}>{`${label}   ${label}   ${label}   ${label}   ${label}`}</div>
        ))}
      </div>
    </div>
  );
}
