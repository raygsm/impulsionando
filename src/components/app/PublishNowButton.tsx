import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Rocket, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PublishState = "idle" | "queued" | "running" | "success" | "failed";
type PublishRow = {
  id: string;
  status: "queued" | "running" | "success" | "failed";
  message: string | null;
  commit_sha: string | null;
  requested_at: string;
  finished_at: string | null;
};

export function PublishNowButton() {
  const [state, setState] = useState<PublishState>("idle");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("Publica a versão mais recente do Core no front.");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  async function poll(id: string) {
    const { data, error } = await supabase
      .from("core_publish_requests" as never)
      .select("id,status,message,commit_sha,requested_at,finished_at" as never)
      .eq("id" as never, id)
      .maybeSingle();
    if (error || !data) return;
    const row = data as unknown as PublishRow;
    setState(row.status);
    setMessage(row.message || (row.status === "queued" ? "Publicação na fila…" : "Publicando…"));
    if (row.status === "success" || row.status === "failed") {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      if (row.status === "success") {
        toast.success("PUBLICADO — a nova versão já está no front.");
        window.setTimeout(() => window.location.reload(), 900);
      } else {
        toast.error("A publicação falhou e a versão anterior foi preservada.");
      }
    }
  }

  async function publish() {
    if (["queued", "running"].includes(state)) return;
    setState("queued");
    setMessage("Solicitando publicação segura…");
    const { data, error } = await supabase
      .from("core_publish_requests" as never)
      .insert({ target: "core", status: "queued" } as never)
      .select("id,status" as never)
      .single();
    if (error || !data) {
      setState("failed");
      setMessage("Não foi possível iniciar a publicação.");
      toast.error(error?.message || "Falha ao solicitar publicação.");
      return;
    }
    const id = String((data as any).id);
    setRequestId(id);
    await poll(id);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => void poll(id), 2500);
  }

  const busy = state === "queued" || state === "running";
  const success = state === "success";
  const failed = state === "failed";

  return (
    <div className="border-b border-border bg-card/95 px-4 py-2 shadow-sm backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Gestão Master · publicação</div>
          <div className="truncate text-xs text-foreground/75" title={message}>{message}</div>
        </div>
        <Button
          type="button"
          onClick={() => void publish()}
          disabled={busy}
          className={success ? "bg-emerald-700 hover:bg-emerald-700" : failed ? "bg-destructive hover:bg-destructive" : "bg-primary"}
          title="Faz build, valida a aplicação, publica no Hostinger/Traefik e reverte automaticamente se houver falha."
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : success ? <CheckCircle2 className="mr-2 h-4 w-4" /> : failed ? <TriangleAlert className="mr-2 h-4 w-4" /> : <Rocket className="mr-2 h-4 w-4" />}
          {busy ? "PUBLICANDO…" : success ? "PUBLICADO" : "PUBLICAR"}
        </Button>
        {requestId ? <span className="sr-only">Solicitação {requestId}</span> : null}
      </div>
    </div>
  );
}
