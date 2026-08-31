import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readReleaseMarker, releaseMarkerResponse } from "./release-marker";

function fixtureDir(sha: string): string {
  const root = mkdtempSync(join(tmpdir(), "release-marker-"));
  mkdirSync(join(root, ".output", "public"), { recursive: true });
  writeFileSync(join(root, ".output", "public", "impulsionando-front-sha.txt"), sha);
  writeFileSync(
    join(root, ".output", "public", "impulsionando-release.json"),
    JSON.stringify({ sha }),
  );
  return root;
}

describe("readReleaseMarker", () => {
  it("returns the SHA marker from .output/public", () => {
    const cwd = fixtureDir("08e7178a55a501b095a870f06428065d7db1f70a");
    expect(readReleaseMarker("/impulsionando-front-sha.txt", cwd)).toEqual({
      body: "08e7178a55a501b095a870f06428065d7db1f70a",
      contentType: "text/plain; charset=utf-8",
    });
  });

  it("ignores unknown paths and missing files", () => {
    expect(readReleaseMarker("/nope.txt", fixtureDir("abc"))).toBeNull();
    expect(readReleaseMarker("/impulsionando-front-sha.txt", tmpdir())).toBeNull();
  });
});

describe("releaseMarkerResponse", () => {
  it("serves GET and HEAD without falling through to the SPA", async () => {
    const cwd = fixtureDir("deadbeef");
    const get = releaseMarkerResponse(new Request("https://csi.impulsionando.com.br/impulsionando-front-sha.txt"), cwd);
    expect(get?.status).toBe(200);
    expect(await get?.text()).toBe("deadbeef");
    const head = releaseMarkerResponse(
      new Request("https://impulsionando.com.br/impulsionando-front-sha.txt", { method: "HEAD" }),
      cwd,
    );
    expect(head?.status).toBe(200);
    expect(await head?.text()).toBe("");
  });
});
