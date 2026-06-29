import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);

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
        fetch(request) {
          return handler.fetch(request, process.env, {});
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
      return new Response("ok\n", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (pathname.includes(".env") || pathname.includes("..")) {
      return new Response("Not found\n", { status: 404 });
    }

    const normalizedPath = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, "");
    let filePath = resolve(absoluteRoot, normalizedPath || "index.html");

    if (!filePath.startsWith(absoluteRoot)) {
      return new Response("Not found\n", { status: 404 });
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(absoluteRoot, "index.html");
    }

    const type = contentTypes.get(extname(filePath)) || "application/octet-stream";
    return new Response(createReadStream(filePath), {
      headers: { "content-type": type },
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
