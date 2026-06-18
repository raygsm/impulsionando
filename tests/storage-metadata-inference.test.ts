/**
 * Metadata-inference resistance: an authenticated user from a different
 * tenant must not be able to infer the existence, size, content-type or
 * any metadata of a protected file in another company's path — neither
 * via list(), search(), info(), download(HEAD), nor createSignedUrl().
 *
 * A correct RLS posture either:
 *   - returns an error, OR
 *   - returns an empty/sanitized result (no name, size, content_type, mimetype, etag).
 *
 * Leaking ANY of those fields lets a probing user confirm a target file
 * exists by trying well-known names.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin, createUser, deleteUser, signIn,
  assignProfile, createCompany, deleteCompany, PROFILES,
} from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

const RUN = Date.now();
const BUCKETS = ["contracts", "contab-documents"] as const;
const SECRET_NAME = `secret-${RUN}.pdf`;
const SECRET_SIZE = 4096;

let companyA = "";
let companyB = "";
let userA = "";
let userB = "";
let clientB!: SupabaseClient;

const emails = {
  a: `meta-a-${RUN}@example.com`,
  b: `meta-b-${RUN}@example.com`,
};

beforeAll(async () => {
  companyA = await createCompany(`Meta A ${RUN}`);
  companyB = await createCompany(`Meta B ${RUN}`);
  const a = await createUser(emails.a);
  const b = await createUser(emails.b);
  userA = a.id; userB = b.id;
  await assignProfile({ userId: userA, companyId: companyA, profileId: PROFILES.gestor, email: emails.a });
  await assignProfile({ userId: userB, companyId: companyB, profileId: PROFILES.gestor, email: emails.b });

  clientB = (await signIn(emails.b)).client;

  const payload = new Blob([new Uint8Array(SECRET_SIZE).fill(0x41)], { type: "application/pdf" });
  for (const bucket of BUCKETS) {
    await admin.storage.from(bucket).upload(`${companyA}/__meta/${RUN}/${SECRET_NAME}`, payload, {
      upsert: true,
      contentType: "application/pdf",
      metadata: { tenant: "A", classification: "confidential", run: String(RUN) },
    });
  }
}, 180_000);

afterAll(async () => {
  for (const bucket of BUCKETS) {
    await admin.storage.from(bucket).remove([`${companyA}/__meta/${RUN}/${SECRET_NAME}`]).catch(() => {});
  }
  await deleteUser(userA);
  await deleteUser(userB);
  await deleteCompany(companyA);
  await deleteCompany(companyB);
});

const METADATA_FIELDS = ["name", "size", "metadata", "mimetype", "etag", "last_modified"] as const;

describe.each(BUCKETS)("metadata inference resistance — %s", (bucket) => {
  const targetKey = `${companyA}/__meta/${RUN}/${SECRET_NAME}`;
  const targetDir = `${companyA}/__meta/${RUN}`;

  it("list(prefix) on A's directory must not leak file metadata to B", async () => {
    const { data, error } = await clientB.storage.from(bucket).list(targetDir, { limit: 1000 });
    const objs = data ?? [];
    const hit = objs.find((o) => o.name === SECRET_NAME);
    expect(hit, `B should not see ${SECRET_NAME} in A's prefix (got ${JSON.stringify(hit)})`).toBeUndefined();
    if (!error) {
      // Even if API returns 200, the result must be empty — non-empty leaks structure.
      expect(objs.length).toBe(0);
    }
  });

  it("list with search:name must not return A's file (any metadata field)", async () => {
    const { data } = await clientB.storage.from(bucket).list("", { search: SECRET_NAME, limit: 100 });
    for (const o of data ?? []) {
      for (const f of METADATA_FIELDS) {
        const v = (o as any)[f];
        if (typeof v === "string") {
          expect(v.includes(SECRET_NAME), `field ${f} leaked SECRET_NAME`).toBe(false);
        }
      }
      // Size of the protected file is 4096 bytes — must not surface.
      const size = (o as any).metadata?.size ?? (o as any).size;
      expect(size === SECRET_SIZE && (o as any).name === SECRET_NAME).toBe(false);
    }
  });

  it("list with search by partial prefix of company A id must not enumerate cross-tenant", async () => {
    const probe = companyA.slice(0, 8);
    const { data } = await clientB.storage.from(bucket).list("", { search: probe, limit: 100 });
    const leaked = (data ?? []).filter((o) => (o as any).name?.includes(companyA));
    expect(leaked.length, `enumerating with prefix "${probe}" leaked ${leaked.length} cross-tenant entries`).toBe(0);
  });

  it("createSignedUrl must not confirm existence (no signed URL, no size hint)", async () => {
    const { data, error } = await clientB.storage.from(bucket).createSignedUrl(targetKey, 60);
    expect(!!data?.signedUrl).toBe(false);
    expect(error).toBeTruthy();
    // Error message must not include the filename or its size — that would itself be a leak.
    const msg = `${error?.message || ""} ${(error as any)?.error || ""}`.toLowerCase();
    expect(msg.includes(SECRET_NAME.toLowerCase())).toBe(false);
    expect(msg.includes(String(SECRET_SIZE))).toBe(false);
  });

  it("download() must fail without leaking content-type / size via response body", async () => {
    const { data, error } = await clientB.storage.from(bucket).download(targetKey);
    expect(data).toBeNull();
    expect(error).toBeTruthy();
    // Body must be null — any blob (even empty) with type "application/pdf" would
    // confirm the file's content-type, which is itself a metadata leak.
    expect((data as any)?.type).toBeUndefined();
    expect((data as any)?.size).toBeUndefined();
  });

  it("404 vs 403 must not distinguish 'missing' from 'forbidden' (oracle resistance)", async () => {
    const realMiss = await clientB.storage.from(bucket).download(
      `${companyA}/__meta/${RUN}/definitely-does-not-exist-${RUN}.pdf`,
    );
    const forbidden = await clientB.storage.from(bucket).download(targetKey);
    // Both must error; the error shape must be indistinguishable enough that a
    // probing user cannot tell "file exists but I can't read it" from "file missing".
    expect(realMiss.error).toBeTruthy();
    expect(forbidden.error).toBeTruthy();
    // If the storage layer differentiates statuses, RLS is acting as an existence oracle.
    const codeA = (realMiss.error as any)?.statusCode ?? (realMiss.error as any)?.status;
    const codeB = (forbidden.error as any)?.statusCode ?? (forbidden.error as any)?.status;
    if (codeA && codeB) {
      expect(codeA, "missing vs forbidden must return the same status code").toBe(codeB);
    }
  });
});
