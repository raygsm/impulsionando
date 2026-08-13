/**
 * Compatibilidade para chamadas antigas de dispatch n8n.
 *
 * A implementacao anterior fabricava `${N8N_BASE_URL}/webhook/<slug>` sem
 * comprovar que o workflow existia no runtime. Agora toda chamada passa pelo
 * registry real + estado do cliente + webhook sincronizado.
 */
import { dispatchN8nByEvent } from "@/lib/n8n-dispatch-by-event.server";

export async function dispatchN8nSigned(
  slug: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const result = await dispatchN8nByEvent(slug, payload, null);

  if (result.skipped) {
    return {
      ok: false,
      status: 0,
      error: result.error ?? "workflow_not_dispatchable",
    };
  }

  return {
    ok: result.ok,
    status: result.status ?? 0,
    error: result.error,
  };
}
