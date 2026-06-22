// Endpoint público de versão. Usado pelo painel /admin/deploy-status para
// comparar o commit publicado em cada domínio com o build local atual.
import { createFileRoute } from "@tanstack/react-router";
import { BUILD_INFO } from "@/generated/build-info";

export const Route = createFileRoute("/api/public/version")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const body = {
          ...BUILD_INFO,
          host: url.host,
          servedAt: new Date().toISOString(),
        };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store, must-revalidate",
            "access-control-allow-origin": "*",
          },
        });
      },
      HEAD: async () =>
        new Response(null, {
          status: 200,
          headers: {
            "x-commit": BUILD_INFO.commit,
            "x-built-at": BUILD_INFO.builtAt,
            "cache-control": "no-store",
          },
        }),
    },
  },
});
