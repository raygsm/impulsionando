import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import {
  CheckInfinitePayInput,
  checkInfinitePayStatusCore,
} from "@/lib/infinitepay.functions";

async function authenticateUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return String(data.claims.sub);
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/payments/infinitepay/check-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await authenticateUserId(request);
        if (!userId) return json(401, { ok: false, message: "Não autenticado" });

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json(400, { ok: false, message: "Payload inválido" });
        }

        const parsed = CheckInfinitePayInput.safeParse(raw);
        if (!parsed.success) {
          return json(400, {
            ok: false,
            message: "Dados inválidos",
            issues: parsed.error.issues,
          });
        }

        try {
          const result = await checkInfinitePayStatusCore(userId, parsed.data);
          return json(200, result);
        } catch (e: any) {
          const msg = e?.message ?? "Erro ao verificar pagamento";
          const code = msg === "Pedido não encontrado" ? 404 : msg === "Acesso negado" ? 403 : 500;
          console.error("[infinitepay/check-status]", e);
          return json(code, { ok: false, message: msg });
        }
      },
    },
  },
});
