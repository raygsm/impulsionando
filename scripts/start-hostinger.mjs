import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const runtimeName = "impulsionando-core-bun";
const imageVersion = process.env.IMPULSIONANDO_IMAGE_VERSION || "local";

function coreHeaders(extra = {}) {
  return {
    "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
    pragma: "no-cache",
    expires: "0",
    "surrogate-control": "no-store",
    "x-accel-expires": "0",
    "x-impulsionando-runtime": runtimeName,
    "x-impulsionando-image-version": imageVersion,
    ...extra,
  };
}

function healthResponse(mode, artifact) {
  return new Response(`ok\nruntime=${runtimeName}\nmode=${mode}\nversion=${imageVersion}\n`, {
    headers: coreHeaders({ "content-type": "text/plain; charset=utf-8" }),
  });
}

function runtimeResponse(mode, artifact) {
  return new Response(
    JSON.stringify(
      {
        ok: true,
        runtime: runtimeName,
        mode,
        version: imageVersion,
        artifact,
      },
      null,
      2,
    ),
    {
      headers: coreHeaders({ "content-type": "application/json; charset=utf-8" }),
    },
  );
}

function attachCoreHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(coreHeaders())) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const serverEntrypoints = [
  ".output/server/index.mjs",
  ".output/server/index.js",
  ".output/server/chunks/nitro/nitro.mjs",
  "dist/server/index.mjs",
  "dist/server/index.js",
  "dist/server/server.mjs",
];

let startedServerEntrypoint = false;

for (const entrypoint of serverEntrypoints) {
  if (existsSync(entrypoint)) {
    const module = await import(resolve(entrypoint));
    const handler = module.default ?? module;

    if (typeof handler?.fetch === "function") {
      Bun.serve({
        hostname: host,
        port,
        async fetch(request) {
          const url = new URL(request.url);

          if (url.pathname === "/health") {
            return healthResponse("server", entrypoint);
          }

          if (url.pathname === "/__impulsionando-runtime") {
            return runtimeResponse("server", entrypoint);
          }

          const response = await handler.fetch(request, process.env, {});
          return attachCoreHeaders(response);
        },
      });
    }

    console.log(`Impulsionando Core server loaded from ${entrypoint} on ${host}:${port}`);
    startedServerEntrypoint = true;
    break;
  }
}

if (!startedServerEntrypoint) {
  const staticRoots = [
    "dist",
    "dist/client",
    ".output/public",
    ".vinxi/build/client",
    ".tanstack/start/build/client",
    "build",
    "build/client",
  ];

  function findIndexRoot(candidate, depth = 0) {
    if (!existsSync(candidate) || depth > 5) return undefined;
    if (existsSync(join(candidate, "index.html"))) return candidate;

    for (const item of readdirSync(candidate)) {
      const child = join(candidate, item);
      if (statSync(child).isDirectory()) {
        const found = findIndexRoot(child, depth + 1);
        if (found) return found;
      }
    }

    return undefined;
  }

  const root = staticRoots.map((candidate) => findIndexRoot(candidate)).find(Boolean);

  if (!root) {
    console.error("No runnable Hostinger artifact found after build.");
    process.exit(1);
  }

  const contentTypes = new Map([
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".mjs", "text/javascript; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".svg", "image/svg+xml"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
    [".ico", "image/x-icon"],
    [".woff", "font/woff"],
    [".woff2", "font/woff2"],
  ]);

  const absoluteRoot = resolve(root);

  function fileResponse(pathname) {
    if (pathname === "/health") {
      return healthResponse("static", root);
    }

    if (pathname === "/__impulsionando-runtime") {
      return runtimeResponse("static", root);
    }

    if (pathname.includes(".env") || pathname.includes("..")) {
      return new Response("Not found\n", {
        status: 404,
        headers: coreHeaders({ "content-type": "text/plain; charset=utf-8" }),
      });
    }

    const normalizedPath = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, "");
    let filePath = resolve(absoluteRoot, normalizedPath || "index.html");

    if (!filePath.startsWith(absoluteRoot)) {
      return new Response("Not found\n", {
        status: 404,
        headers: coreHeaders({ "content-type": "text/plain; charset=utf-8" }),
      });
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(absoluteRoot, "index.html");
    }

    const type = contentTypes.get(extname(filePath)) || "application/octet-stream";
    return new Response(createReadStream(filePath), {
      headers: coreHeaders({ "content-type": type }),
    });
  }

  Bun.serve({
    hostname: host,
    port,
    fetch(request) {
      const url = new URL(request.url);
      return fileResponse(url.pathname);
    },
  });

  console.log(`Impulsionando Core static server started from ${root} on ${host}:${port}`);
}
