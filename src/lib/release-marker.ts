import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MARKERS: Record<string, { file: string; contentType: string }> = {
  "/impulsionando-front-sha.txt": {
    file: "impulsionando-front-sha.txt",
    contentType: "text/plain; charset=utf-8",
  },
  "/impulsionando-release.json": {
    file: "impulsionando-release.json",
    contentType: "application/json; charset=utf-8",
  },
};

export function releaseMarkerPublicDir(cwd = process.cwd()): string {
  return join(cwd, ".output", "public");
}

export function readReleaseMarker(
  pathname: string,
  cwd = process.cwd(),
): { body: string; contentType: string } | null {
  const spec = MARKERS[pathname];
  if (!spec) return null;
  const fullPath = join(releaseMarkerPublicDir(cwd), spec.file);
  if (!existsSync(fullPath)) return null;
  return { body: readFileSync(fullPath, "utf8"), contentType: spec.contentType };
}

export function releaseMarkerResponse(request: Request, cwd = process.cwd()): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const pathname = new URL(request.url).pathname;
  const marker = readReleaseMarker(pathname, cwd);
  if (!marker) return null;
  const headers = {
    "content-type": marker.contentType,
    "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  };
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(marker.body, { status: 200, headers });
}
